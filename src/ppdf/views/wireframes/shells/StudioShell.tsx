import React, { useState } from 'react';
import { PdfrendLogo } from '../../../../shared/components/PdfrendLogo';
import { HorizontalSlideContainer } from '../../../components/HorizontalSlideContainer';
import { ThemeMode, resolveThemeMode, getThemeAdaptiveClasses } from '../../../../styles/tokens';
import { ChevronDown, Monitor, Smartphone, Tablet, Layers } from 'lucide-react';

export interface StudioShellProps {
  activeTab: 'showcase' | 'user' | 'admin';
  onChangeTab: (tab: 'showcase' | 'user' | 'admin') => void;
  viewportMode: 'full' | 'tablet' | 'mobile';
  onChangeViewport: (mode: 'full' | 'tablet' | 'mobile') => void;
  themeMode?: ThemeMode;
  onSelectWireframeProgram?: (type: 'user' | 'admin' | 'showcase', progId: string) => void;
  children: React.ReactNode;
}

// 25개 와이어프레임 프로그램 전체 레지스트리 (상단 중앙 퀵 셀렉트용)
export const ALL_WIREFRAME_PROGRAMS = [
  { group: '쇼케이스', type: 'showcase' as const, id: 'DS-SHOWCASE', name: '디자인시스템 쇼케이스', desc: '8대 Primitive UI & 토큰 팔레트' },
  // 사용자 서비스 (9개)
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-01', name: '첫화면 (랜딩)', desc: '공개 문서조회, 롤링배너, 공지/리뷰' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-02', name: '로그인 / 회원가입', desc: '소셜/이메일 2FA 탭 전환, 약관동의' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-03', name: '홈화면 (대시보드)', desc: '7대 PDF 핵심도구 퀵그리드, 프로필' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-04', name: '마이페이지 > 사용자관리', desc: '비밀번호 변경, 2FA, 닉네임 수정' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-05', name: '문서관리 (라이브러리)', desc: '8대 상세필터, 4종 다운로드 모달' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-06', name: '문서뷰어 & 주석스튜디오', desc: '단일줄 툴바+슬라이더, 8대 모드' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-07', name: '문서공유 및 협업작업뷰', desc: '공유권한 설정, 동시접속자 목록' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-08', name: '오프라인 작업 정리', desc: '리소스모드/문서모드, 3Way 충돌머지' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-09', name: '정밀 사용자 환경설정', desc: '단축키설정(PC/태블릿), 도구그룹설정' },
  // 관리자 서비스 (16개)
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-01', name: '보안관리', desc: '화이트리스트 & 2FA 강제화, 세션만료' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-02', name: '프로그램관리', desc: 'DAG 순환방지, 다중권한 설정' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-03', name: '사용자관리', desc: '프로필 사진, 상세조회, 스토리지' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-04', name: '약관·동의·정책', desc: '적용버전만 보기, 이전약관 수정' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-05', name: '사용자 권한관리', desc: '권한/프로그램/사용자 3대 탭' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-06', name: '메뉴관리', desc: '메뉴 계층, 화면 프로그램 매핑' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-07', name: '로그관리', desc: '다차원 감사로그 필터, PDF 변경추적' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-08', name: '알림관리', desc: '공지안내, OCR 완료알림, 개인알림' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-09', name: 'API 연동관리', desc: '내부 서비스 및 외부 OAuth/Gemini 통합' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-11', name: '사용자설정 항목관리', desc: '체크박스/드롭다운 메타데이터 관리' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-12', name: '게시판·배너관리', desc: '예약공지, 다시열지않기, 배너순서' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-13', name: '고객관리', desc: 'FAQ, 공개 QNA, 1:1 상담' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-14', name: '무료글꼴관리', desc: '웹폰트 WOFF2/TTF 등록, 프리뷰' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-15', name: '단축키 및 도구아이콘 관리', desc: '시스템 기본 vs 커스텀 우선, 리소스' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-16', name: '도구그룹관리', desc: '8대 뷰어모드별 도구편성, 영향도 검토' },
];

