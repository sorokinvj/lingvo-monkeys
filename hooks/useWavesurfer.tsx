import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveSurferContextType {
  wavesurfer: WaveSurfer | null;
  isPlaying: boolean;
  currentTrack: string | null;
  initializeWavesurfer: (
    container: HTMLElement,
    options: WaveSurfer.WaveSurferParams
  ) => void;
  loadTrack: (url: string) => void;
  playPause: () => void;
  setTime: (time: number) => void;
}

const WaveSurferContext = createContext<WaveSurferContextType | undefined>(
  undefined
);

export const WaveSurferProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);

  const initializeWavesurfer = (
    container: HTMLElement,
    options: WaveSurfer.WaveSurferParams
  ) => {
    if (wavesurfer) {
      wavesurfer.destroy();
    }
    const ws = WaveSurfer.create({ ...options, container });
    setWavesurfer(ws);

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
  };

  const loadTrack = (url: string) => {
    if (wavesurfer && url !== currentTrack) {
      wavesurfer.load(url);
      setCurrentTrack(url);
    }
  };

  const playPause = () => {
    if (wavesurfer) {
      wavesurfer.playPause();
    }
  };

  const setTime = (time: number) => {
    if (wavesurfer) {
      wavesurfer.setTime(time);
    }
  };

  return (
    <WaveSurferContext.Provider
      value={{
        wavesurfer,
        isPlaying,
        currentTrack,
        initializeWavesurfer,
        loadTrack,
        playPause,
        setTime,
      }}
    >
      {children}
    </WaveSurferContext.Provider>
  );
};

export const useWaveSurfer = () => {
  const context = useContext(WaveSurferContext);
  if (context === undefined) {
    throw new Error('useWaveSurfer must be used within a WaveSurferProvider');
  }
  return context;
};
