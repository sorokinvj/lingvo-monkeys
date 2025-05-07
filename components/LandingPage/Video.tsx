import { FC, useEffect, useRef, useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

// Используем фиксированный UUID для лендинг-видео
// UUID v4 сгенерирован заранее
const LANDING_VIDEO_UUID = '00000000-0000-4000-a000-000000000001';

interface VideoProps {
  src: string;
  poster?: string;
}

export const Video: FC<VideoProps> = ({ src, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const { trackPlayerInteraction } = useAnalytics();

  const handlePlayClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        trackPlayerInteraction({
          fileId: LANDING_VIDEO_UUID,
          fileName: 'LandingVideo',
          actionType: 'pause',
          position: videoRef.current.currentTime,
        });
      } else {
        videoRef.current.play();
        if (hasEnded) {
          setHasEnded(false);
          // Reset video to beginning when clicking "Play Again"
          videoRef.current.currentTime = 0;
        }
        trackPlayerInteraction({
          fileId: LANDING_VIDEO_UUID,
          fileName: 'LandingVideo',
          actionType: 'play',
          position: videoRef.current.currentTime,
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.src = src;
          observer.unobserve(entry.target);
        }
      });
    }, options);

    if (videoRef.current) {
      observer.observe(videoRef.current);

      // Add ended event listener to track video completion
      const video = videoRef.current;
      const handleVideoEnded = () => {
        setIsPlaying(false);
        setHasEnded(true);

        trackPlayerInteraction({
          fileId: LANDING_VIDEO_UUID,
          fileName: 'LandingVideo',
          actionType: 'playback_complete',
          position: video.duration,
          metadata: {
            method: 'auto',
            totalDuration: video.duration,
          },
        });
      };

      video.addEventListener('ended', handleVideoEnded);

      return () => {
        observer.disconnect();
        video.removeEventListener('ended', handleVideoEnded);
      };
    }

    return () => observer.disconnect();
  }, [src, trackPlayerInteraction]);

  return (
    <div className="relative group">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="loading-spinner" />
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full"
        poster={poster}
        preload="metadata"
        onLoadedData={() => setIsLoading(false)}
        onClick={handlePlayClick}
      >
        <source type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {!isPlaying && (
        <button
          onClick={handlePlayClick}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                     w-32 h-32 bg-white/30 rounded-full
                     flex flex-col items-center justify-center
                     transition-all hover:bg-white/40 hover:scale-110"
          aria-label={hasEnded ? 'Play again' : 'Play video'}
        >
          {hasEnded ? (
            <>
              <div className="w-12 h-12 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-8 h-8"
                >
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                </svg>
              </div>
              <span className="text-white font-medium mt-1">Play Again</span>
            </>
          ) : (
            <div
              className="w-0 h-0 
                          border-t-[25px] border-t-transparent
                          border-l-[35px] border-l-white
                          border-b-[25px] border-b-transparent
                          ml-2"
            />
          )}
        </button>
      )}
    </div>
  );
};
