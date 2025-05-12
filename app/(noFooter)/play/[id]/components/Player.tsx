// libs
import React, { useRef, useState, useCallback, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { createClient } from '@/utils/supabase/client';
import { useLogPracticeSession } from '@/hooks/useLogPracticeSession';

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

  const { trackPlayerInteraction } = useAnalytics();

  // --- Practice session state ---
  const sessionStartRef = useRef<Date | null>(null);
  const accumulatedTimeRef = useRef(0); // ms
  const playbackStartTimeRef = useRef<number | null>(null); // ms timestamp when playback starts/resumes

  const supabase = createClient();
  const logSession = useLogPracticeSession();

  // -- Helper: save session to Supabase via mutation
  const savePracticeSession = useCallback(
    async (durationMs: number, startedAt: Date | null) => {
      if (!pageId || !fileName || !startedAt) return;
      const { data } = await supabase.auth.getUser();
      const user_id = data?.user?.id;
      if (!user_id) return;
      logSession.mutate({
        user_id,
        page_id: pageId,
        file_name: fileName,
        started_at: startedAt.toISOString(),
        duration_seconds: Math.round(durationMs / 1000),
      });
    },
    [logSession, pageId, fileName, supabase]
  );

  // DRY: finalize and log session
const finalizeSession = useCallback(
  (sync: boolean = false) => {
    // Only log if a session is active and has started and playback was ongoing
    if (
      sessionStartRef.current &&
      playbackStartTimeRef.current !== null &&
      accumulatedTimeRef.current !== null
    ) {
      const now = Date.now();
      accumulatedTimeRef.current += now - playbackStartTimeRef.current;
      playbackStartTimeRef.current = null;
      if (sync) {
        // Synchronously flush session data (for beforeunload)
        let user_id: string | undefined;
        try {
          const raw = window.localStorage.getItem('supabase.auth.token');
          if (raw) {
            const parsed = JSON.parse(raw);
            user_id = parsed?.currentSession?.user?.id;
          }
        } catch {}
        if (user_id && pageId && fileName && sessionStartRef.current) {
          const payload = {
            user_id,
            page_id: pageId,
            file_name: fileName,
            started_at: sessionStartRef.current.toISOString(),
            duration_seconds: Math.round(accumulatedTimeRef.current / 1000),
          };
          try {
            navigator.sendBeacon(
              '/api/practice-session',
              new Blob([JSON.stringify(payload)], { type: 'application/json' })
            );
          } catch (e) {
            // Ignore errors in beforeunload
          }
        }
      } else {
        savePracticeSession(accumulatedTimeRef.current, sessionStartRef.current);
      }
      sessionStartRef.current = null;
      accumulatedTimeRef.current = 0;
      setSessionActive(false);
    }
  },
  [savePracticeSession, pageId, fileName]
);

// Visibility/page unload event handlers
const handleVisibility = useCallback(() => {
  if (document.visibilityState === 'hidden') {
    finalizeSession(false);
  }
}, [finalizeSession]);

const handleBeforeUnload = useCallback(() => {
  finalizeSession(true);
}, [finalizeSession]);

  // --- WaveSurfer logic ---
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
        trackPlayerInteraction({
          fileId,
          fileName: fileName || 'Unknown File',
          actionType: 'play',
          position: wavesurferRef.current?.getCurrentTime() || 0,
        });
      });

      // On PAUSE, end session and log
      wavesurferRef.current.on('pause', () => {
        finalizeSession(false);
        setIsPlaying(false);
        trackPlayerInteraction({
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
        setLoadingProgress(progress);
      });

      // On FINISH (natural end), end session and log
      wavesurferRef.current.on('finish', () => {
        finalizeSession(false);
        setIsPlaying(false);
        trackPlayerInteraction({
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

          trackPlayerInteraction({
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

      wavesurferRef.current.on('seeking', () => {
        trackPlayerInteraction({
          fileId,
          fileName: fileName || 'Unknown File',
          actionType: 'seek',
          position: wavesurferRef.current?.getCurrentTime() || 0,
        });
      });

      // Register visibility/page unload events here (removed from effect)
      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Clean up event listeners on destroy
      wavesurferRef.current.on('destroy', () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('beforeunload', handleBeforeUnload);
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
    isPlaying,
    handleVisibility,
    handleBeforeUnload,
  ]);

  useEffect(() => {
    initializeWaveSurfer();

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      // No need to clean up global handlers here; they're cleaned up by .on('destroy')
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializeWaveSurfer]);

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
      {saving && (
        <div className="text-xs text-blue-400 mt-2">Saving practice session...</div>
      )}
    </div>
  );
};

export default Player;
