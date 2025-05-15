// libs
import React, { useRef, useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import { useAnalytics } from '@/hooks/useAnalytics';

interface PlayerProps {
  publicUrl: string;
  fileId: string;
  jumpToPositionMS?: number;
  onTimeUpdate?: (timeMS: number) => void;
  onWaveformSeek?: (timeMS: number) => void;
  onDurationReady?: (duration: number) => void;
  fileName?: string;
}

const Player: React.FC<PlayerProps> = ({
  publicUrl,
  fileId,
  jumpToPositionMS,
  onTimeUpdate,
  onWaveformSeek,
  onDurationReady,
  fileName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const currentTimeRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Рефы для отслеживания времени прослушивания
  const sessionStartRef = useRef<string | null>(null); // Время начала всей сессии прослушивания
  const currentPlaySegmentStartTimeRef = useRef<number | null>(null); // Время начала текущего сегмента воспроизведения
  const totalPlaybackTimeRef = useRef<number>(0); // Общее накопленное время прослушивания
  const { trackPlayerInteraction, trackEvent } = useAnalytics();

  const initializeWaveSurfer = useCallback(() => {
    if (containerRef.current && !wavesurferRef.current) {
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
      });

      wavesurferRef.current.on('ready', () => {
        setIsReady(true);

        if (wavesurferRef.current && onDurationReady) {
          onDurationReady(wavesurferRef.current.getDuration());
        }
      });

      wavesurferRef.current.on('play', () => {
        setIsPlaying(true);

        // Запоминаем время начала сессии при первом запуске воспроизведения
        if (sessionStartRef.current === null) {
          sessionStartRef.current = new Date().toISOString();
        }

        // Начинаем отслеживать текущий сегмент воспроизведения
        currentPlaySegmentStartTimeRef.current = Date.now();
      });

      wavesurferRef.current.on('pause', () => {
        setIsPlaying(false);

        // Рассчитываем время воспроизведения при остановке
        if (currentPlaySegmentStartTimeRef.current !== null) {
          const elapsedTimeMs =
            Date.now() - currentPlaySegmentStartTimeRef.current;
          totalPlaybackTimeRef.current += elapsedTimeMs;
          currentPlaySegmentStartTimeRef.current = null;
        }
      });

      wavesurferRef.current.on('timeupdate', (currentTime) => {
        currentTimeRef.current = currentTime;
        onTimeUpdate?.(Math.floor(currentTime * 1000));
      });

      wavesurferRef.current.on('loading', (progress) => {
        setLoadingProgress(progress);
      });

      wavesurferRef.current.on('finish', () => {
        // Если воспроизведение идет, сохраняем текущее накопленное время
        if (currentPlaySegmentStartTimeRef.current !== null) {
          const elapsedTimeMs =
            Date.now() - currentPlaySegmentStartTimeRef.current;
          totalPlaybackTimeRef.current += elapsedTimeMs;
          currentPlaySegmentStartTimeRef.current = null;
        }

        trackEvent({
          eventType: 'file_listening',
          data: {
            fileId,
            fileName: fileName || 'Unknown File',
            startTime: sessionStartRef.current || new Date().toISOString(),
            endTime: new Date().toISOString(),
            durationSeconds: Math.floor(totalPlaybackTimeRef.current / 1000),
            totalPlaybackTimeMs: totalPlaybackTimeRef.current,
          },
        });

        // Сбрасываем рефы после отправки
        sessionStartRef.current = null;
        totalPlaybackTimeRef.current = 0;

        trackPlayerInteraction({
          fileId,
          fileName: fileName || 'Unknown File',
          actionType: 'playback_complete',
          position: currentTimeRef.current,
          metadata: {
            method: 'auto',
            totalDuration: wavesurferRef.current?.getDuration() || 0,
            sessionTimeMs: totalPlaybackTimeRef.current,
          },
        });
      });

      wavesurferRef.current.on('click', (relativePosition) => {
        if (typeof relativePosition === 'number' && wavesurferRef.current) {
          const absoluteTime =
            relativePosition * wavesurferRef.current.getDuration();
          const timeMS = Math.floor(absoluteTime * 1000);
          onTimeUpdate?.(timeMS);
          onWaveformSeek?.(timeMS);
        }
      });
    }
  }, [
    publicUrl,
    onTimeUpdate,
    onWaveformSeek,
    trackPlayerInteraction,
    fileId,
    onDurationReady,
    fileName,
    trackEvent,
  ]);

  useEffect(() => {
    initializeWaveSurfer();

    return () => {
      // Сохраняем накопленное время при размонтировании компонента
      if (currentPlaySegmentStartTimeRef.current !== null) {
        const elapsedTimeMs =
          Date.now() - currentPlaySegmentStartTimeRef.current;
        totalPlaybackTimeRef.current += elapsedTimeMs;
      }

      if (totalPlaybackTimeRef.current > 0) {
        // Отправляем FileListeningEvent
        trackEvent({
          eventType: 'file_listening',
          data: {
            fileId,
            fileName: fileName || 'Unknown File',
            startTime: sessionStartRef.current || new Date().toISOString(),
            endTime: new Date().toISOString(),
            durationSeconds: Math.floor(totalPlaybackTimeRef.current / 1000),
            totalPlaybackTimeMs: totalPlaybackTimeRef.current,
          },
        });

        // Обнуляем счетчики при успешной отправке
        sessionStartRef.current = null;
        totalPlaybackTimeRef.current = 0;
      }

      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [
    initializeWaveSurfer,
    trackPlayerInteraction,
    fileId,
    fileName,
    trackEvent,
  ]);

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

          trackPlayerInteraction({
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
    [trackPlayerInteraction, fileId, fileName]
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
        <p className="font-mono">{formatTime(currentTimeRef.current)}</p>
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
