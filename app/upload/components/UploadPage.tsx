'use client';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import FileList from './FileList';
import { parseErrorMessage } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { useUploadProgress } from '@/hooks/useUploadProgress';
import { getPresignedUrl, processFile, uploadToS3 } from './upload.utils';
import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_TEXT,
  ALLOWED_AUDIO_TYPES,
} from '@/config/constants';

const UploadPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const { progress, message, setMessage, updateProgress, reset, complete } =
    useUploadProgress();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      try {
        // Этап 1: Получаем presigned URL
        setMessage('Подготовка к загрузке...');
        updateProgress('PRESIGN');
        const { url, fields, key, publicUrl } = await getPresignedUrl(file);

        // Этап 2: Подготовка
        setMessage('Начинаем загрузку...');
        updateProgress('PREPARING');

        // Этап 3: Загружаем в S3
        setMessage('Загрузка файла...');
        await uploadToS3(url, fields, file, (uploadProgress) => {
          updateProgress('UPLOAD', uploadProgress);
        });

        // Этап 4: Обработка
        console.log('🎯 Starting processFile');
        setMessage('Файл загружен, начинаем обработку...');
        await processFile(
          {
            name: file.name,
            path: key,
            size: file.size,
            mimeType: file.type,
            publicUrl,
          },
          (processProgress, processMessage) => {
            console.log('⏳ Process Progress:', {
              processProgress,
              processMessage,
            });
            updateProgress('PROCESSING', processProgress);
            setMessage(processMessage);
          }
        );

        // Завершение
        console.log('🏁 Upload completed, calling complete()');
        updateProgress('COMPLETED');
        setMessage('Загрузка завершена!');
        complete();
        console.log('✨ Complete called');
      } catch (error) {
        console.error('❌ Upload error:', error);
        reset();
        throw error;
      }
    },
    onError: (error) => {
      setError(parseErrorMessage(error));
      reset();
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE_TEXT}, размер вашего файла: ${(
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
    accept: ALLOWED_AUDIO_TYPES,
    maxSize: MAX_FILE_SIZE,
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
