import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export function SwordsIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <line x1="4" y1="20" x2="18" y2="6" />
      <line x1="15" y1="3" x2="21" y2="9" />
      <line x1="18" y1="6" x2="21" y2="3" />
      <line x1="20" y1="4" x2="6" y2="18" />
      <line x1="3" y1="15" x2="9" y2="21" />
      <line x1="6" y1="18" x2="3" y2="21" />
    </svg>
  );
}

export function TrophyIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M6 2h12v6a6 6 0 01-12 0V2z" />
      <path d="M6 4H3v2a3 3 0 003 3" />
      <path d="M18 4h3v2a3 3 0 01-3 3" />
      <line x1="12" y1="14" x2="12" y2="18" />
      <path d="M7 22h10l-1-4H8l-1 4z" />
    </svg>
  );
}

export function SkullIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M12 2C7 2 3 6 3 11c0 3 1.5 5.5 4 7v3h10v-3c2.5-1.5 4-4 4-7 0-5-4-9-9-9z" />
      <circle cx="9" cy="10" r="1.5" />
      <circle cx="15" cy="10" r="1.5" />
      <line x1="10" y1="21" x2="10" y2="17" />
      <line x1="14" y1="21" x2="14" y2="17" />
    </svg>
  );
}

export function BellIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M4 18h16" />
      <path d="M6 18V10c0-3.3 2.7-6 6-6s6 2.7 6 6v8" />
      <line x1="12" y1="4" x2="12" y2="2" />
      <path d="M10 21h4" />
    </svg>
  );
}

export function LightningIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
    </svg>
  );
}

export function ImpactIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polygon points="12,2 14.5,8 21,8.5 16,13 17.5,20 12,16.5 6.5,20 8,13 3,8.5 9.5,8" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="17" y1="7" x2="20" y2="4" />
      <line x1="7" y1="7" x2="4" y2="4" />
    </svg>
  );
}

export function SpeakerIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polygon points="3,9 3,15 7,15 12,19 12,5 7,9" />
      <path d="M16 9a4 4 0 010 6" />
      <path d="M19 6a8 8 0 010 12" />
    </svg>
  );
}

export function SpeakerMuteIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polygon points="3,9 3,15 7,15 12,19 12,5 7,9" />
      <line x1="16" y1="9" x2="22" y2="15" />
      <line x1="22" y1="9" x2="16" y2="15" />
    </svg>
  );
}

export function MicIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0014 0" />
      <line x1="12" y1="17" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

export function RefreshIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M3 12a9 9 0 0115-6.7L21 2" />
      <polyline points="21,2 21,8 15,8" />
      <path d="M21 12a9 9 0 01-15 6.7L3 22" />
      <polyline points="3,22 3,16 9,16" />
    </svg>
  );
}

export function FlameIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M12 22c-4 0-7-3-7-7 0-4 3-7 5-10 1 2 2 3 3 3 0-3 1-6 3-8 1 3 3 6 3 8 0 2 0 4-1 5.5C17 16 16 19 12 22z" />
    </svg>
  );
}

export function SnowflakeIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="19.1" y2="19.1" />
      <line x1="19.1" y1="4.9" x2="4.9" y2="19.1" />
      <line x1="12" y1="2" x2="14" y2="5" />
      <line x1="12" y1="2" x2="10" y2="5" />
      <line x1="12" y1="22" x2="14" y2="19" />
      <line x1="12" y1="22" x2="10" y2="19" />
    </svg>
  );
}

export function SparkIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10Z" />
    </svg>
  );
}

export function CrownIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M2 18L5 8L9 13L12 4L15 13L19 8L22 18H2Z" />
      <line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  );
}

export function PredatorClawIcon({ className }: { className?: string }) {
  return (
    <span className={`font-black uppercase tracking-tight ${className || ''}`}>
      <span className="text-red-600">A</span><span className="text-white">P</span>
    </span>
  );
}

export function DiceIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <rect x="3" y="3" width="18" height="18" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="16" cy="8" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="8" cy="16" r="1" fill="currentColor" />
      <circle cx="16" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

export function CoinIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v12" />
      <path d="M15 9h-4.5a2 2 0 000 4h3a2 2 0 010 4H9" />
    </svg>
  );
}
