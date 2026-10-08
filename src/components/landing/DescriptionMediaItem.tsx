import React from 'react';
import { isVideoUrl } from '../../lib/media';
import { AutoPlayVideo } from '../ui/AutoPlayVideo';

export { isVideoUrl as isDescriptionVideo } from '../../lib/media';

export function cleanMediaUrl(url: string): string {
  return (url || '').trim();
}

export interface DescriptionMediaItemProps {
  url: string;
  alt?: string;
  className?: string;
}

export const DescriptionMediaItem: React.FC<DescriptionMediaItemProps> = ({
  url,
  alt = '',
  className = 'w-full h-auto object-contain mx-auto block',
}) => {
  if (!url) return null;

  const isVideo = isVideoUrl(url);

  if (isVideo) {
    return (
      <div className="relative w-full overflow-hidden bg-black/5 rounded-xl">
        <AutoPlayVideo
          src={url}
          className={`${className} w-full rounded-xl`}
        />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={(e) => {
        // Fallback display if an image link fails
        const target = e.currentTarget;
        target.onerror = null;
      }}
    />
  );
};

export default DescriptionMediaItem;
