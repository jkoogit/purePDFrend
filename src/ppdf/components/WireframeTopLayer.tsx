import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  ShieldCheck,
  Settings,
  LogOut,
  Key,
  Shield,
  Clock,
  Star,
  MailCheck,
  RefreshCw,
} from 'lucide-react';

export interface WireframeTopLayerProps {
  currentProgramId: string;
  isLoggedIn?: boolean;
  userAvatar?: string;
  userAccount?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  joinedDate?: string;
  isTwoFactorEnabled?: boolean;
  isMobileMode?: boolean;
  onNavigate?: (programId: string) => void;
  onAgentServiceClick?: () => void;
  onAdminServiceClick?: () => void;
  className?: string;
}

export function WireframeTopLayer({
  currentProgramId,
  isLoggedIn: initialLoggedIn,
  userAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  userAccount = 'jkok2j2m',
  userName = '정진국',
  userEmail = 'jkok2j2m@gmail.com',
  userRole = '시스템관리자',
  joinedDate = '2024.03.15 (Pro 플랜)',
  isTwoFactorEnabled = true,
  isMobileMode = false,
  onNavigate,
  onAgentServiceClick,
  onAdminServiceClick,
  className = '',
}: WireframeTopLayerProps) {
  // 로그인 상태 토글 (와이어프레임 시뮬레이션용: PG-USR-01은 기본 비로그인, 그 외는 기본 로그인)
  const isDefaultLoggedIn = initialLoggedIn !== undefined ? initialLoggedIn : currentProgramId !== 'PG-USR-01' && currentProgramId !== 'PG-USR-02';
  const [isLoggedIn, setIsLoggedIn] = useState(isDefaultLoggedIn);
  const [isPinned, setIsPinned] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [docTab, setDocTab] = useState<'recent' | 'favorites'>('recent');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const docScrollRef = useRef<HTMLDivElement>(null);

  // 최근 읽은 문서 (최대 4권: 긴 문서명 가로 슬라이드 및 총/열람페이지 동시 표시)
  const recentDocs = [
    { id: 'd1', title: 'ISO 32000-2:2020 문서 관리 및 차세대 PDF 2.0 전자서명 표준 규격 가이드북', totalPages: 840, readPages: 655, progress: '78%', date: '10분 전', tag: '표준문서' },
    { id: 'd2', title: 'OCR 듀얼엔진 성능비교 및 Tesseract vs Gemini 분당 처리율 심층 분석 보고서', totalPages: 42, readPages: 42, progress: '100%', date: '2시간 전', tag: '기술보고' },
    { id: 'd3', title: 'purePDFrend 엔터프라이즈 보안아키텍처 및 로컬 샌드박스 격리 명세서_v1.2', totalPages: 68, readPages: 24, progress: '35%', date: '어제', tag: '보안' },
    { id: 'd4', title: 'Gemini Vision 프롬프트 가이드 및 지능형 멀티모달 도큐먼트 파싱 핸드북', totalPages: 29, readPages: 4, progress: '15%', date: '3일 전', tag: 'AI가이드' },
  ];

  // 즐겨찾기한 문서 (최대 4권: 긴 문서명 가로 슬라이드 및 총/열람페이지 동시 표시)
  const favoriteDocs = [
    { id: 'f1', title: '표준 용역계약서 및 전자상거래 이용약관 (사내 법무팀 검토완료 최종본)', totalPages: 18, readPages: 18, progress: '완독', date: '★ 중요', tag: '법무' },
    { id: 'f2', title: '전자출원 특허기술 명세서: 분산 PDF 가상화 렌더링 및 하이브리드 OCR 특허출원', totalPages: 54, readPages: 36, progress: '67%', date: '★ 핵심', tag: '특허' },
    { id: 'f3', title: '2026 순수 PDF 렌더링 명세 및 브라우저 오프라인 WASM 파이프라인 설계서', totalPages: 120, readPages: 120, progress: '필독', date: '★ 개발', tag: '아키텍처' },
    { id: 'f4', title: '연간 재무 감사보고서 원본 및 회계법인 외부 감사 의견서 (대외비)', totalPages: 230, readPages: 230, progress: '완독', date: '★ 재무', tag: '경영' },
  ];

  // [요청 3 반영] 클라우드 통합 표시 및 캐시 로딩 상태
  const [selectedCloudFilter, setSelectedCloudFilter] = useState<'all' | 'gdrive' | 'dropbox' | 'onedrive' | 's3'>('all');
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [cloudLoadingProgress, setCloudLoadingProgress] = useState(100);
  const [cloudCacheTime, setCloudCacheTime] = useState('3분 전 (캐시 유효)');

  const connectedClouds = [
    {
      id: 'gdrive' as const,
      name: 'Google Drive',
      icon: '📁',
      usedGB: 1.4,
      totalGB: 5.0,
      resourceFolder: '/MyDrive/purePDFrend_Resources/',
      status: '연결됨',
    },
    {
      id: 'dropbox' as const,
      name: 'Dropbox',
      icon: '📦',
      usedGB: 0.62,
      totalGB: 2.0,
      resourceFolder: '/Dropbox/Apps/purePDFrend/',
      status: '연결됨',
    },
    {
      id: 'onedrive' as const,
      name: 'OneDrive',
      icon: '☁️',
      usedGB: 3.8,
      totalGB: 15.0,
      resourceFolder: '/OneDrive/문서/purePDFrend_Lib/',
      status: '연결됨',
    },
    {
      id: 's3' as const,
      name: 'AWS S3',
      icon: '🪣',
      usedGB: 12.4,
      totalGB: 100.0,
      resourceFolder: 's3://purepdf-archive-bucket/prod/',
      status: '아카이브',
    },
  ];

  // 연결된 스토리지 총 계획량 및 사용량 통합 계산
  const totalPlannedGB = connectedClouds.reduce((acc, c) => acc + c.totalGB, 0); // 122.0 GB
  const totalUsedGB = parseFloat(connectedClouds.reduce((acc, c) => acc + c.usedGB, 0).toFixed(1)); // 18.2 GB
  const totalUsagePercent = Math.round((totalUsedGB / totalPlannedGB) * 100); // 15%

  // 레이어 뜰 때 로딩바 표시 후 캐시값 표시 (조회 시뮬레이션)
  const triggerCloudCacheRefresh = () => {
    setIsCloudLoading(true);
    setCloudLoadingProgress(20);
    setTimeout(() => setCloudLoadingProgress(65), 180);
    setTimeout(() => setCloudLoadingProgress(100), 380);
    setTimeout(() => {
      setIsCloudLoading(false);
      setCloudCacheTime('방금 갱신됨 (5분 캐시)');
    }, 550);
  };

  useEffect(() => {
    if (isProfileMenuOpen) {
      triggerCloudCacheRefresh();
    }
  }, [isProfileMenuOpen]);

  // 퀵설정 항목 및 위치편집 상태
  const [quickSettings, setQuickSettings] = useState([
    { id: 'theme', label: '테마', icon: '🌓', desc: '다크/라이트 전환' },
    { id: 'ocr', label: 'OCR', icon: '🔤', desc: 'Gemini ↔ Tesseract' },
    { id: 'virtual', label: '가상화', icon: '⚡', desc: '초고속 대용량 렌더링' },
    { id: 'keys', label: '단축키', icon: '⌨️', desc: '키보드 매핑 힌트' },
    { id: 'save', label: '자동저장', icon: '💾', desc: '3초 주기 로컬저장' },
    { id: 'mask', label: '마스킹', icon: '🛡️', desc: '개인정보 자동 비식별화' },
    { id: 'dpi', label: 'DPI', icon: '📐', desc: '150/300 DPI 가변 렌더' },
  ]);

  // [요청 3 반영] 퀵설정 길게 누르기 드래그 & 가이드바 기준 위치 이동 상태
  const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
  const [isItemFloating, setIsItemFloating] = useState(false);
  const [qsNotice, setQsNotice] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const quickSettingsTrackRef = useRef<HTMLDivElement>(null);
  const pointerStartPosRef = useRef({ x: 0, y: 0 });
  const isPointerDownRef = useRef(false);

  const handleItemPressStart = (idx: number, e: React.PointerEvent) => {
    isPointerDownRef.current = true;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      if (isPointerDownRef.current) {
        setDraggedItemIdx(idx);
        setIsItemFloating(true);
        setDropTargetIdx(idx);
      }
    }, 280);
  };

  const handleTrackPointerMove = (e: React.PointerEvent) => {
    if (!isItemFloating) {
      const dist = Math.hypot(e.clientX - pointerStartPosRef.current.x, e.clientY - pointerStartPosRef.current.y);
      if (dist > 8 && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      return;
    }

    if (quickSettingsTrackRef.current) {
      const children = Array.from(quickSettingsTrackRef.current.querySelectorAll('[data-qs-idx]')) as HTMLElement[];
      let target = children.length;
      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        if (e.clientX < midX) {
          target = i;
          break;
        }
      }
      setDropTargetIdx(target);
    }
  };

  const handleItemPressEnd = (clickedIdx?: number) => {
    isPointerDownRef.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isItemFloating && draggedItemIdx !== null && dropTargetIdx !== null) {
      if (draggedItemIdx !== dropTargetIdx && dropTargetIdx !== draggedItemIdx + 1) {
        const updated = [...quickSettings];
        const [moved] = updated.splice(draggedItemIdx, 1);
        const insertAt = dropTargetIdx > draggedItemIdx ? dropTargetIdx - 1 : dropTargetIdx;
        updated.splice(insertAt, 0, moved);
        setQuickSettings(updated);
        setQsNotice(`⚡ [${moved.label}] 이동 완료`);
        setTimeout(() => setQsNotice(null), 1500);
      }
      setIsItemFloating(false);
      setDraggedItemIdx(null);
      setDropTargetIdx(null);
      return;
    }

    if (!isItemFloating && clickedIdx !== undefined) {
      const item = quickSettings[clickedIdx];
      alert(`⚡ 퀵설정 [${item.label}]: ${item.desc}\n(아이콘을 0.3초 길게 누르면 원하는 위치로 드래그 이동할 수 있습니다)`);
    }

    setIsItemFloating(false);
    setDraggedItemIdx(null);
    setDropTargetIdx(null);
  };

  // [요청 1 반영] '슬라이드클릭드래그휠' 공통 휠 스크롤 및 이벤트 전파 방지 핸들러
  const handleDocWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (docScrollRef.current) {
      docScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // 권한 확인 (관리자 권한 보유 여부)
  const hasAdminPrivilege = userRole.includes('관리자') || userRole.includes('ADMIN') || userAccount === 'jkok2j2m';

  // 외부 클릭 시 프로필/설정 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  // 전체화면 토글
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <header
      className={`relative p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg select-none transition-all ${
        isPinned ? 'sticky top-2 z-40 ring-1 ring-sky-500/40 backdrop-blur-md bg-slate-950/95' : ''
      } ${className}`}
    >
      {/* 1. 좌측 로고 & 브랜드 영역 (심플 기하학 조형 + 강렬한 네온 컬러) */}
      <div
        onClick={() => onNavigate && onNavigate('PG-USR-01')}
        className="flex items-center gap-3 shrink-0 whitespace-nowrap cursor-pointer group"
        title="첫화면(PG-USR-01)으로 이동"
      >
        {/* 모던 심볼 (Geometric Vibrant Folded Symbol) */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-sky-400 p-[1.5px] shadow-lg shadow-rose-600/30 flex items-center justify-center group-hover:scale-105 transition-transform">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-sky-400 text-xs font-mono tracking-tighter">
              PDF
            </span>
          </div>
        </div>

        {/* 브랜드명 타이포그래피 */}
        <div className="whitespace-nowrap">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-black text-white text-base tracking-tight font-sans">
              pure<span className="text-amber-400">PDF</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold border border-rose-500/30">
              rend
            </span>
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:inline-block leading-tight mt-0.5 whitespace-nowrap">
            Dual OCR & Smart Studio
          </span>
        </div>
      </div>

      {/* 2. 우측 컨트롤 & 사용자 프로필 영역 (탑레이어에는 프로필 아이콘만 표시) */}
      <div className="flex items-center gap-2 flex-wrap flex-1 sm:flex-initial justify-end whitespace-nowrap min-w-fit">
        {/* 모바일 모드 시 스크롤 고정핀 & 전체화면 모드 아이콘 표시 */}
        {isMobileMode && (
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`p-1.5 rounded-md transition-all ${
                isPinned
                  ? 'bg-sky-500/20 text-sky-400 shadow-sm ring-1 ring-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={isPinned ? '상단 고정핀 해제' : '상단 스크롤 고정핀 고정'}
              aria-label="스크롤 고정핀 토글"
            >
              <svg className="w-4 h-4 fill-none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className={`p-1.5 rounded-md transition-all ${
                isFullscreen
                  ? 'bg-amber-500/20 text-amber-400 shadow-sm ring-1 ring-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={isFullscreen ? '전체화면 종료' : '전체화면 모드 진입'}
              aria-label="전체화면 모드 토글"
            >
              <svg className="w-4 h-4 fill-none" viewBox="0 0 24 24" stroke="currentColor">
                {isFullscreen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 9L4 4m0 0l5 0m-5 0l0 5m6 6l5 5m0 0l-5 0m5 0l0-5"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                )}
              </svg>
            </button>
          </div>
        )}

        {/* 로그인 상태 여부에 따른 동적 분기 */}
        {isLoggedIn ? (
          /* 로그인 한 상태: 뷰어 아이콘(원복) + 프로필 아이콘만 표시 */
          <div className="flex items-center gap-2">
            {/* [요청 2 반영] 뷰어 아이콘 이전 형태로 완벽 복구 */}
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('PG-USR-06')}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-800 text-xs flex items-center gap-1.5 transition-all shadow-xs"
              title="문서 뷰어로 바로가기"
            >
              <span>📖</span>
              <span className="hidden md:inline font-medium text-[11px]">뷰어 열기</span>
            </button>

            {/* [요청 3 반영] 탑레이어에는 계정/권한 텍스트 없이 프로필 아이콘만 표시 */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={`relative rounded-full p-0.5 transition-all cursor-pointer focus:outline-hidden ${
                  isProfileMenuOpen
                    ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950 scale-105'
                    : 'hover:ring-2 hover:ring-sky-500/70 hover:scale-105'
                }`}
                title="프로필 및 계정 레이어 열기"
                aria-label="사용자 프로필 레이어"
              >
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700 shadow-sm"
                />
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950"
                  title="실시간 접속 상태: 온라인 (Active)"
                />
              </button>

              {/* [요청 1, 2, 4 반영] 프로필레이어 정밀 구성 (모바일 모드 시 화면 너비 초과 및 좌측 잘림 원천 방어) */}
              {isProfileMenuOpen && (
                <div
                  className={`absolute right-[-6px] sm:right-0 mt-2.5 bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden text-xs ${
                    isMobileMode
                      ? 'w-[290px] xs:w-[305px] max-w-[calc(100vw-28px)]'
                      : 'w-[295px] xs:w-[315px] sm:w-[335px] max-w-[calc(100vw-28px)]'
                  }`}
                >
                  {/* 상단 1: 이미지, 계정, 이름, 권한, [요청 1 반영: 아이콘만 표시한 추가 인증 배지 및 균형 여백] */}
                  <div className="p-4 bg-gradient-to-b from-slate-800/80 to-slate-900/60 border-b border-slate-800 flex items-start gap-3.5">
                    <div className="relative shrink-0">
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-13 h-13 rounded-2xl object-cover ring-2 ring-sky-500/50 shadow-md"
                      />
                      <span
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 flex items-center justify-center text-[8px] text-slate-950 font-bold"
                        title="본인 인증 및 보안 계정 검증 완료 (Verified Account)"
                      >
                        ✓
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-white text-sm truncate">{userName}</span>
                          <span className="text-[11px] text-slate-400 font-mono font-medium">@{userAccount}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                          {userRole}
                        </span>
                      </div>

                      {/* [요청 1 반영] 텍스트 배제, 인증 언급 아이콘으로 인증된 모든 항목 표시 + 균형 여백 */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {/* 1. Google 소셜 인증 */}
                        <span
                          className="p-1 rounded-md bg-sky-950/80 border border-sky-800/70 text-sky-400 hover:text-white transition-colors cursor-help shadow-xs"
                          title="Google 소셜 OAuth 계정 인증 완료 (jkok2j2m@gmail.com)"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
                          </svg>
                        </span>

                        {/* 2. GitHub 개발자 인증 */}
                        <span
                          className="p-1 rounded-md bg-slate-950/80 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-help shadow-xs"
                          title="GitHub 워크스페이스 및 Git Data API 인증 완료"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                          </svg>
                        </span>

                        {/* 3. 2FA 보안 인증 */}
                        <span
                          className="p-1 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 hover:text-white transition-colors cursor-help shadow-xs"
                          title="2단계 인증 (2FA OTP) 보안 적용됨"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </span>

                        {/* 4. 이메일 검증 마크 */}
                        <span
                          className="p-1 rounded-md bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 hover:text-white transition-colors cursor-help shadow-xs"
                          title="공식 이메일 인증 완료 (소유권 검증)"
                        >
                          <MailCheck className="w-3.5 h-3.5" />
                        </span>

                        {/* 5. 루트 보안 토큰 (.env) 인증 */}
                        <span
                          className="p-1 rounded-md bg-amber-950/80 border border-amber-800/80 text-amber-400 hover:text-white transition-colors cursor-help shadow-xs"
                          title="시스템 관리자 루트 토큰 보안 인증 완료"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* [요청 3 반영] 클라우드 단일 줄 슬라이드 휠스크롤 버튼 바 + 심플 현황 표시 */}
                  <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800/80 space-y-2 text-[10px]">
                    {/* 상단: 통합/개별 클라우드 휠스크롤 가로 버튼 바 & 스토리지 관리 링크 */}
                    <div className="flex items-center justify-between gap-1">
                      {/* 가로 휠스크롤 버튼 열거 컨테이너 */}
                      <div
                        className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] select-none flex-1 min-w-0"
                        onWheel={(e) => {
                          e.stopPropagation();
                          e.currentTarget.scrollLeft += e.deltaY;
                        }}
                      >
                        {/* 1. 전체 통합 버튼 */}
                        <button
                          type="button"
                          onClick={() => setSelectedCloudFilter('all')}
                          className={`px-2 py-0.5 rounded-md font-semibold text-[9px] flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                            selectedCloudFilter === 'all'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                          title="전체 연결 스토리지 통합 합산 현황"
                        >
                          <span>⚡</span>
                          <span>전체 ({totalPlannedGB}G)</span>
                        </button>

                        {/* 2. 개별 클라우드 버튼 열거 */}
                        {connectedClouds.map((cloud) => (
                          <button
                            key={cloud.id}
                            type="button"
                            onClick={() => setSelectedCloudFilter(cloud.id)}
                            className={`px-1.5 py-0.5 rounded-md font-semibold text-[9px] flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                              selectedCloudFilter === cloud.id
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                            }`}
                            title={`${cloud.name} (${cloud.status}): ${cloud.totalGB}GB 지정`}
                          >
                            <span>{cloud.icon}</span>
                            <span>{cloud.name.split(' ')[0]}</span>
                            <span className="text-slate-500">{cloud.totalGB}G</span>
                          </button>
                        ))}

                        {/* 3. 추가 연동 버튼 */}
                        <button
                          type="button"
                          onClick={() => alert('🔗 신규 클라우드 스토리지 (Box, WebDAV, Nextcloud) 연동 창을 엽니다.')}
                          className="px-1.5 py-0.5 rounded text-[8px] text-slate-500 hover:text-slate-300 border border-dashed border-slate-800 hover:border-slate-700 shrink-0 cursor-pointer"
                          title="클라우드 스토리지 추가 연동"
                        >
                          +연결
                        </button>
                      </div>

                      {/* [요청 4 반영] 우측 스토리지 관리 바로가기: 링크 텍스트가 아닌 버튼으로 인식되도록 표현 */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (onNavigate) onNavigate('PG-USR-09');
                        }}
                        className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-sky-600 active:bg-sky-700 text-sky-300 hover:text-white border border-slate-700 hover:border-sky-500 font-semibold text-[9px] flex items-center gap-1 shrink-0 transition-all shadow-xs cursor-pointer"
                        title="정밀 환경설정 > 클라우드 스토리지 관리 화면으로 이동"
                      >
                        <span>스토리지 관리</span>
                        <span className="text-[8px]">➔</span>
                      </button>
                    </div>

                    {/* 선택된 필터에 따른 심플 현황 표시 */}
                    {isCloudLoading ? (
                      <div className="space-y-1 py-1">
                        <div className="flex items-center justify-between text-slate-400 text-[9px]">
                          <span className="text-sky-400 font-mono animate-pulse flex items-center gap-1">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            <span>스토리지 가용량 실시간 집계중...</span>
                          </span>
                          <span className="font-mono text-slate-500">{cloudLoadingProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-200"
                            style={{ width: `${cloudLoadingProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : selectedCloudFilter === 'all' ? (
                      /* 전체 통합 심플 현황 */
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-slate-400 flex-wrap gap-1">
                          <span className="flex items-center gap-1 text-slate-300 text-[10px]">
                            <span className="text-slate-400 font-medium">통합 사용량:</span>
                            <span className="font-mono text-slate-200 font-bold">
                              {totalUsedGB}GB / {totalPlannedGB}GB
                            </span>
                            <span className="font-mono text-sky-400 font-bold text-[9px]">({totalUsagePercent}%)</span>
                          </span>
                          <button
                            type="button"
                            onClick={triggerCloudCacheRefresh}
                            className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-slate-300 font-mono transition-colors cursor-pointer"
                            title="스토리지 용량 즉시 다시 조회"
                          >
                            <span>{cloudCacheTime}</span>
                            <RefreshCw className="w-2.5 h-2.5 hover:rotate-180 transition-transform" />
                          </button>
                        </div>
                        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              totalUsagePercent > 80 ? 'bg-rose-500' : totalUsagePercent > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.max(totalUsagePercent, 4)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[8px] text-slate-500 pt-0.5 flex-wrap gap-1">
                          <span className="truncate">※ 4개 연결 스토리지 합산 참고치 (계획 지정량)</span>
                          <span className="font-mono text-emerald-400 font-medium shrink-0 ml-auto">
                            오늘 OCR: 42/50회
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* 개별 클라우드 선택 현황 */
                      (() => {
                        const targetCloud = connectedClouds.find((c) => c.id === selectedCloudFilter) || connectedClouds[0];
                        const usagePct = Math.round((targetCloud.usedGB / targetCloud.totalGB) * 100);
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-slate-400 flex-wrap gap-1">
                              <span className="flex items-center gap-1 text-slate-300 text-[10px]">
                                <span className="text-sky-400 font-semibold">{targetCloud.name}:</span>
                                <span className="font-mono text-slate-200 font-bold">
                                  {targetCloud.usedGB}GB / {targetCloud.totalGB}GB
                                </span>
                                <span className="font-mono text-sky-400 font-bold text-[9px]">({usagePct}%)</span>
                              </span>
                              <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                                {targetCloud.status}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  usagePct > 80 ? 'bg-rose-500' : usagePct > 50 ? 'bg-amber-400' : 'bg-sky-400'
                                }`}
                                style={{ width: `${Math.max(usagePct, 4)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[8px] text-slate-500 pt-0.5 flex-wrap gap-1">
                              <span className="truncate font-mono" title={`리소스 폴더: ${targetCloud.resourceFolder}`}>
                                📁 {targetCloud.resourceFolder}
                              </span>
                              <span className="font-mono text-slate-400 shrink-0 ml-auto">
                                전용 리소스 폴더
                              </span>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* 중단 2: 이메일, 가입정보 */}
                  <div className="px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">이메일</span>
                      <span className="font-mono text-slate-200 truncate max-w-[200px]">{userEmail}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">가입정보</span>
                      <span className="font-mono text-slate-300">{joinedDate}</span>
                    </div>
                  </div>

                  {/* [요청 2, 4, 5 반영] 최근읽은 문서 vs 즐겨찾기한 문서 4권 슬라이더 (문서명 슬라이드와 카드 뷰어 이동 이벤트 분리) */}
                  <div className="p-3 bg-slate-900/95 border-b border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setDocTab('recent')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition-all flex items-center gap-1 ${
                            docTab === 'recent'
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>최근 열람 ({recentDocs.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocTab('favorites')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition-all flex items-center gap-1 ${
                            docTab === 'favorites'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Star className="w-3 h-3" />
                          <span>즐겨찾기 ({favoriteDocs.length})</span>
                        </button>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">휠 스크롤 ↔</span>
                    </div>

                    {/* 가로 슬라이더 컨테이너: 휠 이벤트 연동 */}
                    <div
                      ref={docScrollRef}
                      onWheel={handleDocWheel}
                      className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] snap-x"
                    >
                      {(docTab === 'recent' ? recentDocs : favoriteDocs).map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            if (onNavigate) onNavigate('PG-USR-06');
                          }}
                          className="w-52 shrink-0 snap-start p-2.5 bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800/90 hover:border-sky-500/50 rounded-xl transition-all cursor-pointer group flex flex-col justify-between shadow-xs select-none"
                          title="클릭하여 뷰어(PG-USR-06)로 열기"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
                              <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono font-medium">
                                {doc.tag}
                              </span>
                              <span className="font-mono text-slate-500">{doc.date}</span>
                            </div>

                            {/* [요청 4, 5 반영] 문서명 영역만 가로 슬라이드 이벤트 적용 (클릭 이벤트 전파 차단) */}
                            <div
                              className="overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] py-0.5 cursor-ew-resize select-none"
                              onClick={(e) => {
                                // 슬라이드/드래그 시 카드 전체 뷰어 상세이동 이벤트와 겹치지 않도록 차단
                                e.stopPropagation();
                              }}
                              onWheel={(e) => {
                                e.stopPropagation();
                                e.currentTarget.scrollLeft += e.deltaY;
                              }}
                              title={`${doc.title} (마우스 휠/드래그로 긴 문서명 슬라이드)`}
                            >
                              <div className="font-semibold text-slate-200 group-hover:text-sky-300 text-[11px] whitespace-nowrap leading-tight transition-colors">
                                {doc.title}
                              </div>
                            </div>
                          </div>
                          {/* [요청 2, 4 반영] 총페이지 / 열람페이지 동시 표시 + 뷰어 열기 직결 안내 */}
                          <div className="mt-2 pt-1 border-t border-slate-900 flex items-center justify-between text-[10px]">
                            <span className="font-mono text-slate-300">
                              <strong className="text-sky-400 font-semibold">{doc.readPages}</strong> / {doc.totalPages}쪽
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20 text-[9px]">
                                {doc.progress}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-sky-950/80 group-hover:bg-sky-600 text-sky-400 group-hover:text-white border border-sky-800/80 group-hover:border-sky-400 text-[9px] font-bold flex items-center gap-1 transition-all shadow-xs shrink-0 cursor-pointer">
                                <span>열기</span>
                                <span className="text-[8px]">➔</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* [요청 4 반영] 중단 3: 비번변경, 2차인증 - 글꼴(font-sans)과 높이(h-6)를 통일하여 뭉개짐 없이 명확한 버튼 형태로 표현 */}
                  <div className="p-2 bg-slate-900 space-y-1 border-b border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (onNavigate) onNavigate('PG-USR-04');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-800/90 text-slate-300 hover:text-white transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span className="font-medium text-[11px]">비밀번호 변경</span>
                      </div>
                      <span className="h-6 px-2.5 rounded-lg bg-slate-800 group-hover:bg-sky-600 text-sky-400 group-hover:text-white border border-slate-700/80 group-hover:border-sky-400 text-[10px] font-sans font-semibold flex items-center gap-1 transition-all shadow-xs shrink-0">
                        <span>설정 바로가기</span>
                        <span className="text-[9px]">➔</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (onNavigate) onNavigate('PG-USR-04');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-800/90 text-slate-300 hover:text-white transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="font-medium text-[11px]">2차인증 (2FA OTP)</span>
                      </div>
                      <span className={`h-6 px-2.5 rounded-lg text-[10px] font-sans font-semibold flex items-center gap-1 border shadow-xs transition-all shrink-0 ${
                        isTwoFactorEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 group-hover:bg-emerald-600 group-hover:text-white'
                          : 'bg-slate-800 text-slate-400 border-slate-700 group-hover:bg-slate-700 group-hover:text-white'
                      }`}>
                        <span>{isTwoFactorEnabled ? '인증 활성화됨' : '미설정'}</span>
                        <span className="text-[9px]">➔</span>
                      </span>
                    </button>
                  </div>

                  {/* [요청 반영] 50:50 분할 취소 -> 고정아이콘 영역 넓이 우선 확보 + 구분자(|) 기준 좌우 넉넉한 여백 확보 */}
                  <div className="relative p-2.5 bg-slate-950 flex items-center justify-between border-t border-slate-800/80">
                    {/* 위치 변경 피드백 뱃지 */}
                    {qsNotice && (
                      <div className="absolute -top-3 left-3 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[9px] font-mono shadow-md z-40 animate-in fade-in">
                        {qsNotice}
                      </div>
                    )}

                    {/* 좌측: 유연한 가변 너비의 퀵설정 영역 (슬라이드클릭드래그휠 지원) */}
                    <div className="flex-1 min-w-0 flex items-center overflow-hidden">
                      {/* 퀵설정 가로 슬라이더: 버튼 없이 길게 눌러 띄우고 가이드바 기준으로 드래그 드롭 */}
                      <div
                        ref={quickSettingsTrackRef}
                        onPointerMove={handleTrackPointerMove}
                        onPointerUp={() => handleItemPressEnd()}
                        onPointerLeave={() => {
                          if (isItemFloating) handleItemPressEnd();
                        }}
                        onWheel={(e) => {
                          e.stopPropagation();
                          e.currentTarget.scrollLeft += e.deltaY;
                        }}
                        className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] select-none touch-none w-full"
                      >
                        {quickSettings.map((item, idx) => {
                          const isFloating = isItemFloating && draggedItemIdx === idx;
                          const showGuide = isItemFloating && dropTargetIdx === idx;
                          return (
                            <div key={item.id} className="flex items-center shrink-0">
                              {/* [요청 3 반영] 가이드바: 원하는 위치를 시각적으로 확인하는 삽입 기준선 */}
                              {showGuide && (
                                <div
                                  className="w-1 h-7 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.9)] ring-2 ring-amber-300/60 animate-pulse shrink-0 mx-0.5"
                                  title="여기에 놓기"
                                />
                              )}

                              <div
                                data-qs-idx={idx}
                                onPointerDown={(e) => handleItemPressStart(idx, e)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isItemFloating) handleItemPressEnd(idx);
                                }}
                                className={`relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer select-none ${
                                  isFloating
                                    ? 'scale-110 -translate-y-2 ring-2 ring-amber-400 bg-amber-900/90 border-amber-400 shadow-xl shadow-amber-500/40 z-30 cursor-grabbing opacity-95'
                                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600 hover:scale-105 active:scale-95'
                                }`}
                                title={`${item.label}: ${item.desc} (길게 눌러 드래그로 위치 변경)`}
                              >
                                <span className="text-sm sm:text-base leading-none">{item.icon}</span>
                              </div>
                            </div>
                          );
                        })}

                        {/* 맨 끝 위치 가이드바 */}
                        {isItemFloating && dropTargetIdx === quickSettings.length && (
                          <div
                            className="w-1 h-7 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.9)] ring-2 ring-amber-300/60 animate-pulse shrink-0 mx-0.5"
                            title="맨 끝에 놓기"
                          />
                        )}
                      </div>
                    </div>

                    {/* [요청 핵심 반영] 고정아이콘 영역 표시 전 명확한 구분자(|) 및 좌우 확실한 여백 확보 (mx-2.5 sm:mx-3) */}
                    <div
                      className="w-[1.5px] h-5 bg-slate-700/90 shrink-0 mx-2.5 sm:mx-3 rounded-full"
                      aria-hidden="true"
                    />

                    {/* 우측 [우선순위 1위]: 고정아이콘 영역 (shrink-0으로 절대 축소 및 겹침 방지) */}
                    <div className="shrink-0 flex items-center justify-end gap-1.5 py-1">
                      {hasAdminPrivilege && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              if (onAgentServiceClick) onAgentServiceClick();
                              else alert('🤖 AI 에이전트 거버넌스 및 대화 관리 서비스(하네스)로 이동합니다.');
                            }}
                            title="AI 에이전트 서비스"
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-purple-950/60 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-800/60 transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <Bot className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              if (onAdminServiceClick) onAdminServiceClick();
                              else if (onNavigate) onNavigate('PG-ADM-01');
                              else alert('🛠 관리자 시스템 및 OCR 운영 설정 서비스로 이동합니다.');
                            }}
                            title="관리자 서비스 (PG-ADM-01)"
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-800/60 transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (onNavigate) onNavigate('PG-USR-09');
                        }}
                        title="정밀 환경설정 (PG-USR-09)"
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsLoggedIn(false);
                          if (onNavigate) onNavigate('PG-USR-02');
                        }}
                        title="로그아웃 (안전종료)"
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 hover:text-rose-100 border border-rose-800/60 transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 로그인 하지 않은 상태 (PG-USR-01 첫화면 등): 공개 열람 + 로그인 / 회원가입 버튼 */
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('PG-USR-06')}
              title="공개 읽기모드 뷰어로 즉시 열기"
              className="whitespace-nowrap px-3 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700/80 shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span className="text-sm">📖</span>
              <span className="font-semibold text-xs whitespace-nowrap">공개 열람</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigate) onNavigate('PG-USR-02');
              }}
              title="로그인 및 회원가입 화면(PG-USR-02)으로 이동"
              className="whitespace-nowrap px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-lg shadow-md shadow-sky-600/30 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 ring-1 ring-sky-400/50"
            >
              <span className="text-xs">👤</span>
              <span className="whitespace-nowrap">로그인</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
