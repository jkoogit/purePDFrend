import { useState, useRef, useEffect } from 'react';
import { ViewerConfigRegistry, ViewerConfigState } from '../../domain/ViewerConfigRegistry';
import { HorizontalSlideContainer } from '../../components/HorizontalSlideContainer';
import { WireframeTopLayer } from '../../components/WireframeTopLayer';

export const USER_PROGRAMS = [
  { id: 'PG-USR-01', name: '첫화면 (랜딩)', desc: '공개 문서조회 바, 롤링배너, 공지/리뷰/가이드 탭, 고객센터 푸터' },
  { id: 'PG-USR-02', name: '로그인 / 회원가입', desc: 'ID/PW + 소셜/이메일 2FA 탭 전환, 회원가입 프로필 및 약관동의' },
  { id: 'PG-USR-03', name: '홈화면 (대시보드)', desc: '관리자/에이전트 이동 아이콘, 프로필 위젯, 7대 PDF 핵심도구 퀵 그리드' },
  { id: 'PG-USR-04', name: '마이페이지 > 사용자관리', desc: '비밀번호 변경, 2FA 소셜/이메일 탭 설정, 프로필 이미지/닉네임 수정' },
  { id: 'PG-USR-05', name: '문서관리 (라이브러리)', desc: '8대 상세필터, 문서등록(PDF/이미지), 4종 다운로드 모달, 주석 내보내기/불러오기' },
  { id: 'PG-USR-06', name: '문서뷰어 & 주석스튜디오', desc: '단일줄 툴바+가로 슬라이더, 툴바 순서설정 팝업, 8대 모드, 3단계 주석 이벤트' },
  { id: 'PG-USR-07', name: '문서공유 및 협업작업뷰', desc: '공유권한(읽기/열람자쓰기/관리자) 설정, 동시접속자 목록, 실시간 이벤트 피드' },
  { id: 'PG-USR-08', name: '오프라인 모드 & 충돌머지', desc: '오프라인 감지, 수동 즉시재연결 버튼, 로컬 큐, Last-Write-Wins & diff 머지' },
  { id: 'PG-USR-09', name: '정밀 사용자 환경설정', desc: '단축키설정(PC/태블릿), 도구그룹설정(그룹간 중복허용/초기화), 뷰어/테마옵션' },
];

export interface UserWireframesProps {
  isMobileMode?: boolean;
}

