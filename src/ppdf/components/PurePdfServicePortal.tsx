import { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  LogIn,
  LogOut,
  X,
  Bot,
  Settings,
  HelpCircle,
  MessageSquare,
  Sparkle,
  Sun,
  Moon,
  Sunrise,
  Monitor,
  ChevronDown,
} from 'lucide-react';
import { UserSystemRole } from '../../types';
import { ThemeMode, ResolvedTheme, THEME_MODES, resolveThemeMode, applyThemeToDocument } from '../../styles/tokens';
import { PdfrendLogo } from '../../shared/components/PdfrendLogo';
import { VirtualViewerStudio } from './VirtualViewerStudio';
import { HorizontalSlideContainer } from './HorizontalSlideContainer';

export interface PurePdfServicePortalProps {
  onNavigateToAgent?: () => void;
  onNavigateToSettings?: () => void;
  userRole?: UserSystemRole;
  onSelectRole?: (role: UserSystemRole) => void;
  systemAdminEmail?: string;
  themeMode?: ThemeMode;
  onChangeThemeMode?: (mode: ThemeMode) => void;
}

export default function PurePdfServicePortal({
  onNavigateToAgent,
  onNavigateToSettings,
  userRole = 'ROLE_USER',
  onSelectRole,
  systemAdminEmail = 'jkoogit@gmail.com',
  themeMode: propThemeMode,
  onChangeThemeMode,
}: PurePdfServicePortalProps) {
  // 1. 사용자 인증(로그인) 상태 (기본값: 비로그인 상태로 진입하여 로그인 시 권한별 버튼 동적 표시)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTab, setLoginTab] = useState<'signin' | 'signup'>('signin');
  const [loginEmail, setLoginEmail] = useState('user@purepdfrend.io');
  const [loginPassword, setLoginPassword] = useState('••••••••');
  const [userName, setUserName] = useState('홍길동');

  // 4모드 테마 상태
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (propThemeMode) return propThemeMode;
    try {
      const saved = localStorage.getItem('purepdfrend_theme_mode');
      if (saved && ['light', 'dark', 'dawn', 'system'].includes(saved)) {
        return saved as ThemeMode;
      }
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    if (propThemeMode && propThemeMode !== themeMode) {
      setThemeMode(propThemeMode);
    }
  }, [propThemeMode]);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveThemeMode(themeMode));
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

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

  const renderThemeIcon = (mode: ThemeMode, className: string = 'w-3.5 h-3.5') => {
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

  // 2. 공유 열람 문서 조회 검색 상태
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [viewerBookTitle, setViewerBookTitle] = useState('ISO 32000-2 표준 가이드북 및 엔터프라이즈 PDF 아카이빙 지침서');

  // 3. PG-USR-01 롤링 이벤트 배너 상태 & 마우스휠/드래그 인터랙션
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [bannerList, setBannerList] = useState<Array<{ id: number; title: string; subtitle: string; tag: string; bg: string; highlight: string }>>([
    {
      id: 1,
      title: 'PDFrend 2.0 정식 런칭',
      subtitle: '대용량 800쪽 스캔 PDF 듀얼 OCR 엔진 및 고속 가상화 주석 스튜디오',
      tag: 'NEW FEATURE',
      bg: 'from-sky-950/90 via-indigo-950/80 to-slate-950',
      highlight: '듀얼 OCR & Searchable PDF',
    },
    {
      id: 2,
      title: '오프라인 주석 & 지능형 3-Way diff 충돌 머지',
      subtitle: '네트워크 단절 시에도 로컬 큐에 안전 보존, 재연결 시 무손실 동기화',
      tag: 'OFFLINE SYNC',
      bg: 'from-indigo-950/90 via-purple-950/80 to-slate-950',
      highlight: '30일 오프라인 토큰',
    },
    {
      id: 3,
      title: '관리자 16대 운영관리 프로그램 개편',
      subtitle: '보안 통제부터 웹폰트, 단축키 및 도구그룹 커스텀 배포 지원',
      tag: 'ADMIN SUITE',
      bg: 'from-slate-900 via-sky-950/80 to-indigo-950/90',
      highlight: 'RBAC 권한 통제',
    },
  ]);

  const bannerContainerRef = useRef<HTMLDivElement>(null);
  const [isBannerDragging, setIsBannerDragging] = useState(false);
  const [bannerDragStartX, setBannerDragStartX] = useState(0);
  const [bannerDragDistance, setBannerDragDistance] = useState(0);
  const touchStartXRef = useRef(0);

  const handlePrevBanner = () => {
    if (bannerList.length <= 1) return;
    setCurrentBannerIdx((prev) => (prev === 0 ? bannerList.length - 1 : prev - 1));
  };

  const handleNextBanner = () => {
    if (bannerList.length <= 1) return;
    setCurrentBannerIdx((prev) => (prev === bannerList.length - 1 ? 0 : prev + 1));
  };

  // 마우스 휠 이벤트: 배너 영역 위에서 부모 스크롤 간섭 격리
  useEffect(() => {
    const el = bannerContainerRef.current;
    if (!el || bannerList.length <= 1) return;

    let wheelCooldown = false;
    const onBannerWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) > 10) {
        if (wheelCooldown) return;
        wheelCooldown = true;

        if (delta > 0) {
          handleNextBanner();
        } else {
          handlePrevBanner();
        }

        setTimeout(() => {
          wheelCooldown = false;
        }, 280);
      }
    };

    el.addEventListener('wheel', onBannerWheel, { passive: false, capture: true });
    return () => {
      el.removeEventListener('wheel', onBannerWheel, { capture: true });
    };
  }, [bannerList.length]);

  // 마우스 드래그 스와이프
  const handleBannerMouseDown = (e: React.MouseEvent) => {
    if (bannerList.length <= 1) return;
    setIsBannerDragging(true);
    setBannerDragStartX(e.clientX);
    setBannerDragDistance(0);
  };

  const handleBannerMouseMove = (e: React.MouseEvent) => {
    if (!isBannerDragging) return;
    const diff = e.clientX - bannerDragStartX;
    setBannerDragDistance(diff * 0.75);
  };

  const handleBannerMouseUp = () => {
    if (!isBannerDragging) return;
    setIsBannerDragging(false);
    if (bannerDragDistance > 35) {
      handlePrevBanner();
    } else if (bannerDragDistance < -35) {
      handleNextBanner();
    }
    setBannerDragDistance(0);
  };

  // 모바일 터치 스와이프
  const handleBannerTouchStart = (e: React.TouchEvent) => {
    if (bannerList.length <= 1) return;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleBannerTouchEnd = (e: React.TouchEvent) => {
    if (bannerList.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;
    if (diff > 35) {
      handlePrevBanner();
    } else if (diff < -35) {
      handleNextBanner();
    }
  };

  // 4. PG-USR-01 3대 탭 (공지사항 / 사용자 리뷰 / 단계별 이용 가이드) 상태
  const [activeInfoTab, setActiveInfoTab] = useState<'notice' | 'review' | 'guide'>('notice');

  // Quick Open Document Handler
  const handleOpenSampleDoc = (title: string) => {
    setViewerBookTitle(title);
    setIsViewerModalOpen(true);
  };

  // One-click Role Login Simulator Handler
  const handleLoginWithRole = (targetRole: UserSystemRole, displayName: string, email: string) => {
    setIsLoggedIn(true);
    setUserName(displayName);
    setLoginEmail(email);
    onSelectRole?.(targetRole);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    onSelectRole?.('ROLE_USER');
  };

  return (
    <div className="w-full flex flex-col space-y-6 pb-20 select-none animate-fadeIn">
      {/* =================================================================== */}
      {/* 1. 서비스 상단 인증 & 사용자 권한별 시스템 전환 바 */}
      {/* =================================================================== */}
      <div className={`relative z-50 border rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200 ${
        resolvedTheme === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/60'
          : resolvedTheme === 'dawn'
          ? 'bg-[#070e22]/95 border-[#1e3066] text-white shadow-sky-950/30'
          : 'bg-slate-900/90 border-slate-800 text-white shadow-indigo-950/20'
      }`}>
        {/* 서비스 타이틀 & 슬로건 */}
        <div className="flex items-center gap-3">
          <PdfrendLogo size={40} theme={resolvedTheme} />
          <div>
            <h1 className={`text-base font-bold flex items-center gap-2 ${
              resolvedTheme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
              <span>PDFrend</span>
            </h1>
          </div>
        </div>

        {/* 우측 로그인 상태 & 권한별 시스템 전환 인터페이스 */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {isLoggedIn ? (
            <>
              {/* 로그인 사용자 프로필 칩 */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-[11px]">
                  {userName.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-200 leading-tight">{userName} 님</span>
                  <span className="text-[10px] text-emerald-400 font-mono leading-tight">
                    {userRole === 'ROLE_USER' && '일반사용자 (서비스전용)'}
                    {userRole === 'ROLE_OPERATOR' && '서비스설정자 (설정권한)'}
                    {userRole === 'ROLE_ADMIN' && '마스터관리자 (전체권한)'}
                    {userRole === 'ROLE_SUPER_ADMIN' && '최고관리자 (전체권한)'}
                  </span>
                </div>
              </div>

              {/* [권한별 전환 버튼 1: 서비스설정 시스템] (ROLE_OPERATOR, ROLE_ADMIN, ROLE_SUPER_ADMIN 전용) */}
              {(userRole === 'ROLE_OPERATOR' || userRole === 'ROLE_ADMIN' || userRole === 'ROLE_SUPER_ADMIN') && (
                <button
                  id="btn-portal-goto-settings"
                  onClick={onNavigateToSettings}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/25 transition-all cursor-pointer active:scale-95"
                  title="서비스설정 시스템(25개 와이어프레임 & 시스템 설정 스튜디오)으로 전환"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>서비스설정 시스템</span>
                  <ArrowUpRight className="w-3 h-3 opacity-80" />
                </button>
              )}

              {/* [권한별 전환 버튼 2: 에이전트관리 마스터] (ROLE_ADMIN, ROLE_SUPER_ADMIN 전용) */}
              {(userRole === 'ROLE_ADMIN' || userRole === 'ROLE_SUPER_ADMIN') && (
                <button
                  id="btn-portal-goto-agent"
                  onClick={onNavigateToAgent}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-violet-600/25 transition-all cursor-pointer active:scale-95"
                  title="에이전트관리 마스터 시스템(작업그래프/토큰쿼터/지식원장)으로 전환"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>에이전트관리 (마스터)</span>
                  <ArrowUpRight className="w-3 h-3 opacity-80" />
                </button>
              )}

              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </>
          ) : (
            <>
              {/* 비로그인(게스트) 상태 로그인 버튼 */}
              <button
                id="btn-portal-open-login"
                onClick={() => {
                  setLoginTab('signin');
                  setShowLoginModal(true);
                }}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>로그인 / 권한선택</span>
              </button>
              <button
                onClick={() => {
                  setLoginTab('signup');
                  setShowLoginModal(true);
                }}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                회원가입
              </button>

              {/* [요청 5 반영] 테마 설정 버튼: 회원가입 뒤로 배치 */}
              <div className="relative z-50">
                <button
                  id="btn-portal-theme-toggle"
                  onClick={() => setIsThemeMenuOpen((prev) => !prev)}
                  onDoubleClick={cycleTheme}
                  className="min-h-[40px] h-10 flex items-center gap-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-slate-600 font-semibold text-xs transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
                  title={`테마 설정: ${THEME_MODES[themeMode].label} (현재) - 클릭 시 4모드 선택`}
                >
                  {renderThemeIcon(themeMode, 'w-3.5 h-3.5 shrink-0')}
                  <span>테마 ({THEME_MODES[themeMode].label})</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {isThemeMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-[100] text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1 text-[10px] text-slate-400 font-bold border-b border-slate-800 flex items-center justify-between">
                      <span>4모드 테마 선택</span>
                      <span className="font-mono text-indigo-400 text-[9px]">{resolvedTheme}</span>
                    </div>
                    {(Object.keys(THEME_MODES) as ThemeMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleSelectThemeMode(mode)}
                        className={`w-full min-h-[36px] text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
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
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. [서비스설정 > 사용자서비스 > 첫화면 (PG-USR-01) 전개 영역] */}
      {/* =================================================================== */}
      <div className="space-y-5 text-xs">
        {/* 2-1. 중앙 롤링 이벤트 및 프로모션 배너 슬라이더 */}
        <div className="space-y-2">
          {bannerList.length > 0 ? (
            <div className="space-y-2">
              {/* 스와이프 스크롤 트랙 컨테이너 */}
              <div
                ref={bannerContainerRef}
                onMouseDown={handleBannerMouseDown}
                onMouseMove={handleBannerMouseMove}
                onMouseUp={handleBannerMouseUp}
                onMouseLeave={handleBannerMouseUp}
                onTouchStart={handleBannerTouchStart}
                onTouchEnd={handleBannerTouchEnd}
                className="relative z-0 overflow-hidden rounded-2xl border border-slate-800/80 shadow-xl bg-slate-950 select-none cursor-grab active:cursor-grabbing overscroll-contain"
                style={{ overscrollBehavior: 'contain' }}
              >
                {/* 가로 슬라이딩 필름 트랙 */}
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{
                    transform: `translateX(calc(-${currentBannerIdx * 100}% + ${isBannerDragging ? bannerDragDistance : 0}px))`,
                  }}
                >
                  {bannerList.map((banner) => (
                    <div
                      key={banner.id}
                      className={`w-full shrink-0 min-w-full h-32 sm:h-36 p-5 sm:p-7 bg-gradient-to-r ${banner.bg} flex flex-col justify-center`}
                    >
                      <div className="flex items-center justify-between mb-1.5 pointer-events-none">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[10px] font-mono font-bold tracking-wider">
                            {banner.tag}
                          </span>
                          <span className="text-[11px] text-slate-400">PDFrend 공식 프로모션</span>
                        </div>
                        <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
                          🖱️ 마우스휠 이동 / ↔️ 스와이프
                        </span>
                      </div>

                      <div className="pointer-events-none">
                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                          {banner.title}
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 max-w-xl">
                          {banner.subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 미니멀 인디케이터 네비게이션 */}
              <div className="flex items-center justify-between px-2 pt-0.5">
                <span className="text-[11px] text-slate-500 font-mono">
                  {currentBannerIdx + 1} / {bannerList.length}
                </span>

                <div className="flex items-center gap-1.5 py-1">
                  {bannerList.map((banner, idx) => (
                    <button
                      key={banner.id}
                      type="button"
                      onClick={() => setCurrentBannerIdx(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentBannerIdx
                          ? 'w-6 bg-sky-400 shadow-sm shadow-sky-400/50'
                          : 'w-2 bg-slate-700 hover:bg-slate-500'
                      }`}
                      aria-label={`${idx + 1}번 배너로 이동`}
                      title={`${idx + 1}번 배너: ${banner.title}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevBanner}
                    className="w-6 h-6 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleNextBanner}
                    className="w-6 h-6 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-28 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center p-4 text-center">
              <span className="text-slate-400 font-medium text-xs flex items-center gap-1.5">
                <span>📢</span>
                <span>현재 진행 중인 공지 및 이벤트 배너가 없습니다.</span>
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                관리자 메뉴(PG-ADM-12 게시판·배너관리)에서 신규 배너를 발행하면 이곳에 자동으로 노출됩니다.
              </span>
              <button
                onClick={() =>
                  setBannerList([
                    {
                      id: 1,
                      title: 'pdfrend 2.0 정식 런칭',
                      subtitle: '대용량 스캔 PDF 듀얼 OCR 엔진 및 고속 주석 스튜디오',
                      tag: 'NEW FEATURE',
                      bg: 'from-sky-950/80 via-indigo-950/70 to-slate-900',
                      highlight: '듀얼 OCR & Searchable PDF',
                    },
                    {
                      id: 2,
                      title: '오프라인 주석 & 지능형 diff 충돌 머지',
                      subtitle: '네트워크 단절 시에도 로컬 큐에 안전 보존, 재연결 시 무손실 동기화',
                      tag: 'OFFLINE MODE',
                      bg: 'from-indigo-950/80 via-purple-950/70 to-slate-900',
                      highlight: '30일 오프라인 토큰',
                    },
                    {
                      id: 3,
                      title: '관리자 16대 운영관리 프로그램 개편',
                      subtitle: '보안 통제부터 웹폰트, 단축키 및 도구그룹 커스텀 배포 지원',
                      tag: 'ADMIN SUITE',
                      bg: 'from-slate-900 via-sky-950/70 to-indigo-950/80',
                      highlight: 'RBAC 권한 통제',
                    },
                  ])
                }
                className="mt-2 text-[11px] px-3 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-medium transition-all cursor-pointer"
              >
                + 기본 배너 다시 불러오기
              </button>
            </div>
          )}
        </div>

        {/* 2-3. 하단 서비스 정보 탭 (공지사항 / 사용자 리뷰 / 단계별 이용 가이드) */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl shadow-lg space-y-3">
          <div className="border-b border-slate-800 pb-2">
            <HorizontalSlideContainer showScrollButtons={false} className="w-full">
              <div className="flex gap-4 text-slate-400 font-medium whitespace-nowrap">
                <button
                  onClick={() => setActiveInfoTab('notice')}
                  className={`pb-1.5 min-h-[36px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeInfoTab === 'notice'
                      ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
                      : 'hover:text-slate-200'
                  }`}
                >
                  <Sparkle className="w-3.5 h-3.5" />
                  <span>공지사항</span>
                </button>
                <button
                  onClick={() => setActiveInfoTab('review')}
                  className={`pb-1.5 min-h-[36px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeInfoTab === 'review'
                      ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
                      : 'hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>사용자 리뷰</span>
                </button>
                <button
                  onClick={() => setActiveInfoTab('guide')}
                  className={`pb-1.5 min-h-[36px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeInfoTab === 'guide'
                      ? 'text-sky-400 border-b-2 border-sky-400 font-semibold'
                      : 'hover:text-slate-200'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>단계별 이용 가이드</span>
                </button>
              </div>
            </HorizontalSlideContainer>
          </div>

          {/* 탭 본문 내용 */}
          <div className="pt-1">
            {activeInfoTab === 'notice' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-400 font-bold">공지</span>
                    <span className="text-slate-300 font-medium">PDFrend 3대 도메인 및 오프라인 주석 동기화 v2.0 정식 런칭 안내</span>
                  </div>
                  <span className="text-slate-500 text-[11px] font-mono">2026-10-10</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">업데이트</span>
                    <span className="text-slate-300 font-medium">대용량 800쪽 가상화 뷰어 LRU 15페이지 메모리가드 v2.2 패치 배포 완료</span>
                  </div>
                  <span className="text-slate-500 text-[11px] font-mono">2026-10-08</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-bold">보안</span>
                    <span className="text-slate-300 font-medium">2FA 이메일/OTP 및 비-LLM 긴급 Push DR 무손실 인계 가동 중</span>
                  </div>
                  <span className="text-slate-500 text-[11px] font-mono">2026-10-05</span>
                </div>
              </div>
            )}

            {activeInfoTab === 'review' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 text-xs font-bold">★★★★★</span>
                    <span className="text-slate-500 text-[10px]">김*수 연구원</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    "800쪽 전공 서적을 렉 없이 매끄럽게 스크롤하며 주석을 달 수 있어 학술 연구 효율이 3배 늘었습니다."
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 text-xs font-bold">★★★★★</span>
                    <span className="text-slate-500 text-[10px]">이*진 변호사</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    "스캔 문서의 희미한 한글 텍스트도 듀얼 OCR로 완벽하게 인식되어 검색 가능한 Searchable PDF로 즉시 추출되었습니다."
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 text-xs font-bold">★★★★★</span>
                    <span className="text-slate-500 text-[10px]">박*현 엔지니어</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    "네트워크가 끊겨도 오프라인에서 주석을 작성하고 재연결 시 3-Way diff로 충돌 없이 자동 병합되어 감탄했습니다."
                  </p>
                </div>
              </div>
            )}

            {activeInfoTab === 'guide' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="text-sky-400 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">1</span>
                    <span>문서 번호 또는 파일 등록</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    공개 열람 번호(DOC-xxxx)를 입력하거나 상단에서 파일을 직접 등록하여 뷰어를 즉시 구동합니다.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="text-indigo-400 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">2</span>
                    <span>가상화 뷰어 & 주석 작성</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    단일줄 반응형 툴바로 펜, 형광펜, 사각형, 스탬프 등 3단계 인터랙션 주석을 자유롭게 생성합니다.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">3</span>
                    <span>Searchable PDF 다운로드</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    투명 텍스트 레이어가 결합된 원본 무손실 PDF를 오프라인/온라인 어디서든 영구 보존합니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* [요청 4, 6 반영] 2-4. 공유 열람 문서 조회 바 (하단 탭 6번 div 아래 배치) */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-slate-300 font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-sky-400">🔍</span>
              {/* [요청 4 반영] 타이틀: 공개열람문서조회 > 공유열람문서조회 */}
              <span className="whitespace-nowrap font-bold text-slate-200">공유 열람 문서 조회</span>
            </span>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 mt-1">
            <input
              type="text"
              value={searchDocQuery}
              onChange={(e) => setSearchDocQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleOpenSampleDoc(searchDocQuery || 'ISO 32000-2 표준 가이드북');
                }
              }}
              placeholder="공유받은 문서 고유번호(DOC-xxxx) 또는 공유 링크를 입력하세요..."
              className="flex-1 min-w-[220px] bg-slate-900 border border-slate-700/80 focus:border-sky-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none transition-colors"
            />
            <button
              id="btn-public-doc-open"
              onClick={() => handleOpenSampleDoc(searchDocQuery || 'ISO 32000-2 표준 가이드북')}
              className="whitespace-nowrap w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-md shadow-indigo-600/20 active:scale-95 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="whitespace-nowrap font-semibold">열람하기</span>
              <span>➔</span>
            </button>
          </div>
        </div>

        {/* 2-5. 서비스 하단 정보 푸터 */}
        <div className="pt-4 pb-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>© 2026 PDFrend. All rights reserved.</span>
            <span className="hidden sm:inline">|</span>
            <span className="hover:text-slate-400 cursor-pointer">이용약관</span>
            <span className="hover:text-slate-400 cursor-pointer">개인정보처리방침</span>
          </div>
          <div className="flex items-center gap-2">
            <span>시스템 관리자: {systemAdminEmail}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
              Zero-Loss AI Architecture
            </span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. 로그인 및 사용자 권한 선택 모달 (인증 시뮬레이션) */}
      {/* =================================================================== */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5 text-slate-100 relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mx-auto flex items-center justify-center mb-2">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white">
                {loginTab === 'signin' ? 'PDFrend 서비스 로그인' : '서비스 회원가입'}
              </h2>
              <p className="text-xs text-slate-400">
                로그인하신 계정의 권한에 따라 시스템 접근 권한이 자동 부여됩니다.
              </p>
            </div>

            {/* 빠른 권한 시뮬레이션 원클릭 로그인 섹션 */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">
                ⚡ 빠른 권한 선택 로그인 (시뮬레이터):
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleLoginWithRole('ROLE_USER', '홍길동', 'user@purepdfrend.io')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between group transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                      일
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                        일반사용자 (ROLE_USER)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        PDF 비즈니스 서비스 전용 (문서 열람 및 주석)
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 opacity-0 group-hover:opacity-100 font-bold transition-opacity">
                    선택 ➔
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoginWithRole('ROLE_OPERATOR', '운영자(김설정)', 'operator@purepdfrend.io')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between group transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold">
                      설
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-sky-300">
                        서비스설정자 (ROLE_OPERATOR)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        '서비스설정 시스템(와이어프레임 & 설정)' 전환 활성화
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-sky-400 opacity-0 group-hover:opacity-100 font-bold transition-opacity">
                    선택 ➔
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoginWithRole('ROLE_ADMIN', '마스터(이관리)', 'admin@purepdfrend.io')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between group transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold">
                      마
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-violet-300">
                        마스터관리자 (ROLE_ADMIN)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        '서비스설정' 및 '에이전트관리(마스터)' 전체 전환 활성화
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-violet-400 opacity-0 group-hover:opacity-100 font-bold transition-opacity">
                    선택 ➔
                  </span>
                </button>
              </div>
            </div>

            {/* 표준 아이디/비밀번호 입력 폼 */}
            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">이메일 계정</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">비밀번호</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleLoginWithRole(userRole, userName, loginEmail)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95"
              >
                로그인 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. 800쪽 대용량 가상화 뷰어 팝업 모달 (공개 문서 열람) */}
      {/* =================================================================== */}
      {isViewerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* 뷰어 상단 바 */}
            <div className="h-12 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-xs text-white truncate max-w-md">
                  {viewerBookTitle}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                  800P 가상화 모드
                </span>
              </div>
              <button
                onClick={() => setIsViewerModalOpen(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>닫기</span>
              </button>
            </div>

            {/* 실제 대용량 가상화 뷰어 스튜디오 구동 */}
            <div className="flex-1 overflow-hidden relative">
              <VirtualViewerStudio />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
