// libs
import React, { useRef, useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [playbackRate, setPlaybackRate] = useState(1.0);

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

  const changePlaybackRate = useCallback((increment: boolean) => {
    if (wavesurferRef.current) {
      setPlaybackRate((prevRate) => {
        const newRate = increment ? prevRate + 0.1 : prevRate - 0.1;
        const roundedRate = Number(newRate.toFixed(1));
        wavesurferRef.current?.setPlaybackRate(roundedRate);
        return roundedRate;
      });
    }
  }, []);

  return (
    <div className="flex flex-col space-y-2">
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
      <div ref={containerRef} className="w-full" style={{ height: '60px' }} />
    </div>
  );
};

export default Player;
