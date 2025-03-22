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

export interface ListeningEvent extends BaseEvent {
  eventType: 'file_listening';
  fileId: string;
  fileName?: string;
  duration?: number;
  position?: number;
}

export interface PlayerEvent extends BaseEvent {
  eventType: 'player_interaction';
  actionType: 'play' | 'pause' | 'seek' | 'speed' | string;
  fileId?: string;
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

// Объединенный тип для всех событий
export type AnalyticsEvent =
  | UploadEvent
  | ListeningEvent
  | PlayerEvent
  | SettingsEvent
  | PageViewEvent;

// Структура ответа API
export interface UserAuditData {
  upload_events: UploadEvent[];
  listening_events: ListeningEvent[];
  player_events: PlayerEvent[];
  settings_events: SettingsEvent[];
  page_view_events: PageViewEvent[];
}
