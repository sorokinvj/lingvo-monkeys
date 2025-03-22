import { useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import type { AnalyticsEvent } from '@/app/api/analytics/track/route';

/**
 * Хук для отправки аналитических событий
 */
export function useAnalytics() {
  const { data: user } = useUser();

  /**
   * Отправка события аналитики на сервер
   */
  const trackEvent = useCallback(
    async (event: AnalyticsEvent) => {
      if (!user) return;

      try {
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error tracking event:', errorData);
        }

        return response.json();
      } catch (error) {
        console.error('Failed to track event:', error);
      }
    },
    [user]
  );

  /**
   * Трекинг загрузки файла
   */
  const trackFileUpload = useCallback(
    (data: {
      fileId: string;
      fileName: string;
      fileSize: number;
      status?: string;
    }) => {
      return trackEvent({
        eventType: 'file_upload',
        data,
      });
    },
    [trackEvent]
  );

  /**
   * Трекинг изменения статуса файла
   */
  const trackFileStatusChange = useCallback(
    (data: {
      fileId: string;
      uploadEventId: string;
      status: 'uploading' | 'processing' | 'transcribed' | 'error';
      error?: string;
    }) => {
      return trackEvent({
        eventType: 'file_status_change',
        data,
      });
    },
    [trackEvent]
  );

  /**
   * Трекинг начала прослушивания файла
   */
  const trackFileListeningStart = useCallback(
    (data: { fileId: string }) => {
      return trackEvent({
        eventType: 'file_listening',
        data: {
          ...data,
          startTime: new Date().toISOString(),
        },
      });
    },
    [trackEvent]
  );

  /**
   * Трекинг завершения прослушивания файла
   */
  const trackFileListeningEnd = useCallback(
    (data: { fileId: string; startTime: string; durationSeconds: number }) => {
      return trackEvent({
        eventType: 'file_listening',
        data: {
          ...data,
          endTime: new Date().toISOString(),
        },
      });
    },
    [trackEvent]
  );

  /**
   * Трекинг взаимодействия с плеером
   */
  const trackPlayerInteraction = useCallback(
    async (data: {
      fileId: string;
      fileName: string;
      actionType:
        | 'play'
        | 'pause'
        | 'seek'
        | 'speed_change'
        | 'playback_complete';
      position?: number;
      metadata?: Record<string, any>;
    }) => {
      try {
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventType: 'player_interaction',
            data,
          }),
        });

        // Клонируем response для двойного чтения
        const clonedResponse = response.clone();

        if (!response.ok) {
          const errorText = await clonedResponse.text();
          console.error('Error tracking event:', errorText);
          return { error: errorText };
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Failed to track player interaction:', error);
        return { error };
      }
    },
    []
  );

  /**
   * Трекинг взаимодействия с текстом транскрипции
   */
  const trackTranscriptInteraction = useCallback(
    (data: { fileId: string; wordIndex: number; timestamp: number }) => {
      return trackEvent({
        eventType: 'transcript_interaction',
        data,
      });
    },
    [trackEvent]
  );

  /**
   * Трекинг изменения настроек
   */
  const trackSettingsChange = useCallback(
    (data: { settingKey: string; oldValue: any; newValue: any }) => {
      return trackEvent({
        eventType: 'settings_change',
        data,
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackFileUpload,
    trackFileStatusChange,
    trackFileListeningStart,
    trackFileListeningEnd,
    trackPlayerInteraction,
    trackTranscriptInteraction,
    trackSettingsChange,
  };
}
