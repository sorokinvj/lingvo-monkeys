'use client';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import FileList from './FileList';
import { parseErrorMessage } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/utils/supabase/client';

const UploadPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        setMessage('Uploading file...');
        setProgress(10);
        const supabase = createClient();
        const { data, error: uploadError } = await supabase.storage
          .from('audio-files')
          .upload(`${user?.id}/${Date.now()}_${file.name}`, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;
        setMessage('Getting public URL...');
        setProgress(20);
        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('audio-files').getPublicUrl(data.path);

        setMessage('Creating record in database...');
        setProgress(30);
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            path: data.path,
            size: file.size,
            mimeType: file.type,
            publicUrl,
          }),
        });
        setProgress(40);
        if (!response.ok) {
          throw new Error('Upload process failed');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Unable to read response');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          const events = text.split('\n\n').filter(Boolean);

          for (const event of events) {
            const [eventType, data] = event.split('\n');
            if (eventType === 'event: progress') {
              const { progress: newProgress, message: newMessage } = JSON.parse(
                data.replace('data: ', '')
              );
              setProgress(newProgress);
              setMessage(newMessage);
            } else if (eventType === 'event: error') {
              const { error: errorMessage } = JSON.parse(
                data.replace('data: ', '')
              );
              setError(errorMessage);
            }
          }
        }
        console.log('invalidating files');
        queryClient.invalidateQueries({ queryKey: ['files', user?.id] });
      } catch (error) {
        setError(parseErrorMessage(error));
      }
    },
    [user]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB max size
  });

  return (
    <div className="p-4 w-full h-full mt-12">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <h1 className="text-base font-bold mb-4 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-transparent bg-clip-text">
          Upload MP3 File
        </h1>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the MP3 file here...</p>
        ) : (
          <p>Drag and drop an MP3 file here, or click to select a file</p>
        )}
        {progress > 0 && progress < 100 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="mt-2">{message}</p>
          </div>
        )}
        {error && (
          <p className="text-red-500 text-center max-w-prose mx-auto">
            {error}
          </p>
        )}
      </div>
      <div className="mt-4">
        <FileList />
      </div>
    </div>
  );
};

export default UploadPage;
