// libs
import React, { useRef, useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Pause, Play } from 'lucide-react';
import dayjs from 'dayjs';

interface PlayerProps {
  publicUrl: string;
  jumpToPositionMS?: number;
  onTimeUpdate?: (timeMS: number) => void;
}

const Player: React.FC<PlayerProps> = ({
  publicUrl,
  jumpToPositionMS,
  onTimeUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const initializeWaveSurfer = useCallback(() => {
    if (containerRef.current && !wavesurferRef.current) {
      console.log('Initializing WaveSurfer');
      wavesurferRef.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: '#4F4A85',
        progressColor: '#FF69B4',
        cursorColor: '#383351',
        barWidth: 2,
        barRadius: 3,
        height: 60,
        normalize: true,
        url: publicUrl,
      });

      wavesurferRef.current.on('ready', () => {
        console.log('WaveSurfer is ready');
        setIsReady(true);
      });

      wavesurferRef.current.on('play', () => setIsPlaying(true));
      wavesurferRef.current.on('pause', () => setIsPlaying(false));
      wavesurferRef.current.on('timeupdate', (currentTime) => {
        setCurrentTime(currentTime);
        onTimeUpdate?.(Math.floor(currentTime * 1000));
      });
      wavesurferRef.current.on('loading', (progress) => {
        console.log(`Loading progress: ${progress}%`);
      });
    }
  }, [publicUrl, onTimeUpdate]);

  useEffect(() => {
    initializeWaveSurfer();

    return () => {
      if (wavesurferRef.current) {
        console.log('Destroying WaveSurfer instance');
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
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

  return (
    <div className="fixed bottom-8 left-8 right-8 mx-auto w-11/12 max-w-4xl bg-white rounded-lg shadow-lg p-4 z-50">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onPlayPause}
            type="button"
            className="p-2 bg-gray-200 rounded-full"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <p className="font-mono">{formatTime(currentTime)}</p>
        </div>
        <div ref={containerRef} className="w-full" style={{ height: '60px' }} />
      </div>
    </div>
  );
};

export default Player;
