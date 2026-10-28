import { useState, useRef, useEffect } from 'react';
import { Layers, ChevronDown, Search, Check, Sparkles, User, Shield, ArrowUpRight, Settings, Bot } from 'lucide-react';
import { ResolvedTheme } from '../../styles/tokens';
import { ALL_SYSTEM_PROGRAMS, isRealServiceScreen } from '../../shared/constants/menuRegistry';

export interface WireframeTopDropdownProps {
  currentProgId?: string;
  onSelectProgram?: (type: 'showcase' | 'user' | 'admin' | 'settings' | 'agent' | string, progId: string) => void;
  theme?: ResolvedTheme;
  className?: string;
}

export function WireframeTopDropdown({
  currentProgId = 'PG-USR-01',
  onSelectProgram,
  theme = 'dark',
  className = '',
}: WireframeTopDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'USER' | 'ADMIN' | 'SETTINGS' | 'AGENT'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 상단 시스템 버튼 탭 슬라이드 드래그 및 휠 스크롤 핸들러
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [isTabsDragging, setIsTabsDragging] = useState(false);
  const [tabsStartX, setTabsStartX] = useState(0);
  const [tabsScrollLeft, setTabsScrollLeft] = useState(0);

  const handleTabsMouseDown = (e: React.MouseEvent) => {
    const el = tabsContainerRef.current;
    if (!el) return;
    setIsTabsDragging(true);
    setTabsStartX(e.pageX - el.offsetLeft);
    setTabsScrollLeft(el.scrollLeft);
  };

  const handleTabsMouseMove = (e: React.MouseEvent) => {
    if (!isTabsDragging) return;
    const el = tabsContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - tabsStartX) * 1.5;
    el.scrollLeft = tabsScrollLeft - walk;
  };

  const handleTabsMouseUpOrLeave = () => {
    setIsTabsDragging(false);
  };

  // 휠 가로 스크롤 이벤트
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el || !isOpen) return;
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta !== 0) {
        e.preventDefault();
        el.scrollLeft += delta;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const currentProg = ALL_SYSTEM_PROGRAMS.find((p) => p.id === currentProgId) || ALL_SYSTEM_PROGRAMS[0];

  const handleSelect = (type: 'showcase' | 'user' | 'admin' | 'settings' | 'agent', progId: string) => {
    setIsOpen(false);
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

  return (
    <div className={`relative z-50 ${className}`} ref={dropdownRef}>
      {/* Top Bar Center Dropdown Trigger Button */}
      <button
        type="button"
        id="btn-wireframe-top-dropdown-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`min-h-[40px] px-3.5 py-1.5 rounded-xl border flex items-center gap-2.5 transition-all shadow-md cursor-pointer select-none ${
          theme === 'light'
            ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 shadow-slate-200/50'
            : theme === 'dawn'
            ? 'bg-[#0f1b3d]/90 hover:bg-[#162758] border-[#223b7a] text-sky-200 shadow-sky-950/40'
            : 'bg-slate-950/90 hover:bg-slate-800/90 border-slate-700/80 text-slate-100 shadow-indigo-950/30'
        }`}
        title="디자인 화면(와이어프레임 25개) 바로가기 목록 열기"
      >
        <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
          <Layers className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] text-slate-400 font-medium">화면 바로가기</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-sky-400 font-mono">{currentProg.id}</span>
            <span className="text-xs font-semibold max-w-[140px] sm:max-w-[200px] truncate">
              {currentProg.name}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold ml-0.5">
          {ALL_SYSTEM_PROGRAMS.length}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-sky-400' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-84 sm:w-96 max-h-[480px] rounded-2xl border shadow-2xl p-3 z-50 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl ${
            theme === 'light'
              ? 'bg-white/98 border-slate-300 text-slate-900 shadow-slate-300/60'
              : theme === 'dawn'
              ? 'bg-[#0b142d]/98 border-[#1f336a] text-slate-100 shadow-sky-950/60'
              : 'bg-slate-900/98 border-slate-700 text-slate-100 shadow-2xl shadow-black/80'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 px-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-bold">4대 시스템 전체 서비스 화면 ({ALL_SYSTEM_PROGRAMS.length}개)</span>
            </div>
            <span className="text-[10px] font-mono text-sky-400">DS v1.0</span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="화면ID (예: PG-USR-03) 또는 화면명 검색..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Tabs (5 tabs: 전체, 사용자, 관리자, 설정, 에이전트) - 슬라이드 드래그 및 휠 스크롤 적용 */}
          <div
            ref={tabsContainerRef}
            onMouseDown={handleTabsMouseDown}
            onMouseMove={handleTabsMouseMove}
            onMouseUp={handleTabsMouseUpOrLeave}
            onMouseLeave={handleTabsMouseUpOrLeave}
            className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 text-[11px] overflow-x-auto scrollbar-none select-none cursor-grab active:cursor-grabbing"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <button
              type="button"
              onClick={() => setActiveTabFilter('ALL')}
              className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTabFilter === 'ALL'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              전체 ({ALL_SYSTEM_PROGRAMS.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('USER')}
              className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTabFilter === 'USER'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3 h-3" />
              <span>사용자 (9)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('ADMIN')}
              className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTabFilter === 'ADMIN'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>관리자 (16)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('SETTINGS')}
              className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTabFilter === 'SETTINGS'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-3 h-3" />
              <span>설정 (5)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('AGENT')}
              className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTabFilter === 'AGENT'
                  ? 'bg-violet-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3 h-3" />
              <span>에이전트 (6)</span>
            </button>
          </div>

          {/* Filtered Programs List */}
          <div className="overflow-y-auto space-y-1 pr-1 max-h-64 scrollbar-thin">
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((prog) => {
                const isSelected = prog.id === currentProgId;
                const isUser = prog.type === 'user';
                const isAdmin = prog.type === 'admin';
                const isSettings = prog.type === 'settings';
                const isAgent = prog.type === 'agent';
                const isShowcase = prog.type === 'showcase';

                return (
                  <button
                    key={prog.id}
                    type="button"
                    onClick={() => handleSelect(prog.type, prog.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-sky-950/80 border-sky-500/80 text-white shadow-sm ring-1 ring-sky-500/40'
                        : 'bg-slate-950/50 hover:bg-slate-800/70 border-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold shrink-0 mt-0.5 border ${
                          isShowcase
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : isUser
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : isAdmin
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : isSettings
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : isAgent
                            ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                            : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                        }`}
                      >
                        {prog.id}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold leading-snug truncate">{prog.name}</span>
                          <span
                            className={`text-[9px] px-1 py-0.5 rounded font-semibold shrink-0 border ${
                              isRealServiceScreen(prog.id)
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            }`}
                          >
                            {isRealServiceScreen(prog.id) ? '실서비스' : '⚠️ 와이어프레임'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                          {prog.desc}
                        </span>
                      </div>
                    </div>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-sky-400 shrink-0 mt-1" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 hover:text-sky-400 shrink-0 mt-1 opacity-70" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                검색된 디자인 화면이 없습니다.
              </div>
            )}
          </div>

          {/* Quick Tip Footer */}
          <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between px-1">
            <span>💡 실서비스가 있는 화면은 실서비스로, 그 외는 와이어프레임으로 직결됩니다.</span>
            <span className="font-mono text-slate-500">{filteredPrograms.length}개 표시 중</span>
          </div>
        </div>
      )}
    </div>
  );
}
