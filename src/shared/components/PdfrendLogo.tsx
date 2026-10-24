import React from 'react';
import { ResolvedTheme } from '../../styles/tokens';

export interface PdfrendLogoProps {
  size?: number | string;
  theme?: ResolvedTheme;
  className?: string;
  showBackground?: boolean;
}

/**
 * PDFrend 공식 로고 아이콘 (첨부된 아이콘m2 디자인 기반 벡터 구현)
 * - 3D 폴디드 리본 M / 모던 오리가미 모노그램 디자인
 * - 테마(light / dark / dawn)에 맞춰 배경색, 테두리, 그림자 자동 반영
 */
export const PdfrendLogo: React.FC<PdfrendLogoProps> = ({
  size = 40,
  theme = 'dark',
  className = '',
  showBackground = true,
}) => {
  // 테마별 배경 스타일 정의
  const getThemeBackgroundStyles = () => {
    switch (theme) {
      case 'light':
        return 'bg-white/95 border border-slate-200/90 shadow-md shadow-slate-200/70 text-slate-900';
      case 'dawn':
        return 'bg-[#070e22] border border-[#1e3066] shadow-lg shadow-sky-950/50 text-sky-100';
      case 'dark':
      default:
        return 'bg-slate-900/95 border border-slate-800 shadow-lg shadow-indigo-950/40 text-white';
    }
  };

  const containerStyle = showBackground
    ? `rounded-xl flex items-center justify-center p-1.5 transition-colors shrink-0 ${getThemeBackgroundStyles()} ${className}`
    : `flex items-center justify-center shrink-0 ${className}`;

  const dim = typeof size === 'number' ? `${size}px` : size;
  const prefix = `pdfrend-m-${theme}`;

  // 테마별 그래디언트 색상 정의 (라이트: 고명도 고대비 로열블루/퍼플, 다크: 네온시안/일렉트릭마젠타, 여명: 여명스카이/새벽인디고)
  const themeColors = {
    light: {
      left: { s1: '#0284c7', s2: '#1d4ed8', s3: '#1e3a8a' },
      foldLeft: { s1: '#1e3a8a', s2: '#0f172a' },
      center: { s1: '#2563eb', s2: '#4338ca', s3: '#4f46e5' },
      foldRight: { s1: '#3730a3', s2: '#1e1b4b' },
      right: { s1: '#6d28d9', s2: '#7c3aed', s3: '#9333ea' },
      glare: '#ffffff',
      glareOpacity: '0.55',
      glowColor: '#2563eb',
      glowOpacity: '0.22',
      glowDeviation: '2.5',
    },
    dawn: {
      left: { s1: '#38bdf8', s2: '#0284c7', s3: '#0369a1' },
      foldLeft: { s1: '#0369a1', s2: '#082f49' },
      center: { s1: '#0ea5e9', s2: '#3b82f6', s3: '#6366f1' },
      foldRight: { s1: '#312e81', s2: '#1e1b4b' },
      right: { s1: '#6366f1', s2: '#818cf8', s3: '#a855f7' },
      glare: '#e0f2fe',
      glareOpacity: '0.55',
      glowColor: '#38bdf8',
      glowOpacity: '0.45',
      glowDeviation: '3',
    },
    dark: {
      left: { s1: '#00b4d8', s2: '#0077b6', s3: '#023e8a' },
      foldLeft: { s1: '#023e8a', s2: '#1e1b4b' },
      center: { s1: '#2563eb', s2: '#4f46e5', s3: '#6366f1' },
      foldRight: { s1: '#4338ca', s2: '#311042' },
      right: { s1: '#7c3aed', s2: '#9333ea', s3: '#c026d3' },
      glare: '#ffffff',
      glareOpacity: '0.45',
      glowColor: '#6366f1',
      glowOpacity: '0.4',
      glowDeviation: '3',
    },
  }[theme || 'dark'];

  return (
    <div
      className={containerStyle}
      style={{ width: dim, height: dim }}
      title={`PDFrend 공식 로고 (${theme} 모드)`}
      data-testid="pdfrend-logo"
      data-theme={theme}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none"
      >
        <defs>
          {/* 그라디언트 1: 좌측 리본 (Theme-specific) */}
          <linearGradient id={`${prefix}-left`} x1="15" y1="80" x2="35" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={themeColors.left.s1} />
            <stop offset="50%" stopColor={themeColors.left.s2} />
            <stop offset="100%" stopColor={themeColors.left.s3} />
          </linearGradient>

          {/* 그라디언트 2: 좌측 내부 접힘 음영 */}
          <linearGradient id={`${prefix}-fold-left`} x1="30" y1="20" x2="50" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={themeColors.foldLeft.s1} />
            <stop offset="100%" stopColor={themeColors.foldLeft.s2} />
          </linearGradient>

          {/* 그라디언트 3: 중앙 밸리 -> 우측 상승 리본 */}
          <linearGradient id={`${prefix}-center`} x1="45" y1="65" x2="68" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={themeColors.center.s1} />
            <stop offset="50%" stopColor={themeColors.center.s2} />
            <stop offset="100%" stopColor={themeColors.center.s3} />
          </linearGradient>

          {/* 그라디언트 4: 우측 내부 접힘 음영 */}
          <linearGradient id={`${prefix}-fold-right`} x1="68" y1="20" x2="82" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={themeColors.foldRight.s1} />
            <stop offset="100%" stopColor={themeColors.foldRight.s2} />
          </linearGradient>

          {/* 그라디언트 5: 우측 하강 리본 */}
          <linearGradient id={`${prefix}-right`} x1="65" y1="22" x2="85" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={themeColors.right.s1} />
            <stop offset="60%" stopColor={themeColors.right.s2} />
            <stop offset="100%" stopColor={themeColors.right.s3} />
          </linearGradient>

          {/* 하이라이트 글레어 */}
          <linearGradient id={`${prefix}-glare`} x1="20" y1="15" x2="80" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={themeColors.glare} stopOpacity={themeColors.glareOpacity} />
            <stop offset="100%" stopColor={themeColors.glare} stopOpacity="0" />
          </linearGradient>

          {/* 필터: 테마별 발광 & 그림자 */}
          <filter id={`${prefix}-glow`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation={themeColors.glowDeviation}
              floodColor={themeColors.glowColor}
              floodOpacity={themeColors.glowOpacity}
            />
          </filter>
        </defs>

        {/* 3D 접힘 M 리본 구조 */}
        <g filter={`url(#${prefix}-glow)`}>
          {/* 1. 좌측 메인 기둥 리본 */}
          <path
            d="M18 78 L32 18 C33 14 37 14 38 18 L50 48 L41 78 C39 82 34 82 33 78 Z"
            fill={`url(#${prefix}-left)`}
          />

          {/* 2. 좌측 내부 음영 폴드 */}
          <path
            d="M32 18 L50 66 L52 64 L41 38 Z"
            fill={`url(#${prefix}-fold-left)`}
            opacity="0.9"
          />

          {/* 3. 중앙 -> 우측 피크 상승 리본 */}
          <path
            d="M45 66 C47 69 53 69 55 66 L68 18 C69 15 73 15 74 18 L62 76 C60 80 54 80 52 76 Z"
            fill={`url(#${prefix}-center)`}
          />

          {/* 4. 우측 내부 음영 폴드 */}
          <path
            d="M68 18 L60 76 L68 62 L74 18 Z"
            fill={`url(#${prefix}-fold-right)`}
            opacity="0.85"
          />

          {/* 5. 우측 하강 기둥 리본 */}
          <path
            d="M68 18 C70 14 74 14 75 18 L84 78 C85 82 80 84 76 80 L63 42 Z"
            fill={`url(#${prefix}-right)`}
          />

          {/* 상단 엣지 하이라이트 글레어 */}
          <path
            d="M32 18 L38 24 L62 24 L68 18 Z"
            fill={`url(#${prefix}-glare)`}
          />
        </g>
      </svg>
    </div>
  );
};

export default PdfrendLogo;
