// File size limits
export const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
export const MAX_FILE_SIZE_TEXT = '1ГБ';

// Timeouts (in seconds)
export const UPLOAD_TIMEOUT_SEC = 600; // 10 minutes
export const UPLOAD_TIMEOUT = UPLOAD_TIMEOUT_SEC * 1000; // 10 minutes in milliseconds

// Content types
export const ALLOWED_AUDIO_TYPES = {
  'audio/mpeg': ['.mp3'],
};

// Upload stages
export const UPLOAD_STAGES = {
  PRESIGN: 10, // 0-10%: Получение presigned URL
  PREPARING: 20, // 10-20%: Подготовка загрузки
  UPLOAD: 60, // 20-60%: Загрузка файла (XHR)
  PROCESSING: 90, // 60-90%: Обработка файла
  COMPLETED: 100, // 90-100%: Завершение
} as const;

export type UploadStage = keyof typeof UPLOAD_STAGES;

// Фиксированные идентификаторы для аналитики
export const LANDING_VIDEO_UUID = '00000000-0000-4000-a000-000000000001';
