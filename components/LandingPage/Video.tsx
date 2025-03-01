import { FC, useEffect, useRef, useState } from 'react';

interface VideoProps {
  src: string;
  poster?: string;
}

export const Video: FC<VideoProps> = ({ src, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
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
    }

    return () => observer.disconnect();
  }, [src]);

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
                     flex items-center justify-center
                     transition-all hover:bg-white/40 hover:scale-110"
          aria-label="Play video"
        >
          <div
            className="w-0 h-0 
                        border-t-[25px] border-t-transparent
                        border-l-[35px] border-l-white
                        border-b-[25px] border-b-transparent
                        ml-2"
          />
        </button>
      )}
    </div>
  );
};
