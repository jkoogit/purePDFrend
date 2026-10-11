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
        return 'bg-white border border-slate-200/90 shadow-sm shadow-slate-200 text-slate-800';
      case 'dawn':
        return 'bg-[#0b1326] border border-[#1d2b45] shadow-md shadow-sky-950/40 text-sky-100';
      case 'dark':
      default:
        return 'bg-slate-900/95 border border-slate-800 shadow-lg shadow-indigo-950/40 text-white';
    }
  };

  const containerStyle = showBackground
    ? `rounded-xl flex items-center justify-center p-1.5 transition-colors shrink-0 ${getThemeBackgroundStyles()} ${className}`
    : `flex items-center justify-center shrink-0 ${className}`;

  const dim = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={containerStyle}
      style={{ width: dim, height: dim }}
      title="PDFrend 공식 로고"
      data-testid="pdfrend-logo"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none"
      >
        <defs>
          {/* 그라디언트 1: 좌측 리본 (Cyan to Vibrant Blue) */}
          <linearGradient id="pdfrend-m-left" x1="15" y1="80" x2="35" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00b4d8" />
            <stop offset="50%" stopColor="#0077b6" />
            <stop offset="100%" stopColor="#023e8a" />
          </linearGradient>

          {/* 그라디언트 2: 좌측 내부 접힘 음영 (Deep Blue Shadow) */}
          <linearGradient id="pdfrend-m-fold-left" x1="30" y1="20" x2="50" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#023e8a" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>

          {/* 그라디언트 3: 중앙 밸리 -> 우측 상승 리본 (Blue to Indigo) */}
          <linearGradient id="pdfrend-m-center" x1="45" y1="65" x2="68" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          {/* 그라디언트 4: 우측 내부 접힘 음영 (Indigo to Deep Violet) */}
          <linearGradient id="pdfrend-m-fold-right" x1="68" y1="20" x2="82" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#311042" />
          </linearGradient>

          {/* 그라디언트 5: 우측 하강 리본 (Violet to Magenta/Purple) */}
          <linearGradient id="pdfrend-m-right" x1="65" y1="22" x2="85" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="60%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#c026d3" />
          </linearGradient>

          {/* 하이라이트 글레어 */}
          <linearGradient id="pdfrend-m-glare" x1="20" y1="15" x2="80" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* 필터: 테마별 은은한 발광 */}
          <filter id="pdfrend-m-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodColor={theme === 'light' ? '#2563eb' : '#6366f1'}
              floodOpacity={theme === 'light' ? '0.2' : '0.35'}
            />
          </filter>
        </defs>

        {/* 3D 접힘 M 리본 구조 */}
        <g filter="url(#pdfrend-m-glow)">
          {/* 1. 좌측 메인 기둥 리본 (하단 18,80 -> 상단 피크 32,18 -> 44,40 -> 30,80) */}
          <path
            d="M18 78 L32 18 C33 14 37 14 38 18 L50 48 L41 78 C39 82 34 82 33 78 Z"
            fill="url(#pdfrend-m-left)"
          />

          {/* 2. 좌측 내부 음영 폴드 (피크 32,18 -> 센터 계곡 50,66 -> 42,46) */}
          <path
            d="M32 18 L50 66 L52 64 L41 38 Z"
            fill="url(#pdfrend-m-fold-left)"
            opacity="0.9"
          />

          {/* 3. 중앙 -> 우측 피크 상승 리본 (센터 50,66 -> 우측 피크 68,18 -> 56,20 -> 42,66) */}
          <path
            d="M45 66 C47 69 53 69 55 66 L68 18 C69 15 73 15 74 18 L62 76 C60 80 54 80 52 76 Z"
            fill="url(#pdfrend-m-center)"
          />

          {/* 4. 우측 내부 음영 폴드 */}
          <path
            d="M68 18 L60 76 L68 62 L74 18 Z"
            fill="url(#pdfrend-m-fold-right)"
            opacity="0.85"
          />

          {/* 5. 우측 하강 기둥 리본 (우측 피크 68,18 -> 우측 하단 84,78 -> 72,78 -> 58,40) */}
          <path
            d="M68 18 C70 14 74 14 75 18 L84 78 C85 82 80 84 76 80 L63 42 Z"
            fill="url(#pdfrend-m-right)"
          />

          {/* 상단 엣지 하이라이트 글레어 */}
          <path
            d="M32 18 L38 24 L62 24 L68 18 Z"
            fill="url(#pdfrend-m-glare)"
          />
        </g>
      </svg>
    </div>
  );
};

export default PdfrendLogo;
