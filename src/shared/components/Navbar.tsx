import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ScrollSnapCarousel } from './ScrollSnapCarousel';
import { EmergencyRecoveryPanel } from '../../aiagent/components/EmergencyRecoveryPanel';
import {
  Settings,
  Database,
  CheckCircle2,
  Server,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Bot,
  AlertTriangle,
  Stethoscope,
  X,
  Menu,
  Network,
  BarChart3,
  FileText,
  Cpu,
  ChevronRight,
  Pin,
  PinOff,
  Sun,
  Moon,
  Sunrise,
  Monitor,
  Lock,
  UserCheck,
  ChevronDown,
  FileBox,
} from 'lucide-react';
import { ActiveViewId, DomainGroupId, SystemDomainId, UserSystemRole } from '../../types';
import { ThemeMode, ResolvedTheme, THEME_MODES, resolveThemeMode, applyThemeToDocument } from '../../styles/tokens';
import { PdfrendLogo } from './PdfrendLogo';

export type AppTab = 'agent' | 'system' | 'viewer' | 'ocr';

export interface DomainViewItem {
  id: ActiveViewId;
  label: string;
  description: string;
  domain: DomainGroupId;
  icon: any;
}

export const DOMAIN_GROUPS: {
  id: DomainGroupId;
  name: string;
  description: string;
  views: DomainViewItem[];
}[] = [
  {
    id: 'harness',
    name: '하네스 거버넌스',
    description: '작업 흐름, 태스크 생명주기 및 3계층 상태 감사',
    views: [
      {
        id: 'graph',
        label: '작업그래프',
        description: '세션-태스크-루프 실행 흐름 시각화',
        domain: 'harness',
        icon: Network,
      },
      {
        id: 'task',
        label: '태스크정보',
        description: '태스크 생명주기 및 백로그 관리',
        domain: 'harness',
        icon: Layers,
      },
      {
        id: 'usage',
        label: '에이전트통계',
        description: '토큰 쿼터(429 분리) 및 턴 추적',
        domain: 'harness',
        icon: BarChart3,
      },
      {
        id: 'audit',
        label: '무결성감사',
        description: '100점 만점 3계층 무결성 감사',
        domain: 'harness',
        icon: ShieldCheck,
      },
    ],
  },
  {
    id: 'knowledge',
    name: '추적 및 지식창고',
    description: '18대 기술문서 체계, SHA-256 동기화 및 시스템 설정',
    views: [
      {
        id: 'docs',
        label: '문서거버넌스',
        description: '18대 문서 체계 & GIN 검색',
        domain: 'knowledge',
        icon: FileText,
      },
      {
        id: 'settings',
        label: '시스템설정',
        description: 'DB 브릿지 및 시스템 파라미터',
        domain: 'knowledge',
        icon: Settings,
      },
    ],
  },
  {
    id: 'studio',
    name: 'PDF 스튜디오',
    description: '대용량 스캔 PDF 교정 및 듀얼 OCR 엔진 파이프라인',
    views: [
      {
        id: 'ocr',
        label: 'OCR엔진관리',
        description: 'Tesseract vs Gemini 듀얼 엔진 설정',
        domain: 'studio',
        icon: Cpu,
      },
      {
        id: 'wireframes',
        label: '와이어프레임',
        description: '관리자 16개·사용자 9개 화면 프로토타입',
        domain: 'studio',
        icon: Layers,
      },
    ],
  },
];

export const ALL_VIEWS: DomainViewItem[] = DOMAIN_GROUPS.flatMap((g) => g.views);

export interface SystemDomainConfig {
  id: SystemDomainId;
  label: string;
  shortLabel: string;
  icon: any;
  requiredRole: UserSystemRole[];
  description: string;
  themeColor: string;
}

