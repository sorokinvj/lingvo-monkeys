// file: app/upload/components/UploadPage.tsx
'use client';
import React, { useCallback, useState, useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import AudiobookSources from './AudiobookSources';
import { useAnalytics } from '@/hooks/useAnalytics';

const UploadPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { trackFileStatusChange } = useAnalytics();

  // Для хранения идентификаторов
  const [fileData, setFileData] = useState<{
    fileId?: string;
    analyticsEventId?: string;
  }>({});

  const { progress, message, setMessage, updateProgress, reset, complete } =
    useUploadProgress();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const timings = {
        start: Date.now(),
        presign: 0,
        upload: 0,
        processing: 0,
        total: 0,
      };

      try {
        // Этап 1: Получаем presigned URL
        setMessage('Подготовка к загрузке...');
        updateProgress('PRESIGN');
        const { url, fields, key, publicUrl } = await getPresignedUrl(file);
        timings.presign = Date.now() - timings.start;

        // Этап 2: Подготовка
        setMessage('Начинаем загрузку...');
        updateProgress('PREPARING');

        // Этап 3: Загружаем в S3
        const uploadStart = Date.now();
        setMessage('Загрузка файла...');
        await uploadToS3(url, fields, file, (uploadProgress) => {
          updateProgress('UPLOAD', uploadProgress);
        });

        // После успешной загрузки в S3
        timings.upload = Date.now() - uploadStart;

        // Этап 4: Обработка и транскрибирование
        const processingStart = Date.now();

        const result = await processFile(
          {
            name: file.name,
            path: key,
            size: file.size,
            mimeType: file.type,
            publicUrl,
          },
          (processProgress, processMessage) => {
            updateProgress('PROCESSING', processProgress);
            setMessage(processMessage);
          }
        );

        // Сохраняем идентификаторы
        setFileData(result);

        timings.processing = Date.now() - processingStart;
        timings.total = Date.now() - timings.start;

        // Логируем результаты
        console.log('📊 Upload Timings:', {
          fileName: file.name,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
          presign: `${(timings.presign / 1000).toFixed(2)}s`,
          upload: `${(timings.upload / 1000).toFixed(2)}s`,
          processing: `${(timings.processing / 1000).toFixed(2)}s`,
          total: `${(timings.total / 1000).toFixed(2)}s`,
        });

        // Завершение
        updateProgress('COMPLETED');
        setMessage(
          `Загрузка завершена за ${(timings.total / 1000).toFixed(2)}s!`
        );
        complete();
      } catch (error) {
        console.error('❌ Upload error:', error);

        // Если у нас есть идентификаторы и произошла ошибка, обновляем статус в аналитике
        if (fileData.fileId && fileData.analyticsEventId) {
          await trackFileStatusChange({
            fileId: fileData.fileId,
            uploadEventId: fileData.analyticsEventId,
            status: 'error',
            error: parseErrorMessage(error),
          });
        }

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
    <div className="flex flex-col p-4 w-full h-full">
      <div
        {...getRootProps()}
        className={`order-2 mt-4 md:order-1 border-2 border-dashed p-8 text-center cursor-pointer ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-blue-300 rounded-lg'
        }`}
      >
        <h1 className="hidden md:block text-xl font-bold mb-4 text-blue-900">
          Загрузить MP3 Файл
        </h1>
        <Button variant="default" className="block w-full md:hidden">
          Загрузить MP3
        </Button>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="hidden md:block">Отпустите MP3 файл здесь...</p>
        ) : (
          <p className="hidden md:block text-blue-900">
            Перетащите MP3 файл сюда или нажмите для выбора
          </p>
        )}
        <p className="text-sm text-gray-500 mt-4">
          Максимальный размер файла: {MAX_FILE_SIZE_TEXT}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Поддерживаемые языки: Английский&nbsp;(en), Голландский&nbsp;(nl),
          Испанский&nbsp;(es), Индонезийский&nbsp;(id), Итальянский&nbsp;(it),
          Китайский&nbsp;(zh), Корейский&nbsp;(ko), Немецкий&nbsp;(de),
          Португальский&nbsp;(pt), Русский&nbsp;(ru), Турецкий&nbsp;(tr),
          Украинский&nbsp;(uk), Французский&nbsp;(fr), Хинди&nbsp;(hi),
          Шведский&nbsp;(sv), Японский&nbsp;(ja)
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
      <div className="mt-4 md:mt-8 order-1 md:order-2">
        <FileList />
      </div>
      <AudiobookSources />
    </div>
  );
};

export default UploadPage;
