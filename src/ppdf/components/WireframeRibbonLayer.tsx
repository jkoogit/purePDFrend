import { useState, useRef, useEffect } from 'react';
import {
  Layers,
  ChevronDown,
  Search,
  Check,
  User,
  Shield,
  ArrowUpRight,
  X,
  Laptop,
  Settings,
  Bot,
} from 'lucide-react';
import { ResolvedTheme } from '../../styles/tokens';
import { ALL_WIREFRAME_PROGRAMS } from '../views/wireframes/shells/StudioShell';
import {
  ALL_SYSTEM_PROGRAMS,
  MenuRegistryItem as SystemProgramItem,
  isRealServiceScreen,
} from '../../shared/constants/menuRegistry';

export type WireframeProgram = (typeof ALL_WIREFRAME_PROGRAMS)[number];
export type { SystemProgramItem };
export { ALL_SYSTEM_PROGRAMS };


export interface WireframeRibbonLayerProps {
  currentProgId?: string;
  onSelectProgram?: (type: 'showcase' | 'user' | 'admin' | 'settings' | 'agent', progId: string) => void;
  theme?: ResolvedTheme;
  className?: string;
}

export function WireframeRibbonLayer({
  currentProgId: propProgId = 'PG-USR-01',
  onSelectProgram,
  theme = 'dark',
  className = '',
}: WireframeRibbonLayerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'USER' | 'ADMIN' | 'SETTINGS' | 'AGENT'>('ALL');
  const layerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 모바일 메뉴그룹 버튼 슬라이드 드래그 휠 컨테이너 ref 및 상태
  const filterTabsContainerRef = useRef<HTMLDivElement>(null);
  const [isFilterDragging, setIsFilterDragging] = useState(false);
  const [filterStartX, setFilterStartX] = useState(0);
  const [filterScrollLeft, setFilterScrollLeft] = useState(0);

  const handleFilterMouseDown = (e: React.MouseEvent) => {
    const el = filterTabsContainerRef.current;
    if (!el) return;
    setIsFilterDragging(true);
    setFilterStartX(e.pageX - el.offsetLeft);
    setFilterScrollLeft(el.scrollLeft);
  };

  const handleFilterMouseMove = (e: React.MouseEvent) => {
    if (!isFilterDragging) return;
    const el = filterTabsContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - filterStartX) * 1.5;
    el.scrollLeft = filterScrollLeft - walk;
  };

  const handleFilterMouseUpOrLeave = () => {
    setIsFilterDragging(false);
  };

  useEffect(() => {
    const el = filterTabsContainerRef.current;
    if (!el || !isOpen) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isOpen]);

  // Active program state with localStorage and event synchronization
  const [selectedProgId, setSelectedProgId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('purepdfrend_selected_wireframe');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.progId) return parsed.progId;
      }
    } catch {}
    return propProgId;
  });

  useEffect(() => {
    if (propProgId && propProgId !== selectedProgId) {
      setSelectedProgId(propProgId);
    }
  }, [propProgId]);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      const detail = e.detail;
      if (detail?.progId) {
        setSelectedProgId(detail.progId);
      }
    };
    window.addEventListener('purepdfrend-navigate-screen', handleNavigate);
    window.addEventListener('purepdfrend-navigate-wireframe', handleNavigate);
    return () => {
      window.removeEventListener('purepdfrend-navigate-screen', handleNavigate);
      window.removeEventListener('purepdfrend-navigate-wireframe', handleNavigate);
    };
  }, []);

  // Keyboard shortcut listener (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 모바일 키패드 자동 팝업 방지를 위해 자동 포커스(focus())를 배제합니다.

  const currentProg = ALL_SYSTEM_PROGRAMS.find((p) => p.id === selectedProgId) || ALL_SYSTEM_PROGRAMS[0];

  const handleSelect = (type: 'showcase' | 'user' | 'admin' | 'settings' | 'agent', progId: string) => {
    setIsOpen(false);
    setSelectedProgId(progId);
    try {
      localStorage.setItem('purepdfrend_selected_screen', JSON.stringify({ type, progId }));
      localStorage.setItem('purepdfrend_selected_wireframe', JSON.stringify({ type, progId }));
      window.dispatchEvent(new CustomEvent('purepdfrend-navigate-screen', { detail: { type, progId } }));
      window.dispatchEvent(new CustomEvent('purepdfrend-navigate-wireframe', { detail: { type, progId } }));
    } catch {}
    onSelectProgram?.(type, progId);
  };

  const filteredPrograms = ALL_SYSTEM_PROGRAMS.filter((p) => {
    const matchesFilter =
      activeTabFilter === 'ALL' ||
      (activeTabFilter === 'USER' && (p.type === 'user' || p.type === 'showcase')) ||
      (activeTabFilter === 'ADMIN' && p.type === 'admin') ||
      (activeTabFilter === 'SETTINGS' && p.type === 'settings') ||
      (activeTabFilter === 'AGENT' && p.type === 'agent');

    const matchesSearch =
      searchQuery.trim() === '' ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const userPrograms = filteredPrograms.filter((p) => p.type === 'user' || p.type === 'showcase');
  const adminPrograms = filteredPrograms.filter((p) => p.type === 'admin');
  const settingsPrograms = filteredPrograms.filter((p) => p.type === 'settings');
  const agentPrograms = filteredPrograms.filter((p) => p.type === 'agent');

  // Program Card Renderer Helper
  const renderProgramCard = (prog: SystemProgramItem) => {
    const isSelected = prog.id === selectedProgId;
    const isUser = prog.type === 'user';
    const isAdmin = prog.type === 'admin';
    const isSettings = prog.type === 'settings';
    const isAgent = prog.type === 'agent';
    const isShowcase = prog.type === 'showcase';

    return (
      <button
        key={prog.id}
        type="button"
        id={`btn-nav-wireframe-${prog.id}`}
        onClick={() => handleSelect(prog.type, prog.id)}
        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-2.5 cursor-pointer group select-none ${
          isSelected
            ? theme === 'light'
              ? 'bg-sky-50 border-sky-400 text-sky-950 shadow-sm ring-1 ring-sky-400/30'
              : 'bg-sky-950/80 border-sky-500 text-white shadow-md shadow-sky-950/50 ring-1 ring-sky-400/40'
            : theme === 'light'
            ? 'bg-slate-50/90 hover:bg-white hover:border-sky-300 border-slate-200 text-slate-800 hover:shadow-md'
            : theme === 'dawn'
            ? 'bg-[#0f1d42]/70 hover:bg-[#162758] hover:border-sky-500/50 border-[#1f336a] text-slate-200 hover:text-white hover:shadow-md'
            : 'bg-slate-950/60 hover:bg-slate-800/80 hover:border-indigo-500/50 border-slate-800 text-slate-300 hover:text-white hover:shadow-md'
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold shrink-0 mt-0.5 border ${
              isShowcase
                ? 'bg-amber-500/20 text-amber-500 dark:text-amber-300 border-amber-500/40'
                : isUser
                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/40'
                : isAdmin
                ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/40'
                : isSettings
                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/40'
                : isAgent
                ? 'bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/40'
                : 'bg-slate-500/20 text-slate-400 border-slate-500/40'
            }`}
          >
            {prog.id}
          </span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold leading-snug group-hover:text-sky-400 transition-colors truncate">
                {prog.name}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-semibold font-mono shrink-0 border ${
                  isRealServiceScreen(prog.id)
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}
              >
                {isRealServiceScreen(prog.id) ? '실서비스 직결' : '⚠️ 와이어프레임'}
              </span>
            </div>
            <span
              className={`text-[11px] leading-relaxed mt-0.5 line-clamp-1 ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {prog.desc}
            </span>
          </div>
        </div>
        <div className="shrink-0 mt-0.5">
          {isSelected ? (
            <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Check className="w-3.5 h-3.5" />
            </div>
          ) : (
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all opacity-60" />
          )}
        </div>
      </button>
    );
  };

  return (
    <>
      {/* 1. Navbar 정규 인라인 트리거 버튼 (화면 부유 증상 100% 해소) */}
      <div className={`relative shrink-0 flex items-center ${className}`}>
        <button
          type="button"
          id="btn-top-ribbon-trigger"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`h-8 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 rounded-full border text-xs font-semibold shadow-xs transition-all cursor-pointer select-none group shrink-0 ${
            isOpen
              ? 'bg-sky-600 border-sky-400 text-white shadow-sky-600/30'
              : theme === 'light'
              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-sky-700 hover:border-sky-400'
              : theme === 'dawn'
              ? 'bg-[#0f1b3d] hover:bg-[#162758] border-[#223b7a] text-sky-200 hover:text-white hover:border-sky-400'
              : 'bg-slate-900 border-slate-800 hover:border-sky-500/50 text-slate-200 hover:text-white'
          }`}
          title="클릭 시 4대 시스템(사용자/관리자/설정/에이전트) 37개 전체 서비스 화면 네비게이션이 펼쳐집니다."
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <Layers className={`w-3.5 h-3.5 shrink-0 ${isOpen ? 'text-white' : 'text-sky-400'}`} />
          <span className="font-semibold text-xs leading-none whitespace-nowrap">
            메뉴 바로가기
          </span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold leading-none ${
              isOpen
                ? 'bg-white/20 text-white'
                : 'bg-sky-500/20 text-sky-400 border border-sky-400/30'
            }`}
          >
            {ALL_SYSTEM_PROGRAMS.length}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-slate-400 group-hover:text-sky-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </button>
      </div>

      {/* 2. 메가 네비게이션 레이어 모듈 (Mega Navigation Layer Overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-start">
          {/* Backdrop Blur Dimm */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Layer Container (Top Slide Down) */}
          <div
            ref={layerRef}
            role="dialog"
            aria-modal="true"
            aria-label="전체 서비스 화면 네비게이션"
            className={`relative z-10 w-full max-h-[88vh] border-b shadow-2xl flex flex-col animate-in slide-in-from-top-6 duration-200 ${
              theme === 'light'
                ? 'bg-white/98 border-slate-300 text-slate-900 shadow-slate-300/60'
                : theme === 'dawn'
                ? 'bg-[#0b142d]/98 border-[#1f336a] text-slate-100 shadow-sky-950/80'
                : 'bg-slate-900/98 border-slate-700 text-slate-100 shadow-black/80'
            }`}
          >
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col min-h-0">
              {/* Header Bar: Filter Tabs (사용자, 관리자, 설정, 에이전트) + Search + Close */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60 shrink-0">
                {/* 4대 시스템 카테고리 필터 탭 (모바일 슬라이드 드래그/휠 스크롤 & 줄바꿈 방지) */}
                <div
                  ref={filterTabsContainerRef}
                  onMouseDown={handleFilterMouseDown}
                  onMouseMove={handleFilterMouseMove}
                  onMouseUp={handleFilterMouseUpOrLeave}
                  onMouseLeave={handleFilterMouseUpOrLeave}
                  className="flex items-center gap-1.5 overflow-x-auto scrollbar-none select-none cursor-grab active:cursor-grabbing w-full sm:w-auto pb-1 sm:pb-0"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('ALL')}
                    className={`shrink-0 whitespace-nowrap h-7 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTabFilter === 'ALL'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">전체 ({ALL_SYSTEM_PROGRAMS.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('USER')}
                    className={`shrink-0 whitespace-nowrap h-7 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTabFilter === 'USER'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">사용자 (9)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('ADMIN')}
                    className={`shrink-0 whitespace-nowrap h-7 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTabFilter === 'ADMIN'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">관리자 (16)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('SETTINGS')}
                    className={`shrink-0 whitespace-nowrap h-7 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTabFilter === 'SETTINGS'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">설정 (5)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('AGENT')}
                    className={`shrink-0 whitespace-nowrap h-7 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTabFilter === 'AGENT'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">에이전트 (6)</span>
                  </button>
                </div>

                {/* Search Bar & Close Button */}
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="화면ID (예: PG-USR-03) 또는 이름 검색..."
                      className={`w-full pl-9 pr-8 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-sky-500 transition-colors ${
                        theme === 'light'
                          ? 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'
                          : theme === 'dawn'
                          ? 'bg-[#070e22] border-[#1e3066] text-white placeholder-sky-400/50'
                          : 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
                      }`}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    id="btn-close-wireframe-ribbon-layer"
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="닫기 (ESC)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Categorized Screens Grid Area (Scrollable) */}
              <div className="overflow-y-auto pr-1 flex-1 space-y-5 no-scrollbar py-1">
                {/* 1. 사용자 서비스 도구 (9종 + 쇼케이스) */}
                {(activeTabFilter === 'ALL' || activeTabFilter === 'USER') && userPrograms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-800/60">
                      <User className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold text-blue-400 tracking-wide">
                        사용자 도구 ({userPrograms.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                      {userPrograms.map(renderProgramCard)}
                    </div>
                  </div>
                )}

                {/* 2. 관리자 및 거버넌스 도구 (16종) */}
                {(activeTabFilter === 'ALL' || activeTabFilter === 'ADMIN') && adminPrograms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-800/60">
                      <Shield className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-bold text-indigo-400 tracking-wide">
                        관리자 도구 ({adminPrograms.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5">
                      {adminPrograms.map(renderProgramCard)}
                    </div>
                  </div>
                )}

                {/* 3. 설정 시스템 (5종) */}
                {(activeTabFilter === 'ALL' || activeTabFilter === 'SETTINGS') && settingsPrograms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-800/60">
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold text-cyan-400 tracking-wide">
                        설정 도구 ({settingsPrograms.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                      {settingsPrograms.map(renderProgramCard)}
                    </div>
                  </div>
                )}

                {/* 4. 에이전트 시스템 (6종) */}
                {(activeTabFilter === 'ALL' || activeTabFilter === 'AGENT') && agentPrograms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-800/60">
                      <Bot className="w-4 h-4 text-violet-400" />
                      <h3 className="text-xs font-bold text-violet-400 tracking-wide">
                        에이전트 관리 도구 ({agentPrograms.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                      {agentPrograms.map(renderProgramCard)}
                    </div>
                  </div>
                )}

                {filteredPrograms.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-500">
                    검색어와 일치하는 서비스 화면이 없습니다.
                  </div>
                )}
              </div>

              {/* Footer Information Bar */}
              <div
                className={`pt-3 mt-2 border-t text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 ${
                  theme === 'light'
                    ? 'border-slate-200 text-slate-600'
                    : 'border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sky-400">현재 활성 화면:</span>
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                    {currentProg.id}
                  </span>
                  <span className="truncate max-w-[280px]">{currentProg.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span>💡 [ESC] 키 또는 바깥 영역 클릭 시 닫힙니다.</span>
                  <span>|</span>
                  <span className="font-mono">{filteredPrograms.length}개 화면 표시 중</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