export const SYSTEM_DOMAINS: SystemDomainConfig[] = [
  {
    id: 'service',
    label: 'PDF 서비스',
    shortLabel: '서비스',
    icon: FileBox,
    requiredRole: ['ROLE_USER', 'ROLE_OPERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'],
    description: 'PDF 뷰어, 편집, 듀얼 OCR 및 주석 비즈니스 포털',
    themeColor: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'settings',
    label: '서비스설정',
    shortLabel: '설정',
    icon: Settings,
    requiredRole: ['ROLE_OPERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'],
    description: '25개 와이어프레임 및 단축키/폰트/약관 환경설정 스튜디오',
    themeColor: 'from-sky-600 to-cyan-600',
  },
  {
    id: 'harness',
    label: '에이전트관리',
    shortLabel: '마스터',
    icon: Bot,
    requiredRole: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'],
    description: '하네스 작업그래프, 토큰 쿼터, 3계층 무결성 감사 마스터 시스템',
    themeColor: 'from-violet-600 to-purple-600',
  },
];

export interface NavbarProps {
  activeView: ActiveViewId;
  onSelectView: (view: ActiveViewId) => void;
  activeDomain: DomainGroupId;
  onSelectDomain: (domain: DomainGroupId) => void;
  dbStatus: string;
  currentTab?: AppTab;
  onSelectTab?: (tab: AppTab) => void;
  isHeaderPinned?: boolean;
  onTogglePinHeader?: () => void;
  // 3대 시스템 도메인 전환 (service: PDF 서비스, settings: 서비스설정, harness: 에이전트관리)
  activeSystem?: SystemDomainId;
  onSelectSystem?: (system: SystemDomainId) => void;
  // 사용자 권한 체계
  userRole?: UserSystemRole;
  onSelectRole?: (role: UserSystemRole) => void;
  // 4모드 테마
  themeMode?: ThemeMode;
  onChangeThemeMode?: (mode: ThemeMode) => void;
}

interface CheckResultItem {
  step: string;
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export default function Navbar({
  activeView,
  onSelectView,
  activeDomain,
  onSelectDomain,
  dbStatus,
  isHeaderPinned = true,
  onTogglePinHeader,
  activeSystem = 'service',
  onSelectSystem,
  userRole = 'ROLE_ADMIN',
  onSelectRole,
  themeMode: propThemeMode,
  onChangeThemeMode,
}: NavbarProps) {
  const [hoveredBadge, setHoveredBadge] = useState<'db' | 'status' | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string>('SESSION-0028');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // 4-Mode Theme State (Light / Dark / Dawn / System)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (propThemeMode) return propThemeMode;
    try {
      const saved = localStorage.getItem('purepdfrend_theme_mode');
      if (saved && ['light', 'dark', 'dawn', 'system'].includes(saved)) {
        return saved as ThemeMode;
      }
      const legacy = localStorage.getItem('purepdfrend_theme');
      if (legacy === 'light' || legacy === 'dark') return legacy;
      return 'system';
    } catch {
      return 'dark';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveThemeMode(themeMode));
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [permissionAlert, setPermissionAlert] = useState<{ message: string; required: string } | null>(null);

  useEffect(() => {
    const resolved = applyThemeToDocument(themeMode);
    setResolvedTheme(resolved);
    try {
      localStorage.setItem('purepdfrend_theme_mode', themeMode);
      localStorage.setItem('purepdfrend_theme', resolved);
    } catch {}

    if (themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => {
        const res = applyThemeToDocument('system');
        setResolvedTheme(res);
      };
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [themeMode]);

  const handleSelectThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    onChangeThemeMode?.(mode);
    setIsThemeMenuOpen(false);
  };

  const cycleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'dawn', 'system'];
    const nextIdx = (modes.indexOf(themeMode) + 1) % modes.length;
    handleSelectThemeMode(modes[nextIdx]);
  };

  // System Switching Handler with Role Verification
  const handleSystemSwitch = (targetSystem: SystemDomainId) => {
    const targetConfig = SYSTEM_DOMAINS.find((s) => s.id === targetSystem);
    if (!targetConfig) return;

    const hasPermission = targetConfig.requiredRole.includes(userRole);
    if (!hasPermission) {
      const requiredName = targetSystem === 'settings' ? '서비스설정(ROLE_OPERATOR 이상)' : '마스터관리자(ROLE_ADMIN 이상)';
      setPermissionAlert({
        message: `'${targetConfig.label}' 시스템은 접근 권한이 제한되어 있습니다.`,
        required: requiredName,
      });
      return;
    }

    onSelectSystem?.(targetSystem);
    if (targetSystem === 'settings') {
      onSelectDomain('studio');
      onSelectView('wireframes');
    } else if (targetSystem === 'harness') {
      if (activeDomain === 'studio' && activeView === 'wireframes') {
        onSelectDomain('harness');
        onSelectView('graph');
      }
    }
    setIsMobileDrawerOpen(false);
  };

