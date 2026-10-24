import { useState, useRef, useEffect } from 'react';
import { Layers, ChevronDown, Search, Check, Sparkles, User, Shield, ArrowUpRight } from 'lucide-react';
import { ResolvedTheme } from '../../styles/tokens';
import { ALL_WIREFRAME_PROGRAMS } from '../views/wireframes/shells/StudioShell';

export interface WireframeTopDropdownProps {
  currentProgId?: string;
  onSelectProgram?: (type: 'showcase' | 'user' | 'admin', progId: string) => void;
  theme?: ResolvedTheme;
  className?: string;
}

export function WireframeTopDropdown({
  currentProgId: propProgId = 'PG-USR-01',
  onSelectProgram,
  theme = 'dark',
  className = '',
}: WireframeTopDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'USER' | 'ADMIN' | 'SHOWCASE'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          25
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
          <div className={`flex items-center justify-between border-b pb-2 px-1 ${
            theme === 'light' ? 'border-slate-200 text-slate-900' : 'border-slate-800/80 text-white'
          }`}>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-bold">와이어프레임 전체 서비스 화면 (25개)</span>
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
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-sky-500 transition-colors ${
                theme === 'light'
                  ? 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'
                  : theme === 'dawn'
                  ? 'bg-[#070e22] border-[#1e3066] text-white placeholder-sky-400/50'
                  : 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
              }`}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border text-[11px] ${
            theme === 'light'
              ? 'bg-slate-100 border-slate-200 text-slate-700'
              : theme === 'dawn'
              ? 'bg-[#070e22]/90 border-[#1e3066] text-slate-200'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
          }`}>
            <button
              type="button"
              onClick={() => setActiveTabFilter('ALL')}
              className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTabFilter === 'ALL'
                  ? 'bg-sky-600 text-white font-bold'
                  : theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              전체 (25)
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('USER')}
              className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTabFilter === 'USER'
                  ? 'bg-blue-600 text-white font-bold'
                  : theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3 h-3" />
              <span>사용자 (9)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('ADMIN')}
              className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTabFilter === 'ADMIN'
                  ? 'bg-indigo-600 text-white font-bold'
                  : theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>관리자 (16)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabFilter('SHOWCASE')}
              className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTabFilter === 'SHOWCASE'
                  ? 'bg-amber-600 text-white font-bold'
                  : theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="디자인시스템 쇼케이스"
            >
              쇼케이스
            </button>
          </div>

          {/* Filtered Programs List */}
          <div className="overflow-y-auto space-y-1 pr-1 max-h-64 no-scrollbar">
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((prog) => {
                const isSelected = prog.id === selectedProgId;
                const isUser = prog.type === 'user';
                const isShowcase = prog.type === 'showcase';

                return (
                  <button
                    key={prog.id}
                    type="button"
                    onClick={() => handleSelect(prog.type, prog.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? theme === 'light'
                          ? 'bg-sky-50 border-sky-400 text-sky-950 shadow-sm font-semibold'
                          : 'bg-sky-950/80 border-sky-500/80 text-white shadow-sm'
                        : theme === 'light'
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                        : theme === 'dawn'
                        ? 'bg-[#0e1a38]/60 hover:bg-[#132247] border-[#1e3066] text-slate-200 hover:text-white'
                        : 'bg-slate-950/50 hover:bg-slate-800/70 border-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold shrink-0 mt-0.5 border ${
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
                        <span className="text-xs font-bold leading-snug truncate">{prog.name}</span>
                        <span className={`text-[10px] leading-tight mt-0.5 truncate ${
                          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {prog.desc}
                        </span>
                      </div>
                    </div>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0 mt-1" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 hover:text-sky-400 shrink-0 mt-1 opacity-70" />
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
          <div className={`pt-1.5 border-t text-[10px] flex items-center justify-between px-1 ${
            theme === 'light' ? 'border-slate-200 text-slate-500' : 'border-slate-800/80 text-slate-400'
          }`}>
            <span>💡 클릭 시 해당 와이어프레임 화면으로 즉시 전환됩니다.</span>
            <span className="font-mono text-slate-500">{filteredPrograms.length}개 표시 중</span>
          </div>
        </div>
      )}
    </div>
  );
}
