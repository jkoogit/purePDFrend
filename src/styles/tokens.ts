/**
 * purePDFrend 통합 디자인 토큰 시스템 (Design Tokens)
 * 단일 진실 공급원 (Single Source of Truth)
 * 
 * - Color System: Brand (Blue), Gray (Slate), Semantic (Success, Warning, Danger, Info), Dawn (Midnight Blue)
 * - 4-Mode Theme System: light, dark, dawn, system
 * - Typography System: Display, Body, Mono (엄격한 스케일)
 * - Spacing System: 4pt Grid 기반 (0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px)
 * - Radius System: Zero-pill discipline (none, sm, md, lg, xl - max 16px)
 * - Elevation & Shadow System: Subtle, Card, Popover, Modal
 * - Touch Targets: 모바일 최소 44px 보장
 */

export type ThemeMode = 'light' | 'dark' | 'dawn' | 'system';
export type ResolvedTheme = 'light' | 'dark' | 'dawn';

export interface ThemeConfig {
  id: ThemeMode;
  label: string;
  iconName: 'Sun' | 'Moon' | 'Sunrise' | 'Monitor';
  description: string;
}

export const THEME_MODES: Record<ThemeMode, ThemeConfig> = {
  light: {
    id: 'light',
    label: '주간',
    iconName: 'Sun',
    description: '밝고 선명한 주간 라이트 모드',
  },
  dark: {
    id: 'dark',
    label: '야간',
    iconName: 'Moon',
    description: '눈이 편안한 OLED 다크 모드',
  },
  dawn: {
    id: 'dawn',
    label: '여명',
    iconName: 'Sunrise',
    description: '새벽 감성의 미드나잇 블루 고대비 모드',
  },
  system: {
    id: 'system',
    label: '시스템',
    iconName: 'Monitor',
    description: 'OS 화면 설정에 따라 자동 전환',
  },
};

/** OS prefers-color-scheme 기반으로 시스템 테마를 실제 light/dark로 해석 */
export function resolveThemeMode(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return mode;
}

/** HTML root DOM에 테마 클래스 및 data 속성 동기화 */
export function applyThemeToDocument(mode: ThemeMode): ResolvedTheme {
  const resolved = resolveThemeMode(mode);
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'dawn', 'theme-light', 'theme-dark', 'theme-dawn');
    root.classList.add(resolved, `theme-${resolved}`);
    root.setAttribute('data-theme', resolved);
    root.setAttribute('data-theme-mode', mode);
  }
  return resolved;
}

export const tokens = {
  // 1. 색상 시스템 (Colors)
  colors: {
    // 브랜드 색상 (PDF & 인프라 공통)
    brand: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb', // Core Primary
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },

    // 뉴트럴/그레이 색상 (다크 모드 & 라이트 모드 기준)
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b', // Card/Panel Dark
      850: '#172033', // Deep Layer
      900: '#0f172a', // Background Dark
      950: '#020617', // Canvas Deepest
    },

    // 여명 (Dawn) 모드 색상 체계 (Midnight Blue / Dawn Cyan-Indigo)
    dawn: {
      canvas: '#070e22',
      panel: '#0e1a38',
      card: '#132247',
      cardHover: '#182b57',
      border: '#1e3066',
      borderHover: '#2a448c',
      textMain: '#f0f6ff',
      textMuted: '#94a3b8',
      accent: '#38bdf8',
    },

    // 시맨틱 상태 색상
    semantic: {
      success: {
        light: '#ecfdf5',
        border: '#a7f3d0',
        text: '#047857',
        solid: '#10b981',
        darkBg: 'rgba(6, 78, 59, 0.4)',
        darkBorder: 'rgba(16, 185, 129, 0.3)',
        darkText: '#6ee7b7',
      },
      warning: {
        light: '#fffbeb',
        border: '#fde68a',
        text: '#b45309',
        solid: '#f59e0b',
        darkBg: 'rgba(120, 53, 15, 0.4)',
        darkBorder: 'rgba(245, 158, 11, 0.3)',
        darkText: '#fcd34d',
      },
      danger: {
        light: '#fef2f2',
        border: '#fecaca',
        text: '#b91c1c',
        solid: '#ef4444',
        darkBg: 'rgba(127, 29, 29, 0.4)',
        darkBorder: 'rgba(239, 68, 68, 0.3)',
        darkText: '#fca5a5',
      },
      info: {
        light: '#f0f9ff',
        border: '#bae6fd',
        text: '#0369a1',
        solid: '#0ea5e9',
        darkBg: 'rgba(12, 74, 110, 0.4)',
        darkBorder: 'rgba(14, 165, 233, 0.3)',
        darkText: '#7dd3fc',
      },
    },

    // 도메인 전용 색상 (PDF / Agent)
    domain: {
      pdf: {
        primary: '#2563eb', // Blue-600
        secondary: '#0ea5e9', // Sky-500
        accent: '#6366f1', // Indigo-500
      },
      agent: {
        primary: '#8b5cf6', // Violet-500
        secondary: '#a855f7', // Purple-500
        accent: '#ec4899', // Pink-500
      },
    },
  },

  // 2. 타이포그래피 (Typography)
  typography: {
    fontFamily: {
      display: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      body: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    // 스케일 정의
    scale: {
      'display-2xl': { fontSize: '2rem', lineHeight: '2.5rem', fontWeight: '700' }, // 32px
      'display-xl': { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '700' }, // 24px
      'display-lg': { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '600' }, // 20px
      'body-lg': { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '500' }, // 16px
      'body-md': { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400' }, // 14px
      'body-sm': { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '400' }, // 12px
      'caption': { fontSize: '0.6875rem', lineHeight: '0.875rem', fontWeight: '500' }, // 11px
      'code': { fontSize: '0.8125rem', lineHeight: '1.25rem', fontWeight: '400' }, // 13px mono
    },
  },

  // 3. 4pt 간격 시스템 (Spacing)
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
  },

  // 4. 모서리 둥글기 (Border Radius - Zero-pill 규율)
  radius: {
    none: '0px',
    sm: '4px', // 버튼(sm), 인라인 태그
    md: '6px', // 일반 폼 인풋, 카드 내부
    lg: '8px', // 기본 버튼(md), 카드
    xl: '12px', // 대형 패널, 모달
    '2xl': '16px', // 최상위 쉘 컨테이너 (최대 허용치)
    // 주의: full(pill)은 아바타/원형 아이콘 버튼 외에 직사각형 컴포넌트에는 금지
  },

  // 5. 그림자 & 엘레베이션 (Shadows)
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.2)',
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    popover: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
    modal: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
  },

  // 6. 터치 타겟 & 접근성 규격
  accessibility: {
    minTouchTarget: '44px',
    focusRing: 'ring-2 ring-blue-500/50 outline-none',
    minContrastRatio: 4.5, // WCAG AA
  },
} as const;