export function StudioShell({
  activeTab,
  onChangeTab,
  viewportMode,
  onChangeViewport,
  themeMode = 'dark',
  onSelectWireframeProgram,
  children,
}: StudioShellProps) {
  const resolvedTheme = resolveThemeMode(themeMode);
  const themeClasses = getThemeAdaptiveClasses(resolvedTheme);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  return (
    <div className={`space-y-6 font-sans ${themeClasses.shellBg} transition-colors duration-200`}>
      {/* 상단 컨트롤 바: 브랜드 + 중앙 와이어프레임 퀵 점프 목록 + 우측 도메인/뷰포트 스위처 */}
      <div className={`p-4 rounded-2xl border ${themeClasses.container} shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
        {/* Left: 브랜드 & 타이틀 */}
        <div className="flex items-center gap-3">
          <PdfrendLogo size={38} theme={resolvedTheme} />
          <div>
            <h1 className="text-base font-bold flex items-center gap-2">
              <span className={themeClasses.textMain}>purePDFrend 와이어프레임 & 디자인시스템 스튜디오</span>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                DS v1.0
              </span>
            </h1>
            <p className={`text-xs ${themeClasses.textMuted}`}>
              3대 공통 쉘(Admin/User/Studio), tokens.ts 디자인 토큰 및 25개 서비스 화면
            </p>
          </div>
        </div>

        {/* Center: top 영역 가운데 와이어프레임 서비스목록 퀵 점프 드롭다운 */}
        <div className="relative self-start lg:self-center">
          <button
            id="btn-wireframe-quick-jump"
            onClick={() => setIsQuickMenuOpen((prev) => !prev)}
            className="min-h-[42px] px-3.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-700/80 text-white text-xs font-semibold flex items-center gap-2 shadow-inner transition-colors cursor-pointer"
            title="25개 와이어프레임 서비스 화면 퀵 점프"
          >
            <Layers className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-400 leading-none">화면 바로가기</span>
              <span className="text-xs font-bold text-sky-300">와이어프레임 서비스 목록 (25개)</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isQuickMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isQuickMenuOpen && (
            <div className="absolute left-0 lg:left-1/2 lg:-translate-x-1/2 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 no-scrollbar">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-800 flex items-center justify-between">
                <span>전체 25개 서비스 화면 퀵 점프</span>
                <span className="text-[10px] text-sky-400 font-mono">25 Screens</span>
              </div>

              {/* Group: 쇼케이스 */}
              <div className="mt-2">
                <div className="px-2 py-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  디자인시스템
                </div>
                <button
                  onClick={() => {
                    onChangeTab('showcase');
                    onSelectWireframeProgram?.('showcase', 'DS-SHOWCASE');
                    setIsQuickMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    activeTab === 'showcase' ? 'bg-blue-600/30 text-blue-300 font-bold' : 'text-slate-200'
                  }`}
                >
                  <span className="font-medium">🎨 디자인시스템 쇼케이스</span>
                  <span className="text-[10px] text-slate-500 font-mono">Showcase</span>
                </button>
              </div>

              {/* Group: 사용자 서비스 (9개) */}
              <div className="mt-2 pt-1 border-t border-slate-800">
                <div className="px-2 py-1 text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  사용자 서비스 (9개)
                </div>
                {ALL_WIREFRAME_PROGRAMS.filter((p) => p.type === 'user').map((prog) => (
                  <button
                    key={prog.id}
                    onClick={() => {
                      onChangeTab('user');
                      onSelectWireframeProgram?.('user', prog.id);
                      setIsQuickMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
                        {prog.id}
                      </span>
                      <span className="text-xs truncate">{prog.name}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Group: 관리자 서비스 (16개) */}
              <div className="mt-2 pt-1 border-t border-slate-800">
                <div className="px-2 py-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  관리자 서비스 (16개)
                </div>
                {ALL_WIREFRAME_PROGRAMS.filter((p) => p.type === 'admin').map((prog) => (
                  <button
                    key={prog.id}
                    onClick={() => {
                      onChangeTab('admin');
                      onSelectWireframeProgram?.('admin', prog.id);
                      setIsQuickMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                        {prog.id}
                      </span>
                      <span className="text-xs truncate">{prog.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: 도메인 선택 탭 & 뷰포트 스위처 */}
        <div className="w-full lg:w-auto overflow-hidden">
          <HorizontalSlideContainer showScrollButtons={false} className="w-full lg:w-auto">
            {/* 3대 도메인 전환 버튼 */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs shrink-0">
              <button
                id="btn-tab-showcase"
                onClick={() => onChangeTab('showcase')}
                className={`px-3.5 py-2 min-h-[40px] rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 select-none ${
                  activeTab === 'showcase'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🎨</span>
                <span>디자인시스템 쇼케이스</span>
              </button>
              <button
                id="btn-tab-user-wireframes"
                onClick={() => onChangeTab('user')}
                className={`px-3.5 py-2 min-h-[40px] rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 select-none ${
                  activeTab === 'user'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📱</span>
                <span>사용자 서비스 (9개)</span>
              </button>
              <button
                id="btn-tab-admin-wireframes"
                onClick={() => onChangeTab('admin')}
                className={`px-3.5 py-2 min-h-[40px] rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 select-none ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🛠</span>
                <span>관리자 서비스 (16개)</span>
              </button>
            </div>

            {/* 뷰포트 시뮬레이션 */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs shrink-0">
              <button
                onClick={() => onChangeViewport('full')}
                className={`px-3 py-2 min-h-[40px] rounded-lg transition-all shrink-0 flex items-center gap-1 select-none ${
                  viewportMode === 'full' ? 'bg-slate-800 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="데스크톱 100% 뷰"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>PC (100%)</span>
              </button>
              <button
                onClick={() => onChangeViewport('tablet')}
                className={`px-3 py-2 min-h-[40px] rounded-lg transition-all shrink-0 flex items-center gap-1 select-none ${
                  viewportMode === 'tablet' ? 'bg-slate-800 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="태블릿 768px 뷰"
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>태블릿 (768px)</span>
              </button>
              <button
                onClick={() => onChangeViewport('mobile')}
                className={`px-3 py-2 min-h-[40px] rounded-lg transition-all shrink-0 flex items-center gap-1 select-none ${
                  viewportMode === 'mobile' ? 'bg-slate-800 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="모바일 390px 뷰"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>모바일 (390px)</span>
              </button>
            </div>
          </HorizontalSlideContainer>
        </div>
      </div>

      {/* 뷰포트 래퍼 (시뮬레이션 모드 반영) */}
      <div
        className={`mx-auto transition-all duration-300 ${
          viewportMode === 'mobile'
            ? 'max-w-[410px] p-2 bg-slate-950/80 rounded-3xl border-4 border-slate-800 shadow-2xl'
            : viewportMode === 'tablet'
            ? 'max-w-[800px] p-3 bg-slate-950/50 rounded-2xl border-2 border-slate-800 shadow-xl'
            : 'w-full'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
