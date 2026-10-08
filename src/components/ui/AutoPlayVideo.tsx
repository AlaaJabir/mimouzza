import React, { useEffect, useRef } from 'react';

export interface AutoPlayVideoProps {
  src: string;
  className?: string;
  poster?: string;
}

/**
 * High-performance autoplay video component.
 * Follows modern browser autoplay policies (muted + playsinline + programmatic play attempt)
 * ensuring video starts immediately when landing page opens on iOS Safari, Android, and Desktop.
 */
export const AutoPlayVideo: React.FC<AutoPlayVideoProps> = ({
  src,
  className = '',
  poster,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Standard requirement for mobile & desktop autoplay
    video.muted = true;
    video.defaultMuted = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback for strict browser power-saver modes: play on first user interaction
        const startPlay = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
          window.removeEventListener('touchstart', startPlay);
          window.removeEventListener('click', startPlay);
          window.removeEventListener('scroll', startPlay);
        };
        window.addEventListener('touchstart', startPlay, { once: true, passive: true });
        window.addEventListener('click', startPlay, { once: true, passive: true });
        window.addEventListener('scroll', startPlay, { once: true, passive: true });
      });
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      controls
      preload="auto"
      poster={poster}
      className={className}
    />
  );
};
