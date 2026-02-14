import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export function SwordsIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
      <path d="M256 117c-65.2 0-124.2 11.6-166.13 29.7c-20.95 9.1-37.57 19.8-48.57 31.1S25 200.4 25 212s5.3 22.9 16.3 34.2s27.62 22 48.57 31.1C131.8 295.4 190.8 307 256 307s124.2-11.6 166.1-29.7c21-9.1 37.6-19.8 48.6-31.1S487 223.6 487 212s-5.3-22.9-16.3-34.2s-27.6-22-48.6-31.1C380.2 128.6 321.2 117 256 117M25 255.1v50.2c0 6.3 5.3 17.6 16.3 28.9s27.62 22 48.57 31.1C131.8 383.4 190.8 395 256 395s124.2-11.6 166.1-29.7c21-9.1 37.6-19.8 48.6-31.1s16.3-22.6 16.3-28.9v-50.2c-1.1 1.3-2.2 2.5-3.4 3.7c-13.3 13.6-31.8 25.3-54.3 35c-45 19.5-106 31.2-173.3 31.2s-128.3-11.7-173.28-31.2c-22.49-9.7-41.01-21.4-54.3-35c-1.19-1.2-2.32-2.5-3.42-3.7" />
    </svg>
  );
}

export function PunchIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
      <path d="M198.844 64.75q-1.477-.001-2.97.094c-15.915 1.015-32.046 11.534-37.78 26.937c-34.072 91.532-51.085 128.865-61.5 222.876c14.633 13.49 31.63 26.45 50.25 38.125l66.406-196.467l17.688 5.968L163.28 362.5c19.51 10.877 40.43 20.234 62 27.28l75.407-201.53l17.5 6.53l-74.937 200.282c19.454 5.096 39.205 8.2 58.78 8.875L381.345 225.5l17.094 7.594l-75.875 170.656c21.82-1.237 43.205-5.768 63.437-14.28c43.317-53.844 72.633-109.784 84.5-172.69c5.092-26.992-14.762-53.124-54.22-54.81l-6.155-.282l-2.188-5.75c-8.45-22.388-19.75-30.093-31.5-32.47s-25.267 1.535-35.468 7.376l-13.064 7.47l-.906-15c-.99-16.396-10.343-29.597-24.313-35.626c-13.97-6.03-33.064-5.232-54.812 9.906l-10.438 7.25l-3.812-12.125c-6.517-20.766-20.007-27.985-34.78-27.97zM103.28 188.344C71.143 233.448 47.728 299.56 51.407 359.656c27.54 21.84 54.61 33.693 80.063 35.438c14.155.97 27.94-1.085 41.405-6.438c-35.445-17.235-67.36-39.533-92.594-63.53l-3.343-3.157l.5-4.595c5.794-54.638 13.946-91.5 25.844-129.03z" />
    </svg>
  );
}

export function MuscleIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
      <path d="M165.906 18.688C15.593 59.28-42.187 198.55 92.72 245.375h-1.095c.635.086 1.274.186 1.906.28c8.985 3.077 18.83 5.733 29.532 7.94C173.36 273.35 209.74 321.22 212.69 368c-33.514 23.096-59.47 62.844-59.47 62.844l26.28 38.686L138.28 493h81.97c-40.425-40.435-11.76-85.906 36.125-85.906c48.54 0 73.945 48.112 36.156 85.906h81.126l-40.375-23.47l26.283-38.686s-26.376-40.4-60.282-63.406c3.204-46.602 39.5-94.167 89.595-113.844c10.706-2.207 20.546-4.86 29.53-7.938c.633-.095 1.273-.195 1.908-.28h-1.125c134.927-46.82 77.163-186.094-73.157-226.69c-40.722 39.37 6.54 101.683 43.626 56.877c36.9 69.08 8.603 127.587-72.28 83.406c-11.88 24.492-34.213 41.374-60.688 41.374c-26.703 0-49.168-17.167-60.97-42c-81.774 45.38-110.512-13.372-73.437-82.78c37.09 44.805 84.35-17.508 43.626-56.876zm90.79 35.92c-27.388 0-51.33 27.556-51.33 63.61c0 36.056 23.942 62.995 51.33 62.995s51.327-26.94 51.327-62.994c0-36.058-23.94-63.61-51.328-63.61z" />
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 23c-5.14 0-8-3.54-8-7.5 0-3.6 2.4-6.5 4.6-9.5.4-.54 1.18-.12.96.52-.5 1.46-.06 2.98.94 3.98.26.26.7.08.72-.28.12-2.44 1.14-5.06 2.88-7.22.38-.48 1.12-.12 1.02.48-.3 1.9.56 3.86 2.14 5.02.24.18.56.06.62-.22.34-1.56 1.1-2.96 2.22-4.06.34-.34.92-.06.84.42-.6 3.5 1.24 5.56 1.24 8.36 0 3.96-2.86 7.5-8 7.5z" />
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

export function FistIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
      <path d="M141.977 56.943q-.952.005-1.905.053c-2.903.145-5.805.58-8.7 1.326c-28.33 7.294-56.425 29.248-77.058 57.844c-20.632 28.596-33.67 63.593-33.554 95.455c.06 16.533 6.94 27.84 18.886 36.927c7.29 5.544 16.59 9.97 27.032 13.23c-1.023-14.32-.482-29.776 3.957-42.71l16.844 5.783c-15.886 57.862 18.713 102.134 69.65 142.007c-2.305-28.866 2.355-59.986 15.7-91.345c-1.265-7.76-1.14-16.392.57-25.664c4.65-25.21 20.01-56.115 49.88-93.414l14.59 11.68c-28.65 35.777-42.302 64.575-46.09 85.122c-3.79 20.548 1.342 31.848 10.048 38.176s23.24 8.047 40.315 2.526c17.073-5.522 36.13-18.136 52.42-38.405c40.154-49.957 56.8-91.026 58.064-120.484c1.265-29.46-11.115-47.414-32.752-56.937C276.602 59.067 191.21 80.82 119.7 162.938l-14.095-12.272c26.81-30.786 55.632-54.11 84.143-70.29c-15.18-14.578-31.464-23.538-47.77-23.433zm230.76 85.89c-.65-.005-1.303.005-1.956.01c-3.553 34.283-22.66 75.888-61.65 124.397c-18.358 22.844-40.163 37.666-61.237 44.48c-21.075 6.816-41.974 5.77-57.053-5.19a42 42 0 0 1-7.387-6.887c-20.753 63.805-2.12 122.793 34.906 158.587c25.613 24.76 60.005 38.354 97.472 34.727s78.5-24.527 116.943-70.998c84.462-102.102 71.214-199.61 19.823-247.646c-21.08-19.702-48.703-31.302-79.862-31.482z" />
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
