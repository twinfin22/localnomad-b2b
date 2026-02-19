'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

interface LogoIconProps {
  size?: number;
  className?: string;
}

export const LogoIcon = ({ size = 24, className }: LogoIconProps) => {
  const gradientId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      {/* Globe arc — subtle travel/international motif */}
      <path
        d="M16 8a8 8 0 0 1 0 16"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.2"
        fill="none"
      />
      <ellipse
        cx="16"
        cy="16"
        rx="3.5"
        ry="8"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        fill="none"
      />
      {/* V mark — visa / verification */}
      <path
        d="M10.5 12l5.5 9 5.5-9"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4338ca" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
      </defs>
    </svg>
  );
};

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export const Logo = ({
  size = 24,
  showText = true,
  className,
  textClassName,
}: LogoProps) => (
  <div className={cn('flex items-center gap-2.5', className)}>
    <LogoIcon size={size} />
    {showText && (
      <span
        className={cn(
          'text-lg font-bold tracking-tight text-brand-700',
          textClassName,
        )}
      >
        로컬노마드
      </span>
    )}
  </div>
);
