// libs
import React, { useRef, useState, useCallback, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useLogPracticeSession } from '@/hooks/useLogPracticeSession';
import { useUser } from '@/hooks/useUser';

// Минимальное время сессии для логирования (в мс)
const MIN_SESSION_DURATION_MS = 1000; // 1 секунда
// Дебаунс для аналитики (в мс)
const ANALYTICS_DEBOUNCE_MS = 500; // 0.5 секунды

interface PlayerProps {
  publicUrl: string;
  fileId: string;
  jumpToPositionMS?: number;
  onTimeUpdate?: (timeMS: number) => void;
  onWaveformSeek?: (timeMS: number) => void;
  onDurationReady?: (duration: number) => void;
  fileName?: string;
  pageId?: string; // for session logging
}

const Player: React.FC<PlayerProps> = ({
  publicUrl,
  fileId,
  jumpToPositionMS,
  onTimeUpdate,
  onWaveformSeek,
  onDurationReady,
  fileName,
  pageId, // NEW
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Предотвращение избыточной аналитики
  const lastTrackEventRef = useRef<{ type: string; time: number } | null>(null);
  const { trackPlayerInteraction } = useAnalytics();
  // Флаг для отслеживания инициализации WaveSurfer
  const wasPlayerInitializedRef = useRef(false);

  // Обертка для предотвращения дублирования аналитики
  const trackPlayerWithDebounce = useCallback(
    (data: any) => {
      const now = Date.now();
      if (
        !lastTrackEventRef.current ||
        lastTrackEventRef.current.type !== data.actionType ||
        now - lastTrackEventRef.current.time > ANALYTICS_DEBOUNCE_MS
      ) {
        lastTrackEventRef.current = { type: data.actionType, time: now };
        trackPlayerInteraction(data);
      }
    },
    [trackPlayerInteraction]
  );

  // --- Practice session state ---
  const sessionStartRef = useRef<Date | null>(null);
  const accumulatedTimeRef = useRef(0); // ms
  const playbackStartTimeRef = useRef<number | null>(null); // ms timestamp when playback starts/resumes
  const isFinalizingRef = useRef(false); // Флаг для предотвращения одновременных вызовов finalizeSession

  const logSession = useLogPracticeSession();
  const { data: user } = useUser();

  // -- Helper: save session to Supabase via mutation, using useUser
  const savePracticeSession = useCallback(
    (durationMs: number, startedAt: Date | null) => {
      if (!pageId || !fileName || !startedAt || !user?.id) return;
      logSession.mutate({
        user_id: user.id,
        page_id: pageId,
        file_name: fileName,
        started_at: startedAt.toISOString(),
        duration_seconds: Math.round(durationMs / 1000),
      });
    },
    [logSession, pageId, fileName, user]
  );

  /**
   * Финализация и логирование сессии - с защитой от дублирующих вызовов
   * и оптимизацией для предотвращения отправки слишком коротких сессий
   */
  const finalizeSession = useCallback(
    (isBeforeUnload = false) => {
      // Блокируем повторные вызовы
      if (isFinalizingRef.current) return;
      isFinalizingRef.current = true;

      // Проверяем наличие активной сессии
      if (sessionStartRef.current && playbackStartTimeRef.current !== null) {
        // Считаем накопленное время
        const now = Date.now();
        accumulatedTimeRef.current += now - playbackStartTimeRef.current;
        playbackStartTimeRef.current = null;

        // Логируем только если сессия имеет минимальную длительность
        if (accumulatedTimeRef.current >= MIN_SESSION_DURATION_MS) {
          if (
            isBeforeUnload &&
            user?.id &&
            pageId &&
            fileName &&
            sessionStartRef.current
          ) {
            /**
             * ВАЖНО: Здесь используется navigator.sendBeacon вместо обычного fetch запроса,
             * потому что он специально разработан для надёжной отправки данных при закрытии страницы.
             *
             * Почему sendBeacon:
             * 1. Гарантирует доставку данных даже когда страница закрывается (обычные XHR/fetch часто прерываются)
             * 2. Браузер выполняет запрос в фоне после закрытия страницы
             * 3. Не блокируется событием beforeunload, в отличие от синхронных AJAX
             * 4. Имеет высокий приоритет браузера для выполнения (выше чем обычные запросы)
             *
             * Мы оборачиваем вызов в try-catch и намеренно игнорируем ошибки, так как:
             * - Пользователь уже покидает страницу и не увидит уведомления об ошибке
             * - Мы не хотим мешать закрытию страницы из-за проблем с аналитикой
             * - В некоторых браузерах или с определенными настройками приватности
             *   sendBeacon может быть не поддержан или заблокирован
             */
            try {
              const payload = {
                user_id: user.id,
                page_id: pageId,
                file_name: fileName,
                started_at: sessionStartRef.current.toISOString(),
                duration_seconds: Math.round(accumulatedTimeRef.current / 1000),
              };

              navigator.sendBeacon(
                '/api/practice-session',
                new Blob([JSON.stringify(payload)], {
                  type: 'application/json',
                })
              );
            } catch (e) {
              // Игнорируем ошибки при beforeunload
            }
          } else if (user?.id) {
            // Обычный случай - используем мутацию
            savePracticeSession(
              accumulatedTimeRef.current,
              sessionStartRef.current
            );
          }
        }

        // Сбрасываем состояние сессии
        sessionStartRef.current = null;
        accumulatedTimeRef.current = 0;
      }

      // После короткой задержки разрешаем новые вызовы
      setTimeout(() => {
        isFinalizingRef.current = false;
      }, 100);
    },
    [savePracticeSession, pageId, fileName, user]
  );

  // Обработчики событий visibility и beforeunload
  const handleVisibility = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      finalizeSession(false);
    }
  }, [finalizeSession]);

  const handleBeforeUnload = useCallback(() => {
    finalizeSession(true);
  }, [finalizeSession]);

  // Главный Effect - инициализация WaveSurfer и обработчиков
  useEffect(() => {
    console.log(
      '[PLAYER] Mount effect called, wasInitialized:',
      wasPlayerInitializedRef.current
    );

    // Инициализируем WaveSurfer только один раз
    if (!wasPlayerInitializedRef.current && containerRef.current) {
      wasPlayerInitializedRef.current = true;
      console.log('[PLAYER] Creating WaveSurfer instance');

      // Создаём экземпляр WaveSurfer
      wavesurferRef.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: '#0349A4',
        progressColor: '#90AFE2',
        cursorColor: '#0349A4',
        barWidth: 2,
        barRadius: 3,
        height: 60,
        normalize: true,
        url: publicUrl,
        // Добавляем опцию кэширования для предотвращения повторных запросов
        fetchParams: {
          cache: 'force-cache',
        },
      });

      // Настраиваем обработчики событий
      wavesurferRef.current.on('ready', () => {
        console.log('[PLAYER] WaveSurfer ready event');
        setIsReady(true);

        if (wavesurferRef.current && onDurationReady) {
          onDurationReady(wavesurferRef.current.getDuration());
        }
      });

      wavesurferRef.current.on('play', () => {
        // If already playing, don't restart session
        if (!isPlaying) {
          setIsPlaying(true);
          // --- PRACTICE SESSION START LOGIC ---
          // If session not active, start one
          if (!sessionStartRef.current) {
            sessionStartRef.current = new Date();
            accumulatedTimeRef.current = 0;
          }
          playbackStartTimeRef.current = Date.now();
        } else if (playbackStartTimeRef.current === null) {
          // Resuming from pause
          playbackStartTimeRef.current = Date.now();
        }
        trackPlayerWithDebounce({
          fileId,
          fileName: fileName || 'Unknown File',
          actionType: 'play',
          position: wavesurferRef.current?.getCurrentTime() || 0,
        });
      });

      // On PAUSE, end session and log
      wavesurferRef.current.on('pause', () => {
        finalizeSession();
        setIsPlaying(false);
        trackPlayerWithDebounce({
          fileId,
          fileName: fileName || 'Unknown File',
          actionType: 'pause',
          position: wavesurferRef.current?.getCurrentTime() || 0,
        });
      });

      wavesurferRef.current.on('timeupdate', (currentTime) => {
        setCurrentTime(currentTime);
        onTimeUpdate?.(Math.floor(currentTime * 1000));
      });

      wavesurferRef.current.on('loading', (progress) => {
        console.log('[PLAYER] WaveSurfer loading event', { progress });
        setLoadingProgress(progress);
      });

      // On FINISH (natural end), end session and log
      wavesurferRef.current.on('finish', () => {
        finalizeSession();
        setIsPlaying(false);
        trackPlayerWithDebounce({
          fileId,
          fileName: fileName || 'Unknown File',
          actionType: 'playback_complete',
          position: currentTime,
          metadata: {
            method: 'auto',
            totalDuration: wavesurferRef.current?.getDuration() || 0,
          },
        });
      });

      // Seeking/clicking in waveform: do NOT stop session, just update position
      wavesurferRef.current.on('click', (relativePosition) => {
        if (typeof relativePosition === 'number' && wavesurferRef.current) {
          const absoluteTime =
            relativePosition * wavesurferRef.current.getDuration();
          const timeMS = Math.floor(absoluteTime * 1000);
          const totalDuration = wavesurferRef.current.getDuration();
          const positionPercent = Math.round(relativePosition * 100);

          trackPlayerWithDebounce({
            fileId,
            fileName: fileName || 'Unknown File',
            actionType: 'seek',
            position: absoluteTime,
            metadata: {
              source: 'transcript',
              method: 'click',
              positionPercent,
              totalDuration,
            },
          });

          onTimeUpdate?.(timeMS);
          onWaveformSeek?.(timeMS);
        }
      });

      // Добавляем дебаунс для seeking, чтобы предотвратить шквал событий
      let seekingTimeout: ReturnType<typeof setTimeout> | null = null;
      wavesurferRef.current.on('seeking', () => {
        if (seekingTimeout) {
          clearTimeout(seekingTimeout);
        }
        seekingTimeout = setTimeout(() => {
          trackPlayerWithDebounce({
            fileId,
            fileName: fileName || 'Unknown File',
            actionType: 'seek',
            position: wavesurferRef.current?.getCurrentTime() || 0,
          });
          seekingTimeout = null;
        }, 200); // Задержка 200мс перед отправкой события
      });

      // Сохраняем обработчик в функции destroy
      wavesurferRef.current.on('destroy', () => {
        console.log('[PLAYER] WaveSurfer destroy event');
      });
    }

    // Отдельно добавляем обработчики событий на документ
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Очистка при размонтировании компонента
    return () => {
      console.log('[PLAYER] Cleanup effect');

      // Удаляем обработчики событий
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Уничтожаем WaveSurfer
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }

      // Сбрасываем флаг инициализации только если компонент полностью размонтируется
      wasPlayerInitializedRef.current = false;
    };
  }, []); // Пустой массив зависимостей - выполняется только при монтировании

  // Отдельный эффект для обработки jumpToPositionMS
  useEffect(() => {
    if (
      wavesurferRef.current &&
      isReady &&
      typeof jumpToPositionMS === 'number'
    ) {
      wavesurferRef.current.setTime(jumpToPositionMS / 1000);
    }
  }, [jumpToPositionMS, isReady]);

  const onPlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const timeInMs = timeInSeconds * 1000;
    return dayjs().startOf('day').millisecond(timeInMs).format('HH:mm:ss.SSS');
  };

  const changePlaybackRate = useCallback(
    (increment: boolean) => {
      if (wavesurferRef.current) {
        setPlaybackRate((prevRate) => {
          const newRate = increment ? prevRate + 0.1 : prevRate - 0.1;
          const roundedRate = Number(newRate.toFixed(1));
          wavesurferRef.current?.setPlaybackRate(roundedRate);

          trackPlayerWithDebounce({
            fileId,
            fileName: fileName || 'Unknown File',
            actionType: 'speed_change',
            position: wavesurferRef.current?.getCurrentTime() || 0,
            metadata: {
              oldRate: prevRate,
              newRate: roundedRate,
            },
          });

          return roundedRate;
        });
      }
    },
    [trackPlayerWithDebounce, fileId, fileName]
  );

  return (
    <div className="flex flex-col md:space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={onPlayPause}
          type="button"
          className="p-2 bg-gray-200 rounded-full"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changePlaybackRate(false)}
            className="p-1 bg-gray-200 rounded"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-mono">{playbackRate.toFixed(1)}x</span>
          <button
            onClick={() => changePlaybackRate(true)}
            className="p-1 bg-gray-200 rounded"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <p className="font-mono">{formatTime(currentTime)}</p>
      </div>
      <div className="relative w-full h-[30px] md:h-[60px]">
        {loadingProgress < 100 && (
          <div className="absolute inset-0 bg-gray-100 rounded">
            <div
              className="h-full bg-blue-200 rounded transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default Player;
