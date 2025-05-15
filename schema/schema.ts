/**
 * Схема базы данных - константы и типы для использования в запросах
 * Это помогает избегать опечаток в названиях таблиц и колонок
 */

// Названия таблиц
export const Tables = {
  USER: 'User',
  FILE: 'File',
  TRANSCRIPTION: 'Transcription',
  PLAYER_EVENT: 'PlayerInteractionEvent',
  SETTINGS_EVENT: 'SettingsChangeEvent',
  FILE_UPLOAD_EVENT: 'FileUploadEvent',
  FILE_LISTENING_EVENT: 'FileListeningEvent',
  PAGE_VIEW_EVENT: 'PageViewEvent',
} as const;

export type TableName = (typeof Tables)[keyof typeof Tables];

// Колонки для каждой таблицы
export const Columns = {
  // Общие колонки для всех таблиц
  COMMON: {
    ID: 'id',
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt',
    USER_ID: 'userId',
  },

  // Колонки для User
  USER: {
    NAME: 'name',
    EMAIL: 'email',
  },

  // Колонки для File
  FILE: {
    NAME: 'name',
    PATH: 'path',
    SIZE: 'size',
    MIME_TYPE: 'mimeType',
    PUBLIC_URL: 'publicUrl',
    STATUS: 'status',
    TRANSCRIPTION_ID: 'transcriptionId',
    LANGUAGE: 'language',
    LANGUAGE_LEVEL: 'languageLevel',
    CONTENT_TYPE: 'contentType',
  },

  // Колонки для Transcription
  TRANSCRIPTION: {
    CONTENT: 'content',
    IS_TRANSCRIBING: 'isTranscribing',
    ERROR: 'error',
    FULL_TRANSCRIPTION: 'fullTranscription',
    FILE_ID: 'fileId',
  },

  // Колонки для PlayerEvent
  PLAYER_EVENT: {
    FILE_ID: 'fileId',
    ACTION_TYPE: 'actionType',
    POSITION: 'position',
    VALUE: 'value',
    METADATA: 'metadata',
  },

  // Колонки для SettingsEvent
  SETTINGS_EVENT: {
    SETTING_KEY: 'settingKey',
    OLD_VALUE: 'oldValue',
    NEW_VALUE: 'newValue',
  },

  // Колонки для UploadEvent
  UPLOAD_EVENT: {
    FILE_ID: 'fileId',
    FILE_NAME: 'fileName',
    FILE_SIZE: 'fileSize',
    STATUS: 'status',
    ERROR_MESSAGE: 'errorMessage',
  },

  // Колонки для PageViewEvent
  PAGE_VIEW_EVENT: {
    PATH: 'path',
    ENTERED_AT: 'enteredAt',
    IS_ACTIVE: 'isActive',
    LAST_ACTIVITY_AT: 'lastActivityAt',
    EXITED_AT: 'exitedAt',
    DURATION: 'duration',
  },

  // Колонки для FileListeningEvent
  FILE_LISTENING_EVENT: {
    FILE_ID: 'fileId',
    FILE_NAME: 'fileName',
    START_TIME: 'startTime',
    END_TIME: 'endTime',
    DURATION_SECONDS: 'durationSeconds',
    TOTAL_PLAYBACK_TIME_MS: 'totalPlaybackTimeMs',
  },
} as const;
