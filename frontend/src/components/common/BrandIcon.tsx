import React from 'react';

export interface BrandIconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'glyph' | 'container' | 'monochrome';
  className?: string;
  withGlow?: boolean;
}

export const BrandIcon: React.FC<BrandIconProps> = ({
  size = 'md',
  variant = 'container',
  className = '',
  withGlow = false,
}) => {
  const getDimension = () => {
    if (typeof size === 'number') return { width: size, height: size };
    switch (size) {
      case 'xs':
        return { width: 16, height: 16 };
      case 'sm':
        return { width: 24, height: 24 };
      case 'md':
        return { width: 36, height: 36 };
      case 'lg':
        return { width: 48, height: 48 };
      case 'xl':
        return { width: 64, height: 64 };
      default:
        return { width: 36, height: 36 };
    }
  };

  const { width, height } = getDimension();

  if (variant === 'glyph') {
    return (
      <svg
        viewBox="0 0 512 512"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block shrink-0 ${withGlow ? 'drop-shadow-[0_0_12px_rgba(239,68,68,0.45)]' : ''} ${className}`}
        aria-label="Emergency Alert & Hospital Assistance Brand Symbol"
        role="img"
      >
        <defs>
          <linearGradient id="brandShieldRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
          <linearGradient id="brandCrossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF4D4D" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>

        {/* Radiating Dispatch Radar Signal */}
        <path d="M 212, 70 A 48,48 0 0,1 300, 70" stroke="#38BDF8" strokeWidth="12" strokeLinecap="round" opacity="0.75" />
        <path d="M 188, 44 A 78,78 0 0,1 324, 44" stroke="#38BDF8" strokeWidth="8" strokeLinecap="round" opacity="0.4" />

        {/* Protective Shield Contour */}
        <path
          d="M 256, 94 C 348, 94 420, 120 420, 202 C 420, 332 328, 420 256, 456 C 184, 420 92, 332 92, 202 C 92, 120 164, 94 256, 94 Z"
          fill="#0F172A"
          stroke="url(#brandShieldRim)"
          strokeWidth="16"
          strokeLinejoin="round"
        />

        {/* Medical Cross Geometry */}
        <rect x="222" y="140" width="68" height="244" rx="22" fill="url(#brandCrossGrad)" />
        <rect x="132" y="230" width="248" height="68" rx="22" fill="url(#brandCrossGrad)" />

        {/* Cardiac Vitallink ECG Waveform */}
        <path
          d="M 118, 264 L 192, 264 L 214, 226 L 236, 318 L 260, 172 L 286, 346 L 306, 244 L 322, 264 L 394, 264"
          stroke="#FFFFFF"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Apex Dispatch Beacon Node */}
        <circle cx="256" cy="94" r="14" fill="#38BDF8" />
        <circle cx="256" cy="94" r="20" stroke="#38BDF8" strokeWidth="4" opacity="0.8" />
      </svg>
    );
  }

  if (variant === 'monochrome') {
    return (
      <svg
        viewBox="0 0 512 512"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block shrink-0 ${className}`}
        aria-label="Emergency Alert & Hospital Assistance Brand Symbol"
        role="img"
      >
        {/* Signal Arc */}
        <path d="M 212, 70 A 48,48 0 0,1 300, 70" stroke="currentColor" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
        {/* Shield Contour */}
        <path
          d="M 256, 94 C 348, 94 420, 120 420, 202 C 420, 332 328, 420 256, 456 C 184, 420 92, 332 92, 202 C 92, 120 164, 94 256, 94 Z"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinejoin="round"
        />
        {/* Medical Cross */}
        <rect x="222" y="140" width="68" height="244" rx="22" fill="currentColor" fillOpacity="0.25" />
        <rect x="132" y="230" width="248" height="68" rx="22" fill="currentColor" fillOpacity="0.25" />
        {/* ECG Waveform */}
        <path
          d="M 118, 264 L 192, 264 L 214, 226 L 236, 318 L 260, 172 L 286, 346 L 306, 244 L 322, 264 L 394, 264"
          stroke="currentColor"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Beacon */}
        <circle cx="256" cy="94" r="14" fill="currentColor" />
      </svg>
    );
  }

  // Full container variant with sleek rounded squircle
  return (
    <svg
      viewBox="0 0 512 512"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${withGlow ? 'drop-shadow-[0_0_16px_rgba(239,68,68,0.5)]' : ''} ${className}`}
      aria-label="Emergency Alert & Hospital Assistance Brand Symbol"
      role="img"
    >
      <defs>
        <radialGradient id="techBgCard" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="55%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        <linearGradient id="shieldStrokeCard" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="45%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id="crossGradCard" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF4D4D" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>

      {/* Titanium Squircle Container */}
      <rect x="20" y="20" width="472" height="472" rx="104" fill="url(#techBgCard)" stroke="#334155" strokeWidth="4" strokeOpacity="0.6" />

      {/* Radar Arcs */}
      <path d="M 212, 78 A 48,48 0 0,1 300, 78" stroke="#38BDF8" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
      <path d="M 188, 54 A 78,78 0 0,1 324, 54" stroke="#38BDF8" strokeWidth="7" strokeLinecap="round" opacity="0.3" />

      {/* Shield Body */}
      <path
        d="M 256, 102 C 344, 102 414, 126 414, 204 C 414, 328 324, 410 256, 444 C 188, 410 98, 328 98, 204 C 98, 126 168, 102 256, 102 Z"
        fill="#090E17"
        stroke="url(#shieldStrokeCard)"
        strokeWidth="12"
        strokeLinejoin="round"
      />

      {/* Cross Beams */}
      <rect x="224" y="146" width="64" height="236" rx="20" fill="url(#crossGradCard)" />
      <rect x="138" y="234" width="236" height="64" rx="20" fill="url(#crossGradCard)" />

      {/* Vitallink ECG Waveform */}
      <path
        d="M 124, 266 L 194, 266 L 214, 230 L 236, 318 L 260, 178 L 286, 344 L 306, 246 L 322, 266 L 388, 266"
        stroke="#FFFFFF"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Apex Beacon */}
      <circle cx="256" cy="102" r="12" fill="#38BDF8" />
      <circle cx="256" cy="102" r="18" stroke="#38BDF8" strokeWidth="3" opacity="0.8" />
    </svg>
  );
};
