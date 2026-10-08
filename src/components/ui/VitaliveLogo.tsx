import React from 'react';

export const VITALIVE_LOGO_URL = 'https://res.cloudinary.com/drdjzjgn0/image/upload/v1791478715/VITALIVE-removebg-preview_igqrbw.png';
export const VITALIVE_BRAND_COLOR = '#10B981';
export const VITALIVE_DARK_BRAND = '#064E3B';
export const MIMOUZZA_BRAND_BG = '#C80C32';

export interface VitaliveLogoProps {
  className?: string;
  height?: number;
  variant?: 'white' | 'dark' | 'color';
  alt?: string;
}

export const VitaliveLogo: React.FC<VitaliveLogoProps> = ({
  className = '',
  height = 38,
  variant,
  alt = 'VITALIVE',
}) => {
  return (
    <img
      src={VITALIVE_LOGO_URL}
      alt={alt}
      height={height}
      style={{
        height: `${height}px`,
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
      }}
      className={`select-none shrink-0 inline-block transition-transform duration-150 ${className}`}
      loading="eager"
      decoding="async"
    />
  );
};

export const MimouzzaLogo = VitaliveLogo;
