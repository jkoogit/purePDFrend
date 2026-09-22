import { useState, useEffect } from 'react';
import {
  Layout,
  Settings,
  Database,
  GitBranch,
  CheckCircle2,
  Server,
  ShieldCheck,
  Layers,
  Bot,
  AlertTriangle,
  Stethoscope,
  RefreshCw,
  X,
  Menu,
  Network,
  BarChart3,
  FileText,
  Cpu,
  ChevronRight,
} from 'lucide-react';
import { ActiveViewId, DomainGroupId } from '../../types';

export type AppTab = 'agent' | 'scenarios' | 'system' | 'viewer' | 'ocr';

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
        id: 'scenarios',
        label: '시나리오설계',
        description: '도서 스캔본 PDF 변환/교정 워크플로우',
        domain: 'studio',
        icon: Layout,
      },
    ],
  },
];

export const ALL_VIEWS: DomainViewItem[] = DOMAIN_GROUPS.flatMap((g) => g.views);

interface NavbarProps {
  activeView: ActiveViewId;
  onSelectView: (view: ActiveViewId) => void;
  activeDomain: DomainGroupId;
  onSelectDomain: (domain: DomainGroupId) => void;
  dbStatus: string;
  currentTab?: AppTab;
  onSelectTab?: (tab: AppTab) => void;
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
}: NavbarProps) {
  const [hoveredBadge, setHoveredBadge] = useState<'db' | 'branch' | 'status' | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string>('SESSION-20260921-004');
  const [activeBranch, setActiveBranch] = useState<string>('task/모바일UX_IA개편_Gemini');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Service Health Check state
  const [isCheckModalOpen, setIsCheckModalOpen] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [checkResults, setCheckResults] = useState<CheckResultItem[] | null>(null);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);

  const currentViewItem = ALL_VIEWS.find((v) => v.id === activeView) || ALL_VIEWS[0];
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
          setActiveSessionId(latest.session_id);
          if (latest.doc_payload?.gitBranch) {
            setActiveBranch(latest.doc_payload.gitBranch);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectDomainAndFirstView = (domainId: DomainGroupId) => {
    onSelectDomain(domainId);
    const group = DOMAIN_GROUPS.find((g) => g.id === domainId);
    if (group && group.views.length > 0) {
      // If current view does not belong to new domain, switch to first view
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

  return (
    <header className="sticky top-0 z-40 flex flex-col w-full bg-slate-950/95 border-b border-slate-800 backdrop-blur-md">
      {/* 1. Main Global Header */}
      <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => handleViewClick('graph', 'harness')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm sm:text-base shadow-lg shadow-indigo-500/20">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-white tracking-tight text-xs sm:text-sm">purePDFrend</span>
                <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                  v2.1 IA
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono hidden xs:block">
                대용량 스캔 PDF & 하네스 스튜디오
              </div>
            </div>
          </div>

          {/* Desktop 3-Domain Segmented Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 border-l border-slate-800 pl-4 lg:pl-6">
            {DOMAIN_GROUPS.map((group) => {
              const isDomainActive = activeDomain === group.id;
              return (
                <button
                  key={group.id}
                  id={`domain-tab-${group.id}`}
                  onClick={() => handleSelectDomainAndFirstView(group.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                    isDomainActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title={group.description}
                >
                  {group.id === 'harness' && <Bot className="w-3.5 h-3.5 text-indigo-300" />}
                  {group.id === 'knowledge' && <FileText className="w-3.5 h-3.5 text-indigo-300" />}
                  {group.id === 'studio' && <Cpu className="w-3.5 h-3.5 text-indigo-300" />}
                  <span>{group.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Status Indicators & Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Current View Mini Pill */}
          <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-[11px] font-semibold">
            <currentViewItem.icon className="w-3 h-3 text-indigo-400" />
            <span className="max-w-[80px] truncate">{currentViewItem.label}</span>
          </div>

          {/* DB Connection Indicator */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredBadge('db')}
            onMouseLeave={() => setHoveredBadge(null)}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-colors text-xs">
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
                  <div className="flex justify-between">
                    <span className="text-slate-400">동기화 테이블:</span>
                    <span className="font-mono text-slate-300">agent_docs_meta (30건)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Git Branch Badge */}
          <div
            className="relative hidden lg:block"
            onMouseEnter={() => setHoveredBadge('branch')}
            onMouseLeave={() => setHoveredBadge(null)}
          >
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-800/40 hover:border-amber-500/60 cursor-pointer transition-colors text-xs text-amber-300 font-mono text-[11px]">
              <GitBranch className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate max-w-[130px]">{activeBranch}</span>
            </div>
          </div>

          {/* Comprehensive Service Health Check Button */}
          <button
            id="btn-service-health-check"
            onClick={() => {
              setIsCheckModalOpen(true);
              if (!checkResults) runServiceCheck();
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-700/60 hover:border-emerald-400 hover:bg-emerald-900/40 cursor-pointer transition-all text-emerald-300 text-xs font-semibold shadow-sm"
            title="서비스 전수 점검 및 가드레일 진단"
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">정밀점검</span>
            {allPassed === true && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
            {allPassed === false && <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />}
          </button>

          {/* Mobile Hamburger Drawer Trigger (44px Minimum Touch Target Guaranteed) */}
          <button
            id="btn-mobile-menu-drawer"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="모바일 도메인 메뉴 열기"
            className="md:hidden w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Bar */}
      {/* Desktop: Active Domain Views Chip Bar */}
      <div className="hidden md:flex h-10 border-t border-slate-800/80 bg-slate-900/50 px-6 items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            {currentDomainGroup.name}:
          </span>
          <div className="flex items-center gap-1.5">
            {currentDomainGroup.views.map((item) => {
              const isActive = activeView === item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  id={`sub-view-tab-${item.id}`}
                  onClick={() => onSelectView(item.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                  title={item.description}
                >
                  <IconComp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            AGENTS.md 준거 거버넌스 활성
          </span>
          <span>|</span>
          <span className="text-slate-400">{activeSessionId}</span>
        </div>
      </div>

      {/* Mobile: Horizontal Swipeable Quick Chip Bar (8 Views Direct 1-Tap) */}
      <div className="md:hidden h-11 border-t border-slate-800/80 bg-slate-900/60 px-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap touch-pan-x">
        {ALL_VIEWS.map((item) => {
          const isActive = activeView === item.id;
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleViewClick(item.id, item.domain)}
              className={`min-h-[32px] px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 select-none ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Mobile Right Sliding Drawer (Off-Canvas Navigation) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop Dim */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Sliding Panel */}
          <div className="relative w-80 max-w-[85vw] h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  P
                </div>
                <span className="font-bold text-white text-sm">3대 도메인 내비게이션</span>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="메뉴 닫기"
                className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body: 3 Domain Groups */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {DOMAIN_GROUPS.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      {group.name}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {group.views.length}개 뷰
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 px-1">{group.description}</p>

                  <div className="space-y-1 mt-1">
                    {group.views.map((view) => {
                      const isSelected = activeView === view.id;
                      const IconComponent = view.icon;
                      return (
                        <button
                          key={view.id}
                          onClick={() => handleViewClick(view.id, group.id)}
                          className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-indigo-600/20 border border-indigo-500/50 text-white'
                              : 'bg-slate-950/40 border border-slate-800/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold">{view.label}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                                {view.description}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer: System Status & Diagnostic Action */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">데이터베이스 상태:</span>
                {dbStatus === 'CONNECTED' ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 정상 연결
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> 로컬 캐시 모드
                  </span>
                )}
              </div>

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
        </div>
      )}

      {/* 4. Comprehensive Service Health Check Modal (100% Shared & Responsive) */}
      {isCheckModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    서비스 전수 점검 & 상시 가드레일 진단
                    {allPassed === true && (
                      <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        100% ALL PASSED
                      </span>
                    )}
                    {allPassed === false && (
                      <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        점검필요
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">
                    인프라/DB, 정합성, 거버넌스 100점 감사, 문서 및 GIN 검색 4단계 종합 검증
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={runServiceCheck}
                  disabled={checking}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 min-h-[36px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${checking ? 'animate-spin text-emerald-400' : ''}`} />
                  <span className="hidden sm:inline">{checking ? '점검중...' : '재점검'}</span>
                </button>
                <button
                  onClick={() => setIsCheckModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
              {checking && !checkResults ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs">4단계 서비스 전수 점검을 수행하고 있습니다...</p>
                </div>
              ) : checkResults && checkResults.length > 0 ? (
                <div className="space-y-2.5">
                  {checkResults.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        item.passed
                          ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                          : 'bg-rose-950/20 border-rose-900/60'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {item.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                              {item.step}
                            </span>
                            <span className="text-xs font-bold text-white">{item.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            {item.message}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap mt-0.5">
                        {item.durationMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  점검 결과가 없습니다. 재점검을 실행해 주세요.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>CLI: <code className="text-slate-200 font-mono px-1 py-0.5 bg-slate-800 rounded">npm run check:service</code></span>
              </div>
              <button
                onClick={() => setIsCheckModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md min-h-[36px]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
