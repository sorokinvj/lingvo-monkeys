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
  PRESIGN: 10,
  PREPARING: 30,
  UPLOAD: 50,
  PROCESSING: 80,
  COMPLETED: 100,
} as const;

export type UploadStage = keyof typeof UPLOAD_STAGES;
