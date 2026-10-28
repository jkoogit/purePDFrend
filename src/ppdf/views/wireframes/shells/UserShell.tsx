import React from 'react';
import { PdfrendLogo } from '../../../../shared/components/PdfrendLogo';
import { HorizontalSlideContainer } from '../../../components/HorizontalSlideContainer';
import { ThemeMode, resolveThemeMode, getThemeAdaptiveClasses } from '../../../../styles/tokens';
import { ChevronRight, Smartphone, Monitor, Home } from 'lucide-react';
import { WireframeTopDropdown } from '../../../components/WireframeTopDropdown';

export interface UserProgramItem {
  id: string;
  name: string;
  desc: string;
}

export interface UserShellProps {
  currentProgId: string;
  programs: UserProgramItem[];
  onSelectProg: (progId: string) => void;
  isMobileMode?: boolean;
  themeMode?: ThemeMode;
  children: React.ReactNode;
}

export function UserShell({
  currentProgId,
  programs,
  onSelectProg,
  isMobileMode = false,
  themeMode = 'dark',
  children,
}: UserShellProps) {
  const resolvedTheme = resolveThemeMode(themeMode);
  const themeClasses = getThemeAdaptiveClasses(resolvedTheme);
  const currentProg = programs.find((p) => p.id === currentProgId) || programs[0];

  const handleSelectWireframe = (type: any, progId: string) => {
    if (type === 'user') {
      onSelectProg(progId);
    }
  };

  return (
    <div className={`w-full space-y-4 font-sans ${themeClasses.shellBg} transition-colors duration-200`}>
      {/* 1. 공통 쉘 상단 헤더 (BrandLogo 4모드 + 브레드크럼 + 상단 중앙 25개 와이어프레임 목록 + 뷰포트 상태) */}
      <div className={`p-4 rounded-2xl border ${themeClasses.container} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md`}>
        {/* 좌측: 브랜드 로고 & 현재 프로그램 */}
        <div className="flex items-center gap-3">
          <PdfrendLogo size={34} theme={resolvedTheme} />
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 mb-0.5">
              <span className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                <Home className="w-3 h-3" />
                <span>사용자 서비스</span>
              </span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="font-semibold text-blue-400">{currentProg.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span className={themeClasses.textMain}>{currentProg.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
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

        {/* 우측: 뷰포트 상태 칩 */}
        <div className="flex items-center gap-2 self-start md:self-auto text-xs flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 text-slate-300">
            {isMobileMode ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-medium text-[11px]">모바일 뷰포트</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-[11px]">반응형 데스크톱</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. 공통 서브탭 가로 슬라이더 네비게이션 (PG-USR-01 ~ PG-USR-09) */}
      <div className={`p-1.5 rounded-xl border ${themeClasses.border} bg-slate-950/70`}>
        <HorizontalSlideContainer showScrollButtons={true} className="w-full">
          <div className="flex items-center gap-1.5 py-0.5">
            {programs.map((prog) => {
              const isActive = prog.id === currentProgId;
              return (
                <button
                  key={prog.id}
                  onClick={() => onSelectProg(prog.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title={`${prog.id}: ${prog.desc}`}
                >
                  <span className="font-mono text-[10px] opacity-80">{prog.id}</span>
                  <span>{prog.name}</span>
                </button>
              );
            })}
          </div>
        </HorizontalSlideContainer>
      </div>

      {/* 3. 본문 와이어프레임 화면 콘텐츠 */}
      <div className="w-full">{children}</div>
    </div>
  );
}
