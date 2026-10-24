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
  Palette,
  Laptop,
} from 'lucide-react';
import { ResolvedTheme } from '../../styles/tokens';
import { ALL_WIREFRAME_PROGRAMS } from '../views/wireframes/shells/StudioShell';

export type WireframeProgram = (typeof ALL_WIREFRAME_PROGRAMS)[number];

export interface WireframeRibbonLayerProps {
  currentProgId?: string;
  onSelectProgram?: (type: 'showcase' | 'user' | 'admin', progId: string) => void;
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
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'USER' | 'ADMIN' | 'SHOWCASE'>('ALL');
  const layerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    window.addEventListener('purepdfrend-navigate-wireframe', handleNavigate);
    return () => window.removeEventListener('purepdfrend-navigate-wireframe', handleNavigate);
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

  // Focus search input when layer opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const currentProg = ALL_WIREFRAME_PROGRAMS.find((p) => p.id === selectedProgId) || ALL_WIREFRAME_PROGRAMS[1];

  const handleSelect = (type: 'showcase' | 'user' | 'admin', progId: string) => {
    setIsOpen(false);
    setSelectedProgId(progId);
    try {
      localStorage.setItem('purepdfrend_selected_wireframe', JSON.stringify({ type, progId }));
      window.dispatchEvent(new CustomEvent('purepdfrend-navigate-wireframe', { detail: { type, progId } }));
    } catch {}
    onSelectProgram?.(type, progId);
  };

  const filteredPrograms = ALL_WIREFRAME_PROGRAMS.filter((p) => {
    const matchesFilter =
      activeTabFilter === 'ALL' ||
      (activeTabFilter === 'SHOWCASE' && p.type === 'showcase') ||
      (activeTabFilter === 'USER' && p.type === 'user') ||
      (activeTabFilter === 'ADMIN' && p.type === 'admin');

    const matchesSearch =
      searchQuery.trim() === '' ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const userPrograms = filteredPrograms.filter((p) => p.type === 'user');
  const adminPrograms = filteredPrograms.filter((p) => p.type === 'admin');
  const showcasePrograms = filteredPrograms.filter((p) => p.type === 'showcase');

  // Program Card Renderer Helper
  const renderProgramCard = (prog: WireframeProgram) => {
    const isSelected = prog.id === selectedProgId;
    const isUser = prog.type === 'user';
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
                : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/40'
            }`}
          >
            {prog.id}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold leading-snug group-hover:text-sky-400 transition-colors truncate">
              {prog.name}
            </span>
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
      {/* 1. 상단 행잉 리본 트리거 (Top Hanging Ribbon Tab)
          - 헤더 중앙 상단에 슬림하게 걸쳐져 평시 가로 점유폭 0px 유지
          - 마우스 호버 시 살짝 슬라이드 다운 & 앰비언트 글로우 효과 */}
      <div className={`absolute left-1/2 -translate-x-1/2 top-0 z-50 pointer-events-auto ${className}`}>
        <button
          type="button"
          id="btn-top-ribbon-trigger"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`h-6 sm:h-7 px-3 sm:px-4 rounded-b-xl border border-t-0 flex items-center gap-1.5 sm:gap-2 shadow-md transition-all duration-200 cursor-pointer select-none group ${
            isOpen
              ? 'bg-sky-600 border-sky-400 text-white shadow-sky-600/30'
              : theme === 'light'
              ? 'bg-white/95 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-sky-700 shadow-slate-200/80 hover:translate-y-0.5'
              : theme === 'dawn'
              ? 'bg-[#0f1b3d]/95 hover:bg-[#162758] border-[#223b7a] text-sky-200 hover:text-white shadow-sky-950/80 hover:translate-y-0.5'
              : 'bg-slate-900/95 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-sky-400 shadow-black/60 hover:translate-y-0.5'
          }`}
          title="클릭 시 25대 전체 서비스 화면 네비게이션 레이어가 펼쳐집니다."
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <div
            className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${
              isOpen ? 'text-white' : 'text-sky-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
            화면 바로가기
          </span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold leading-none ${
              isOpen
                ? 'bg-white/20 text-white'
                : 'bg-sky-500/20 text-sky-400 border border-sky-400/30'
            }`}
          >
            25
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
              {/* Header Bar: Filter Tabs + Search + Close (단일 컴팩트 바) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60 shrink-0">
                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('ALL')}
                    className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTabFilter === 'ALL'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>전체 (25)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('USER')}
                    className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTabFilter === 'USER'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>사용자 (9)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('ADMIN')}
                    className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTabFilter === 'ADMIN'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>관리자 (16)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('SHOWCASE')}
                    className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTabFilter === 'SHOWCASE'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>쇼케이스 (1)</span>
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
                {/* 1. 사용자 서비스 도구 (9종) */}
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

                {/* 3. 디자인 시스템 쇼케이스 (1종) */}
                {(activeTabFilter === 'ALL' || activeTabFilter === 'SHOWCASE') && showcasePrograms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-800/60">
                      <Palette className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-bold text-amber-400 tracking-wide">
                        디자인 시스템 & 쇼케이스 ({showcasePrograms.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                      {showcasePrograms.map(renderProgramCard)}
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