/** Tailwind 유틸리티 클래스 매핑 헬퍼 */
export const tokenClassMap = {
  containerShell: 'bg-slate-900 border border-slate-800 rounded-2xl shadow-xl',
  panel: 'bg-slate-950/80 border border-slate-800/80 rounded-xl p-4',
  card: 'bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors',
  cardActive: 'bg-slate-850 border border-blue-500/50 rounded-xl p-4 shadow-md',
  touchButton: 'min-h-[44px] flex items-center justify-center select-none',
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
};

/** 4모드 테마 적응형 스타일 헬퍼 */
export function getThemeAdaptiveClasses(theme: ResolvedTheme = 'dark') {
  switch (theme) {
    case 'light':
      return {
        shellBg: 'bg-slate-50 text-slate-900',
        container: 'bg-white border-slate-200 shadow-md text-slate-900',
        panel: 'bg-slate-100/90 border-slate-200 text-slate-800',
        card: 'bg-white border-slate-200 shadow-xs hover:border-blue-400 text-slate-900',
        cardActive: 'bg-blue-50/80 border-blue-500 shadow-xs text-blue-950',
        header: 'bg-white/95 border-slate-200 text-slate-900',
        border: 'border-slate-200',
        textMain: 'text-slate-900',
        textMuted: 'text-slate-500',
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        input: 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400',
        dropdown: 'bg-white border-slate-200 text-slate-900 shadow-xl',
      };
    case 'dawn':
      return {
        shellBg: 'bg-[#070e22] text-white',
        container: 'bg-[#0e1a38] border-[#1e3066] shadow-xl shadow-sky-950/20 text-white',
        panel: 'bg-[#0b152d]/90 border-[#1e3066] text-slate-200',
        card: 'bg-[#132247]/90 border-[#1e3066] shadow-xs hover:border-sky-400 text-white',
        cardActive: 'bg-[#182b57] border-sky-400 shadow-md shadow-sky-500/20 text-sky-100',
        header: 'bg-[#070e22]/95 border-[#1e3066] text-white',
        border: 'border-[#1e3066]',
        textMain: 'text-white',
        textMuted: 'text-sky-300/70',
        badge: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
        input: 'bg-[#070e22] border-[#1e3066] text-white placeholder:text-sky-400/50',
        dropdown: 'bg-[#0e1a38] border-[#1e3066] text-white shadow-2xl',
      };
    case 'dark':
    default:
      return {
        shellBg: 'bg-slate-950 text-slate-100',
        container: 'bg-slate-900 border-slate-800 shadow-xl text-slate-100',
        panel: 'bg-slate-950/80 border-slate-800/80 text-slate-300',
        card: 'bg-slate-900/90 border-slate-800 shadow-xs hover:border-slate-700 text-slate-200',
        cardActive: 'bg-slate-850 border-blue-500/50 shadow-md text-white',
        header: 'bg-slate-950/95 border-slate-800 text-white',
        border: 'border-slate-800',
        textMain: 'text-white',
        textMuted: 'text-slate-400',
        badge: 'bg-slate-800 text-slate-300 border-slate-700',
        input: 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500',
        dropdown: 'bg-slate-900 border-slate-700 text-slate-100 shadow-2xl',
      };
  }
}
