// Базовый интерфейс для всех событий
export interface BaseEvent {
  id: string;
  userId: string;
  createdAt: string;
  [key: string]: any;
}

// Интерфейсы для разных типов событий
export interface UploadEvent extends BaseEvent {
  eventType: 'file_upload';
  fileName: string;
  fileId: string;
  fileSize?: number;
  fileType?: string;
}

export interface PlayerEvent extends BaseEvent {
  eventType: 'player_interaction';
  actionType?: 'play' | 'pause' | 'seek' | 'speed' | 'speed_change' | string;
  action?: string; // Добавляем поле action для совместимости со старыми данными
  fileId?: string;
  fileName?: string;
  position?: number;
  speed?: number;
  metadata?: Record<string, any>;
}

export interface SettingsEvent extends BaseEvent {
  eventType: 'settings_change';
  settingKey: string;
  oldValue?: string;
  newValue?: string;
}

export interface PageViewEvent extends BaseEvent {
  eventType: 'page_view';
  path?: string;
  referrer?: string;
  duration?: number;
}

// Интерфейс для агрегированной статистики
export interface UserDailyStats {
  totalSeconds: number;
  totalFilesListened: number;
  dailyStats?: Array<{
    date: string;
    totalListeningSeconds: number;
    totalFilesUploaded: number;
    filesListened: Array<{
      fileId: string;
      fileName: string;
      seconds: number;
    }>;
  }>;
}

// Интерфейс для события прослушивания файла
export interface FileListeningEvent extends BaseEvent {
  eventType: 'file_listening';
  fileId: string;
  fileName?: string;
  duration: number; // длительность в секундах
}

// Объединенный тип для всех событий
export type AnalyticsEvent =
  | UploadEvent
  | PlayerEvent
  | SettingsEvent
  | PageViewEvent
  | FileListeningEvent;

// Структура ответа API
export interface UserAuditData {
  upload_events: UploadEvent[];
  player_events: PlayerEvent[];
  settings_events: SettingsEvent[];
  page_view_events: PageViewEvent[];
  listening_events: FileListeningEvent[];
  daily_stats?: UserDailyStats;
}
