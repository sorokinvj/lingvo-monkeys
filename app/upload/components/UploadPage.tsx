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

      try {
        // Этап 1: Получаем presigned URL
        setMessage('Подготовка к загрузке...');
        setProgress(10);

        const presignResponse = await fetch('/api/upload/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            fileId,
          }),
        });

        if (!presignResponse.ok) {
          const error = await presignResponse.json();
          throw new Error(error.message || 'Failed to get upload URL');
        }

        const { url, fields, key } = await presignResponse.json();

        // Этап 2: Загружаем в S3
        setProgress(20);
        setMessage('Загрузка файла...');
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        formData.append('file', file);

        const uploadResponse = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload to S3');
        }

        setProgress(50);
        setMessage('Файл загружен, начинаем обработку...');

        // Этап 3: Запускаем обработку через существующий API
        const publicUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;

        const eventSource = new EventSource(`/api/upload`, {
          withCredentials: true, // для передачи cookies с авторизацией
        });

        // Сначала отправляем данные
        await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            path: key,
            size: file.size,
            mimeType: file.type,
            publicUrl,
          }),
        });

        return new Promise((resolve, reject) => {
          eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setProgress(data.progress);
            setMessage(data.message);
          };

          eventSource.onerror = (error) => {
            eventSource.close();
            reject(new Error('Processing failed'));
          };

          eventSource.addEventListener('complete', (event) => {
            eventSource.close();
            resolve(JSON.parse(event.data));
          });
        });
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
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
          <p className="text-red-500 text-center max-w-prose mx-auto mt-2">
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