  // Emergency Disaster Recovery Modal state
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);

  // Service Health Check state
  const [isCheckModalOpen, setIsCheckModalOpen] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [checkResults, setCheckResults] = useState<CheckResultItem[] | null>(null);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);

  const currentDomainGroup = DOMAIN_GROUPS.find((g) => g.id === activeDomain) || DOMAIN_GROUPS[0];

  const runServiceCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/agent/check/service');
      const data = await res.json();
      if (data.success) {
        setCheckResults(data.results);
        setAllPassed(data.allPassed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetch('/api/agent/sessions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.sessions && data.sessions.length > 0) {
          const latest = data.sessions[data.sessions.length - 1];
          if (latest.session_id) {
            setActiveSessionId(latest.session_id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectDomainAndFirstView = (domainId: DomainGroupId) => {
    onSelectDomain(domainId);
    const group = DOMAIN_GROUPS.find((g) => g.id === domainId);
    if (group && group.views.length > 0) {
      const belongs = group.views.some((v) => v.id === activeView);
      if (!belongs) {
        onSelectView(group.views[0].id);
      }
    }
  };

  const handleViewClick = (viewId: ActiveViewId, domainId: DomainGroupId) => {
    onSelectDomain(domainId);
    onSelectView(viewId);
    setIsMobileDrawerOpen(false);
  };

  // Theme Icon Helper
  const renderThemeIcon = (mode: ThemeMode, className: string = 'w-4 h-4') => {
    switch (mode) {
      case 'light':
        return <Sun className={`${className} text-amber-400`} />;
      case 'dark':
        return <Moon className={`${className} text-indigo-400`} />;
      case 'dawn':
        return <Sunrise className={`${className} text-sky-400`} />;
      case 'system':
        return <Monitor className={`${className} text-emerald-400`} />;
    }
  };

  return (
    <header className="sticky top-0 z-40 flex flex-col w-full bg-slate-950/95 border-b border-slate-800 backdrop-blur-md">
      {/* 1. Main Global Header (1단 글로벌 바: 브랜드 + 3대 시스템 스위처 + 공통 툴) */}
      <div className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand & Identity */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none"
            onClick={() => handleSystemSwitch('service')}
            title="pdfrend 서비스 첫화면으로 이동"
          >
            <PdfrendLogo size={36} theme={resolvedTheme} />
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-black text-white tracking-tight text-sm sm:text-base whitespace-nowrap leading-tight">
                PDFrend
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline leading-none mt-0.5">
                PDF 제작 & OCR 교정 스튜디오
              </span>
            </div>
          </div>
        </div>

        {/* Center: 권한 기반 3대 시스템 전환 인터페이스 (System Switcher) & 역할 시뮬레이터 */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2 bg-slate-900/90 border border-slate-800/90 p-1 rounded-xl shadow-inner shrink-0">
          {SYSTEM_DOMAINS.map((sys) => {
            const isActive = activeSystem === sys.id;
            const hasPermission = sys.requiredRole.includes(userRole);
            const Icon = sys.icon;

            return (
              <button
                key={sys.id}
                id={`btn-system-switch-${sys.id}`}
                onClick={() => handleSystemSwitch(sys.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 select-none ${
                  isActive
                    ? 'bg-gradient-to-r ' + sys.themeColor + ' text-white shadow-md ring-1 ring-white/20'
                    : hasPermission
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/50 cursor-pointer opacity-70'
                }`}
                title={`${sys.label}: ${sys.description}${!hasPermission ? ' (권한 필요)' : ''}`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : hasPermission ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{sys.label}</span>
                {!hasPermission && <Lock className="w-3 h-3 text-amber-500/80 shrink-0 ml-0.5" />}
              </button>
            );
          })}

          {/* 역할 시뮬레이터 (Role Switcher Tag) */}
          <div className="relative pl-1 border-l border-slate-800">
            <button
              id="btn-role-simulator-dropdown"
              onClick={() => setIsRoleMenuOpen((prev) => !prev)}
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="권한 시뮬레이터: 다양한 사용자 역할로 시스템 전환 검증"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold text-emerald-400">
                {userRole === 'ROLE_USER' && '일반사용자'}
                {userRole === 'ROLE_OPERATOR' && '서비스설정자'}
                {userRole === 'ROLE_ADMIN' && '마스터관리자'}
                {userRole === 'ROLE_SUPER_ADMIN' && '최고관리자'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[10px] text-slate-400 font-bold border-b border-slate-800">
                  권한 시뮬레이션
                </div>
                <button
                  onClick={() => {
                    onSelectRole?.('ROLE_USER');
                    setIsRoleMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    userRole === 'ROLE_USER' ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>일반사용자 (ROLE_USER)</span>
                  <span className="text-[10px] text-slate-500">서비스전용</span>
                </button>
                <button
                  onClick={() => {
                    onSelectRole?.('ROLE_OPERATOR');
                    setIsRoleMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    userRole === 'ROLE_OPERATOR' ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>서비스설정자 (OPERATOR)</span>
                  <span className="text-[10px] text-sky-400">설정접근</span>
                </button>
                <button
                  onClick={() => {
                    onSelectRole?.('ROLE_ADMIN');
                    setIsRoleMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    userRole === 'ROLE_ADMIN' || userRole === 'ROLE_SUPER_ADMIN'
                      ? 'bg-indigo-600/30 text-indigo-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>마스터관리자 (ADMIN)</span>
                  <span className="text-[10px] text-violet-400">전체접근</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Status Indicators & Action Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* DB Connection Indicator */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredBadge('db')}
            onMouseLeave={() => setHoveredBadge(null)}
          >
            <div className="h-8 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-colors text-xs shrink-0 select-none">
              <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-mono text-[10px] sm:text-[11px] hidden sm:inline">DB:</span>
              {dbStatus === 'CONNECTED' ? (
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden xs:inline">정상</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="hidden xs:inline">로컬</span>
                </span>
              )}
            </div>

            {/* Hover Tooltip: DB Details */}
            {hoveredBadge === 'db' && (
              <div className="absolute right-0 top-full mt-2 w-72 max-w-[90vw] max-h-[80vh] overflow-y-auto p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-2 font-bold text-white pb-2 border-b border-slate-800">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span>데이터베이스 연결 상세정보</span>
                </div>
                <div className="mt-2 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">타겟 DB:</span>
                    <span className="font-mono text-indigo-300 font-semibold">purepdfrend_dev</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">스키마:</span>
                    <span className="font-mono text-slate-200">aiagent, public</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">연결 상태:</span>
                    {dbStatus === 'CONNECTED' ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 정상 작동 (Bridge OK)
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> 로컬 캐시 모드 (점검필요)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 비-LLM 긴급 Push 및 DR 관제실 모달 버튼 */}
          <button
            id="btn-emergency-recovery-panel"
            onClick={() => setIsEmergencyModalOpen(true)}
            className="h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-full bg-amber-950/70 border border-amber-600/80 hover:border-amber-400 hover:bg-amber-900/70 cursor-pointer transition-all text-amber-300 text-xs font-semibold shadow-xs shrink-0 whitespace-nowrap select-none"
            title="비-LLM 긴급 소스 GitHub Push 및 세션 DR 관제실"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline font-semibold">DR 긴급관제</span>
          </button>

          {/* Comprehensive Service Health Check Button */}
          <button
            id="btn-service-health-check"
            onClick={() => {
              setIsCheckModalOpen(true);
              if (!checkResults) runServiceCheck();
            }}
            className="h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-full bg-emerald-950/70 border border-emerald-700/80 hover:border-emerald-400 hover:bg-emerald-900/60 cursor-pointer transition-all text-emerald-300 text-xs font-semibold shadow-xs shrink-0 whitespace-nowrap select-none"
            title="서비스 전수 점검 및 가드레일 진단"
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline font-semibold">정밀점검</span>
            {allPassed === true && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
            {allPassed === false && <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping shrink-0" />}
          </button>

          {/* 4모드 테마 스위처 (주간 / 야간 / 여명 / 시스템설정) */}
          <div className="relative">
            <button
              id="btn-theme-toggle"
              onClick={() => setIsThemeMenuOpen((prev) => !prev)}
              onDoubleClick={cycleTheme}
              className="h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs shrink-0 whitespace-nowrap select-none"
              title={`테마 전환: ${THEME_MODES[themeMode].label} (현재) - 클릭 시 4모드 선택, 더블클릭 시 즉시 순환`}
              aria-label={`테마 전환 (현재: ${THEME_MODES[themeMode].label})`}
            >
              {renderThemeIcon(themeMode, 'w-3.5 h-3.5 text-indigo-400 shrink-0')}
              <span className="font-semibold text-xs text-slate-200 flex items-center gap-1">
                <span>테마</span>
                <span className="text-slate-400 font-normal hidden xs:inline">({THEME_MODES[themeMode].label})</span>
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {/* 4모드 테마 팝오버 선택기 */}
            {isThemeMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[10px] text-slate-400 font-bold border-b border-slate-800 flex items-center justify-between">
                  <span>4모드 테마 선택</span>
                  <span className="font-mono text-indigo-400 text-[9px]">{resolvedTheme}</span>
                </div>
                {(Object.keys(THEME_MODES) as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleSelectThemeMode(mode)}
                    className={`w-full min-h-[36px] text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                      themeMode === mode ? 'bg-indigo-600/30 text-indigo-200 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {renderThemeIcon(mode, 'w-3.5 h-3.5')}
                    <div className="flex-1">
                      <div className="leading-tight">{THEME_MODES[mode].label}</div>
                      <div className="text-[9px] text-slate-400 leading-tight">{THEME_MODES[mode].description}</div>
                    </div>
                  </button>
                ))}
                <div className="pt-1 mt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      cycleTheme();
                    }}
                    className="w-full text-center py-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    ⚡ 다음 테마로 즉시 순환
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Header Pin / Unpin Toggle Button */}
          {onTogglePinHeader && (
            <button
              id="btn-toggle-pin-header"
              onClick={onTogglePinHeader}
              className={`min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] w-9 h-9 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 ${
                isHeaderPinned
                  ? 'bg-indigo-950/70 border-indigo-700/60 text-indigo-300 hover:bg-indigo-900/60 hover:border-indigo-400'
                  : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={isHeaderPinned ? '헤더 고정 해제' : '상단 헤더 고정'}
              aria-label={isHeaderPinned ? '헤더 고정 해제' : '헤더 고정'}
            >
              {isHeaderPinned ? (
                <Pin className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <PinOff className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          )}

          {/* Mobile Hamburger Drawer Trigger (44px Minimum Touch Target Guaranteed) */}
          <button
            id="btn-mobile-menu-drawer"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="모바일 시스템 및 도메인 메뉴 열기"
            className="md:hidden w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Bar (activeSystem이 'harness'일 때 하네스 도메인 및 서브뷰 노출) */}
      {activeSystem === 'harness' && (
        <>
          {/* [Desktop] 2단 메뉴: 활성 도메인의 서브 뷰 가로슬라이드 */}
          <div className="hidden md:flex h-10 border-t border-slate-800/80 bg-slate-900/50">
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between text-xs min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                {/* 1단 도메인 칩 */}
                <div className="flex items-center gap-1 shrink-0">
                  {DOMAIN_GROUPS.map((group) => {
                    const isDomainActive = activeDomain === group.id;
                    return (
                      <button
                        key={group.id}
                        id={`domain-tab-${group.id}`}
                        onClick={() => handleSelectDomainAndFirstView(group.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 select-none ${
                          isDomainActive
                            ? 'bg-violet-600 text-white shadow-sm ring-1 ring-violet-400/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        {group.id === 'harness' && <Bot className="w-3 h-3 text-violet-300" />}
                        {group.id === 'knowledge' && <FileText className="w-3 h-3 text-violet-300" />}
                        {group.id === 'studio' && <Cpu className="w-3 h-3 text-violet-300" />}
                        <span>{group.name}</span>
                      </button>
                    );
                  })}
                </div>

                <span className="text-slate-600">|</span>

                {/* 2단 서브뷰 목록 */}
                <div className="min-w-0 flex-1">
                  <ScrollSnapCarousel
                    dragEnabled={true}
                    wheelEnabled={true}
                    magnetic={true}
                    showArrows={false}
                    showGradients={true}
                    gradientWidth="w-5"
                    scrollStep={180}
                    ariaLabel="데스크톱 2단 서브메뉴 슬라이드"
                  >
                    <div className="flex items-center gap-1.5 py-1 whitespace-nowrap no-scrollbar">
                      {currentDomainGroup.views.map((item) => {
                        const isActive = activeView === item.id;
                        return (
                          <button
                            key={item.id}
                            id={`sub-view-tab-${item.id}`}
                            onClick={() => onSelectView(item.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 select-none snap-start ${
                              isActive
                                ? 'bg-indigo-600 text-white font-semibold shadow-sm ring-1 ring-indigo-400/40'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
                            }`}
                            title={item.description}
                          >
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollSnapCarousel>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono shrink-0">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  AGENTS.md 준거 거버넌스 활성
                </span>
                <span>|</span>
                <span className="text-slate-400 truncate max-w-[180px] lg:max-w-[280px]" title={activeSessionId}>
                  {activeSessionId}
                </span>
              </div>
            </div>
          </div>

          {/* [Mobile] 1단 도메인 + 2단 서브뷰 */}
          <div className="md:hidden border-t border-slate-800/90 bg-slate-950/90">
            <div className="w-full max-w-7xl mx-auto">
              <ScrollSnapCarousel
                className="h-10"
                gradientWidth="w-5"
                showArrows={false}
                dragEnabled={true}
                wheelEnabled={true}
                magnetic={true}
                scrollStep={160}
                ariaLabel="모바일 1단 도메인 선택 메뉴"
              >
                <div className="flex items-center gap-1.5 whitespace-nowrap px-3 sm:px-6 py-1.5 no-scrollbar">
                  {DOMAIN_GROUPS.map((group) => {
                    const isDomainActive = activeDomain === group.id;
                    return (
                      <button
                        key={group.id}
                        id={`mobile-domain-tab-${group.id}`}
                        onClick={() => handleSelectDomainAndFirstView(group.id)}
                        className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 select-none snap-start ${
                          isDomainActive
                            ? 'bg-violet-600 text-white shadow-sm ring-1 ring-violet-400/50'
                            : 'bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                        }`}
                      >
                        <span>{group.name}</span>
                      </button>
                    );
                  })}
                </div>
              </ScrollSnapCarousel>
            </div>
          </div>
        </>
      )}

      {/* 3. Mobile Right Sliding Drawer (Portal to document.body) */}
      {isMobileDrawerOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9998] md:hidden flex justify-end">
          {/* Backdrop Dim */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Sliding Panel */}
          <div className="relative w-80 max-w-[88vw] h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-[9999] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <PdfrendLogo size={32} theme={resolvedTheme} />
                <div className="flex flex-col justify-center min-w-0">
                  <span className="font-black text-white tracking-tight text-sm whitespace-nowrap leading-tight">
                    PDFrend
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    시스템 및 권한 전환
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="메뉴 닫기"
                className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body: 3대 시스템 전환 & 권한 시뮬레이션 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* 시스템 선택 */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider px-1">
                  시스템 전환
                </div>
                <div className="space-y-1.5">
                  {SYSTEM_DOMAINS.map((sys) => {
                    const isActive = activeSystem === sys.id;
                    const hasPermission = sys.requiredRole.includes(userRole);
                    const Icon = sys.icon;

                    return (
                      <button
                        key={sys.id}
                        onClick={() => handleSystemSwitch(sys.id)}
                        className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                          isActive
                            ? 'bg-gradient-to-r ' + sys.themeColor + ' text-white shadow-md'
                            : hasPermission
                            ? 'bg-slate-950/60 border border-slate-800 text-slate-200 hover:bg-slate-800'
                            : 'bg-slate-950/30 border border-slate-900 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 shrink-0" />
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span>{sys.label}</span>
                              {!hasPermission && <Lock className="w-3 h-3 text-amber-400" />}
                            </div>
                            <div className="text-[10px] text-slate-400 leading-tight">
                              {sys.description}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 역할 시뮬레이터 */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider px-1">
                  사용자 역할 시뮬레이션
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { id: 'ROLE_USER', label: '일반사용자', desc: 'PDF 서비스만 접근 가능' },
                    { id: 'ROLE_OPERATOR', label: '서비스설정자', desc: '서비스설정(와이어프레임) 접근 가능' },
                    { id: 'ROLE_ADMIN', label: '마스터관리자', desc: '에이전트관리 마스터 전체 접근' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onSelectRole?.(r.id as UserSystemRole)}
                      className={`min-h-[44px] px-3 py-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between ${
                        userRole === r.id
                          ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-300 font-bold'
                          : 'bg-slate-950/40 border border-slate-800/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{r.label}</div>
                        <div className="text-[10px] text-slate-400">{r.desc}</div>
                      </div>
                      {userRole === r.id && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4모드 테마 선택 */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider px-1">
                  4모드 테마 설정
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(THEME_MODES) as ThemeMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleSelectThemeMode(mode)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${
                        themeMode === mode
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-950/50 border border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {renderThemeIcon(mode, 'w-4 h-4')}
                      <span>{THEME_MODES[mode].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 하네스 뷰 전환 (activeSystem === 'harness' 일 때 모바일 드로어에 표시) */}
              {activeSystem === 'harness' && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-violet-400 uppercase tracking-wider px-1">
                    하네스 뷰 목록
                  </div>
                  {DOMAIN_GROUPS.map((group) => (
                    <div key={group.id} className="space-y-1">
                      <div className="text-[11px] font-semibold text-slate-400 px-1">{group.name}</div>
                      <div className="space-y-1">
                        {group.views.map((v) => {
                          const IconComp = v.icon;
                          const isSel = activeView === v.id;
                          return (
                            <button
                              key={v.id}
                              onClick={() => handleViewClick(v.id, group.id)}
                              className={`w-full min-h-[40px] px-3 py-2 rounded-lg text-left flex items-center justify-between text-xs transition-colors ${
                                isSel ? 'bg-violet-600/30 text-white font-bold' : 'text-slate-300 hover:bg-slate-800/80'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <IconComp className="w-3.5 h-3.5 text-violet-400" />
                                <span>{v.label}</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-2">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsEmergencyModalOpen(true);
                }}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 active:scale-98 transition-all"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>🚨 비-LLM 긴급 Push & DR 관제</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsCheckModalOpen(true);
                  if (!checkResults) runServiceCheck();
                }}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98 transition-all"
              >
                <Stethoscope className="w-4 h-4" />
                <span>4단계 서비스 전수진단 실행</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 권한 제한 알림 모달 */}
      {permissionAlert && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setPermissionAlert(null)}
          />
          <div className="relative w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl z-50 text-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">접근 권한 제한</h3>
                <p className="text-[11px] text-amber-300/80">필요 권한: {permissionAlert.required}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {permissionAlert.message}
              <br />
              현재 역할은 <span className="font-bold text-white font-mono">[{userRole}]</span> 입니다. 헤더의 권한 시뮬레이터를 통해 권한을 상향 조정하시거나 시스템 관리자에게 문의하세요.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setPermissionAlert(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                확인
              </button>
              <button
                onClick={() => {
                  onSelectRole?.('ROLE_ADMIN');
                  setPermissionAlert(null);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                관리자로 권한 상향
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 비-LLM 긴급 Push 및 DR 관제실 모달 */}
      {isEmergencyModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsEmergencyModalOpen(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 overflow-y-auto z-50">
            <button
              onClick={() => setIsEmergencyModalOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <EmergencyRecoveryPanel />
          </div>
        </div>,
        document.body
      )}

      {/* 서비스 정밀점검 모달 */}
      {isCheckModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsCheckModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 z-50 text-slate-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">4단계 서비스 전수진단 및 가드레일</h3>
              </div>
              <button
                onClick={() => setIsCheckModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {checking ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">시스템 전체 무결성을 진단하는 중입니다...</p>
                </div>
              ) : checkResults ? (
                <div className="space-y-2.5">
                  {checkResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5 text-white">
                          <span>{item.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({item.step})</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{item.message}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 font-mono text-[11px]">
                        {item.passed ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 통과
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> 실패
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">진단 결과가 없습니다.</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsCheckModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                닫기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