export function UserWireframes({ isMobileMode = false }: UserWireframesProps) {
  const [selectedProg, setSelectedProg] = useState('PG-USR-01');

  // Viewer Config Registry
  const registry = ViewerConfigRegistry.getInstance();
  const [viewerConfig, setViewerConfig] = useState<ViewerConfigState>(() => registry.getConfig());
  const [activeGroup, setActiveGroup] = useState('annot');

  // PG-USR-01 Banner state
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [bannerList, setBannerList] = useState<Array<{ id: number; title: string; subtitle: string; tag: string; bg: string }>>([
    {
      id: 1,
      title: 'purePDFrend 2.0 정식 런칭',
      subtitle: '대용량 스캔 PDF 듀얼 OCR 엔진 및 고속 주석 스튜디오',
      tag: 'NEW FEATURE',
      bg: 'from-sky-950/80 via-indigo-950/70 to-slate-900',
    },
    {
      id: 2,
      title: '오프라인 주석 & 지능형 diff 충돌 머지',
      subtitle: '네트워크 단절 시에도 로컬 큐에 안전 보존, 재연결 시 무손실 동기화',
      tag: 'OFFLINE MODE',
      bg: 'from-indigo-950/80 via-purple-950/70 to-slate-900',
    },
    {
      id: 3,
      title: '관리자 16대 운영관리 프로그램 개편',
      subtitle: '보안 통제부터 웹폰트, 단축키 및 도구그룹 커스텀 배포 지원',
      tag: 'ADMIN SUITE',
      bg: 'from-slate-900 via-sky-950/70 to-indigo-950/80',
    },
  ]);

  // PG-USR-01 Banner Swipe & Wheel Drag state
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

  // 마우스 휠 이벤트: 배너 영역 위에 마우스가 있을 때 화면 전체 세로 스크롤 및 부모 컨테이너로의 이벤트 전파를 완벽히 차단
  useEffect(() => {
    const el = bannerContainerRef.current;
    if (!el || bannerList.length <= 1) return;

    let wheelCooldown = false;

    const onBannerWheel = (e: WheelEvent) => {
      // 1. 배너 영역 위에서는 브라우저 기본 세로 스크롤 및 상위 요소로의 이벤트 전파(Bubbling/Capture)를 100% 원천 차단
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

  // 마우스 드래그 스와이프 이벤트 (부드러운 추종 및 마그네틱 복원)
  const handleBannerMouseDown = (e: React.MouseEvent) => {
    if (bannerList.length <= 1) return;
    setIsBannerDragging(true);
    setBannerDragStartX(e.clientX);
    setBannerDragDistance(0);
  };

  const handleBannerMouseMove = (e: React.MouseEvent) => {
    if (!isBannerDragging) return;
    const diff = e.clientX - bannerDragStartX;
    // 탄성 저항 계수 적용으로 매끄러운 드래그
    setBannerDragDistance(diff * 0.75);
  };

  const handleBannerMouseUp = () => {
    if (!isBannerDragging) return;
    setIsBannerDragging(false);
    // 35px 이상 이동 시 부드러운 전환, 미만 시 마그네틱 탄성 복원
    if (bannerDragDistance > 35) {
      handlePrevBanner();
    } else if (bannerDragDistance < -35) {
      handleNextBanner();
    }
    setBannerDragDistance(0);
  };

  // 모바일 터치 스와이프 이벤트
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

  // PG-USR-02 Login / Sign-up state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [signupStep, setSignupStep] = useState<1 | 2 | 3 | 4>(1); // 1: 동의, 2: 입력, 3: 인증, 4: 완료
  // 1단계 동의 상태
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  // 2단계 프로필 입력 상태
  const [signupAvatar, setSignupAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80');
  const [avatarScale, setAvatarScale] = useState(100); // 50% ~ 200% 크기 조절
  const [avatarPosX, setAvatarPosX] = useState(0); // 위치 이동
  const [avatarPosY, setAvatarPosY] = useState(0);
  const [avatarStatus, setAvatarStatus] = useState<'기본' | '프리셋 적용' | '자르기 적용됨' | '업로드 완료'>('기본');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false); // 크기선택 및 위치이동 조절 모달
  const [tempCropScale, setTempCropScale] = useState(100);
  const [tempCropPosX, setTempCropPosX] = useState(0);
  const [tempCropPosY, setTempCropPosY] = useState(0);
  const [tempCropImage, setTempCropImage] = useState('');
  // 캔버스 드래그 및 모서리 크기조절 인터랙션 상태
  const [isAvatarDragging, setIsAvatarDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState({ x: 0, y: 0 });
  const [isCornerResizing, setIsCornerResizing] = useState(false);
  const [resizeStartPoint, setResizeStartPoint] = useState({ y: 0, scale: 100 });
  // 더 많은 프리셋 선택 모달 상태
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetCategory, setPresetCategory] = useState<'all' | 'person' | '3d' | 'character'>('all');
  const AVATAR_PRESETS = [
    { id: 1, name: '사라 (프로페셔널)', category: 'person', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=180&q=80' },
    { id: 2, name: '민준 (엔지니어)', category: 'person', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=180&q=80' },
    { id: 3, name: '지우 (크리에이티브)', category: 'person', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=180&q=80' },
    { id: 4, name: '데이빗 (매니저)', category: 'person', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=80' },
    { id: 5, name: '서연 (마케팅)', category: 'person', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=180&q=80' },
    { id: 6, name: '현우 (아키텍트)', category: 'person', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=180&q=80' },
    { id: 7, name: '스마트 캐주얼', category: 'person', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=180&q=80' },
    { id: 8, name: '비즈니스 프로', category: 'person', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=180&q=80' },
    { id: 9, name: '3D 네오 캐릭터 1', category: '3d', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=180&q=80' },
    { id: 10, name: '3D 사이버 아바타', category: '3d', url: 'https://images.unsplash.com/photo-1634926878768-2a5b3c42f139?auto=format&fit=crop&w=180&q=80' },
    { id: 11, name: '아트 팝 캐릭터', category: 'character', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=180&q=80' },
    { id: 12, name: '미니멀 심볼', category: 'character', url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=180&q=80' },
  ];
  const [signupEmail, setSignupEmail] = useState('hong@purepdfrend.io'); // 2차인증 미사용 시 정보입력에서 필수 수집
  const [signupName, setSignupName] = useState('홍길동');
  const [signupNickname, setSignupNickname] = useState('pureMaster');
  const [signupPhone, setSignupPhone] = useState('010-1234-5678');
  // 3단계 소셜/이메일 2차 인증 및 시스템 정책 연동 상태
  const [is2FaPolicyRequired, setIs2FaPolicyRequired] = useState(false); // 시스템 정책: 2FA 강제화 여부 (기본: 선택/해제/생략가능)
  const [authMethod, setAuthMethod] = useState<'kakao' | 'naver' | 'google' | 'email'>('kakao');
  const [isAuthVerified, setIsAuthVerified] = useState(false);
  const [authCode, setAuthCode] = useState('');

  // PG-USR-06 Viewer Toolbar state
  const [isToolbarModalOpen, setIsToolbarModalOpen] = useState(false);
  const [activeViewerTab, setActiveViewerTab] = useState<'bookmarks' | 'toc' | 'annots'>('toc');
  const [currentTool, setCurrentTool] = useState('pen');

  // PG-USR-08 Offline state
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(true);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  // PG-USR-09 Settings state
  const [settingsTab, setSettingsTab] = useState<'general' | 'shortcuts' | 'groups'>('groups');
  const [targetGroupForAdd, setTargetGroupForAdd] = useState('annot');
  const [selectedToolToAdd, setSelectedToolToAdd] = useState('rect');

  const handleResetConfig = () => {
    const fresh = registry.resetToDefault();
    setViewerConfig(fresh);
  };

  const handleAddToolToGroup = () => {
    const updated = registry.addToolToGroup(targetGroupForAdd, selectedToolToAdd);
    setViewerConfig(updated);
  };

  const handleRemoveToolFromGroup = (grp: string, idx: number) => {
    const updated = registry.removeToolFromGroup(grp, idx);
    setViewerConfig(updated);
  };

  const handleMoveTool = (grp: string, fromIdx: number, toIdx: number) => {
    const updated = registry.reorderTools(grp, fromIdx, toIdx);
    setViewerConfig(updated);
  };

  const handleShortcutChange = (toolId: string, val: string) => {
    const updated = registry.updateShortcut(toolId, val);
    setViewerConfig(updated);
  };

  // 프로필 사진 크롭 및 포인터 조작 핸들러
  const handleApplyCrop = () => {
    try {
      const canvas = document.createElement('canvas');
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const src = tempCropImage || signupAvatar;

      if (ctx && src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.clearRect(0, 0, size, size);
          // 원형 마스크 클리핑
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          const scale = tempCropScale / 100;
          const drawW = size * scale;
          const drawH = size * scale;
          const drawX = (size - drawW) / 2 + tempCropPosX;
          const drawY = (size - drawH) / 2 + tempCropPosY;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          try {
            const croppedData = canvas.toDataURL('image/png');
            setSignupAvatar(croppedData);
            setAvatarScale(100);
            setAvatarPosX(0);
            setAvatarPosY(0);
            setAvatarStatus('자르기 적용됨');
          } catch {
            if (tempCropImage) setSignupAvatar(tempCropImage);
            setAvatarScale(tempCropScale);
            setAvatarPosX(tempCropPosX);
            setAvatarPosY(tempCropPosY);
            setAvatarStatus('자르기 적용됨');
          }
          setIsCropModalOpen(false);
        };
        img.onerror = () => {
          if (tempCropImage) setSignupAvatar(tempCropImage);
          setAvatarScale(tempCropScale);
          setAvatarPosX(tempCropPosX);
          setAvatarPosY(tempCropPosY);
          setAvatarStatus('자르기 적용됨');
          setIsCropModalOpen(false);
        };
        img.src = src;
        return;
      }
    } catch (e) {
      console.error('Crop failed, falling back:', e);
    }
    if (tempCropImage) setSignupAvatar(tempCropImage);
    setAvatarScale(tempCropScale);
    setAvatarPosX(tempCropPosX);
    setAvatarPosY(tempCropPosY);
    setAvatarStatus('자르기 적용됨');
    setIsCropModalOpen(false);
  };

  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsAvatarDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartPoint({ x: clientX - tempCropPosX, y: clientY - tempCropPosY });
  };

  const onCornerResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsCornerResizing(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setResizeStartPoint({ y: clientY, scale: tempCropScale });
  };

  const onGlobalPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAvatarDragging && !isCornerResizing) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    if (isAvatarDragging) {
      const newX = Math.max(-90, Math.min(90, clientX - dragStartPoint.x));
      const newY = Math.max(-90, Math.min(90, clientY - dragStartPoint.y));
      setTempCropPosX(newX);
      setTempCropPosY(newY);
    } else if (isCornerResizing) {
      const diff = (resizeStartPoint.y - clientY) * 0.8;
      const nextScale = Math.max(50, Math.min(250, Math.round(resizeStartPoint.scale + diff)));
      setTempCropScale(nextScale);
    }
  };

  const onGlobalPointerEnd = () => {
    setIsAvatarDragging(false);
    setIsCornerResizing(false);
  };

  const activeTools = registry.getToolsForGroup(activeGroup);

  return (
    <div className="space-y-6">
      {/* 9대 사용자 프로그램 선택 칩 바 (가로 슬라이드 컨테이너 적용) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
          <span className="font-semibold text-sky-400">9대 사용자 핵심 서비스 화면 (User Portal Modules)</span>
          <span>선택: <strong className="text-white">{selectedProg}</strong></span>
        </div>
        <HorizontalSlideContainer scrollStep={280} className="w-full">
          {USER_PROGRAMS.map((p) => {
            const active = p.id === selectedProg;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProg(p.id)}
                className={`shrink-0 px-3.5 py-2.5 min-h-[44px] rounded-lg text-xs font-mono transition-all flex items-center gap-2 ${
                  active
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400 font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="opacity-80 px-1 py-0.5 rounded bg-black/20 text-[11px]">{p.id}</span>
                <span className="font-sans font-medium whitespace-nowrap">{p.name}</span>
              </button>
            );
          })}
        </HorizontalSlideContainer>
      </div>

      {/* 실제 프로덕션 대상 순수 화면 캔버스 (설명 배제, 화면 컴포넌트만 정확히 렌더링) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-6 min-h-[540px]">
        {/* PG-USR-02(로그인/회원가입)는 전용 독립 진입 화면이므로 상단 탑 레이어(WireframeTopLayer)를 제외하고, 그 외 화면에만 상단 헤더 배치 */}
        {selectedProg !== 'PG-USR-02' && (
          <WireframeTopLayer
            currentProgramId={selectedProg}
            isMobileMode={isMobileMode}
            onNavigate={(progId) => setSelectedProg(progId)}
          />
        )}

        {/* PG-USR-01: 첫화면 (랜딩) */}
        {selectedProg === 'PG-USR-01' && (
          <div className="space-y-5 text-xs">
            {/* 1. 공개 열람 문서 조회 바: 타이틀과 버튼에 whitespace-nowrap 적용, 좁아질 때 flex-wrap으로 자연스럽게 다음줄 꽉 채움 */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-slate-300 font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-sky-400">🔍</span>
                  <span className="whitespace-nowrap">공개 열람 문서 조회</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">DOC-XXXX / SHARE LINK</span>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2.5 mt-1">
                <input
                  type="text"
                  placeholder="문서 고유번호(DOC-xxxx) 또는 공유 링크를 입력하세요..."
                  className="flex-1 min-w-[220px] bg-slate-900 border border-slate-700/80 focus:border-sky-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none transition-colors"
                />
                <button className="whitespace-nowrap w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-md shadow-indigo-600/20 active:scale-95 shrink-0 flex items-center justify-center gap-1.5">
                  <span className="whitespace-nowrap">열람하기</span>
                  <span>➔</span>
                </button>
              </div>
            </div>

            {/* 2. 중앙 롤링 이벤트 배너 슬라이더 (텍스트 줄바꿈 방지, 좁아질 때 flex-wrap 자동 적응) */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
                <span className="font-medium text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                  <span>🎠</span>
                  <span className="whitespace-nowrap">이벤트 및 프로모션 배너</span>
                </span>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <button
                    onClick={() => {
                      if (bannerList.length > 0) {
                        setBannerList([]);
                      } else {
                        setBannerList([
                          {
                            id: 1,
                            title: 'purePDFrend 2.0 정식 런칭',
                            subtitle: '대용량 스캔 PDF 듀얼 OCR 엔진 및 고속 주석 스튜디오',
                            tag: 'NEW FEATURE',
                            bg: 'from-sky-950/80 via-indigo-950/70 to-slate-900',
                          },
                          {
                            id: 2,
                            title: '오프라인 주석 & 지능형 diff 충돌 머지',
                            subtitle: '네트워크 단절 시에도 로컬 큐에 안전 보존, 재연결 시 무손실 동기화',
                            tag: 'OFFLINE MODE',
                            bg: 'from-indigo-950/80 via-purple-950/70 to-slate-900',
                          },
                          {
                            id: 3,
                            title: '관리자 16대 운영관리 프로그램 개편',
                            subtitle: '보안 통제부터 웹폰트, 단축키 및 도구그룹 커스텀 배포 지원',
                            tag: 'ADMIN SUITE',
                            bg: 'from-slate-900 via-sky-950/70 to-indigo-950/80',
                          },
                        ]);
                        setCurrentBannerIdx(0);
                      }
                    }}
                    className="whitespace-nowrap text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="배너 유/무 상태 시뮬레이션 전환"
                  >
                    <span className="whitespace-nowrap">{bannerList.length > 0 ? '배너 없는 상태 테스트' : '배너 목록 복구'}</span>
                  </button>
                </div>
              </div>

              {bannerList.length > 0 ? (
                <div className="space-y-2">
                  {/* 스와이프 스크롤 트랙 컨테이너 (부드러운 애니메이션 및 마우스휠 이벤트 완벽 격리 적용) */}
                  <div
                    ref={bannerContainerRef}
                    onWheel={(e) => {
                      // 마우스 휠 이벤트: 이벤트 버블링 및 상위 전파 원천 차단
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
                      if (Math.abs(delta) > 10) {
                        if (delta > 0) {
                          handleNextBanner();
                        } else {
                          handlePrevBanner();
                        }
                      }
                    }}
                    onMouseDown={handleBannerMouseDown}
                    onMouseMove={handleBannerMouseMove}
                    onMouseUp={handleBannerMouseUp}
                    onMouseLeave={handleBannerMouseUp}
                    onTouchStart={handleBannerTouchStart}
                    onTouchEnd={handleBannerTouchEnd}
                    className="relative overflow-hidden rounded-2xl border border-slate-800/80 shadow-xl bg-slate-950 select-none cursor-grab active:cursor-grabbing overscroll-contain"
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
                              <span className="text-[11px] text-slate-400">purePDFrend 공식 프로모션</span>
                            </div>
                            <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
                              🖱️ 마우스휠 이동 / ↔️ 스와이프
                            </span>
                          </div>

                          {/* 배너 텍스트 콘텐츠 (내부 불필요 버튼 제거로 가독성 극대화) */}
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

                  {/* 심플하고 직관적인 미니멀 인디케이터 네비게이션 (중복 방지: 단일 위치 카운터) */}
                  <div className="flex items-center justify-between px-2 pt-0.5">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {currentBannerIdx + 1} / {bannerList.length}
                    </span>

                    {/* 심플 슬림 인디케이터 바 (클릭 시 부드러운 애니메이션 전환) */}
                    <div className="flex items-center gap-1.5 py-1">
                      {bannerList.map((banner, idx) => (
                        <button
                          key={banner.id}
                          type="button"
                          onClick={() => setCurrentBannerIdx(idx)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentBannerIdx
                              ? 'w-6 bg-sky-400 shadow-sm shadow-sky-400/50'
                              : 'w-2 bg-slate-700 hover:bg-slate-500'
                          }`}
                          aria-label={`${idx + 1}번 배너로 이동`}
                          title={`${idx + 1}번 배너: ${banner.title}`}
                        />
                      ))}
                    </div>

                    <span className="text-[10px] text-slate-600 font-mono tracking-wider">SLIDE</span>
                  </div>
                </div>
              ) : (
                /* 배너 없는 상태 (Empty Banner State): 깔끔한 여백 처리 및 안내 */
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
                          title: 'purePDFrend 2.0 정식 런칭',
                          subtitle: '대용량 스캔 PDF 듀얼 OCR 엔진 및 고속 주석 스튜디오',
                          tag: 'NEW FEATURE',
                          bg: 'from-sky-950/80 via-indigo-950/70 to-slate-900',
                        },
                        {
                          id: 2,
                          title: '오프라인 주석 & 지능형 diff 충돌 머지',
                          subtitle: '네트워크 단절 시에도 로컬 큐에 안전 보존, 재연결 시 무손실 동기화',
                          tag: 'OFFLINE MODE',
                          bg: 'from-indigo-950/80 via-purple-950/70 to-slate-900',
                        },
                        {
                          id: 3,
                          title: '관리자 16대 운영관리 프로그램 개편',
                          subtitle: '보안 통제부터 웹폰트, 단축키 및 도구그룹 커스텀 배포 지원',
                          tag: 'ADMIN SUITE',
                          bg: 'from-slate-900 via-sky-950/70 to-indigo-950/80',
                        },
                      ])
                    }
                    className="mt-2 text-[11px] px-3 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-medium transition-all"
                  >
                    + 기본 배너 다시 불러오기
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="border-b border-slate-800 pb-2">
                <HorizontalSlideContainer showScrollButtons={false} className="w-full">
                  <div className="flex gap-4 text-slate-400 font-medium whitespace-nowrap">
                    <button className="text-sky-400 border-b-2 border-sky-400 pb-1 font-semibold min-h-[36px]">공지사항</button>
                    <button className="hover:text-slate-200 pb-1 min-h-[36px]">사용자 리뷰</button>
                    <button className="hover:text-slate-200 pb-1 min-h-[36px]">단계별 이용 가이드</button>
                  </div>
                </HorizontalSlideContainer>
              </div>
              <div className="pt-2 text-slate-500">[공지] purePDFrend 3대 도메인 및 오프라인 주석 동기화 v2.0 정식 런칭 안내</div>
            </div>
          </div>
        )}

        {/* PG-USR-02: 로그인 / 회원가입 (4단계 프로세스 완결) */}
        {selectedProg === 'PG-USR-02' && (
          <div className="space-y-5 max-w-xl mx-auto">
            {/* 상단 서브 헤더 네비게이션: 홈(PG-USR-01) | 모드 탭 (로그인 / 회원가입) */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-md">
              <button
                type="button"
                onClick={() => setSelectedProg('PG-USR-01')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 text-xs flex items-center gap-1.5 transition-all"
                title="첫화면(홈)으로 이동"
              >
                <span>🏠</span>
                <span className="hidden sm:inline font-medium">홈으로</span>
              </button>

              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`px-4 py-1.5 rounded-md font-medium transition-all ${
                    authMode === 'login'
                      ? 'bg-sky-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setSignupStep(1);
                  }}
                  className={`px-4 py-1.5 rounded-md font-medium transition-all ${
                    authMode === 'signup'
                      ? 'bg-sky-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  회원가입
                </button>
              </div>
            </div>

            {/* A. 로그인 UI */}
            {authMode === 'login' ? (
              <div className="p-6 bg-slate-950/90 border border-slate-800 rounded-2xl shadow-xl space-y-5">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-white tracking-tight">서비스 로그인</h3>
                  <p className="text-xs text-slate-400">purePDFrend 스마트 PDF 스튜디오에 오신 것을 환영합니다</p>
                </div>

                {/* ID / PW 폼 */}
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">아이디 또는 이메일</label>
                    <input
                      type="text"
                      defaultValue="jkok2j2m@purepdfrend.io"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                      placeholder="아이디 또는 이메일 주소"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-medium">비밀번호</label>
                      <button type="button" className="text-sky-400 hover:underline text-[11px]">
                        비밀번호 찾기
                      </button>
                    </div>
                    <input
                      type="password"
                      defaultValue="••••••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                      placeholder="비밀번호"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-400 select-none">
                      <input type="checkbox" defaultChecked className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0" />
                      <span>로그인 상태 유지</span>
                    </label>
                    <span className="text-[11px] text-slate-500">2FA 보안 강제화 적용</span>
                  </div>

                  {/* 로그인 실행 버튼 ➔ 홈화면(PG-USR-03)으로 이동 */}
                  <button
                    type="button"
                    onClick={() => setSelectedProg('PG-USR-03')}
                    className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>로그인하고 시작하기</span>
                    <span>➔</span>
                  </button>
                </div>

                {/* 소셜 간편 로그인 구분선 */}
                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <span className="relative px-3 bg-slate-950 text-slate-500 text-[11px] font-mono">
                    간편 소셜 로그인
                  </span>
                </div>

                {/* 3대 소셜 로그인 버튼 그리드 (카카오, 네이버, 구글): 소셜 공식 SVG 로고 탑재 및 좁아질 때 아이콘만 깔끔하게 표시 */}
                <div className="grid grid-cols-3 gap-2.5">
                  {/* 1. 카카오톡: 공식 노란색 배경 + 공식 심볼 말풍선 SVG */}
                  <button
                    type="button"
                    onClick={() => setSelectedProg('PG-USR-03')}
                    className="py-2.5 px-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
                    title="카카오 로그인"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3C6.477 3 2 6.48 2 10.772c0 2.76 1.838 5.176 4.636 6.544l-.946 3.473c-.085.313.19.588.484.484l4.137-2.738c.552.074 1.115.113 1.689.113 5.523 0 10-3.48 10-7.772S17.523 3 12 3z" />
                    </svg>
                    <span className="hidden sm:inline">카카오</span>
                  </button>

                  {/* 2. 네이버: 공식 녹색 배경 + 공식 N 심볼 SVG */}
                  <button
                    type="button"
                    onClick={() => setSelectedProg('PG-USR-03')}
                    className="py-2.5 px-3 bg-[#03C75A] hover:bg-[#02b351] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
                    title="네이버 로그인"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
                    </svg>
                    <span className="hidden sm:inline">네이버</span>
                  </button>

                  {/* 3. 구글: 사용자가 요청한 깔끔한 흰색 카드 바탕 + 공식 4색 구글 G 심볼 SVG */}
                  <button
                    type="button"
                    onClick={() => setSelectedProg('PG-USR-03')}
                    className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-xs border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
                    title="구글 로그인 (공식 4색 로고)"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span className="hidden sm:inline text-slate-800">구글</span>
                  </button>
                </div>

                {/* 하단 회원가입 전환 안내 */}
                <div className="text-center pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  아직 purePDFrend 회원이 아니신가요?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setSignupStep(1);
                    }}
                    className="text-sky-400 hover:text-sky-300 font-semibold hover:underline ml-1"
                  >
                    회원가입 진행하기
                  </button>
                </div>
              </div>
            ) : (
              /* B. 회원가입 4단계 프로세스 (1.동의 ➔ 2.입력 ➔ 3.인증 ➔ 4.완료) */
              <div className="p-6 bg-slate-950/90 border border-slate-800 rounded-2xl shadow-xl space-y-6">
                {/* 단계 인디케이터 (1: 동의 ➔ 2: 입력 ➔ 3: 인증 ➔ 4: 완료) */}
                <div className="flex items-center justify-between relative px-2">
                  <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 -z-0" />
                  {[
                    { step: 1, label: '약관동의' },
                    { step: 2, label: '정보입력' },
                    { step: 3, label: '2차인증' },
                    { step: 4, label: '가입완료' },
                  ].map((s) => {
                    const isActive = signupStep === s.step;
                    const isPassed = signupStep > s.step;
                    return (
                      <div key={s.step} className="flex flex-col items-center gap-1.5 relative z-10 bg-slate-950 px-1">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-sky-600 text-white ring-4 ring-sky-500/20 shadow-md'
                              : isPassed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isPassed ? '✓' : s.step}
                        </div>
                        <span
                          className={`text-[10px] font-medium whitespace-nowrap ${
                            isActive ? 'text-sky-400 font-bold' : isPassed ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* [1단계: 동의] 서비스 이용약관 및 개인정보 정책 */}
                {signupStep === 1 && (
                  <div className="space-y-4 text-xs animate-in fade-in duration-200">
                    <div className="border-b border-slate-800 pb-3">
                      <h4 className="text-sm font-bold text-white mb-1">약관 및 정책 동의</h4>
                      <p className="text-slate-400 text-[11px]">purePDFrend 서비스 이용을 위해 필수 약관에 동의해 주세요.</p>
                    </div>

                    {/* 전체 동의 박스 */}
                    <label className="flex items-center justify-between p-3.5 bg-sky-950/30 border border-sky-500/30 rounded-xl cursor-pointer hover:bg-sky-950/40 transition-colors">
                      <div className="flex items-center gap-2.5 font-bold text-sky-200">
                        <input
                          type="checkbox"
                          checked={agreeAll}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setAgreeAll(val);
                            setAgreeTerms(val);
                            setAgreePrivacy(val);
                            setAgreeMarketing(val);
                          }}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0"
                        />
                        <span>모든 약관에 전체 동의합니다</span>
                      </div>
                      <span className="text-[10px] text-sky-400 font-mono">전체 선택</span>
                    </label>

                    {/* 개별 약관 목록 */}
                    <div className="space-y-2.5 pt-1">
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                            <input
                              type="checkbox"
                              checked={agreeTerms}
                              onChange={(e) => setAgreeTerms(e.target.checked)}
                              className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0"
                            />
                            <span className="font-medium">[필수] purePDFrend 서비스 이용약관</span>
                          </label>
                          <span className="text-[10px] text-sky-400">보기</span>
                        </div>
                        <div className="h-16 p-2 bg-slate-950 rounded text-[11px] text-slate-400 overflow-y-auto leading-relaxed border border-slate-800/60 font-mono">
                          제1조 (목적) 본 약관은 purePDFrend가 제공하는 PDF 변환, 가상화 뷰어, OCR 텍스트 레이어 생성 및 주석 협업 도구의 이용조건 및 절차를 규정합니다. 회원은 관련 법령 및 본 약관을 준수해야 합니다.
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                            <input
                              type="checkbox"
                              checked={agreePrivacy}
                              onChange={(e) => setAgreePrivacy(e.target.checked)}
                              className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0"
                            />
                            <span className="font-medium">[필수] 개인정보 수집 및 이용 동의</span>
                          </label>
                          <span className="text-[10px] text-sky-400">보기</span>
                        </div>
                        <div className="h-16 p-2 bg-slate-950 rounded text-[11px] text-slate-400 overflow-y-auto leading-relaxed border border-slate-800/60 font-mono">
                          수집 항목: 성명, 별명(닉네임), 프로필 사진, 연락처(휴대폰 번호), 2차 인증정보(소셜 식별자 또는 이메일). 목적: 서비스 본인 확인, 협업 주석 공유, 보안 알림 및 계정 복구.
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={agreeMarketing}
                            onChange={(e) => setAgreeMarketing(e.target.checked)}
                            className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0"
                          />
                          <span className="text-slate-400">[선택] 이벤트 혜택 및 신기능 업데이트 소식 수신</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">선택 동의</span>
                      </div>
                    </div>

                    {/* [요청 3] 1단계 액션 버튼: 취소<br>(로그인으로), 동의하고 다음단계<br>(정보입력)-> 고정 줄바꿈 적용 */}
                    <div className="flex gap-2.5 pt-3">
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="w-1/3 py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl font-medium transition-colors text-center text-xs leading-snug flex flex-col items-center justify-center"
                      >
                        <span>취소</span>
                        <span className="text-[10px] opacity-80">(로그인으로)</span>
                      </button>
                      <button
                        type="button"
                        disabled={!agreeTerms || !agreePrivacy}
                        onClick={() => setSignupStep(2)}
                        className={`w-2/3 py-2.5 px-3 rounded-xl font-bold transition-all shadow-md text-center text-xs leading-snug flex flex-col items-center justify-center ${
                          agreeTerms && agreePrivacy
                            ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span>동의하고 다음단계</span>
                        <span className="text-[10px] opacity-90">(정보입력) ➔</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* [2단계: 입력] 사진(업로드 및 크기조절 포함), 이름, 별명, 전화번호, 시스템 정책(2FA 해제)시 이메일 입력 */}
                {signupStep === 2 && (
                  <div className="space-y-4 text-xs animate-in fade-in duration-200">
                    <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">사용자 프로필 정보 입력</h4>
                      </div>

                      {/* 시스템 2차인증 정책 상태 뱃지 (미사용/해제 시 이메일 필수 안내) */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                          is2FaPolicyRequired
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        }`}
                      >
                        {is2FaPolicyRequired ? '2FA 필수정책' : '2FA 해제정책'}
                      </span>
                    </div>

                    {/* [요청 1, 3, 4] 프로필 사진 원에 연필아이콘 배치, 안내텍스트 제거, 상태 배지 표시, 3개 프리셋 + 더 많은 프리셋 선택 모달 */}
                    <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold block">1. 프로필 사진</span>
                        {/* 상태 명확 표시: 업로드 여부 및 배율/위치 상태 */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono font-medium">
                            상태: {avatarStatus}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            {avatarScale}% · ({avatarPosX}, {avatarPosY})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        {/* 원형 아바타 마스크 및 [연필 아이콘 버튼] */}
                        <div className="relative shrink-0">
                          <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-950 ring-2 ring-sky-500/50 shadow-md flex items-center justify-center">
                            <img
                              src={signupAvatar}
                              alt="프로필 미리보기"
                              style={{
                                transform: `scale(${avatarScale / 100}) translate(${avatarPosX}px, ${avatarPosY}px)`,
                              }}
                              className="w-full h-full object-cover transition-transform duration-100 select-none pointer-events-none"
                            />
                          </div>

                          {/* 원 하단 우측 연필 아이콘 업로드/편집 버튼 */}
                          <label
                            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-sky-600 hover:bg-sky-500 active:scale-95 text-white ring-2 ring-slate-950 flex items-center justify-center cursor-pointer shadow-lg transition-transform"
                            title="사진 업로드 및 크기·위치 영역 조정"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (uploadEvt) => {
                                    if (uploadEvt.target?.result) {
                                      setTempCropImage(uploadEvt.target.result as string);
                                      setTempCropScale(100);
                                      setTempCropPosX(0);
                                      setTempCropPosY(0);
                                      setAvatarStatus('업로드 완료');
                                      setIsCropModalOpen(true);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* 우측 프리셋: 3개만 깔끔히 표시하고 '+ 더보기' 버튼으로 확장 모달 제공 */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-300">추천 프리셋</span>
                            <button
                              type="button"
                              onClick={() => setIsPresetModalOpen(true)}
                              className="text-[11px] text-sky-400 hover:text-sky-300 font-medium hover:underline flex items-center gap-1"
                            >
                              <span>+ 더보기 ({AVATAR_PRESETS.length}종)</span>
                            </button>
                          </div>

                          <div className="flex gap-2 items-center">
                            {AVATAR_PRESETS.slice(0, 3).map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSignupAvatar(item.url);
                                  setAvatarScale(100);
                                  setAvatarPosX(0);
                                  setAvatarPosY(0);
                                  setAvatarStatus('프리셋 적용');
                                }}
                                className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-transform active:scale-95 ${
                                  signupAvatar === item.url ? 'border-sky-400 scale-105 shadow-md' : 'border-slate-700 opacity-70 hover:opacity-100'
                                }`}
                                title={item.name}
                              >
                                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                              </button>
                            ))}

                            <button
                              type="button"
                              onClick={() => setIsPresetModalOpen(true)}
                              className="w-8 h-8 rounded-full border border-dashed border-slate-600 hover:border-sky-400 text-slate-400 hover:text-sky-300 flex items-center justify-center text-xs transition-colors"
                              title="전체 프리셋 아바타 선택창 열기"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* [요청 4] 더 많은 프리셋 선택 모달 */}
                    {isPresetModalOpen && (
                      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-white text-sm">프리셋 아바타 전체 선택</h5>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                                총 {AVATAR_PRESETS.length}종
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsPresetModalOpen(false)}
                              className="text-slate-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>

                          {/* 카테고리 필터 탭 */}
                          <div className="flex gap-1.5 text-[11px] pb-1 border-b border-slate-800/80">
                            {[
                              { id: 'all', label: '전체' },
                              { id: 'person', label: '인물' },
                              { id: '3d', label: '3D 아바타' },
                              { id: 'character', label: '캐릭터' },
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setPresetCategory(tab.id as any)}
                                className={`px-2.5 py-1 rounded-lg transition-colors ${
                                  presetCategory === tab.id
                                    ? 'bg-sky-600 text-white font-semibold'
                                    : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          {/* 프리셋 그리드 */}
                          <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1 no-scrollbar py-1">
                            {AVATAR_PRESETS.filter((p) => presetCategory === 'all' || p.category === presetCategory).map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSignupAvatar(item.url);
                                  setAvatarScale(100);
                                  setAvatarPosX(0);
                                  setAvatarPosY(0);
                                  setAvatarStatus('프리셋 적용');
                                  setIsPresetModalOpen(false);
                                }}
                                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                                  signupAvatar === item.url
                                    ? 'bg-sky-950/60 border-sky-400 ring-2 ring-sky-500/30'
                                    : 'border-slate-800 hover:border-slate-600 bg-slate-950'
                                }`}
                              >
                                <img src={item.url} alt={item.name} className="w-12 h-12 rounded-full object-cover shadow-sm ring-1 ring-slate-800" />
                                <span className="text-[10px] text-slate-300 truncate w-full text-center">{item.name}</span>
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsPresetModalOpen(false)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                          >
                            닫기
                          </button>
                        </div>
                      </div>
                    )}

                    {/* [요청 3] 프로필 사진 업로드 팝업: 마우스 드래그로 위치 이동 + 모서리로 크기조절 + 실제 자르기(Canvas Crop) 저장 */}
                    {isCropModalOpen && (
                      <div
                        onMouseMove={onGlobalPointerMove}
                        onMouseUp={onGlobalPointerEnd}
                        onTouchMove={onGlobalPointerMove}
                        onTouchEnd={onGlobalPointerEnd}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
                      >
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-white text-sm">사진 자르기 및 위치·크기 조절</h5>
                              <span className="text-[10px] text-sky-400 font-mono px-1.5 py-0.5 rounded bg-sky-950/50 border border-sky-500/30">
                                드래그 / 4방향 모서리 조절
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsCropModalOpen(false)}
                              className="text-slate-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>

                          {/* 인터랙티브 크롭 뷰포트 (드래그 위치이동 + 4방향 모서리 핸들 크기조절) */}
                          <div className="relative w-56 h-56 mx-auto select-none">
                            {/* 원형 마스크 프레임 */}
                            <div
                              onMouseDown={onDragStart}
                              onTouchStart={onDragStart}
                              className={`w-full h-full rounded-full bg-slate-950 border-2 border-sky-400 shadow-2xl overflow-hidden relative cursor-grab active:cursor-grabbing ${
                                isAvatarDragging ? 'cursor-grabbing' : ''
                              }`}
                            >
                              {/* 실제 드래그 가능한 이미지 캔버스 */}
                              <img
                                src={tempCropImage || signupAvatar}
                                alt="영역 조절 미리보기"
                                style={{
                                  transform: `scale(${tempCropScale / 100}) translate(${tempCropPosX}px, ${tempCropPosY}px)`,
                                }}
                                className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-75"
                              />

                              {/* 3x3 가이드 라인 오버레이 */}
                              <div className="absolute inset-0 pointer-events-none opacity-20">
                                <div className="w-full h-1/3 border-b border-sky-400" />
                                <div className="w-full h-1/3 border-b border-sky-400" />
                                <div className="absolute top-0 bottom-0 left-1/3 border-r border-sky-400" />
                                <div className="absolute top-0 bottom-0 left-2/3 border-r border-sky-400" />
                              </div>
                            </div>

                            {/* 4방향 모서리 크기조절 핸들 (원형 모서리 4개 핸들) */}
                            {/* 1. 좌상단 */}
                            <div
                              onMouseDown={onCornerResizeStart}
                              onTouchStart={onCornerResizeStart}
                              className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center text-[10px] font-bold shadow-lg cursor-nwse-resize z-20 ring-2 ring-slate-900 active:scale-110"
                              title="모서리를 드래그하여 크기 조절"
                            >
                              ⤡
                            </div>
                            {/* 2. 우상단 */}
                            <div
                              onMouseDown={onCornerResizeStart}
                              onTouchStart={onCornerResizeStart}
                              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center text-[10px] font-bold shadow-lg cursor-nesw-resize z-20 ring-2 ring-slate-900 active:scale-110"
                              title="모서리를 드래그하여 크기 조절"
                            >
                              ⤢
                            </div>
                            {/* 3. 좌하단 */}
                            <div
                              onMouseDown={onCornerResizeStart}
                              onTouchStart={onCornerResizeStart}
                              className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center text-[10px] font-bold shadow-lg cursor-nesw-resize z-20 ring-2 ring-slate-900 active:scale-110"
                              title="모서리를 드래그하여 크기 조절"
                            >
                              ⤢
                            </div>
                            {/* 4. 우하단 */}
                            <div
                              onMouseDown={onCornerResizeStart}
                              onTouchStart={onCornerResizeStart}
                              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center text-[10px] font-bold shadow-lg cursor-nwse-resize z-20 ring-2 ring-slate-900 active:scale-110"
                              title="모서리를 드래그하여 크기 조절"
                            >
                              ⤡
                            </div>
                          </div>

                          {/* 자르기/위치 상태 요약 바 */}
                          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-300 font-mono">
                            <span>확대배율: <strong className="text-sky-400">{tempCropScale}%</strong></span>
                            <span>위치: <strong className="text-sky-400">X:{tempCropPosX}px, Y:{tempCropPosY}px</strong></span>
                          </div>

                          {/* 슬라이더 및 빠른 조작 툴바 */}
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between items-center text-slate-400 text-[11px]">
                              <span>배율 및 위치 미세조절</span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setTempCropScale((s) => Math.max(50, s - 10))}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px]"
                                  title="축소"
                                >
                                  - 줌
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTempCropScale((s) => Math.min(250, s + 10))}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px]"
                                  title="확대"
                                >
                                  + 줌
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTempCropScale(100);
                                    setTempCropPosX(0);
                                    setTempCropPosY(0);
                                  }}
                                  className="text-sky-400 hover:underline text-[10px]"
                                >
                                  중앙 초기화
                                </button>
                              </div>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="250"
                              step="5"
                              value={tempCropScale}
                              onChange={(e) => setTempCropScale(Number(e.target.value))}
                              className="w-full accent-sky-500 h-1.5 bg-slate-950 rounded cursor-pointer"
                            />
                          </div>

                          {/* 모달 액션 버튼: [자르기 및 선택영역 저장] ➔ 실제 Canvas Crop 실행 */}
                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsCropModalOpen(false)}
                              className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyCrop}
                              className="w-2/3 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/30 flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              <span>자르기 및 영역 저장</span>
                              <span>✓</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2.2 이름, 별명, 전화번호 및 시스템 2차인증 해제 시 이메일주소 입력 필드 */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          실명 (이름) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="홍길동"
                          className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          서비스 별명 (닉네임) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={signupNickname}
                          onChange={(e) => setSignupNickname(e.target.value)}
                          placeholder="pureMaster"
                          className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">협업 주석 및 공유 화면에서 다른 사용자에게 표시됩니다.</span>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          전화번호 (휴대폰) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="tel"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          placeholder="010-1234-5678"
                          className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* 시스템 설정상 2차인증 해제(미강제) 시 이메일 주소를 정보입력 화면에서 직접 수집 */}
                      {!is2FaPolicyRequired && (
                        <div className="p-3 bg-slate-900/90 border border-sky-500/30 rounded-xl space-y-1 animate-in fade-in duration-150">
                          <label className="block text-sky-300 font-medium">
                            이메일 주소 (계정 식별용) <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="email"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="user@purepdfrend.io"
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                          />
                          <span className="text-[10px] text-slate-400 block">
                            💡 2차 인증 해제 상태이므로 로그인 ID 및 알림 수신용 이메일 주소를 여기서 직접 등록합니다.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 2단계 액션 버튼 */}
                    <div className="flex gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => setSignupStep(1)}
                        className="w-1/3 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl font-medium transition-colors"
                      >
                        이전 (약관)
                      </button>
                      <button
                        type="button"
                        disabled={!signupName || !signupNickname || !signupPhone || (!is2FaPolicyRequired && !signupEmail)}
                        onClick={() => setSignupStep(3)}
                        className={`w-2/3 py-2.5 rounded-xl font-bold transition-all shadow-md ${
                          signupName && signupNickname && signupPhone && (is2FaPolicyRequired || signupEmail)
                            ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        다음단계 (인증설정) ➔
                      </button>
                    </div>
                  </div>
                )}

                {/* [3단계: 인증] 소셜인증(카카오, 네이버, 구글), 이메일인증 + 시스템 정책 연동 */}
                {signupStep === 3 && (
                  <div className="space-y-4 text-xs animate-in fade-in duration-200">
                    <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white mb-0.5">2차 본인 인증 (소셜 / 이메일)</h4>
                        <p className="text-slate-400 text-[11px]">계정 보안을 위한 2차 인증 채널을 연결합니다.</p>
                      </div>

                      {/* 시스템 보안 정책 시뮬레이터 토글 (PG-ADM-01 정책 연동) */}
                      <button
                        type="button"
                        onClick={() => setIs2FaPolicyRequired(!is2FaPolicyRequired)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all ${
                          is2FaPolicyRequired
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                        title="관리자 보안정책 시뮬레이션: 2FA 필수 여부 변경"
                      >
                        정책: {is2FaPolicyRequired ? '2FA 필수(강제)' : '2FA 해제(선택)'}
                      </button>
                    </div>

                    {/* 인증 수단 선택 탭: 카카오톡, 네이버, 구글, 이메일 (공식 SVG 로고 적용) */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        {
                          id: 'kakao',
                          name: '카카오톡',
                          color: 'hover:border-yellow-400',
                          iconSvg: (
                            <svg className="w-5 h-5 text-[#FEE500]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3C6.477 3 2 6.48 2 10.772c0 2.76 1.838 5.176 4.636 6.544l-.946 3.473c-.085.313.19.588.484.484l4.137-2.738c.552.074 1.115.113 1.689.113 5.523 0 10-3.48 10-7.772S17.523 3 12 3z" />
                            </svg>
                          ),
                        },
                        {
                          id: 'naver',
                          name: '네이버',
                          color: 'hover:border-emerald-400',
                          iconSvg: (
                            <svg className="w-4 h-4 text-[#03C75A]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
                            </svg>
                          ),
                        },
                        {
                          id: 'google',
                          name: '구글',
                          color: 'hover:border-blue-400',
                          iconSvg: (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                              />
                            </svg>
                          ),
                        },
                        {
                          id: 'email',
                          name: '이메일',
                          color: 'hover:border-purple-400',
                          iconSvg: <span className="text-base">✉️</span>,
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setAuthMethod(item.id as any);
                            setIsAuthVerified(false);
                          }}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                            authMethod === item.id
                              ? 'bg-sky-950/40 border-sky-500 text-sky-300 ring-1 ring-sky-500/30'
                              : 'bg-slate-900 border-slate-800 text-slate-400 ' + item.color
                          }`}
                        >
                          <div className="h-5 flex items-center justify-center">{item.iconSvg}</div>
                          <span className="text-[11px] font-medium">{item.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* 선택된 수단별 인증 실행 컨테이너 */}
                    <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">
                          {authMethod === 'email' ? '이메일 인증코드 발송' : `${authMethod.toUpperCase()} 계정 간편 연동 인증`}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            isAuthVerified
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isAuthVerified ? '인증완료 ✓' : '미인증 상태'}
                        </span>
                      </div>

                      {authMethod === 'email' ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="email"
                              defaultValue="user@purepdfrend.io"
                              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200"
                              placeholder="인증받을 이메일"
                            />
                            <button
                              type="button"
                              onClick={() => alert('인증번호 6자리가 발송되었습니다.')}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                            >
                              코드발송
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={authCode}
                              onChange={(e) => setAuthCode(e.target.value)}
                              placeholder="인증번호 6자리 입력 (예: 123456)"
                              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setIsAuthVerified(true)}
                              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold"
                            >
                              확인
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* [요청 4] 원클릭 연동인증: 좁아지면 아래 줄바꿈 flex-col sm:flex-row 로 유연하게 표시 */
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800/80 gap-2.5">
                          <div className="space-y-0.5">
                            <div className="text-slate-200 font-medium">{authMethod.toUpperCase()} 원클릭 OAuth 토큰 연동</div>
                            <div className="text-[10px] text-slate-500">소셜 계정의 2차 토큰과 즉시 동기화합니다.</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsAuthVerified(true)}
                            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm shrink-0 text-center"
                          >
                            원클릭 연동인증
                          </button>
                        </div>
                      )}

                      {/* 시스템 설정 정책에 따라 필수가 아닐 때: 인증 생략 안내 문구 */}
                      {!is2FaPolicyRequired && (
                        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-[11px] text-slate-400 flex items-center justify-between">
                          <span>💡 시스템 정책상 2차 인증은 <strong className="text-emerald-400">선택(옵션)</strong>입니다.</span>
                          <span className="text-slate-500 font-mono">생략 가능</span>
                        </div>
                      )}
                    </div>

                    {/* [요청 5] 3단계 액션 버튼: "가입완료" 단일 버튼만 표시하고 시스템설정 여부에 따라 버튼 활성화/비활성화 처리 */}
                    <div className="flex gap-2.5 pt-3">
                      <button
                        type="button"
                        onClick={() => setSignupStep(2)}
                        className="w-1/3 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl font-medium transition-colors"
                      >
                        이전
                      </button>

                      {/* 2차인증이 필수(강제)일 때는 인증완료시에만 활성화, 비필수(선택)일 때는 상시 활성화 */}
                      <button
                        type="button"
                        disabled={is2FaPolicyRequired && !isAuthVerified}
                        onClick={() => setSignupStep(4)}
                        className={`w-2/3 py-2.5 rounded-xl font-bold transition-all shadow-md text-xs ${
                          !is2FaPolicyRequired || isAuthVerified
                            ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                        title={is2FaPolicyRequired && !isAuthVerified ? '시스템 보안 정책상 2차 인증 완료 후 활성화됩니다.' : '회원가입을 완료합니다.'}
                      >
                        가입완료 ➔
                      </button>
                    </div>
                  </div>
                )}

                {/* [4단계: 완료] 회원가입 완료 축하 및 로그인 화면으로 이동 */}
                {signupStep === 4 && (
                  <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-lg shadow-emerald-500/10">
                      🎉
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">회원가입이 성공적으로 완료되었습니다!</h4>
                      <p className="text-xs text-slate-400">
                        <strong className="text-sky-400">{signupNickname}</strong> ({signupName}) 님의 purePDFrend 계정이 준비되었습니다.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 max-w-sm mx-auto text-left text-xs space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">닉네임:</span>
                        <span className="text-slate-300">{signupNickname}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">연락처:</span>
                        <span className="text-slate-300">{signupPhone}</span>
                      </div>
                      {!is2FaPolicyRequired && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">등록 이메일:</span>
                          <span className="text-slate-300">{signupEmail}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">2차 인증 상태:</span>
                        <span className={isAuthVerified ? 'text-emerald-400' : 'text-slate-400'}>
                          {isAuthVerified ? `${authMethod.toUpperCase()} 인증 완료` : '인증 생략 (마이페이지 설정 가능)'}
                        </span>
                      </div>
                    </div>

                    {/* [요청 5] 로그인화면 이동 버튼명: "로그인하기 ➔" 로 간결화 */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setSignupStep(1);
                        }}
                        className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
                      >
                        <span>로그인하기</span>
                        <span>➔</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PG-USR-03: 홈화면 (대시보드 및 7대 PDF 도구) */}
        {selectedProg === 'PG-USR-03' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600/40 border border-indigo-500/50 flex items-center justify-center font-bold text-white">
                  JK
                </div>
                <div>
                  <div className="text-sm font-bold text-white">jkok2j2m (시스템관리자)</div>
                  <div className="text-xs text-slate-400 font-mono">ROLE_SYSADMIN · .env 인증 완료</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-2.5 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded text-xs flex items-center gap-1">
                  🤖 에이전트 서비스
                </button>
                <button className="px-2.5 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded text-xs flex items-center gap-1">
                  🛠 관리자 서비스
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                ⚡ 7대 PDF 핵심 문서 도구 (Quick Action Grid)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { name: '1. 카메라 문서스캔', icon: '📷', desc: '실물 촬영 후 PDF 즉시 추가' },
                  { name: '2. 이미지 ➔ PDF', icon: '🖼', desc: '다중 이미지 병합 변환' },
                  { name: '3. PDF OCR', icon: '🔤', desc: '투명 텍스트 레이어 생성' },
                  { name: '4. PDF OCR ➔ TEXT', icon: '📝', desc: '텍스트 추출 및 .txt 다운로드' },
                  { name: '5. PDF 문서관리', icon: '📑', desc: '병합/추출/순서재배열/삭제' },
                  { name: '6. PDF 압축', icon: '🗜', desc: '이미지 최적화 및 용량 축소' },
                  { name: '7. PDF 보안', icon: '🔒', desc: '비밀번호 및 권한 암호화' },
                ].map((tool) => (
                  <div
                    key={tool.name}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-sky-500/50 transition-all cursor-pointer group"
                  >
                    <div className="text-xl mb-1.5">{tool.icon}</div>
                    <div className="font-semibold text-slate-200 group-hover:text-sky-400">{tool.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{tool.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PG-USR-05: 문서관리 (라이브러리) */}
        {selectedProg === 'PG-USR-05' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-slate-400 font-semibold">🔍 8대 상세 검색 필터 바</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <select className="bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200">
                  <option>문서구분: 전체</option>
                  <option>등록문서</option>
                  <option>내가 공유한 문서</option>
                  <option>공유받은 문서</option>
                </select>
                <input type="text" placeholder="문서명 / 등록자" className="bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200" />
                <input type="text" placeholder="출판사 / 저자 / 역자" className="bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200" />
                <input type="text" placeholder="ISBN 번호" className="bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-sky-600 text-white rounded">+ PDF/이미지 신규 등록</button>
                <button className="px-3 py-1 bg-slate-800 text-slate-300 rounded">주석 불러오기 (.json/.xfdf)</button>
              </div>
              <div className="flex gap-1 text-[11px] text-slate-400">
                <button className="px-2 py-0.5 bg-slate-800 text-white rounded">카드뷰</button>
                <button className="px-2 py-0.5 bg-slate-900 text-slate-500 rounded">테이블뷰</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: 'ISO 32000-2 표준 가이드북', pages: 840, version: 'v1.4', hash: 'e3b0c442...855', round: '2회독 진행중' },
                { title: 'TDD 및 도메인 주도 설계 핸드북', pages: 320, version: 'v2.0', hash: 'a1f89bc2...112', round: '완독 (3회독)' },
              ].map((doc) => (
                <div key={doc.title} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white text-sm">{doc.title}</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-[11px] font-mono">{doc.round}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex gap-3 font-mono">
                    <span>{doc.pages} 쪽</span>
                    <span>버전 {doc.version}</span>
                    <span>해시: {doc.hash}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">4종 다운로드: 원본 / 주석 / 최종본 / 보안압축</span>
                    <button className="px-2.5 py-1 bg-sky-600/30 text-sky-300 rounded hover:bg-sky-600/50">뷰어로 열기 ➔</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PG-USR-06: 문서뷰어 & 주석 스튜디오 (단일줄 툴바 + 가로 슬라이더 + 순서설정 팝업) */}
        {selectedProg === 'PG-USR-06' && (
          <div className="space-y-3">
            {/* 8대 뷰어 모드 그룹 전환 칩 바 (가로 슬라이더 적용) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-1.5">
              <HorizontalSlideContainer scrollStep={200} className="w-full">
                {[
                  { id: 'annot', name: '주석달기' },
                  { id: 'draw', name: '그리기' },
                  { id: 'sign', name: '작성및서명' },
                  { id: 'view', name: '보기' },
                  { id: 'favorite', name: '즐겨찾기' },
                  { id: 'insert', name: '삽입' },
                  { id: 'convert', name: '변환' },
                  { id: 'form', name: '양식준비' },
                ].map((grp) => {
                  const active = grp.id === activeGroup;
                  return (
                    <button
                      key={grp.id}
                      onClick={() => setActiveGroup(grp.id)}
                      className={`shrink-0 px-3 py-1.5 min-h-[36px] rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                        active
                          ? 'bg-sky-600 text-white font-bold shadow-sm ring-1 ring-sky-400'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span>{grp.name}</span>
                      <span className="text-[10px] px-1 py-0.2 bg-black/30 rounded text-slate-300">
                        {registry.getToolsForGroup(grp.id).length}
                      </span>
                    </button>
                  );
                })}
              </HorizontalSlideContainer>
            </div>

            {/* 단일줄 상단 툴바 + 가로 슬라이더 (ERR-04 보완) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center gap-2 overflow-hidden shadow-inner">
              <button className="h-9 w-9 min-w-[36px] bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 shrink-0 flex items-center justify-center text-xs" title="뒤로가기">
                ◀
              </button>
              <div className="font-bold text-slate-200 text-xs shrink-0 max-w-[120px] truncate" title="ISO 32000-2 표준 가이드북">
                ISO 32000-2...
              </div>

              {/* 가로 스크롤 스냅 슬라이더 (아이콘 전용, 텍스트 생략, 사용자 설정 및 중복 도구 인메모리 반영) */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <HorizontalSlideContainer scrollStep={180} className="w-full">
                  {activeTools.map((item, idx) => (
                    <button
                      key={`${item.id}-${idx}`}
                      onClick={() => setCurrentTool(item.id)}
                      title={`${item.name} (${viewerConfig.shortcuts[item.id] || item.defaultKey})`}
                      className={`shrink-0 h-9 w-9 min-w-[36px] rounded-lg flex items-center justify-center text-base transition-all relative ${
                        currentTool === item.id
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/50 ring-2 ring-sky-400/50'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{item.icon}</span>
                    </button>
                  ))}
                </HorizontalSlideContainer>
              </div>

              {/* 툴바 순서 설정 팝업 버튼 (⚙) */}
              <button
                onClick={() => setIsToolbarModalOpen(true)}
                className="h-9 px-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg text-xs shrink-0 flex items-center gap-1.5"
                title="툴바 순서 및 그룹 설정 팝업"
              >
                <span>⚙</span>
                <span className="hidden sm:inline text-[11px] font-medium">순서설정</span>
              </button>

              <button className="h-9 w-9 min-w-[36px] bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 shrink-0 text-xs flex items-center justify-center" title="더보기">
                ⋮
              </button>
            </div>

            {/* 뷰어 메인 워크스페이스: 좌측 드로어 + 중앙 캔버스 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[380px]">
              {/* 좌측 패널 (북마크 / 목차 / 주석) */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col text-xs">
                <div className="flex border-b border-slate-800 pb-2 mb-2 gap-2 text-slate-400">
                  <button
                    onClick={() => setActiveViewerTab('bookmarks')}
                    className={`pb-1 ${activeViewerTab === 'bookmarks' ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : ''}`}
                  >
                    북마크
                  </button>
                  <button
                    onClick={() => setActiveViewerTab('toc')}
                    className={`pb-1 ${activeViewerTab === 'toc' ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : ''}`}
                  >
                    목차(TOC)
                  </button>
                  <button
                    onClick={() => setActiveViewerTab('annots')}
                    className={`pb-1 ${activeViewerTab === 'annots' ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : ''}`}
                  >
                    주석(42)
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 text-slate-300 font-mono text-[11px]">
                  {activeViewerTab === 'toc' && (
                    <>
                      <div className="p-1.5 bg-slate-900 rounded text-sky-300">1. 개요 및 스코프 (p.1)</div>
                      <div className="pl-3 p-1.5 hover:bg-slate-900/50 rounded">1.1 아키텍처 원칙 (p.4)</div>
                      <div className="pl-3 p-1.5 hover:bg-slate-900/50 rounded">1.2 무결성 락 체계 (p.12)</div>
                      <div className="p-1.5 hover:bg-slate-900/50 rounded">2. PDF 주석 표준 사양 (p.45)</div>
                    </>
                  )}
                  {activeViewerTab === 'annots' && (
                    <div className="space-y-1">
                      <div className="p-1.5 bg-slate-900 rounded border-l-2 border-sky-400">
                        <span className="text-[10px] text-slate-500">p.14 | 형광펜 (jkok2j2m)</span>
                        <div className="text-slate-200">"하이브리드 아키텍처 설계 원칙"</div>
                      </div>
                    </div>
                  )}
                  {activeViewerTab === 'bookmarks' && (
                    <div className="text-slate-500 text-center py-4">등록된 북마크 0건</div>
                  )}
                </div>
              </div>

              {/* 중앙 PDF 페이지 캔버스 & 3단계 인터랙션 메뉴 프리뷰 */}
              <div className="md:col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                {/* 3단계 인터랙션 플로팅 툴팁 (시각적 프리뷰) */}
                <div className="p-2 bg-slate-900/95 border border-sky-500/40 rounded-lg shadow-xl flex items-center gap-2 text-xs mb-2">
                  <span className="text-sky-400 font-semibold">1단계: OCR 텍스트 선택 툴팁 ➔</span>
                  <div className="flex gap-1">
                    <button className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-[11px]">강조</button>
                    <button className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded text-[11px]">밑줄</button>
                    <button className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px]">복사</button>
                    <button className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px]">번역</button>
                  </div>
                </div>

                {/* 본문 캔버스 영역 */}
                <div className="flex-1 bg-white text-slate-900 p-6 rounded-lg shadow-inner flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-yellow-200/80 rounded w-4/5 text-[11px] text-slate-800 px-1 font-serif">
                      * 선택된 텍스트: "네트워크 단절 시에도 뷰어와 로컬 주석 이벤트 큐는 연속 실행된다."
                    </div>
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                  <div className="text-center text-slate-400 text-[11px] font-mono">
                    - Page 14 of 482 -
                  </div>
                </div>

                {/* 하단 스크롤 앵커 및 페이지 네비게이터 */}
                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                  <span>스크롤 앵커 가이드라인 활성</span>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-0.5 bg-slate-900 rounded">이전</button>
                    <span className="font-mono text-white">14 / 482</span>
                    <button className="px-2 py-0.5 bg-slate-900 rounded">다음</button>
                  </div>
                </div>
              </div>
            </div>

            {/* 툴바 순서 설정 팝업 (모달) */}
            {isToolbarModalOpen && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>⚙ 뷰어 툴바 순서 및 사용자 설정</span>
                      <span className="text-xs px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded">User Custom</span>
                    </h3>
                    <button onClick={() => setIsToolbarModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <p className="text-xs text-slate-400">
                    툴바 아이콘의 공식 명칭과 단축키를 확인하고, 그룹 내 순서를 변경하거나 자주 쓰지 않는 도구를 숨길 수 있습니다.
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto text-xs pr-1">
                    {activeTools.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-slate-500 font-mono text-[11px] w-4">{idx + 1}</span>
                          <span className="text-base">{item.icon}</span>
                          <div className="truncate">
                            <div className="text-slate-200 font-medium truncate">{item.name}</div>
                            <div className="text-[10px] text-amber-300/80 font-mono">단축키: {viewerConfig.shortcuts[item.id] || item.defaultKey}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {idx > 0 && (
                            <button
                              onClick={() => handleMoveTool(activeGroup, idx, idx - 1)}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                              title="위로 이동"
                            >
                              ▲
                            </button>
                          )}
                          {idx < activeTools.length - 1 && (
                            <button
                              onClick={() => handleMoveTool(activeGroup, idx, idx + 1)}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                              title="아래로 이동"
                            >
                              ▼
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveToolFromGroup(activeGroup, idx)}
                            className="px-1.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[11px]"
                            title="툴바에서 숨기기"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                    <button
                      onClick={() => {
                        setIsToolbarModalOpen(false);
                        setSelectedProg('PG-USR-09');
                        setSettingsTab('groups');
                      }}
                      className="text-sky-400 hover:underline text-[11px]"
                    >
                      + 다른 그룹 도구 중복추가 (설정창 열기) ➔
                    </button>
                    <div className="flex gap-2">
                      <button onClick={handleResetConfig} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]">
                        초기화 (Reset)
                      </button>
                      <button onClick={() => setIsToolbarModalOpen(false)} className="px-4 py-1.5 bg-sky-600 text-white rounded font-medium text-[11px]">
                        완료
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PG-USR-08: 오프라인 모드 & 충돌머지 (수동 즉시재연결 버튼 + diff 미리보기) */}
        {selectedProg === 'PG-USR-08' && (
          <div className="space-y-4 text-xs">
            {/* 오프라인 감지 상태바 및 수동 재연결 버튼 (ERR-05 보완) */}
            <div className={`p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 ${
              isOfflineSimulated
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{isOfflineSimulated ? '📡' : '🌐'}</span>
                <div>
                  <span className="font-bold">
                    {isOfflineSimulated ? '현재 네트워크가 오프라인 상태입니다' : '현재 온라인 네트워크에 정상 연결되었습니다'}
                  </span>
                  <p className={`text-[11px] ${isOfflineSimulated ? 'text-amber-400/80' : 'text-emerald-400/80'}`}>
                    {isOfflineSimulated
                      ? '로컬 뷰어 작업(주석 이벤트 소싱)은 중단 없이 유지되며, 재연결 시 안전하게 동기화됩니다.'
                      : '모든 로컬 주석 및 변경 내역이 실시간 동기화됩니다.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                >
                  {isOfflineSimulated ? '온라인 전환' : '오프라인 전환'}
                </button>
                <button
                  onClick={() => setIsDiffModalOpen(true)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold flex items-center gap-1 shadow"
                >
                  <span>🔄</span>
                  <span>지금 다시 연결 (수동)</span>
                </button>
              </div>
            </div>

            {/* 오프라인 로컬 이벤트 큐 현황 */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-200">📦 로컬 이벤트 소싱 큐 (IndexedDB 대기열: 3건)</span>
                <span className="text-[11px] text-emerald-400 font-mono">Draft Quarantine 보호 중</span>
              </div>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2 bg-slate-900 rounded flex justify-between items-center text-slate-300">
                  <span>1. [2026-09-27 06:40:12] ADD_ANNOTATION (p.14 형광펜)</span>
                  <span className="text-amber-400">로컬 대기</span>
                </div>
                <div className="p-2 bg-slate-900 rounded flex justify-between items-center text-slate-300">
                  <span>2. [2026-09-27 06:41:05] UPDATE_COMMENT (p.14 메모 추가)</span>
                  <span className="text-amber-400">로컬 대기</span>
                </div>
              </div>
            </div>

            {/* 충돌 diff 머지 모달 */}
            {isDiffModalOpen && (
              <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>⚠️ 주석 충돌(Conflict) 해결 및 diff 머지</span>
                      <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono">DOC-0091</span>
                    </h3>
                    <button onClick={() => setIsDiffModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <p className="text-xs text-slate-300">
                    오프라인 작업 중 다른 사용자가 서버 문서를 수정하였습니다. 보존할 버전을 선택하거나 수동 diff를 병합하세요.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                      <span className="text-indigo-400 font-semibold">내 로컬 오프라인 작업본</span>
                      <div className="text-[11px] text-slate-400">최종수정: 06:41:05</div>
                      <div className="text-[11px] text-slate-300 p-1.5 bg-slate-900 rounded mt-1 font-mono">
                        + 주석 2건 추가 (형광펜, 메모)
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                      <span className="text-emerald-400 font-semibold">원격 서버 최신본 (권장)</span>
                      <div className="text-[11px] text-slate-400">최종수정: 06:40:50 (Last-Write)</div>
                      <div className="text-[11px] text-slate-300 p-1.5 bg-slate-900 rounded mt-1 font-mono">
                        + 텍스트 레이어 교정 v2.1
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
                    <button onClick={() => setIsDiffModalOpen(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">원격본 유지</button>
                    <button onClick={() => setIsDiffModalOpen(false)} className="px-4 py-1.5 bg-indigo-600 text-white rounded font-medium">로컬 변경 스마트 병합(Merge)</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PG-USR-09: 정밀 사용자 환경설정 (단축키설정 & 도구그룹설정) */}
        {selectedProg === 'PG-USR-09' && (
          <div className="space-y-4 text-xs">
            {/* 설정 탭 전환 바 (가로 슬라이더 적용) */}
            <div className="border-b border-slate-800 pb-2">
              <HorizontalSlideContainer showScrollButtons={false} className="w-full">
                <button
                  onClick={() => setSettingsTab('groups')}
                  className={`pb-1 px-2.5 min-h-[40px] flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all ${
                    settingsTab === 'groups' ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🗂️ 도구그룹 설정 (모바일/전체)</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-sky-500/20 rounded text-sky-300">그룹간 중복허용</span>
                </button>
                <button
                  onClick={() => setSettingsTab('shortcuts')}
                  className={`pb-1 px-2.5 min-h-[40px] flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all ${
                    settingsTab === 'shortcuts' ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>⌨️ 단축키 설정 (PC·태블릿)</span>
                </button>
                <button
                  onClick={() => setSettingsTab('general')}
                  className={`pb-1 px-2.5 min-h-[40px] shrink-0 whitespace-nowrap transition-all ${
                    settingsTab === 'general' ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🎨 뷰어 및 테마 일반 옵션</span>
                </button>

                <button
                  onClick={handleResetConfig}
                  className="ml-auto px-3 py-1.5 min-h-[38px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] flex items-center gap-1 font-medium shrink-0"
                  title="기본 설정값으로 전체 초기화"
                >
                  <span>↺</span>
                  <span>설정 초기화 (Reset)</span>
                </button>
              </HorizontalSlideContainer>
            </div>

            {/* 1. 도구그룹 설정 탭: 모바일 뷰어 8대 그룹 관리 & 그룹간 중복 추가 */}
            {settingsTab === 'groups' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-white text-sm">🗂️ 모바일·태블릿 문서뷰어 도구그룹 커스터마이징</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        * 그리기에 있는 도구(예: 직사각형)를 주석달기 그룹에 <strong>'중복'</strong>으로 추가하거나, 자주 쓰는 순서대로 재배치할 수 있습니다.
                      </p>
                    </div>
                    {/* 그룹 간 중복 도구 추가 폼 */}
                    <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400">대상 그룹:</span>
                      <select
                        value={targetGroupForAdd}
                        onChange={(e) => setTargetGroupForAdd(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                      >
                        <option value="annot">주석달기 (Annotate)</option>
                        <option value="draw">그리기 (Draw)</option>
                        <option value="sign">작성 및 서명 (Sign)</option>
                        <option value="view">보기 (View)</option>
                        <option value="convert">변환 (Convert)</option>
                        <option value="form">양식 준비 (Form)</option>
                        <option value="insert">삽입 (Insert)</option>
                        <option value="favorite">즐겨찾기 (Favorite)</option>
                      </select>
                      <span className="text-[11px] text-slate-400">추가할 도구:</span>
                      <select
                        value={selectedToolToAdd}
                        onChange={(e) => setSelectedToolToAdd(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                      >
                        {registry.getAllTools().map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.icon} {t.name} ({t.id})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddToolToGroup}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-xs flex items-center gap-1 shadow"
                      >
                        <span>+</span>
                        <span>도구 추가</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 8대 그룹별 현재 편성 현황 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'annot', label: '주석달기 (Annotate)' },
                    { id: 'draw', label: '그리기 (Draw)' },
                    { id: 'sign', label: '작성 및 서명 (Sign)' },
                    { id: 'view', label: '보기 (View)' },
                    { id: 'favorite', label: '즐겨찾기 (Favorite)' },
                    { id: 'insert', label: '삽입 (Insert)' },
                    { id: 'convert', label: '변환 (Convert)' },
                    { id: 'form', label: '양식 준비 (Form)' },
                  ].map((grp) => {
                    const tools = registry.getToolsForGroup(grp.id);
                    return (
                      <div key={grp.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                            <span className="font-semibold text-slate-200">{grp.label}</span>
                            <span className="px-2 py-0.5 bg-slate-800 text-sky-400 rounded text-[10px] font-mono">
                              {tools.length}개 도구
                            </span>
                          </div>
                          <div className="space-y-1 mt-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                            {tools.map((t, idx) => (
                              <div
                                key={`${grp.id}-${t.id}-${idx}`}
                                className="p-1.5 bg-slate-900/90 rounded border border-slate-800 flex items-center justify-between text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span>{t.icon}</span>
                                  <span className="text-slate-300 truncate">{t.name}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {idx > 0 && (
                                    <button
                                      onClick={() => handleMoveTool(grp.id, idx, idx - 1)}
                                      className="text-slate-500 hover:text-white"
                                      title="위로 이동"
                                    >
                                      ▲
                                    </button>
                                  )}
                                  {idx < tools.length - 1 && (
                                    <button
                                      onClick={() => handleMoveTool(grp.id, idx, idx + 1)}
                                      className="text-slate-500 hover:text-white"
                                      title="아래로 이동"
                                    >
                                      ▼
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemoveToolFromGroup(grp.id, idx)}
                                    className="text-rose-400 hover:text-rose-300 ml-1"
                                    title="제거"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between">
                          <span>메모리 & JSON 연동</span>
                          <span className="text-indigo-400">자동 저장됨</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. 단축키 설정 탭 (PC·태블릿용 키보드 매핑) */}
            {settingsTab === 'shortcuts' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm">⌨️ PC·태블릿 뷰어 키보드 단축키 커스텀 설정</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      각 도구별 단축키를 입력창에서 직접 수정할 수 있으며, 변경 즉시 뷰어 인메모리 레지스트리에 반영됩니다.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded font-mono">
                    키보드 모드 활성
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {registry.getAllTools().map((t) => {
                    const currentKey = viewerConfig.shortcuts[t.id] || t.defaultKey;
                    return (
                      <div key={t.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{t.icon}</span>
                          <div>
                            <div className="text-slate-200 font-medium">{t.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {t.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={currentKey}
                            onChange={(e) => handleShortcutChange(t.id, e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-amber-300 text-xs font-bold"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. 일반 옵션 탭 */}
            {settingsTab === 'general' && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <span className="font-semibold text-slate-200">뷰어 보기 및 테마 일반 옵션</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span>테마 모드</span>
                    <select className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200">
                      <option>다크 모드 (기본값)</option>
                      <option>라이트 모드</option>
                      <option>세피아 모드</option>
                    </select>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span>초기 첫화면 지정</span>
                    <select className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200">
                      <option>홈 대시보드 (PG-USR-03)</option>
                      <option>문서관리 라이브러리 (PG-USR-05)</option>
                      <option>마지막 열람 문서 뷰어</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PG-USR-04: 마이페이지 > 사용자관리 (프로필/비밀번호/2FA설정/보안세션) */}
        {selectedProg === 'PG-USR-04' && (
          <div className="space-y-4 text-xs">
            {/* 프로필 정보 요약 카드 */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-900 border-2 border-sky-400 ring-2 ring-sky-500/20 shrink-0">
                  <img src={signupAvatar} alt="사용자 프로필" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{signupName}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">@{signupNickname}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">PRO 회원</span>
                  </div>
                  <div className="text-slate-400 text-xs font-mono">{signupEmail}</div>
                  <div className="text-[11px] text-slate-500">가입일: 2026-03-15 · 최근 로그인: 오늘 14:20</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProg('PG-USR-02')}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 text-xs font-medium shrink-0 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>✏️ 프로필/사진 변경</span>
              </button>
            </div>

            {/* 계정 보안 및 2FA 설정 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center justify-between pb-2 border-b border-slate-800">
                  <span>🔐 2단계 인증 (2FA) 보안 관리</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">정상 연동됨</span>
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-200">소셜 간편인증 연동 (카카오/구글)</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">연결됨</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-200">이메일 일회용 OTP 인증</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{signupEmail}</span>
                  </div>
                  <button className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-slate-800 transition-colors">
                    2FA 인증수단 재설정
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center justify-between pb-2 border-b border-slate-800">
                  <span>🔑 비밀번호 변경 및 세션</span>
                  <span className="text-[10px] text-slate-500 font-mono">30일 전 변경</span>
                </h4>
                <div className="space-y-2">
                  <input
                    type="password"
                    placeholder="현재 비밀번호"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs"
                  />
                  <input
                    type="password"
                    placeholder="새 비밀번호 (8자 이상, 특수문자 포함)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs"
                  />
                  <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-colors">
                    비밀번호 업데이트
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PG-USR-07: 문서공유 및 협업작업뷰 (공유권한/동시접속자/실시간활동피드) */}
        {selectedProg === 'PG-USR-07' && (
          <div className="space-y-4 text-xs">
            {/* 상단 공유 설정 바 */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <h4 className="font-bold text-white text-sm">🔗 문서 공유 링크 및 접근 권한 설정</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">대상 문서: ISO 32000-2 표준 가이드북 (840쪽)</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                  실시간 협업 가동중
                </span>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://purepdfrend.io/share/DOC-9821-X3A"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sky-300 font-mono text-xs select-all"
                />
                <button
                  type="button"
                  onClick={() => alert('공유 링크가 클립보드에 복사되었습니다.')}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                >
                  링크 복사
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">열람 권한</span>
                  <select className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200 text-xs">
                    <option>열람 및 주석달기 허용 (기본)</option>
                    <option>읽기 전용 (주석 불가)</option>
                    <option>공동 편집자 (완전 권한)</option>
                  </select>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">유효 기간</span>
                  <select className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200 text-xs">
                    <option>7일 후 만료</option>
                    <option>30일 후 만료</option>
                    <option>무제한 (상시 유지)</option>
                  </select>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">보안 암호 설정</span>
                  <input
                    type="password"
                    placeholder="비밀번호 미설정 (공개)"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 동시 접속자 목록 & 실시간 활동 피드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white text-sm">👥 현재 동시 열람 협업자 (3명)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div className="space-y-2">
                  {[
                    { name: '홍길동 (나)', role: '문서 소유자', page: 'p.12 열람중', color: 'border-sky-500' },
                    { name: '김철수 책임', role: '주석 검토자', page: 'p.14 형광펜 작성중', color: 'border-emerald-500' },
                    { name: '이영희 매니저', role: '단순 열람자', page: 'p.4 목차 탐색중', color: 'border-amber-500' },
                  ].map((user) => (
                    <div key={user.name} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full bg-slate-800 border-2 ${user.color} flex items-center justify-center font-bold text-[10px]`}>
                          {user.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="text-slate-200 font-medium">{user.name}</div>
                          <div className="text-[10px] text-slate-500">{user.role}</div>
                        </div>
                      </div>
                      <span className="text-[11px] text-sky-400 font-mono">{user.page}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white text-sm">⚡ 실시간 주석 & 협업 활동 피드</span>
                  <span className="text-[10px] text-slate-500 font-mono">LIVE FEED</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                  {[
                    { time: '방금 전', text: '김철수 책임님이 14페이지에 취소선 주석을 등록했습니다.' },
                    { time: '2분 전', text: '이영희 매니저님이 문서 공유 링크로 입장했습니다.' },
                    { time: '5분 전', text: '홍길동님이 12페이지에 스탬프(승인완료)를 날인했습니다.' },
                    { time: '11분 전', text: '자동 저장: 오프라인 큐가 클라우드 스토리지와 동기화되었습니다.' },
                  ].map((log, idx) => (
                    <div key={idx} className="p-2 bg-slate-900/80 rounded border border-slate-800/80 flex items-start gap-2">
                      <span className="text-[10px] text-slate-500 font-mono shrink-0 mt-0.5">{log.time}</span>
                      <span className="text-slate-300 text-[11px]">{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
