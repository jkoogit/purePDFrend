import React, { useState } from 'react';
import { PdfrendLogo } from '../../../../shared/components/PdfrendLogo';
import { HorizontalSlideContainer } from '../../../components/HorizontalSlideContainer';
import { ThemeMode, resolveThemeMode, getThemeAdaptiveClasses } from '../../../../styles/tokens';
import { ChevronRight, Shield, Smartphone, Monitor, Search } from 'lucide-react';
import { WireframeTopDropdown } from '../../../components/WireframeTopDropdown';

export interface AdminProgramItem {
  id: string;
  name: string;
  desc: string;
}

export interface AdminShellProps {
  currentProgId: string;
  programs: AdminProgramItem[];
  onSelectProg: (progId: string) => void;
  isMobileMode?: boolean;
  themeMode?: ThemeMode;
  children: React.ReactNode;
}

// 5대 관리자 프로그램 카테고리 분류
export const ADMIN_CATEGORIES = [
  { id: 'ALL', label: '전체 (16개)' },
  { id: 'SEC_AUTH', label: '보안·약관', progIds: ['PG-ADM-01', 'PG-ADM-04'] },
  { id: 'USER_ROLE', label: '사용자·권한', progIds: ['PG-ADM-03', 'PG-ADM-05'] },
  { id: 'PROG_MENU', label: '프로그램·메뉴', progIds: ['PG-ADM-02', 'PG-ADM-06'] },
  { id: 'OPS_LOG', label: '운영·로그·API', progIds: ['PG-ADM-07', 'PG-ADM-08', 'PG-ADM-09', 'PG-ADM-11'] },
  { id: 'BOARD_UI', label: '고객·글꼴·도구', progIds: ['PG-ADM-12', 'PG-ADM-13', 'PG-ADM-14', 'PG-ADM-15', 'PG-ADM-16'] },
];

export function AdminShell({
  currentProgId,
  programs,
  onSelectProg,
  isMobileMode = false,
  themeMode = 'dark',
  children,
}: AdminShellProps) {
  const resolvedTheme = resolveThemeMode(themeMode);
  const themeClasses = getThemeAdaptiveClasses(resolvedTheme);
  const currentProg = programs.find((p) => p.id === currentProgId) || programs[0];

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const handleSelectWireframe = (type: 'showcase' | 'user' | 'admin', progId: string) => {
    if (type === 'admin') {
      onSelectProg(progId);
    }
  };

  // 필터링된 프로그램 목록
  const filteredPrograms = programs.filter((p) => {
    const matchesCategory =
      activeCategory === 'ALL' ||
      ADMIN_CATEGORIES.find((c) => c.id === activeCategory)?.progIds?.includes(p.id);
    const matchesSearch =
      searchKeyword.trim() === '' ||
      p.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`w-full space-y-4 font-sans ${themeClasses.shellBg} transition-colors duration-200`}>
      {/* 1. 공통 쉘 상단 헤더 (BrandLogo + 브레드크럼 + 상단 중앙 25개 와이어프레임 목록 + 검색창 + 뷰포트 상태) */}
      <div className={`p-4 rounded-2xl border ${themeClasses.container} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md`}>
        {/* 좌측: 로고 & 현재 프로그램 */}
        <div className="flex items-center gap-3">
          <PdfrendLogo size={34} theme={resolvedTheme} />
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 mb-0.5">
              <span className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
                <Shield className="w-3 h-3 text-indigo-400" />
                <span>관리자 서비스</span>
              </span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="font-semibold text-indigo-400">{currentProg.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span className={themeClasses.textMain}>{currentProg.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {currentProg.id}
                </span>
              </h2>
            </div>
          </div>
        </div>

        {/* 중앙: top 영역 가운데 와이어프레임 서비스목록 드롭다운 */}
        <div className="flex justify-center my-1 md:my-0">
          <WireframeTopDropdown
            currentProgId={currentProgId}
            theme={resolvedTheme}
            onSelectProgram={handleSelectWireframe}
          />
        </div>

        {/* 우측: 프로그램 검색 & 뷰포트 상태 */}
        <div className="flex items-center gap-2 self-start md:self-auto text-xs flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="프로그램 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-950/70 border border-slate-700/80 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-32 sm:w-40"
            />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 text-slate-300">
            {isMobileMode ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-medium text-[11px]">모바일 뷰</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium text-[11px]">데스크톱 뷰</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. 카테고리 필터 & 가로 슬라이더 네비게이션 */}
      <div className={`p-2 rounded-xl border ${themeClasses.border} bg-slate-950/70 space-y-2`}>
        {/* 카테고리 필터 칩 */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {ADMIN_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`btn-admin-cat-${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`min-h-[32px] px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors select-none ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 16개 프로그램 네비게이션 버튼 가로 슬라이더 */}
        <HorizontalSlideContainer showScrollButtons={true} className="w-full">
          <div className="flex items-center gap-1.5 py-0.5">
            {filteredPrograms.map((prog) => {
              const isActive = prog.id === currentProgId;
              return (
                <button
                  key={prog.id}
                  id={`btn-admin-shell-nav-${prog.id}`}
                  onClick={() => onSelectProg(prog.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 shrink-0 select-none ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={`${prog.id}: ${prog.desc}`}
                >
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {prog.id.replace('PG-ADM-', 'A')}
                  </span>
                  <span>{prog.name}</span>
                </button>
              );
            })}
          </div>
        </HorizontalSlideContainer>
      </div>

      {/* 3. 본문 와이어프레임 렌더링 영역 */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
