'use client';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import FileList from './FileList';
import { parseErrorMessage } from '@/lib/utils';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import { useFiles } from '@/hooks/useFiles';
import { v4 as uuidv4 } from 'uuid';

const UploadPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { refetch } = useFiles(user?.id);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileId = uuidv4();
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'metadata',
        JSON.stringify({
          id: fileId,
          name: file.name,
          size: file.size,
          mimeType: file.type,
        })
      );

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
            console.log('Progress:', newProgress, 'Message:', newMessage);

            if (newProgress === 100) {
              return;
            }
          } else if (eventType === 'event: error') {
            const { error: errorMessage } = JSON.parse(
              data.replace('data: ', '')
            );
            throw new Error(errorMessage);
          }
        }
      }
    },
    onSuccess: () => {
      console.log('Upload completed, updating file list...');
      queryClient.invalidateQueries({ queryKey: ['files'] });
      refetch();
      setTimeout(() => {
        setProgress(0);
        setMessage('');
      }, 1000);
    },
    onError: (error) => {
      setError(parseErrorMessage(error));
      setProgress(0);
      setMessage('');
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError(
        `Файл слишком большой. Максимальный размер: 50МБ, размер вашего файла: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(1)}МБ`
      );
      return;
    }

    setError(null);
    uploadMutation.mutate(file);
  }, []);

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
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-blue-300 rounded-lg'
        }`}
      >
        <h1 className="text-xl font-bold mb-4 text-blue-900">
          Загрузить MP3 Файл
        </h1>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Отпустите MP3 файл здесь...</p>
        ) : (
          <p>Перетащите MP3 файл сюда или нажмите для выбора</p>
        )}
        <p className="text-sm max-w-prose mx-auto text-gray-500 mt-4">
          Жесткого ограничения на размер файла нет, однако загружать большие
          файлы по 500 Мб и выше не рекомендуется.
        </p>
        {progress > 0 && (
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
