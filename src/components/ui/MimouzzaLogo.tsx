import React from 'react';

export const MIMOUZZA_BRAND_BG = '#C80C32';

interface MimouzzaLogoProps {
  className?: string;
  height?: number;
}

export const MimouzzaLogo: React.FC<MimouzzaLogoProps> = ({
  className = '',
  height = 38,
}) => {
  const uid = React.useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 595 138"
      height={height}
      style={{ height: `${height}px`, width: 'auto' }}
      className={`select-none shrink-0 block ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Mimouzza"
    >
      <defs>
        {/* Subtle drop shadow for white letters & M */}
        <filter id={`textShadow-${uid}`} x="-10%" y="-10%" width="125%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#6E0018" floodOpacity="0.35" />
        </filter>

        {/* Drop shadow behind the two central petals onto the white M */}
        <filter id={`petalShadow-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#5A0014" floodOpacity="0.48" />
        </filter>

        {/* Left & Right Petal Upper/Inner Orange-Coral Gradient */}
        <linearGradient id={`petalOrange-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9A3C" />
          <stop offset="55%" stopColor="#FF662E" />
          <stop offset="100%" stopColor="#F83648" />
        </linearGradient>

        {/* Left & Right Petal Lower/Outer Coral-Magenta Gradient */}
        <linearGradient id={`petalPink-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF5B37" />
          <stop offset="50%" stopColor="#F82553" />
          <stop offset="100%" stopColor="#E00B4B" />
        </linearGradient>
      </defs>

      {/* ==================== "M" EMBLEM ==================== */}
      <g filter={`url(#textShadow-${uid})`}>
        {/* Top White Circle (Person Head) */}
        <circle cx="79" cy="25" r="14" fill="#FFFFFF" />

        {/* White "M" Arched Body */}
        <path
          d="M 14 112
             L 14 47
             C 14 35, 25 31, 35 36
             C 52 44, 68 62, 79 81
             C 90 62, 106 44, 123 36
             C 133 31, 144 35, 144 47
             L 144 112
             C 144 119, 138 123, 131 123
             C 124 123, 118 119, 118 112
             L 118 68
             C 106 80, 92 98, 79 116
             C 66 98, 52 80, 40 68
             L 40 112
             C 40 119, 34 123, 27 123
             C 20 123, 14 119, 14 112 Z"
          fill="#FFFFFF"
        />
      </g>

      {/* Two Lotus Petals inside the M */}
      <g filter={`url(#petalShadow-${uid})`}>
        {/* Left Petal - Lower/Outer Pink Half */}
        <path
          d="M 34 71
             C 32 97, 45 119, 77 125
             C 64 106, 50 88, 34 71 Z"
          fill={`url(#petalPink-${uid})`}
        />
        {/* Left Petal - Upper/Inner Orange Half */}
        <path
          d="M 34 71
             C 59 74, 76 94, 77 125
             C 61 107, 48 89, 34 71 Z"
          fill={`url(#petalOrange-${uid})`}
        />

        {/* Right Petal - Lower/Outer Pink Half */}
        <path
          d="M 124 71
             C 126 97, 113 119, 81 125
             C 94 106, 108 88, 124 71 Z"
          fill={`url(#petalPink-${uid})`}
        />
        {/* Right Petal - Upper/Inner Orange Half */}
        <path
          d="M 124 71
             C 99 74, 82 94, 81 125
             C 97 107, 110 89, 124 71 Z"
          fill={`url(#petalOrange-${uid})`}
        />
      </g>

      {/* ==================== "imouzza" WORDMARK ==================== */}
      <g filter={`url(#textShadow-${uid})`}>
        {/* "i" */}
        <circle cx="166" cy="48" r="10.5" fill="#FFFFFF" />
        <line
          x1="166"
          y1="73"
          x2="166"
          y2="113"
          stroke="#FFFFFF"
          strokeWidth="19"
          strokeLinecap="round"
        />

        {/* "m" */}
        <line
          x1="197"
          y1="73"
          x2="197"
          y2="113"
          stroke="#FFFFFF"
          strokeWidth="19"
          strokeLinecap="round"
        />
        <path
          d="M 197 88 C 197 66, 235 66, 235 88 L 235 113"
          stroke="#FFFFFF"
          strokeWidth="19"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 235 88 C 235 66, 273 66, 273 88 L 273 113"
          stroke="#FFFFFF"
          strokeWidth="19"
          strokeLinecap="round"
          fill="none"
        />

        {/* "o" */}
        <circle
          cx="317"
          cy="93"
          r="21"
          stroke="#FFFFFF"
          strokeWidth="18.5"
          fill="none"
        />

        {/* "u" */}
        <path
          d="M 361 73 L 361 95 C 361 119, 399 119, 399 95 L 399 73"
          stroke="#FFFFFF"
          strokeWidth="18.5"
          strokeLinecap="round"
          fill="none"
        />
        <line
          x1="399"
          y1="73"
          x2="399"
          y2="113"
          stroke="#FFFFFF"
          strokeWidth="18.5"
          strokeLinecap="round"
        />

        {/* "z" (1) */}
        <path
          d="M 425 73 L 459 73 L 425 113 L 459 113"
          stroke="#FFFFFF"
          strokeWidth="17.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* "z" (2) */}
        <path
          d="M 480 73 L 514 73 L 480 113 L 514 113"
          stroke="#FFFFFF"
          strokeWidth="17.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* "a" */}
        <circle
          cx="553"
          cy="93"
          r="20.5"
          stroke="#FFFFFF"
          strokeWidth="18.5"
          fill="none"
        />
        <line
          x1="573.5"
          y1="73"
          x2="573.5"
          y2="113"
          stroke="#FFFFFF"
          strokeWidth="18.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
