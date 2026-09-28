import { useState } from 'react';

export interface WireframeTopLayerProps {
  currentProgramId: string;
  isLoggedIn?: boolean;
  userAvatar?: string;
  userName?: string;
  userRole?: string;
  isMobileMode?: boolean;
  onNavigate?: (programId: string) => void;
  className?: string;
}

export function WireframeTopLayer({
  currentProgramId,
  isLoggedIn: initialLoggedIn,
  userAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  userName = 'jkok2j2m',
  userRole = '시스템관리자',
  isMobileMode = false,
  onNavigate,
  className = '',
}: WireframeTopLayerProps) {
  // 로그인 상태 토글 (와이어프레임 시뮬레이션용: PG-USR-01은 기본 비로그인, 그 외는 기본 로그인)
  const isDefaultLoggedIn = initialLoggedIn !== undefined ? initialLoggedIn : currentProgramId !== 'PG-USR-01' && currentProgramId !== 'PG-USR-02';
  const [isLoggedIn, setIsLoggedIn] = useState(isDefaultLoggedIn);
  const [isPinned, setIsPinned] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

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
      className={`p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg select-none transition-all ${
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

      {/* 2. 우측 컨트롤 & 사용자 프로필/인증 영역 (여유로운 gap, 줄바꿈 시 자동 꽉채움) */}
      <div className="flex items-center gap-2 flex-wrap flex-1 sm:flex-initial justify-end whitespace-nowrap min-w-fit">
        {/* [요청 3] 모바일 모드(또는 작은 뷰포트) 시 스크롤 고정핀 & 전체화면 모드 아이콘 표시 */}
        {isMobileMode && (
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
            {/* 스크롤 고정핀 아이콘 버튼 */}
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>

            {/* 전체화면 모드 아이콘 버튼 */}
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {/* [요청 2] 로그인 상태 여부에 따른 동적 분기 */}
        {isLoggedIn ? (
          /* 로그인 한 상태: 사용자의 사진(아바타), 닉네임, 환경설정(⚙) 아이콘 배치 */
          <div className="flex items-center gap-2 relative">
            {/* 공개 열람 모드 빠른 전환 버튼 */}
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('PG-USR-06')}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-800 text-xs flex items-center gap-1.5 transition-all"
              title="문서 뷰어로 바로가기"
            >
              <span>📖</span>
              <span className="hidden md:inline font-medium text-[11px]">뷰어 열기</span>
            </button>

            {/* 환경설정(⚙) 아이콘 버튼 및 팝오버 메뉴 (로그아웃 버튼을 내부로 격리 통합) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white rounded-lg border shadow-sm flex items-center gap-1.5 transition-all active:scale-95 ${
                  isSettingsMenuOpen ? 'border-sky-500 text-sky-300 ring-1 ring-sky-500/40' : 'border-slate-700/80'
                }`}
                title="설정 및 계정 관리 메뉴 열기"
                aria-label="설정 메뉴"
              >
                <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline text-xs font-medium">설정</span>
              </button>

              {/* 설정 드롭다운 팝오버: 탑 레이어 공간을 낭비하지 않고 설정 내부에서 로그아웃 등 주요 액션 수행 */}
              {isSettingsMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-2 border-b border-slate-800">
                    <div className="text-xs font-bold text-white truncate">{userName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{userRole} · 온라인</div>
                  </div>

                  <div className="py-1 space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        if (onNavigate) onNavigate('PG-USR-09');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <span>⚙️</span>
                      <span>정밀 환경설정 (PG-USR-09)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        if (onNavigate) onNavigate('PG-USR-04');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <span>👤</span>
                      <span>마이페이지 (프로필)</span>
                    </button>
                  </div>

                  <div className="pt-1 mt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        setIsLoggedIn(false);
                        if (onNavigate) onNavigate('PG-USR-02');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition-colors font-medium text-xs"
                      title="로그아웃 후 로그인/회원가입 화면으로 전환"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>로그아웃 (안전종료)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 사용자 프로필 사진 (아바타) & 마이페이지 바로가기 */}
            <div
              onClick={() => onNavigate && onNavigate('PG-USR-04')}
              className="flex items-center gap-2 pl-1 pr-2 py-1 bg-slate-900/80 hover:bg-slate-800 rounded-lg border border-slate-800 cursor-pointer transition-all active:scale-95 group"
              title="마이페이지(PG-USR-04)로 이동 / 클릭하여 프로필 확인"
            >
              {/* 사용자 실제 사진 아바타 */}
              <div className="relative">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-sky-500/50 group-hover:ring-sky-400"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-slate-950" />
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
                <span className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate max-w-[80px]">
                  {userName}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">{userRole}</span>
              </div>
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
