'use client';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import FileList from './FileList';
import { parseErrorMessage } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';

const UploadPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
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
      queryClient.invalidateQueries({ queryKey: ['files', user?.id] });
    } catch (error) {
      setError(parseErrorMessage(error));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB max size
  });

  return (
    <div className="p-4 w-full h-full">
      <h1 className="text-2xl font-bold mb-4">Upload MP3 File</h1>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
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
