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
  actionType: 'play' | 'pause' | 'seek' | 'speed' | string;
  fileId?: string;
  fileName?: string;
  position?: number;
  speed?: number;
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
  streak: number;
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

// Объединенный тип для всех событий
export type AnalyticsEvent =
  | UploadEvent
  | PlayerEvent
  | SettingsEvent
  | PageViewEvent;

// Структура ответа API
export interface UserAuditData {
  upload_events: UploadEvent[];
  player_events: PlayerEvent[];
  settings_events: SettingsEvent[];
  page_view_events: PageViewEvent[];
  daily_stats?: UserDailyStats;
}
