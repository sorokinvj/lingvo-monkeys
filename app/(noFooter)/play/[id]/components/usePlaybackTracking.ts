import { useRef, useEffect, useCallback } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import WaveSurfer from 'wavesurfer.js';

interface PlaybackTrackingProps {
  fileId: string;
  fileName?: string;
  isPlaying: boolean;
  wavesurferRef: React.RefObject<WaveSurfer | null>;
}

export function usePlaybackTracking({
  fileId,
  fileName,
  isPlaying,
  wavesurferRef,
}: PlaybackTrackingProps) {
  // Рефы для отслеживания времени
  const sessionStartRef = useRef<string | null>(null);
  const currentPlaySegmentStartTimeRef = useRef<number | null>(null);
  const totalPlaybackTimeRef = useRef<number>(0);

  const { trackEvent } = useAnalytics();

  // Функция отправки данных - выделена в отдельную функцию для переиспользования
  const sendListeningData = useCallback(() => {
    if (currentPlaySegmentStartTimeRef.current !== null) {
      const elapsedTimeMs = Date.now() - currentPlaySegmentStartTimeRef.current;
      totalPlaybackTimeRef.current += elapsedTimeMs;
      currentPlaySegmentStartTimeRef.current = null;
    }

    if (totalPlaybackTimeRef.current > 0 && sessionStartRef.current) {
      console.log('Sending listening data', {
        totalTimeMs: totalPlaybackTimeRef.current,
      });

      trackEvent({
        eventType: 'file_listening',
        data: {
          fileId,
          fileName: fileName || 'Unknown File',
          startTime: sessionStartRef.current,
          endTime: new Date().toISOString(),
          durationSeconds: Math.floor(totalPlaybackTimeRef.current / 1000),
          totalPlaybackTimeMs: totalPlaybackTimeRef.current,
        },
      });

      // Сбрасываем счетчики после отправки
      sessionStartRef.current = null;
      totalPlaybackTimeRef.current = 0;
    }
  }, [fileId, fileName, trackEvent]);

  // Обработчики для различных событий плеера
  const handlePlay = useCallback(() => {
    // Запоминаем время начала сессии при первом запуске
    if (sessionStartRef.current === null) {
      sessionStartRef.current = new Date().toISOString();
    }

    // Начинаем отслеживать текущий сегмент
    currentPlaySegmentStartTimeRef.current = Date.now();
  }, []);

  const handlePause = useCallback(() => {
    if (currentPlaySegmentStartTimeRef.current !== null) {
      const elapsedTimeMs = Date.now() - currentPlaySegmentStartTimeRef.current;
      totalPlaybackTimeRef.current += elapsedTimeMs;
      currentPlaySegmentStartTimeRef.current = null;
    }

    // Отправляем данные при паузе
    sendListeningData();
  }, [sendListeningData]);

  const handleFinish = useCallback(() => {
    // Отправляем данные при завершении воспроизведения
    sendListeningData();
  }, [sendListeningData]);

  // Обработчик для beforeunload (закрытие вкладки/браузера)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentPlaySegmentStartTimeRef.current !== null) {
        const elapsedTimeMs =
          Date.now() - currentPlaySegmentStartTimeRef.current;
        totalPlaybackTimeRef.current += elapsedTimeMs;
      }

      if (totalPlaybackTimeRef.current > 0 && sessionStartRef.current) {
        // Используем sendBeacon для надежной отправки при закрытии
        navigator.sendBeacon(
          '/api/analytics/track',
          JSON.stringify({
            eventType: 'file_listening',
            data: {
              fileId,
              fileName: fileName || 'Unknown File',
              startTime: sessionStartRef.current,
              endTime: new Date().toISOString(),
              durationSeconds: Math.floor(totalPlaybackTimeRef.current / 1000),
              totalPlaybackTimeMs: totalPlaybackTimeRef.current,
            },
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [fileId, fileName]);

  // Обработчик для visibilitychange (вкладка в фоне)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Отправляем данные, когда вкладка уходит в фон
        sendListeningData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sendListeningData]);

  // Устанавливаем обработчики для wavesurfer
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.on('play', handlePlay);
      wavesurferRef.current.on('pause', handlePause);
      wavesurferRef.current.on('finish', handleFinish);

      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.un('play', handlePlay);
          wavesurferRef.current.un('pause', handlePause);
          wavesurferRef.current.un('finish', handleFinish);
        }
      };
    }
  }, [wavesurferRef.current, handlePlay, handlePause, handleFinish]);

  // Отслеживаем время при размонтировании компонента
  useEffect(() => {
    return () => {
      sendListeningData();
    };
  }, [sendListeningData]);

  // Возвращаем API для компонента
  return {
    sendListeningData,
  };
}
