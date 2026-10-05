import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  FileText,
  Minimize2,
  Maximize2,
  Lock,
  UploadCloud,
  CheckCircle2,
  Download,
  Copy,
  Sparkles,
  Plus,
  Trash2,
  RotateCw,
  Split,
  FileCheck,
  Check,
  Pencil,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Search,
  Highlighter,
  MousePointerClick,
} from 'lucide-react';
import { ViewerConfigRegistry, ViewerConfigState } from '../../domain/ViewerConfigRegistry';
import { HorizontalSlideContainer } from '../../components/HorizontalSlideContainer';
import { WireframeTopLayer } from '../../components/WireframeTopLayer';
import { DocumentLibraryViewer, DocumentItem } from '../../components/DocumentLibraryViewer';
import { ToolStylePopover, ToolStyleState, ToolKind } from '../../components/ToolStylePopover';
import { AnnotationActionPopover, AnnotationKind } from '../../components/AnnotationActionPopover';
import { Undo2, Redo2, Sliders, PanelLeft, PanelTop, ArrowUp, ArrowDown, GripVertical, X, Share2, Columns3 } from 'lucide-react';

export const USER_PROGRAMS = [
  { id: 'PG-USR-01', name: '첫화면 (랜딩)', desc: '공개 문서조회 바, 롤링배너, 공지/리뷰/가이드 탭, 고객센터 푸터' },
  { id: 'PG-USR-02', name: '로그인 / 회원가입', desc: 'ID/PW + 소셜/이메일 2FA 탭 전환, 회원가입 프로필 및 약관동의' },
  { id: 'PG-USR-03', name: '홈화면 (대시보드)', desc: '관리자/에이전트 이동 아이콘, 프로필 위젯, 7대 PDF 핵심도구 퀵 그리드' },
  { id: 'PG-USR-04', name: '마이페이지 > 사용자관리', desc: '비밀번호 변경, 2FA 소셜/이메일 탭 설정, 프로필 이미지/닉네임 수정' },
  { id: 'PG-USR-05', name: '문서관리 (라이브러리)', desc: '8대 상세필터, 문서등록(PDF/이미지), 4종 다운로드 모달, 주석 내보내기/불러오기' },
  { id: 'PG-USR-06', name: '문서뷰어 & 주석스튜디오', desc: '단일줄 툴바+가로 슬라이더, 툴바 순서설정 팝업, 8대 모드, 3단계 주석 이벤트' },
  { id: 'PG-USR-07', name: '문서공유 및 협업작업뷰', desc: '공유권한(읽기/열람자쓰기/관리자) 설정, 동시접속자 목록, 실시간 이벤트 피드' },
  { id: 'PG-USR-08', name: '오프라인 작업 정리', desc: '리소스모드·문서모드 작업문서 정리, 충돌 머지(한쪽 반영/스마트병합), 히든주석 추적' },
  { id: 'PG-USR-09', name: '정밀 사용자 환경설정', desc: '단축키설정(PC/태블릿), 도구그룹설정(그룹간 중복허용/초기화), 뷰어/테마옵션' },
];

export interface UserWireframesProps {
  isMobileMode?: boolean;
}

export function UserWireframes({ isMobileMode: propIsMobileMode = false }: UserWireframesProps) {
  // 실제 브라우저 윈도우/iframe 너비 감지 (Google AI Studio 상단 디바이스 모바일 토글 실시간 감지)
  const [isWindowMobile, setIsWindowMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsWindowMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 와이어프레임 내부 버튼 토글과 AI스튜디오 디바이스 모드 하이브리드 연동
  const isMobileMode = propIsMobileMode || isWindowMobile;

  const [selectedProg, setSelectedProg] = useState('PG-USR-01');

  // PG-USR-03 Active Tool Subpage state (7대 PDF 핵심 문서 도구 전용 작업화면)
  const [activePdfTool, setActivePdfTool] = useState<string | null>(null);
  const [ocrEngineTab, setOcrEngineTab] = useState<'gemini' | 'tesseract' | 'paddle'>('gemini');
  const [ocrLangs, setOcrLangs] = useState<{ kor: boolean; eng: boolean; jpn: boolean }>({ kor: true, eng: true, jpn: false });
  const [compressLevel, setCompressLevel] = useState<'high' | 'recommended' | 'max'>('recommended');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedScans, setCapturedScans] = useState<number[]>([1, 2]);
  const [userPasswordInput, setUserPasswordInput] = useState('');
  const [extractedSampleText, setExtractedSampleText] = useState(
    '제 1 장 총 칙\n\n제 1 조 (목적)\n본 규정은 purePDFrend 가상화 뷰어 엔진 및 고속 주석 시스템의 표준 운용 기준을 정함을 목적으로 한다.\n\n제 2 조 (용어의 정의)\n1. "Searchable PDF"란 스캔 이미지 하단에 OCR로 인식된 투명 텍스트 레이어가 합성된 문서를 말한다.\n2. "가상화 뷰어"란 800쪽 이상의 대용량 문서에 대해 화면 가시영역 페이지만 동적 렌더링하는 고속 엔진을 말한다.'
  );
  const [isCopiedToClipboard, setIsCopiedToClipboard] = useState(false);
  const [docMgmtPages, setDocMgmtPages] = useState<Array<{ id: number; page: number; rotated: number }>>([
    { id: 1, page: 1, rotated: 0 },
    { id: 2, page: 2, rotated: 0 },
    { id: 3, page: 3, rotated: 90 },
    { id: 4, page: 4, rotated: 0 },
    { id: 5, page: 5, rotated: 0 },
    { id: 6, page: 6, rotated: 0 },
  ]);

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

  // [요청 3 반영] PG-USR-04 비밀번호 변경 접이식 서랍 및 확인 필드 상태
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const [currentPwInput, setCurrentPwInput] = useState('');
  const [newPwInput, setNewPwInput] = useState('');
  const [confirmPwInput, setConfirmPwInput] = useState('');
  const [pwUpdateMessage, setPwUpdateMessage] = useState<string | null>(null);
  const [socialLinkStates, setSocialLinkStates] = useState<{ google: boolean; kakao: boolean; naver: boolean; github: boolean }>({
    google: true,
    kakao: true,
    naver: false,
    github: true,
  });

  // [요청 반영] PG-USR-04 회원 기본정보(이름·별명·전화번호·이메일) 인라인 수정 모드 상태
  const [isInfoEditMode, setIsInfoEditMode] = useState(false);
  const [editName, setEditName] = useState('홍길동');
  const [editNickname, setEditNickname] = useState('pureMaster');
  const [editPhone, setEditPhone] = useState('010-1234-5678');
  const [editEmail, setEditEmail] = useState('hong@purepdfrend.io');
  const [infoSaveMessage, setInfoSaveMessage] = useState<string | null>(null);

  // [0013 반영] 시스템 정책에 따른 이메일/소셜/2FA 옵션화 및 인라인 인증 상태
  const [isEmailAuthPolicyRequired, setIsEmailAuthPolicyRequired] = useState(true); // 시스템 정책: 이메일 인증 필수 여부 (기본: 필수)
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const [emailInputCode, setEmailInputCode] = useState('');
  const [isEmailCodeVerified, setIsEmailCodeVerified] = useState(false);
  const [emailVerifyFeedback, setEmailVerifyFeedback] = useState<string | null>(null);

  // 시스템 정책: 소셜 연동 허용 여부 & 2FA 사용자 활성화 토글 & 주수단 & 비상 복구코드 상태
  const [isSocialAuthPolicyEnabled, setIsSocialAuthPolicyEnabled] = useState(true); // 시스템 정책: 소셜인증 옵션
  const [is2FaUserEnabled, setIs2FaUserEnabled] = useState(true); // 2FA 선택 정책일 때 사용자 ON/OFF
  const [primary2FaMethod, setPrimary2FaMethod] = useState<'kakao' | 'google' | 'naver' | 'email'>('kakao');
  const [isBackupCodeModalOpen, setIsBackupCodeModalOpen] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([
    'A9B2-4F1C', 'K3L8-9D2P', 'M5N7-1R4Q', 'P8Q2-6S9T', 'U1V4-8W3X',
    'X9Y3-5Z1A', 'B4C7-2D8E', 'F1G6-3H9J', 'J7K2-4L8M', 'N3P9-5Q1R'
  ]);

  // PG-USR-06 Viewer Toolbar state (3탭: 북마크, 목차, 주석 - 목차 탭 복구 및 'toc' 문자 제거)
  const [isToolbarModalOpen, setIsToolbarModalOpen] = useState(false);
  const [activeViewerTab, setActiveViewerTab] = useState<'bookmarks' | 'toc' | 'annots'>('bookmarks');
  const [currentTool, setCurrentTool] = useState('pen');

  // PG-USR-06 Active Document & Virtual Viewer State
  const [activeViewingDoc, setActiveViewingDoc] = useState<DocumentItem | null>({
    id: 'doc-default-iso32000',
    title: 'ISO 32000-2 표준 가이드북 및 엔터프라이즈 PDF 아카이빙 지침서',
    author: '국제표준화기구 (ISO) 기술위원회',
    publisher: '엔터프라이즈 아카이빙 출판부',
    isbn: '978-89-1234-567-8',
    categoryId: 'cat-dev-be',
    categoryPath: '개발 / IT > 백엔드 / DB (PostgreSQL)',
    lastCategory: '백엔드 / DB',
    totalPages: 800,
    readPages: 42,
    progressPercent: 5,
    lastReadAt: '10분 전',
    rawDate: '2026-09-30',
    status: 'OCR완료',
    security: '대외비',
    docType: '등록문서',
    version: 'v2.1',
    fileSize: '48.6 MB',
    round: '1회독',
    coverBg: 'from-sky-600 to-indigo-900',
    accentColor: 'sky',
  });

  // 3탭(목차, 북마크, 주석) 그룹 인터랙션 & 레이아웃 상태
  // - tabOrientation: 'vertical'(세로=좌측 패널, 고정핀 On) | 'horizontal'(가로=상단 위아래 배치, 고정핀 Off)
  // - isTabDrawerVisible: 표시/숨김 여부 (헤더의 표시/숨김 눈 아이콘과 연동)
  // - topDrawerHeightMode: 가로 모드 표시 높이 ('narrow': 3~4줄 / 'default': 7~9줄 / 'fit': 컨텐츠 맞춤)
  const [tabOrientation, setTabOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  // [요구사항 2] 모바일 모드 시 가로 모드 강제 적용 (데스크톱 복귀 시 기존 tabOrientation 원복)
  const effectiveTabOrientation = isMobileMode ? 'horizontal' : tabOrientation;
  const [isMobileGroupModalOpen, setIsMobileGroupModalOpen] = useState(false);
  const [isTabDrawerVisible, setIsTabDrawerVisible] = useState(true);
  const [topDrawerHeightMode, setTopDrawerHeightMode] = useState<'narrow' | 'default' | 'fit'>('default');

  // 주석·문서영역 전체화면 & 몰입형 독서(상·하단 토글) 상태
  const [isViewerFullscreen, setIsViewerFullscreen] = useState(false);
  const [isImmersiveZenMode, setIsImmersiveZenMode] = useState(false);

  // ESC 키 누를 시 전체화면 및 젠모드 안전 복구
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isViewerFullscreen) {
        setIsViewerFullscreen(false);
        setIsImmersiveZenMode(false);
        showToast('↩️ 일반 화면으로 복구되었습니다.', 'info');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerFullscreen]);

  // OCR 바운딩 박스 선택 및 Searchable PDF 양방향 매핑 상태
  const [selectedOcrBoxId, setSelectedOcrBoxId] = useState<string | null>(null);

  // PG-USR-06 Xodo 도구 분류 헬퍼
  const mapToolIdToKind = (toolId: string): ToolKind => {
    const id = toolId.toLowerCase();
    if (id.includes('eraser') || id.includes('지우개')) return 'eraser';
    if (id.includes('rect') || id.includes('shape') || id.includes('circle') || id.includes('arrow') || id.includes('도형')) return 'shape';
    if (id.includes('text') || id.includes('텍스트') || id.includes('note') || id.includes('callout') || id.includes('memo')) return 'text';
    if (id.includes('highlight') || id.includes('형광펜')) return 'highlighter';
    if (id.includes('underline') || id.includes('밑줄')) return 'underline';
    if (id.includes('strike') || id.includes('취소선')) return 'strike';
    if (id.includes('squiggly') || id.includes('물결')) return 'squiggly';
    return 'pen';
  };

  // PG-USR-06 벡터 주석 인터페이스 (자유펜, 도형, 텍스트 상자, 마크업 등 단일 원장 통합 및 확장 메타데이터)
  interface CanvasVectorAnnotation {
    id: string;
    page: number;
    toolKind: ToolKind;
    name: string;
    color: string;
    strokeWidth: number;
    opacity: number;
    fillColor?: string;
    fillOpacity?: number;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
    text?: string;
    pathData?: string;
    author?: string;
    date?: string;
    // 향후 OCR / AI 요약 / 다중 바운딩 박스 확장을 위한 선제적 메타데이터 필드
    rect?: { x: number; y: number; width: number; height: number };
    tags?: string[];
    isAiGenerated?: boolean;
    confidence?: number;
    memo?: string;
    ocrUpdated?: boolean; // OCR 엔진 갱신으로 텍스트 변경/불일치 감지 상태
    originalOcrText?: string;
    latestOcrText?: string;
  }

  // 캔버스 내 실시간 양방향 벡터 주석 목록 (단일 진실 공급원 - Single Source of Truth)
  const [vectorAnnotations, setVectorAnnotations] = useState<CanvasVectorAnnotation[]>([
    {
      id: 'ann-14-1',
      page: 14,
      toolKind: 'highlighter',
      name: '형광펜 강조',
      color: '#facc15',
      strokeWidth: 4,
      opacity: 85,
      text: '하이브리드 아키텍처 설계 원칙: 60fps 가상 렌더링',
      author: 'jkok2j2m',
      date: '오늘 09:30',
      tags: ['아키텍처', '성능'],
      ocrUpdated: true,
      originalOcrText: '하이브리드 아키텍처 설계 원칙: 60fps 가상 렌더링',
      latestOcrText: '하이브리드 엔진 설계 원칙: 60fps 초고속 가상 렌더링 파이프라인',
    },
    {
      id: 'vec-rect-1',
      page: 42,
      toolKind: 'shape',
      name: '핵심 개념 강조 박스',
      color: '#38bdf8',
      strokeWidth: 2,
      opacity: 90,
      fillColor: '#0284c7',
      fillOpacity: 15,
      text: 'ISO 32000-2 아카이빙 표준에 따른 무손실 보존',
      author: 'jkok2j2m',
      date: '오늘 10:15',
      tags: ['표준사양'],
    },
    {
      id: 'vec-pen-1',
      page: 42,
      toolKind: 'pen',
      name: '자유펜 강조 곡선',
      color: '#ef4444',
      strokeWidth: 3,
      opacity: 85,
      pathData: 'M 10 30 Q 70 5 130 35 T 240 20',
      author: 'jkok2j2m',
      date: '오늘 10:20',
      tags: ['필기'],
    },
    {
      id: 'vec-text-1',
      page: 42,
      toolKind: 'text',
      name: '여백 메모 스티커',
      color: '#f59e0b',
      text: '📌 800페이지 대용량 가상 윈도잉 60fps 필수 준수!',
      fontSize: 11,
      fillColor: '#fef3c7',
      textAlign: 'left',
      strokeWidth: 1,
      opacity: 95,
      author: 'jkok2j2m',
      date: '오늘 10:25',
      tags: ['메모', '중요'],
    },
    {
      id: 'ann-demo-1',
      page: 42,
      toolKind: 'underline',
      name: '본문 밑줄 주석',
      color: '#38bdf8',
      strokeWidth: 2,
      opacity: 90,
      text: '코드를 바로 실행해볼 수도 있습니다.',
      author: 'jkok2j2m',
      date: '오늘 10:30',
      tags: ['본문참조'],
      ocrUpdated: true,
      originalOcrText: '코드를 바로 실행해볼 수도 있습니다.',
      latestOcrText: '코드를 브라우저에서 바로 실시간 실행해볼 수 있습니다.',
    },
    {
      id: 'ann-85-1',
      page: 85,
      toolKind: 'underline',
      name: '메모리가드 밑줄',
      color: '#34d399',
      strokeWidth: 2,
      opacity: 90,
      text: '대용량 800페이지 LRU 페이지 메모리가드 적용 범위',
      author: '운영자',
      date: '어제 16:40',
      tags: ['메모리가드'],
      ocrUpdated: true,
      originalOcrText: '대용량 800페이지 LRU 페이지 메모리가드 적용 범위',
      latestOcrText: '대용량 800페이지 LRU 가상화 메모리가드 하이퍼 아키텍처',
    },
  ]);

  const [selectedVectorId, setSelectedVectorId] = useState<string | null>('vec-rect-1');
  const [pulseAnnotationId, setPulseAnnotationId] = useState<string | null>(null);

  // PG-USR-06 비차단 세련된 인앱 토스트 상태 (window.alert 배제 규정 준수)
  const [viewerToast, setViewerToast] = useState<{ message: string; type?: 'info' | 'success' | 'warn' } | null>(null);
  const showToast = (message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setViewerToast({ message, type });
    setTimeout(() => {
      setViewerToast((prev) => (prev?.message === message ? null : prev));
    }, 2800);
  };

  // PG-USR-06 주석 실행취소/다시실행 (Undo/Redo) 불변 히스토리 스택
  const [undoStack, setUndoStack] = useState<CanvasVectorAnnotation[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasVectorAnnotation[][]>([]);

  // 안전한 히스토리 푸시 헬퍼
  const pushAnnotationHistory = (newAnnotations: CanvasVectorAnnotation[]) => {
    setUndoStack((prev) => [...prev.slice(-25), vectorAnnotations]);
    setRedoStack([]);
    setVectorAnnotations(newAnnotations);
  };

  const handleUndoAnnotation = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, vectorAnnotations]);
    setVectorAnnotations(previous);
    if (selectedVectorId && !previous.some((a) => a.id === selectedVectorId)) {
      setSelectedVectorId(null);
    }
    showToast('↶ 주석 작업 실행취소(Undo) 완료', 'info');
  };

  const handleRedoAnnotation = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, vectorAnnotations]);
    setVectorAnnotations(next);
    showToast('↷ 주석 작업 다시실행(Redo) 완료', 'info');
  };

  const importFileRef = useRef<HTMLInputElement>(null);

  // Ctrl+Z / Ctrl+Y 전역 단축키 연동
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndoAnnotation();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedoAnnotation();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, vectorAnnotations]);

  // PG-USR-06 주석 패널 필터 및 범위 상태 (유형 다중선택 체크박스 지원)
  const [annotFilterTypes, setAnnotFilterTypes] = useState<Set<'pen' | 'shape' | 'text' | 'markup'>>(
    new Set(['pen', 'shape', 'text', 'markup'])
  );
  const [isTypeFilterDropdownOpen, setIsTypeFilterDropdownOpen] = useState(false); // [피드백 5 반영] 주석 유형 선택목록 드롭다운 펼침 상태
  const [currentOcrFocusIdx, setCurrentOcrFocusIdx] = useState(0); // [피드백 7 반영] OCR 변경건 위/아래 순차 탐색 포커스 인덱스
  const [isAutoSyncOnNavigate, setIsAutoSyncOnNavigate] = useState(false); // [피드백 7 반영] 위/아래 탐색 시 선택건 즉시 현행화 자동 옵션
  const [annotScope, setAnnotScope] = useState<'all' | 'current' | 'single'>('all');
  const [annotSinglePage, setAnnotSinglePage] = useState<number>(42);
  const [annotViewMode, setAnnotViewMode] = useState<'sequential' | 'by_page' | 'count_only'>('sequential');
  const [annotSortDirection, setAnnotSortDirection] = useState<'asc' | 'desc'>('asc');
  const [annotSortOrder, setAnnotSortOrder] = useState<'page' | 'latest'>('page');
  const [annotSearchKeyword, setAnnotSearchKeyword] = useState('');
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false); // 주석 전체삭제 2중 확인 가드레일 모달

  // PG-USR-06 목차 전용 필터 및 뷰 상태 (깊이 무제한 동적 계층 필터, 'TOC' 문자 완전 배제)
  const [tocViewMode, setTocViewMode] = useState<'tree' | 'standard'>('tree');
  const [tocMaxLevelFilter, setTocMaxLevelFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5' | 'deep'>('all');
  const [tocSearchKeyword, setTocSearchKeyword] = useState('');

  // PG-USR-06 북마크 전용 정렬 및 검색 상태
  const [bookmarkSortBy, setBookmarkSortBy] = useState<'created' | 'page'>('page');
  const [bookmarkSortDirection, setBookmarkSortDirection] = useState<'asc' | 'desc'>('asc');
  const [bookmarkSearchKeyword, setBookmarkSearchKeyword] = useState('');

  // PG-USR-06 Xodo 스타일 팝오버 및 상황별 액션 팝오버 상태
  const [isStylePopoverOpen, setIsStylePopoverOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isPageJumpPopoverOpen, setIsPageJumpPopoverOpen] = useState(false);
  const [activeAnnotationPopover, setActiveAnnotationPopover] = useState<{
    isOpen: boolean;
    annId?: string;
    text: string;
    type: AnnotationKind;
    color: string;
  }>({
    isOpen: true, // 시연 및 즉각 확인을 위해 기본 1건 열림 유지
    annId: 'ann-demo-1',
    text: '코드를 바로 실행해볼 수도 있습니다.',
    type: 'underline',
    color: '#38bdf8',
  });

  const [toolStyleState, setToolStyleState] = useState<ToolStyleState>({
    toolKind: 'shape',
    color: '#38bdf8',
    strokeWidth: 2,
    opacity: 90,
    fillColor: '#0284c7',
    fillOpacity: 15,
    fontSize: 14,
    textAlign: 'left',
    eraserSize: 20,
    eraserMode: 'stroke',
    presets: [
      { id: 'p1', name: '스카이블루', color: '#38bdf8', strokeWidth: 1.5, opacity: 80 },
      { id: 'p2', name: '에메랄드', color: '#4ade80', strokeWidth: 1.5, opacity: 80 },
      { id: 'p3', name: '노랑', color: '#facc15', strokeWidth: 2.0, opacity: 90 },
      { id: 'p4', name: '빨강', color: '#f87171', strokeWidth: 1.0, opacity: 100 },
    ],
  });

  // 양방향 실시간 동기화 핸들러 (도구 팔레트 변경 시 선택된 주석 즉각 반영 및 실행취소 스택 보존)
  const handleUpdateToolStyle = (updated: Partial<ToolStyleState>) => {
    setToolStyleState((prev) => {
      const next = { ...prev, ...updated };
      if (selectedVectorId) {
        setVectorAnnotations((currList) => {
          const nextList = currList.map((ann) => {
            if (ann.id === selectedVectorId) {
              return {
                ...ann,
                color: next.color,
                strokeWidth: next.strokeWidth,
                opacity: next.opacity,
                fillColor: next.fillColor,
                fillOpacity: next.fillOpacity,
                fontSize: next.fontSize,
                textAlign: next.textAlign,
              };
            }
            return ann;
          });
          setUndoStack((prevUndo) => [...prevUndo.slice(-25), currList]);
          setRedoStack([]);
          return nextList;
        });
      }
      return next;
    });
  };

  // PG-USR-06 Viewer Navigation & Reading Controls
  const [viewerScale, setViewerScale] = useState(1.0);
  const [viewerRotation] = useState(0); // 0, 90, 180, 270
  const [viewerCurrentPage, setViewerCurrentPage] = useState(42);
  const [viewerJumpInput, setViewerJumpInput] = useState('42');
  const [viewerSearchQuery, _setViewerSearchQuery] = useState('');
  const [viewerBookmarks, setViewerBookmarks] = useState<number[]>([1, 14, 42, 120]);

  // [0021-01 신규 인터랙션 상태]
  // 1) 3건목록 세로설정 시 너비 조절 상태 (240px ~ 480px, 기본 320px)
  const [viewerSidebarWidth, setViewerSidebarWidth] = useState(320);
  const isResizingSidebarRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(320);

  // 2) 북마크명 인라인 수정 상태
  const [bookmarkCustomTitles, setBookmarkCustomTitles] = useState<Record<number, string>>({
    1: '제 1 페이지 북마크 (총칙)',
    14: '목차 및 주요 규약 정의',
    42: '가상화 렌더링 핵심 알고리즘',
    120: 'Searchable PDF 부록'
  });
  const [editingBookmarkPage, setEditingBookmarkPage] = useState<number | null>(null);
  const [tempBookmarkTitle, setTempBookmarkTitle] = useState('');

  // 3) 툴바 순서 롱프레스 이동모드 및 드래그앤드롭 상태
  const [isReorderDragMode, setIsReorderDragMode] = useState(false);
  const [wiggleCardIdx, setWiggleCardIdx] = useState<number | null>(null);
  const [draggedToolIdx, setDraggedToolIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const longPressTimerRef = useRef<any>(null);

  // 4) 문서영역 좌우 여백 클릭 시 페이지 이동 옵션
  const [navigateOnMarginClick, setNavigateOnMarginClick] = useState(true);

  // 5) 하단 배율 및 열람 페이지수 인라인 직접입력 상태 (10단위 % 선택옵션 지원 및 단일 콤보박스 통합)
  const SCALE_OPTIONS_10 = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 250, 300];
  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState(false);
  const [isEditingScaleInput, setIsEditingScaleInput] = useState(false);
  const [tempScaleInput, setTempScaleInput] = useState('100');
  const [isEditingBottomPage, setIsEditingBottomPage] = useState(false);
  const [tempBottomPageInput, setTempBottomPageInput] = useState('42');

  // UI 정책: 가로모드 / 세로모드 전환 시 너비 및 높이 상태 현행화 핸들러
  const handleSwitchOrientation = (newOrientation: 'vertical' | 'horizontal') => {
    setTabOrientation(newOrientation);
    if (newOrientation === 'vertical') {
      if (!isMobileMode && (viewerSidebarWidth < 240 || viewerSidebarWidth > 480)) {
        setViewerSidebarWidth(320);
      }
    }
    showToast(`${newOrientation === 'vertical' ? '세로 모드(좌측 사이드바)' : '가로 모드(상단 서랍)'}로 전환되었습니다.`, 'info');
  };

  // 사이드바 분할 바 드래그 리사이저 핸들러
  const handleSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSidebarRef.current = true;
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = viewerSidebarWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingSidebarRef.current) return;
      const diff = moveEvent.clientX - resizeStartXRef.current;
      const newWidth = Math.max(240, Math.min(480, resizeStartWidthRef.current + diff));
      setViewerSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizingSidebarRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 목차 데이터 (깊이 1~7 무제한 계층 구조 지원, 'TOC' 문자 완전 배제)
  const [viewerTocItems] = useState([
    { id: 'toc-1', title: '제1편 엔터프라이즈 PDF 제작 총괄', page: 1, level: 1 },
    { id: 'toc-2', title: '1.1 아키텍처 원칙 및 60fps 가상화', page: 4, level: 2 },
    { id: 'toc-3', title: '1.1.1 렌더링 파이프라인 및 버퍼링', page: 8, level: 3 },
    { id: 'toc-4', title: '1.1.1.a 텍스처 아틀라스 생성 규약', page: 10, level: 4 },
    { id: 'toc-5', title: '1.1.1.a.1 GPU 메모리 오버플로우 방어', page: 11, level: 5 },
    { id: 'toc-5-1', title: '1.1.1.a.1.1 셰이더 버퍼 스와핑 알고리즘', page: 11, level: 6 },
    { id: 'toc-5-2', title: '1.1.1.a.1.1.a 텍셀 캐시 라인 정렬 규약', page: 12, level: 7 },
    { id: 'toc-6', title: '1.2 무결성 락 체계 및 동시성 제어', page: 12, level: 2 },
    { id: 'toc-7', title: '1.2.1 분산 락 타임아웃 처리', page: 20, level: 3 },
    { id: 'toc-8', title: '1.3 800페이지 대용량 LRU 메모리가드', page: 28, level: 2 },
    { id: 'toc-9', title: '제2편 PDF 주석 표준 사양 및 툼스톤', page: 42, level: 1 },
    { id: 'toc-10', title: '2.1 하이라이트/스티키노트 XFDF 파싱', page: 65, level: 2 },
    { id: 'toc-11', title: '2.1.1 XFDF 네임스페이스 스키마', page: 90, level: 3 },
    { id: 'toc-12', title: '2.2 투명 텍스트 레이어 Searchable PDF', page: 120, level: 2 },
    { id: 'toc-13', title: '2.2.1 OCR 바운딩 박스 매핑 기술', page: 150, level: 3 },
    { id: 'toc-14', title: '2.2.1.a HOCR 좌표 변환 계수', page: 180, level: 4 },
    { id: 'toc-15', title: '2.2.1.a.1 아핀 변환 행렬 정밀도', page: 200, level: 5 },
    { id: 'toc-16', title: '제3편 보안 암호화 및 DRM 전략', page: 240, level: 1 },
    { id: 'toc-17', title: '제4편 다국어 OCR 앙상블 파이프라인', page: 480, level: 1 },
    { id: 'toc-18', title: '부록: 표준 식별자 및 거버넌스 규약', page: 750, level: 1 },
  ]);

  // PG-USR-08 Offline state (작업 문서 단위 관리)
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(true);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [selectedConflictDoc, setSelectedConflictDoc] = useState<any>(null);
  const [offlineToast, setOfflineToast] = useState<string | null>(null);
  const [offlineWorkDocs, setOfflineWorkDocs] = useState([
    {
      docId: 'DOC-0091',
      docName: '2026_아키텍처_설계_표준서.pdf',
      docVersion: 'v2.1',
      workMode: '리소스모드',
      offlineTime: '2026-10-05 14:05:00',
      startTime: '14:10:12',
      endTime: '14:18:22',
      author: 'jkoogit@gmail.com',
      cachedPages: 10,
      totalPages: 120,
      status: '충돌감지',
      hasConflict: true,
      offlineChangeDesc: 'p.14 주석 2건 (형광펜 주황색, "낙관적 락 충돌 검토" 메모)',
      externalChangeDesc: 'p.14 주석 (클라우드 OCR 텍스트 레이어 교정 v2.1, 수정자: reviewer@pdfrend.com)',
      hiddenMetadata: null
    },
    {
      docId: 'DOC-0094',
      docName: '한국근현대사_사료집_발췌본.pdf',
      docVersion: 'v1.0',
      workMode: '문서모드',
      offlineTime: '2026-10-05 13:30:00',
      startTime: '13:35:10',
      endTime: '13:52:00',
      author: 'jkoogit@gmail.com',
      cachedPages: null,
      totalPages: 85,
      status: '온라인등록대기',
      hasConflict: false,
      offlineChangeDesc: '로컬 독립 PDF 파일 열람 및 주석 5건 작성',
      externalChangeDesc: null,
      hiddenMetadata: {
        startTime: '2026-10-05 13:35:10',
        updateTime: '2026-10-05 13:48:20',
        modifier: 'jkoogit@gmail.com',
        docNo: 'DOC-0094',
        docTitle: '한국근현대사_사료집_발췌본.pdf',
        docVersion: 'v1.0',
        endTime: '2026-10-05 13:52:00',
        annotationCount: 5,
        targetSystem: 'purePDFrend Production'
      }
    },
    {
      docId: 'DOC-0088',
      docName: 'purePDFrend_API_개발가이드.pdf',
      docVersion: 'v3.0',
      workMode: '리소스모드',
      offlineTime: '2026-10-05 14:15:00',
      startTime: '14:16:00',
      endTime: '14:20:00',
      author: 'jkoogit@gmail.com',
      cachedPages: 25,
      totalPages: 40,
      status: '바로머지가능',
      hasConflict: false,
      offlineChangeDesc: 'p.3~5 북마크 순서 변경 및 목차 보정',
      externalChangeDesc: null,
      hiddenMetadata: null
    }
  ]);

  // PG-USR-08 Search Filter states
  const [filterDocId, setFilterDocId] = useState('');
  const [filterDocTitle, setFilterDocTitle] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterWorkMode, setFilterWorkMode] = useState('ALL');
  const [filterTimeFrom, setFilterTimeFrom] = useState('');
  const [filterTimeTo, setFilterTimeTo] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');

  const filteredOfflineDocs = offlineWorkDocs.filter(doc => {
    if (filterDocId && !doc.docId.toLowerCase().includes(filterDocId.toLowerCase())) return false;
    if (filterDocTitle && !doc.docName.toLowerCase().includes(filterDocTitle.toLowerCase())) return false;
    if (filterStatus !== 'ALL' && doc.status !== filterStatus) return false;
    if (filterWorkMode !== 'ALL' && doc.workMode !== filterWorkMode) return false;
    if (filterAuthor && !doc.author.toLowerCase().includes(filterAuthor.toLowerCase())) return false;
    if (filterTimeFrom && doc.offlineTime.slice(0, 10) < filterTimeFrom) return false;
    if (filterTimeTo && doc.offlineTime.slice(0, 10) > filterTimeTo) return false;
    return true;
  });

  // PG-USR-09 Settings state
  const [settingsTab, setSettingsTab] = useState<'general' | 'shortcuts' | 'groups'>('groups');
  const [targetGroupForAdd, setTargetGroupForAdd] = useState('annot');
  const [selectedToolToAdd, setSelectedToolToAdd] = useState('rect');
  const [quickBookmarks, setQuickBookmarks] = useState<string[]>([
    'theme', 'ocr', 'virtual', 'shortcuts', 'autosave', 'masking', 'dpi', 'rect', 'highlight'
  ]);

  const toggleQuickBookmark = (id: string, name: string) => {
    if (quickBookmarks.includes(id)) {
      setQuickBookmarks(quickBookmarks.filter(b => b !== id));
      alert(`⭐ 퀵설정 해제: [${name}] 항목이 프로필 하단 퀵설정 드로어에서 제거되었습니다.`);
    } else {
      setQuickBookmarks([...quickBookmarks, id]);
      alert(`🌟 퀵설정 즐겨찾기 등록: [${name}] 항목이 프로필 하단 퀵설정 드로어에 추가되었습니다!`);
    }
  };

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

  // =========================================================================
  // PG-USR-07: 문서공유 및 협업작업 관리 상태 (제시된 검토내용 100% 반영)
  // =========================================================================
  const [shareOwnershipFilter, setShareOwnershipFilter] = useState<'all' | 'provided' | 'participated'>('all'); // [요청 3] 공유구분 검색조건
  const [shareScopeFilter, setShareScopeFilter] = useState<'all' | 'file' | 'category' | 'version'>('all');
  const [shareRoleFilter, setShareRoleFilter] = useState<'all' | 'viewer' | 'reviewer' | 'editor'>('all');
  const [sharePeriodFilter, setSharePeriodFilter] = useState<'all' | 'valid' | 'expiring' | 'expired' | 'unlimited'>('all');
  const [shareStatusFilter, setShareStatusFilter] = useState<'all' | 'active' | 'unused' | 'revoked'>('all');
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [sharePublicGuestFilter, setSharePublicGuestFilter] = useState(false);

  // 뷰어(PG-USR-06) 주석 작성자 라벨 토글 및 필터 상태
  const [showAuthorLabels, setShowAuthorLabels] = useState(false);
  const [annotAuthorFilter, setAnnotAuthorFilter] = useState<string>('all');

  // 모달 1: 공유링크 신규 등록/수정 레이어 팝업
  const [isShareCreateModalOpen, setIsShareCreateModalOpen] = useState(false);
  const [editingShareLink, setEditingShareLink] = useState<any | null>(null);
  const [shareFormTargetKind, setShareFormTargetKind] = useState<'file' | 'category'>('file');
  const [shareFormTargetDocTitle, setShareFormTargetDocTitle] = useState('ISO 32000-2 표준 가이드북');
  const [isDocSearchDropdownOpen, setIsDocSearchDropdownOpen] = useState(false);
  const [shareFormPermission, setShareFormPermission] = useState<'viewer' | 'reviewer' | 'editor'>('reviewer');
  const [shareFormPeriodKind, setShareFormPeriodKind] = useState<'unlimited' | '1d' | '7d' | '30d' | 'custom'>('7d');
  const [shareFormIsPublicRead, setShareFormIsPublicRead] = useState(true);
  const [shareFormPassword, setShareFormPassword] = useState('');
  const [shareFormPasswordConfirm, setShareFormPasswordConfirm] = useState('');

  // 후보 문서 및 카테고리 목록 (like 검색용)
  const CANDIDATE_DOCS = [
    'ISO 32000-2 표준 가이드북 및 엔터프라이즈 PDF 아카이빙 지침서',
    '2026 엔터프라이즈 클라우드 아키텍처 백서',
    'PDF OCR 텍스트 인식 및 양방향 매핑 가이드',
    'TypeScript 기반 풀스택 시스템 개발 규약집',
    'PostgreSQL 16 고성능 쿼리 최적화 핸드북',
    '2026 상반기 금융보안 인증문서군'
  ];

  const CANDIDATE_CATEGORIES = [
    '웹 프론트엔드 (React 생태계)',
    '백엔드 / DB (PostgreSQL)',
    '교양 / 인문 (역사 / 철학)',
    '엔터프라이즈 아카이빙 / 표준규격',
    '디자인 / UIUX 가이드라인',
    '사내 보안 및 개인정보처리 표준문서함'
  ];

  // 모달 2: 문서작업현황 팝업 (Collaboration Studio Modal)
  const [isCollabStatusModalOpen, setIsCollabStatusModalOpen] = useState(false);
  const [selectedCollabDocId, setSelectedCollabDocId] = useState<string>('link-1');
  const [selectedCollaboratorUserId, setSelectedCollaboratorUserId] = useState<string | null>(null);
  const [selectedRevokeUserIds, setSelectedRevokeUserIds] = useState<string[]>([]);

  // 공유링크 목록 원장 (제공 5건 + 참여 3건 = 총 8건)
  const [shareLinksList, setShareLinksList] = useState<Array<any>>([
    {
      id: 'link-1',
      myRole: 'owner',
      targetKind: 'file',
      targetName: 'ISO 32000-2 표준 가이드북',
      docId: 'DOC-9821',
      docVersion: 'v1.2',
      totalPages: 840,
      ownerName: '홍길동 (나)',
      permission: 'reviewer',
      periodKind: '7d',
      expireDateText: '2026-10-10 (D-7)',
      isExpired: false,
      isRevoked: false,
      isPublicRead: true,
      hasPassword: true,
      shareUrl: 'https://purepdfrend.io/share/DOC-9821-X3A',
      createdAt: '2026-10-01 10:00',
      updatedAt: '2026-10-03 11:30',
      activeCollaboratorCount: 3,
      recentActivityText: '김철수 책임님이 14쪽 취소선 주석 등록',
    },
    {
      id: 'link-2',
      myRole: 'owner',
      targetKind: 'category',
      targetName: '2026 상반기 금융보안 인증문서군 (외 3건)',
      docId: 'CAT-2026-FIN',
      docVersion: 'v2.0',
      totalPages: 320,
      ownerName: '홍길동 (나)',
      permission: 'viewer',
      periodKind: 'unlimited',
      expireDateText: '무제한 (상시 유지)',
      isExpired: false,
      isRevoked: false,
      isPublicRead: false,
      hasPassword: false,
      shareUrl: 'https://purepdfrend.io/share/CAT-FIN-99B',
      createdAt: '2026-09-28 14:20',
      updatedAt: '2026-09-30 09:10',
      activeCollaboratorCount: 1,
      recentActivityText: '이영희 매니저님이 4쪽 열람중',
    },
    {
      id: 'link-3',
      myRole: 'owner',
      targetKind: 'version',
      targetName: '차세대 금융 결제망 설계도 (v2.1 스냅샷)',
      docId: 'DOC-5501-V21',
      docVersion: 'v2.1',
      totalPages: 150,
      ownerName: '홍길동 (나)',
      permission: 'editor',
      periodKind: 'custom',
      expireDateText: '2026-10-05 (D-2)',
      isExpired: false,
      isRevoked: false,
      isPublicRead: false,
      hasPassword: true,
      shareUrl: 'https://purepdfrend.io/share/DOC-5501-REV',
      createdAt: '2026-09-29 16:00',
      updatedAt: '2026-10-02 18:20',
      activeCollaboratorCount: 2,
      recentActivityText: '동시 공동편집 진행중',
    },
    {
      id: 'link-4',
      myRole: 'owner',
      targetKind: 'file',
      targetName: '엔터프라이즈 모바일 디자인가이드',
      docId: 'DOC-1102',
      docVersion: 'v1.0',
      totalPages: 64,
      ownerName: '홍길동 (나)',
      permission: 'viewer',
      periodKind: '7d',
      expireDateText: '2026-09-30 (만료됨)',
      isExpired: true,
      isRevoked: false,
      isPublicRead: true,
      hasPassword: false,
      shareUrl: 'https://purepdfrend.io/share/DOC-1102-EXP',
      createdAt: '2026-09-23 09:00',
      updatedAt: '2026-09-30 23:59',
      activeCollaboratorCount: 0,
      recentActivityText: '공유 기간이 종료되었습니다.',
    },
    {
      id: 'link-5',
      myRole: 'owner',
      targetKind: 'file',
      targetName: '인사평가 및 승진 심사규정 (대외비)',
      docId: 'DOC-SEC-09',
      docVersion: 'v3.0',
      totalPages: 48,
      ownerName: '홍길동 (나)',
      permission: 'editor',
      periodKind: '30d',
      expireDateText: '권한 회수됨 (소유자)',
      isExpired: false,
      isRevoked: true,
      isPublicRead: false,
      hasPassword: true,
      shareUrl: 'https://purepdfrend.io/share/DOC-SEC-REV',
      createdAt: '2026-09-15 11:00',
      updatedAt: '2026-09-25 14:00',
      activeCollaboratorCount: 0,
      recentActivityText: '소유자에 의해 공유 권한이 회수되었습니다.',
    },
    // 참여 문서 (내가 초대받은 문서)
    {
      id: 'link-6',
      myRole: 'invited',
      targetKind: 'file',
      targetName: '2026 클라우드 네이티브 아키텍처 제안서',
      docId: 'DOC-CLOUD-26',
      docVersion: 'v2.0',
      totalPages: 120,
      ownerName: '김철수 책임',
      permission: 'editor',
      periodKind: 'unlimited',
      expireDateText: '무제한 (상시 유지)',
      isExpired: false,
      isRevoked: false,
      isPublicRead: false,
      hasPassword: true,
      shareUrl: 'https://purepdfrend.io/share/DOC-CLOUD-26',
      createdAt: '2026-10-02 11:00',
      updatedAt: '2026-10-03 12:10',
      activeCollaboratorCount: 2,
      recentActivityText: '10분 전 김철수 책임님이 열람함',
    },
    {
      id: 'link-7',
      myRole: 'invited',
      targetKind: 'category',
      targetName: '글로벌 표준 API 명세서 패키지',
      docId: 'CAT-API-STD',
      docVersion: 'v1.4',
      totalPages: 280,
      ownerName: '박상무 팀장',
      permission: 'reviewer',
      periodKind: '30d',
      expireDateText: '2026-10-20 (D-17)',
      isExpired: false,
      isRevoked: false,
      isPublicRead: false,
      hasPassword: false,
      shareUrl: 'https://purepdfrend.io/share/CAT-API-STD',
      createdAt: '2026-09-20 15:00',
      updatedAt: '2026-10-02 09:30',
      activeCollaboratorCount: 1,
      recentActivityText: '어제 박상무님이 결재 스탬프 날인',
    },
    {
      id: 'link-8',
      myRole: 'invited',
      targetKind: 'file',
      targetName: '분기 재무제표 및 감사보고서 (v1.1)',
      docId: 'DOC-FIN-Q3',
      docVersion: 'v1.1',
      totalPages: 95,
      ownerName: '이영희 매니저',
      permission: 'viewer',
      periodKind: '7d',
      expireDateText: '만료됨 (회수됨)',
      isExpired: true,
      isRevoked: true,
      isPublicRead: false,
      hasPassword: true,
      shareUrl: 'https://purepdfrend.io/share/DOC-FIN-Q3',
      createdAt: '2026-09-18 10:00',
      updatedAt: '2026-09-25 18:00',
      activeCollaboratorCount: 0,
      recentActivityText: '공유가 만료되어 문서 열람이 제한되었습니다.',
    }
  ]);

  // 실시간 작업자 목록 (동시 열람 3인 + 오프라인 1인)
  const [collaboratorsList, setCollaboratorsList] = useState<Array<any>>([
    {
      userId: 'usr-chulsoo',
      name: '김철수 책임',
      roleTitle: '주석 검토자',
      status: 'active',
      currentPage: 14,
      currentActionText: 'p.14 형광펜 작성중',
      colorBorder: 'border-emerald-500',
      avatarLetter: '김',
    },
    {
      userId: 'usr-younghee',
      name: '이영희 매니저',
      roleTitle: '단순 열람자',
      status: 'active',
      currentPage: 4,
      currentActionText: 'p.4 목차 탐색중',
      colorBorder: 'border-amber-500',
      avatarLetter: '이',
    },
    {
      userId: 'usr-sangmoo',
      name: '박상무 팀장',
      roleTitle: '문서 관리자',
      status: 'idle',
      currentPage: 1,
      currentActionText: 'p.1 표지 대기 (유휴 15분)',
      colorBorder: 'border-sky-500',
      avatarLetter: '박',
    },
    {
      userId: 'usr-seonim',
      name: '최선임 연구원',
      roleTitle: '초대된 열람자',
      status: 'offline',
      currentPage: 28,
      currentActionText: '오프라인 (3일 전 접속)',
      colorBorder: 'border-slate-600',
      avatarLetter: '최',
    },
  ]);

  // 4단계 시간 그루핑 활동 피드
  const [activityLogsList] = useState<Array<any>>([
    {
      id: 'log-1',
      timeCategory: 'just_now',
      timeText: '방금 전',
      authorName: '김철수 책임',
      actionText: '14페이지에 취소선 및 수정 의견 주석을 등록했습니다.',
      targetPage: 14,
      annotationId: 'ann-demo-1',
    },
    {
      id: 'log-2',
      timeCategory: 'just_now',
      timeText: '1분 전',
      authorName: '홍길동 (나)',
      actionText: '12페이지에 스탬프(결재 승인완료)를 날인했습니다.',
      targetPage: 12,
    },
    {
      id: 'log-3',
      timeCategory: '10m_ago',
      timeText: '8분 전',
      authorName: '이영희 매니저',
      actionText: '문서 공유 링크를 통해 열람실에 입장했습니다.',
      targetPage: 4,
    },
    {
      id: 'log-4',
      timeCategory: '10m_ago',
      timeText: '12분 전',
      authorName: '시스템 자동저장',
      actionText: '오프라인 주석 큐가 클라우드 스토리지와 성공적으로 동기화되었습니다.',
    },
    {
      id: 'log-5',
      timeCategory: '7d_ago',
      timeText: '3일 전',
      authorName: '박상무 팀장',
      actionText: '문서 공유 권한을 [검토자(주석달기 허용)]으로 승급했습니다.',
    },
    {
      id: 'log-6',
      timeCategory: '7d_ago',
      timeText: '5일 전',
      authorName: '김철수 책임',
      actionText: '85쪽에 [메모리가드 밑줄] 주석을 추가했습니다.',
      targetPage: 85,
      annotationId: 'ann-85-1',
    },
    {
      id: 'log-7',
      timeCategory: 'long_ago',
      timeText: '2주 전',
      authorName: '홍길동 (소유자)',
      actionText: 'ISO 32000-2 표준 가이드북 공유 링크(DOC-9821-X3A)를 최초 생성했습니다.',
    },
    {
      id: 'log-8',
      timeCategory: 'long_ago',
      timeText: '1개월 전',
      authorName: '시스템',
      actionText: '문서 v1.0 원본이 등록되었습니다.',
    },
  ]);

  // PG-USR-07 협업 및 공유 문서 뷰어(PG-USR-06) 즉시 오픈 핸들러
  const handleOpenDocInViewer = (
    docId: string,
    title: string,
    totalPages: number,
    ownerName: string,
    targetPage: number = 1
  ) => {
    setActiveViewingDoc((prev) => ({
      ...(prev || {
        publisher: '사내 표준문서함',
        categoryId: 'cat-dev',
        categoryPath: '사내문서',
        lastCategory: '사내문서',
        readPages: 1,
        progressPercent: 0,
        lastReadAt: '방금 전',
        rawDate: '2026-10-03',
        security: '일반',
        docType: '내가 공유한 문서',
        version: 'v1.0',
        fileSize: '18.4 MB',
        round: '1회독',
        coverBg: 'from-sky-600 to-indigo-900',
        accentColor: 'sky',
      }),
      id: docId,
      title,
      totalPages,
      author: ownerName,
      fileSize: '18.4 MB',
      status: 'OCR완료',
    }));
    setViewerCurrentPage(targetPage);
    setSelectedProg('PG-USR-06');
    setIsCollabStatusModalOpen(false);
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

  // PG-USR-06 주석 패널 통합 렌더러 (상단배치 / 좌측배치 100% 동일 로직 공유 및 단일 진실 공급원)
  const renderAnnotationPanelContent = (isTopLayout: boolean = false) => {
    // 1. 다차원 필터링 (다중선택 체크박스 Set 지원)
    const baseFiltered = vectorAnnotations.filter((ann) => {
      // 페이지 범위 필터
      if (annotScope === 'current' && ann.page !== viewerCurrentPage) return false;
      if (annotScope === 'single' && ann.page !== annotSinglePage) return false;

      // 유형 필터 (다중선택 체크박스)
      const isPen = ann.toolKind === 'pen';
      const isShape = ann.toolKind === 'shape';
      const isText = ann.toolKind === 'text';
      const isMarkup = ['underline', 'strike', 'squiggly', 'highlighter'].includes(ann.toolKind);

      const typeMatched =
        (isPen && annotFilterTypes.has('pen')) ||
        (isShape && annotFilterTypes.has('shape')) ||
        (isText && annotFilterTypes.has('text')) ||
        (isMarkup && annotFilterTypes.has('markup'));

      if (!typeMatched) return false;

      // [협업 기능] 작성자별 필터
      if (annotAuthorFilter !== 'all' && ann.author !== annotAuthorFilter) {
        return false;
      }

      // 검색어 필터 (이름, 텍스트, 작성자, 태그)
      if (annotSearchKeyword.trim()) {
        const q = annotSearchKeyword.trim().toLowerCase();
        const matchName = ann.name.toLowerCase().includes(q);
        const matchText = (ann.text || '').toLowerCase().includes(q);
        const matchAuthor = (ann.author || '').toLowerCase().includes(q);
        const matchTags = (ann.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchText && !matchAuthor && !matchTags) return false;
      }
      return true;
    });

    // 2. 오름차순/내림차순 정렬 (Secondary Sort)
    const sortedAnnots = [...baseFiltered].sort((a, b) => {
      const dir = annotSortDirection === 'asc' ? 1 : -1;
      if (annotSortOrder === 'page') {
        const pDiff = a.page - b.page;
        if (pDiff !== 0) return pDiff * dir;
        return a.id.localeCompare(b.id) * dir;
      }
      return b.id.localeCompare(a.id) * dir;
    });

    // 3. 페이지별 그룹화 맵 (페이지단위 보기 및 건수만 보기 모드용)
    const pageGroupMap = sortedAnnots.reduce((acc, ann) => {
      acc[ann.page] = acc[ann.page] || [];
      acc[ann.page].push(ann);
      return acc;
    }, {} as Record<number, CanvasVectorAnnotation[]>);

    const sortedPages = Object.keys(pageGroupMap)
      .map(Number)
      .sort((a, b) => (annotSortDirection === 'asc' ? a - b : b - a));

    const penCount = vectorAnnotations.filter((a) => a.toolKind === 'pen').length;
    const shapeCount = vectorAnnotations.filter((a) => a.toolKind === 'shape').length;
    const textCount = vectorAnnotations.filter((a) => a.toolKind === 'text').length;
    const markupCount = vectorAnnotations.filter((a) =>
      ['underline', 'strike', 'squiggly', 'highlighter'].includes(a.toolKind)
    ).length;

    // OCR 변경 감지된 주석 목록 및 건수
    const ocrUpdatedAnnots = vectorAnnotations.filter((a) => a.ocrUpdated);
    const ocrUpdatedCount = ocrUpdatedAnnots.length;

    // [피드백 5 반영] 주석 유형 목록 키 및 전체 선택 여부
    const allTypeKeys: ('pen' | 'shape' | 'text' | 'markup')[] = ['pen', 'shape', 'text', 'markup'];
    const isAllTypesSelected = annotFilterTypes.size === allTypeKeys.length;

    // [피드백 5 규칙 완벽 준수] '전체' 항목 선택 시:
    // 아래 항목들 중 하나라도 선택되어 있으면 모두 해제, 모두 해제된 상태면 한번 더 선택 시 모두 선택
    const handleToggleSelectAllTypes = () => {
      if (annotFilterTypes.size > 0) {
        setAnnotFilterTypes(new Set()); // 아래항목들 체크박스는 모두 해제
        showToast('선택 항목 체크가 모두 해제되었습니다.', 'info');
      } else {
        setAnnotFilterTypes(new Set(allTypeKeys)); // 한번더 선택하면 모두선택
        showToast('선택 항목이 모두 선택되었습니다.', 'info');
      }
    };

    // 개별 유형 체크박스 토글 핸들러
    const toggleFilterType = (type: 'pen' | 'shape' | 'text' | 'markup') => {
      setAnnotFilterTypes((prev) => {
        const next = new Set(prev);
        if (next.has(type)) {
          next.delete(type);
        } else {
          next.add(type);
        }
        return next;
      });
    };

    // [피드백 7 반영] 특정 단건 주석을 뷰포트 및 목록에서 포커스 이동
    const focusAnnotationById = (targetAnn: CanvasVectorAnnotation) => {
      setViewerCurrentPage(targetAnn.page);
      setViewerJumpInput(String(targetAnn.page));
      setSelectedVectorId(targetAnn.id);
      setPulseAnnotationId(targetAnn.id);
      setTimeout(() => setPulseAnnotationId(null), 1800);
      const el = document.getElementById(`annot-canvas-${targetAnn.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const rowEl = document.getElementById(`annot-row-${targetAnn.id}`);
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    // [피드백 7 반영] OCR 변경건 위/아래 순차 탐색 네비게이션 (▲/▼ 버튼) 및 선택건 즉시 현행화
    const handleNavigateOcr = (direction: 'prev' | 'next') => {
      if (ocrUpdatedAnnots.length === 0) return;
      const newIdx =
        direction === 'prev'
          ? (currentOcrFocusIdx - 1 + ocrUpdatedAnnots.length) % ocrUpdatedAnnots.length
          : (currentOcrFocusIdx + 1) % ocrUpdatedAnnots.length;
      setCurrentOcrFocusIdx(newIdx);
      const target = ocrUpdatedAnnots[newIdx];
      if (target) {
        focusAnnotationById(target);
        if (isAutoSyncOnNavigate) {
          handleSyncSingleAnnotationOcr(target.id);
        } else {
          showToast(`제 ${target.page}페이지 OCR 변경 주석 (${newIdx + 1}/${ocrUpdatedAnnots.length})으로 탐색했습니다.`, 'info');
        }
      }
    };

    // [피드백 7 반영] 선택건 단건 즉시 현행화 핸들러 (원터치 최신 OCR 텍스트 갱신)
    const handleSyncSingleAnnotationOcr = (targetId: string) => {
      const targetAnn = vectorAnnotations.find((a) => a.id === targetId);
      if (!targetAnn || !targetAnn.latestOcrText) return;
      const updated = vectorAnnotations.map((ann) => {
        if (ann.id === targetId) {
          return {
            ...ann,
            text: ann.latestOcrText,
            ocrUpdated: false,
          };
        }
        return ann;
      });
      pushAnnotationHistory(updated);
      showToast(`"${targetAnn.name}" 주석이 최신 OCR 텍스트로 즉시 현행화되었습니다.`, 'success');
    };

    // OCR 일괄 현행화 핸들러 (전체 일괄 갱신)
    const handleSyncAllOcrAnnotations = () => {
      if (ocrUpdatedCount === 0) {
        showToast('OCR 갱신이 필요한 주석이 없습니다.', 'info');
        return;
      }
      const updated = vectorAnnotations.map((ann) => {
        if (ann.ocrUpdated && ann.latestOcrText) {
          return {
            ...ann,
            text: ann.latestOcrText,
            ocrUpdated: false,
          };
        }
        return ann;
      });
      pushAnnotationHistory(updated);
      showToast(`OCR 변경 주석 ${ocrUpdatedCount}건이 최신 텍스트로 일괄 현행화되었습니다.`, 'success');
    };

    // 주석 전체 삭제 핸들러 (Undo 스택 보존 2중 안전 가드레일)
    const handleClearAllAnnotations = () => {
      if (vectorAnnotations.length === 0) return;
      pushAnnotationHistory([]);
      setSelectedVectorId(null);
      setIsClearAllConfirmOpen(false);
      showToast(
        `주석 전체(${vectorAnnotations.length}건)가 삭제되었습니다. (실행취소 Ctrl+Z 가능)`,
        'warn'
      );
    };

    // 단일행 아이템 렌더러 헬퍼 (인라인 임의수정 배제, 원문 보존 및 조회/복사/삭제/OCR갱신배지)
    const renderAnnotationRowItem = (ann: CanvasVectorAnnotation) => {
      const isSelected = selectedVectorId === ann.id;
      const isCurrentPage = ann.page === viewerCurrentPage;

      const typeIcon =
        ann.toolKind === 'pen'
          ? '🖊️'
          : ann.toolKind === 'shape'
          ? '■'
          : ann.toolKind === 'text'
          ? 'T'
          : ann.toolKind === 'highlighter'
          ? '🖍️'
          : '〰️';

      const typeLabel =
        ann.toolKind === 'pen'
          ? '자유펜'
          : ann.toolKind === 'shape'
          ? '도형'
          : ann.toolKind === 'text'
          ? '텍스트'
          : ann.toolKind === 'highlighter'
          ? '형광펜'
          : '밑줄';

      return (
        <div
          key={ann.id}
          id={`annot-row-${ann.id}`}
          onClick={() => {
            setViewerCurrentPage(ann.page);
            setViewerJumpInput(String(ann.page));
            setSelectedVectorId(ann.id);
            setPulseAnnotationId(ann.id);
            setTimeout(() => setPulseAnnotationId(null), 1800);

            const el = document.getElementById(`annot-canvas-${ann.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            setToolStyleState((prev) => ({
              ...prev,
              toolKind: ann.toolKind,
              color: ann.color,
              strokeWidth: ann.strokeWidth,
              opacity: ann.opacity,
              fillColor: ann.fillColor || 'transparent',
              fillOpacity: ann.fillOpacity ?? 20,
              fontSize: ann.fontSize || 14,
              textAlign: ann.textAlign || 'left',
            }));

            if (['underline', 'highlighter', 'strike', 'squiggly'].includes(ann.toolKind)) {
              setActiveAnnotationPopover({
                isOpen: true,
                annId: ann.id,
                text: ann.text || ann.name,
                type: (ann.toolKind === 'highlighter' ? 'highlight' : ann.toolKind) as any,
                color: ann.color,
              });
            }
          }}
          className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs relative group ${
            isSelected
              ? 'bg-sky-950/80 border-sky-400 ring-1 ring-sky-500/50 shadow-sm'
              : isCurrentPage
              ? 'bg-slate-900 border-slate-700/80 hover:border-slate-600'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-90'
          }`}
        >
          {/* 좌측: 페이지번호 + 색상인디케이터 + 유형 + 원문 텍스트 (수정 불가 원본 보존) + OCR갱신 뱃지 */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className={`px-1.5 py-0.5 rounded font-bold font-mono text-[10px] shrink-0 ${
                isCurrentPage
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              p.{ann.page}
            </span>
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: ann.color }}
            />
            <span className="text-[10px] text-slate-400 shrink-0 font-medium hidden sm:inline">
              [{typeIcon} {typeLabel}]
            </span>

            {/* 원문 텍스트 (임의 문구 수정 배제) */}
            <span className="truncate text-slate-200 text-xs font-sans">
              {ann.text ? `"${ann.text}"` : ann.name}
            </span>

            {/* [피드백 6, 7 반영] OCR 변경 감지 뱃지 및 단건 즉시 현행화 버튼 */}
            {ann.ocrUpdated && (
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-sans font-bold flex items-center gap-0.5"
                  title={`OCR 최신인식: "${ann.latestOcrText}"`}
                >
                  ⚠️ OCR 갱신됨
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSyncSingleAnnotationOcr(ann.id);
                  }}
                  className="px-1.5 py-0.2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[9px] transition-colors cursor-pointer shadow-2xs"
                  title="이 주석만 최신 OCR 텍스트로 즉시 현행화"
                >
                  ⚡ 즉시 현행화
                </button>
              </div>
            )}

            {ann.tags && ann.tags.length > 0 && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0 hidden md:inline font-mono">
                #{ann.tags[0]}
              </span>
            )}
          </div>

          {/* 우측: 작성자 + 퀵 복사 / 단건 삭제 버튼 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-500 font-mono hidden lg:inline">
              {ann.author || 'jkok2j2m'}
            </span>
            <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard?.writeText?.(ann.text || ann.name);
                  showToast(`"${ann.name}" 내용이 클립보드에 복사되었습니다.`, 'info');
                }}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
                title="복사"
              >
                📋
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pushAnnotationHistory(vectorAnnotations.filter((a) => a.id !== ann.id));
                  if (selectedVectorId === ann.id) setSelectedVectorId(null);
                  if (activeAnnotationPopover.annId === ann.id) {
                    setActiveAnnotationPopover((prev) => ({ ...prev, isOpen: false }));
                  }
                  showToast(`"${ann.name}" 주석이 삭제되었습니다.`, 'info');
                }}
                className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer text-xs"
                title="삭제"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-2 pb-2">
        {/* 1) 상단 고정 헤더: 실시간 검색창 + 체크박스 멀티유형필터 + 범위(현재 페이지) + 정렬(오름차순/내림차순) */}
        <div className="sticky top-0 z-10 bg-slate-950 pb-1.5 border-b border-slate-800/80 mb-1.5 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs">
            {/* 주석 실시간 검색창 */}
            <div className="relative flex-1 min-w-[140px] max-w-xs">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="주석/텍스트/태그 검색..."
                value={annotSearchKeyword}
                onChange={(e) => setAnnotSearchKeyword(e.target.value)}
                className="w-full pl-6 pr-5 py-1 bg-slate-950 border border-slate-700/80 rounded-lg text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              {annotSearchKeyword && (
                <button
                  type="button"
                  onClick={() => setAnnotSearchKeyword('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 우측 도구 그룹: 선택목록 레이어 팝업 + 범위 + 모드 + 정렬 + Undo/Redo (오른쪽 정렬) */}
            <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
              {/* [협업 기능] 작성자별 필터 드롭다운 & 일괄 삭제 */}
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-700/80 text-[10px]">
                <span className="text-slate-400">작성자:</span>
                <select
                  value={annotAuthorFilter}
                  onChange={(e) => setAnnotAuthorFilter(e.target.value)}
                  className="bg-transparent text-slate-200 font-medium focus:outline-hidden cursor-pointer"
                >
                  <option value="all">전체 작성자</option>
                  <option value="홍길동 (나)">홍길동 (나)</option>
                  <option value="김철수 책임">김철수 책임</option>
                  <option value="운영자">운영자</option>
                </select>
                {annotAuthorFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      const count = vectorAnnotations.filter((a) => a.author === annotAuthorFilter).length;
                      pushAnnotationHistory(vectorAnnotations.filter((a) => a.author !== annotAuthorFilter));
                      showToast(`🗑️ [${annotAuthorFilter}]님의 주석 ${count}건이 일괄 삭제되었습니다.`, 'warn');
                      setAnnotAuthorFilter('all');
                    }}
                    className="ml-1 text-[9px] px-1 py-0.2 bg-rose-500/20 text-rose-300 rounded hover:bg-rose-500/30 cursor-pointer"
                    title="선택된 작성자의 모든 주석 일괄 삭제"
                  >
                    일괄삭제
                  </button>
                )}
              </div>

              {/* [피드백 5 반영] 주석 선택목록 레이어 팝업 (펼쳤을 때 체크박스 목록 표시 & '전체' 토글) */}
              <div className="relative">
              <button
                type="button"
                onClick={() => setIsTypeFilterDropdownOpen(!isTypeFilterDropdownOpen)}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  isTypeFilterDropdownOpen
                    ? 'bg-sky-950 border-sky-400 text-sky-300 font-bold ring-2 ring-sky-500/40'
                    : 'bg-slate-950 border-slate-700/80 text-slate-200 hover:border-slate-600'
                }`}
                title="주석 선택목록(필터) 레이어 팝업 열기"
              >
                <span>
                  {isAllTypesSelected
                    ? '선택목록: 전체'
                    : annotFilterTypes.size === 0
                    ? '선택목록: 전체해제'
                    : `선택목록: ${annotFilterTypes.size}개`}
                </span>
                <span className={`text-[8px] text-slate-400 transition-transform duration-150 ${isTypeFilterDropdownOpen ? 'rotate-180 text-sky-400' : ''}`}>▼</span>
              </button>

              {/* 펼쳐진 선택목록 레이어 팝업 및 투명 백드롭 */}
              {isTypeFilterDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setIsTypeFilterDropdownOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-1.5 z-30 w-52 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-[10px] text-slate-400 font-bold px-1.5 pb-1 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span>주석 선택목록</span>
                        <span className="text-[9px] text-sky-400 font-mono">
                          ({annotFilterTypes.size}/{allTypeKeys.length}개)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTypeFilterDropdownOpen(false)}
                        className="text-slate-400 hover:text-white cursor-pointer text-xs p-0.5"
                        title="닫기"
                      >
                        ✕
                      </button>
                    </div>

                    {/* [피드백 5 규칙 완벽 준수] '전체' 항목: 선택하면 아래항목들 체크박스는 모두 해제, 한번더 선택하면 모두선택 */}
                    <label
                      onClick={(e) => {
                        e.preventDefault();
                        handleToggleSelectAllTypes();
                      }}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs font-semibold ${
                        annotFilterTypes.size > 0
                          ? 'bg-sky-950/70 border border-sky-500/40 text-sky-300'
                          : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isAllTypesSelected}
                          readOnly
                          className="w-3.5 h-3.5 rounded accent-sky-500 cursor-pointer pointer-events-none"
                        />
                        <span>전체</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({vectorAnnotations.length})
                      </span>
                    </label>

                    <div className="w-full h-px bg-slate-800 my-0.5" />

                    {/* 개별 하위 항목 체크박스 목록 */}
                    {[
                      { id: 'pen' as const, label: '자유펜 필기', icon: '🖊️', count: penCount },
                      { id: 'shape' as const, label: '도형 강조', icon: '■', count: shapeCount },
                      { id: 'text' as const, label: '텍스트 메모', icon: 'T', count: textCount },
                      { id: 'markup' as const, label: '마크업(밑줄/형광펜)', icon: '🖍️', count: markupCount },
                    ].map((t) => {
                      const checked = annotFilterTypes.has(t.id);
                      return (
                        <label
                          key={t.id}
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFilterType(t.id);
                          }}
                          className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition-colors text-xs ${
                            checked
                              ? 'bg-sky-600/20 text-sky-300 font-bold border border-sky-500/30'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              className="w-3.5 h-3.5 rounded accent-sky-500 cursor-pointer pointer-events-none"
                            />
                            <span>{t.icon} {t.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({t.count})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* [피드백 6 반영] 범위 선택 드롭다운: 쪽수표현 제거 ➔ '현재 페이지' 표기 */}
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400 hidden sm:inline">범위:</span>
              <select
                value={annotScope}
                onChange={(e) => setAnnotScope(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 font-medium cursor-pointer"
              >
                <option value="all">전체 문서</option>
                <option value="current">현재 페이지</option>
                <option value="single">지정 페이지만</option>
              </select>
              {annotScope === 'single' && (
                <input
                  type="number"
                  min={1}
                  max={activeViewingDoc?.totalPages || 800}
                  value={annotSinglePage}
                  onChange={(e) => setAnnotSinglePage(parseInt(e.target.value, 10) || 1)}
                  className="w-12 px-1 py-0.5 bg-slate-950 border border-slate-700 rounded text-center text-sky-400 font-mono"
                />
              )}
            </div>

            {/* 보기 모드: 순서대로보기 / 페이지단위 / 건수만보기 */}
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400 hidden sm:inline">모드:</span>
              <select
                value={annotViewMode}
                onChange={(e) => setAnnotViewMode(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 font-medium cursor-pointer"
              >
                <option value="sequential">순서대로 보기</option>
                <option value="by_page">페이지단위 보기</option>
                <option value="count_only">건수만 보기</option>
              </select>
            </div>

              {/* [피드백 04 반영] 정렬 기준 및 고인식성 볼드 화살표 아이콘으로 통일 (텍스트 제거) */}
              <div className="flex items-center gap-1 text-[10px]">
                <select
                  value={annotSortOrder}
                  onChange={(e) => setAnnotSortOrder(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 font-medium cursor-pointer"
                >
                  <option value="page">페이지순</option>
                  <option value="latest">최신등록순</option>
                </select>
                <button
                  type="button"
                  onClick={() => setAnnotSortDirection(annotSortDirection === 'asc' ? 'desc' : 'asc')}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 cursor-pointer flex items-center justify-center transition-colors shadow-2xs shrink-0"
                  title={annotSortDirection === 'asc' ? '오름차순 정렬 (클릭 시 내림차순)' : '내림차순 정렬 (클릭 시 오름차순)'}
                >
                  {annotSortDirection === 'asc' ? (
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                  )}
                </button>
              </div>

            {/* 퀵 Undo / Redo */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                disabled={undoStack.length === 0}
                onClick={handleUndoAnnotation}
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                  undoStack.length > 0 ? 'text-sky-300 hover:bg-slate-800 cursor-pointer' : 'text-slate-600 cursor-not-allowed'
                }`}
                title="실행취소 (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5 stroke-[2]" />
              </button>
              <button
                type="button"
                disabled={redoStack.length === 0}
                onClick={handleRedoAnnotation}
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                  redoStack.length > 0 ? 'text-sky-300 hover:bg-slate-800 cursor-pointer' : 'text-slate-600 cursor-not-allowed'
                }`}
                title="다시실행 (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>

          {/* [피드백 6, 7 반영] OCR 변경건 위/아래(▲/▼) 순차 탐색 및 선택건 즉시 현행화 배너 */}
          {ocrUpdatedCount > 0 && (
            <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center gap-2 text-amber-300">
                <span className="text-sm">⚠️</span>
                <span className="font-semibold text-[11px]">
                  OCR 갱신 대상: <strong className="text-white font-mono">{Math.min(currentOcrFocusIdx + 1, ocrUpdatedCount)}</strong> / {ocrUpdatedCount}건
                </span>

                {/* [피드백 7 반영] 위/아래(▲/▼) 순차 탐색 버튼 */}
                <div className="flex items-center gap-1 bg-slate-900 border border-amber-500/50 rounded-lg px-2 py-0.5 shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleNavigateOcr('prev')}
                    className="px-1.5 py-0.5 hover:bg-slate-800 text-amber-300 hover:text-white rounded cursor-pointer text-[11px] font-bold flex items-center gap-0.5 transition-colors"
                    title="이전 (위) OCR 변경 주석으로 탐색"
                  >
                    <span>▲</span>
                    <span>위</span>
                  </button>
                  <span className="text-slate-600 text-xs">|</span>
                  <button
                    type="button"
                    onClick={() => handleNavigateOcr('next')}
                    className="px-1.5 py-0.5 hover:bg-slate-800 text-amber-300 hover:text-white rounded cursor-pointer text-[11px] font-bold flex items-center gap-0.5 transition-colors"
                    title="다음 (아래) OCR 변경 주석으로 탐색"
                  >
                    <span>▼</span>
                    <span>아래</span>
                  </button>
                </div>

                {/* [피드백 7 반영] 탐색 시 즉시 현행화 자동 옵션 */}
                <label className="flex items-center gap-1 text-[10px] text-amber-200/90 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAutoSyncOnNavigate}
                    onChange={(e) => setIsAutoSyncOnNavigate(e.target.checked)}
                    className="w-3 h-3 rounded accent-amber-500 cursor-pointer"
                  />
                  <span>탐색 시 자동 현행화</span>
                </label>
              </div>

              <div className="flex items-center gap-1.5">
                {/* [피드백 7 반영] 선택건 즉시 현행화 버튼 */}
                <button
                  type="button"
                  onClick={() => {
                    const target = ocrUpdatedAnnots[currentOcrFocusIdx] || ocrUpdatedAnnots[0];
                    if (target) handleSyncSingleAnnotationOcr(target.id);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                  title="현재 포커스/선택된 OCR 변경 주석을 즉시 현행화"
                >
                  <span>⚡</span>
                  <span>선택건 즉시 현행화</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncAllOcrAnnotations}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-bold text-[10px] transition-colors cursor-pointer"
                  title="모든 OCR 변경 주석을 일괄 현행화"
                >
                  🔄 전체 일괄
                </button>
              </div>
            </div>
          )}
        </div>

        {/* [피드백 3 반영] 모드별 주석 목록 렌더링: 타이틀 고정, 목록영역만 스크롤 적용 */}
        <div
          className={`space-y-1 overflow-y-auto pr-1 transition-all duration-200 ${
            isTopLayout
              ? topDrawerHeightMode === 'narrow'
                ? 'max-h-28'
                : topDrawerHeightMode === 'default'
                ? 'max-h-60'
                : 'max-h-none'
              : ''
          }`}
        >
        {sortedAnnots.length > 0 ? (
          <div className="space-y-1">
            {/* 2-1) 모드 A: 순서대로 보기 (Sequential List - 한 줄에 하나) */}
            {annotViewMode === 'sequential' && (
              <div className="space-y-1">
                {sortedAnnots.map((ann) => renderAnnotationRowItem(ann))}
              </div>
            )}

            {/* 2-2) 모드 B: 페이지단위로 보기 (Grouped by Page) */}
            {annotViewMode === 'by_page' && (
              <div className="space-y-2">
                {sortedPages.map((pageNo) => {
                  const items = pageGroupMap[pageNo] || [];
                  const isCur = pageNo === viewerCurrentPage;
                  return (
                    <div
                      key={pageNo}
                      className="rounded-lg border border-slate-800 bg-slate-950/70 overflow-hidden"
                    >
                      <div
                        onClick={() => {
                          setViewerCurrentPage(pageNo);
                          setViewerJumpInput(String(pageNo));
                        }}
                        className={`px-3 py-1 text-xs font-bold font-mono flex items-center justify-between cursor-pointer transition-colors ${
                          isCur
                            ? 'bg-sky-950/80 text-sky-300 border-b border-sky-500/30'
                            : 'bg-slate-900/80 text-slate-300 hover:bg-slate-900 border-b border-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>📄 제 {pageNo} 페이지</span>
                          {isCur && <span className="text-[10px] text-sky-400 font-sans">(현재 페이지)</span>}
                        </span>
                        <span className="text-[10px] text-slate-400">{items.length}건의 주석</span>
                      </div>
                      <div className="p-1 space-y-1">
                        {items.map((ann) => renderAnnotationRowItem(ann))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2-3) 모드 C: 페이지기준으로 건수만 보기 (Count Only Overview) */}
            {annotViewMode === 'count_only' && (
              <div className="space-y-1 font-mono text-xs">
                {sortedPages.map((pageNo) => {
                  const items = pageGroupMap[pageNo] || [];
                  const isCur = pageNo === viewerCurrentPage;
                  return (
                    <div
                      key={pageNo}
                      onClick={() => {
                        setViewerCurrentPage(pageNo);
                        setViewerJumpInput(String(pageNo));
                        showToast(`제 ${pageNo} 페이지로 이동했습니다.`, 'info');
                      }}
                      className={`px-3 py-1.5 rounded-lg border flex items-center justify-between transition-colors cursor-pointer ${
                        isCur
                          ? 'bg-sky-950/80 border-sky-500 text-sky-300 font-bold'
                          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">제 {pageNo} 페이지</span>
                        {isCur && <span className="text-[10px] text-sky-400 font-sans">[현재 페이지]</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          {items.some((i) => i.toolKind === 'highlighter') && <span>🖍️</span>}
                          {items.some((i) => ['underline', 'strike', 'squiggly'].includes(i.toolKind)) && <span>〰️</span>}
                          {items.some((i) => i.toolKind === 'text') && <span>T</span>}
                          {items.some((i) => i.toolKind === 'shape') && <span>■</span>}
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-xs border border-sky-500/30">
                          {items.length} 건
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Empty State 친절한 안내 */
          <div className="p-4 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-center space-y-2 my-2">
            <p className="text-slate-400 text-xs font-sans">
              조건에 일치하는 주석이 없습니다.
            </p>
            <div className="flex justify-center gap-1.5 pt-1">
              {(annotFilterTypes.size < 4 || annotScope !== 'all' || annotSearchKeyword) && (
                <button
                  type="button"
                  onClick={() => {
                    setAnnotFilterTypes(new Set(['pen', 'shape', 'text', 'markup']));
                    setAnnotScope('all');
                    setAnnotSearchKeyword('');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  필터 초기화
                </button>
              )}
            </div>
          </div>
        )}
        </div>

        {/* 3) 하단 주석 백업 / 내보내기 / 전체삭제 퀵 액션 바 */}
        <input
          type="file"
          ref={importFileRef}
          accept=".json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                const parsed = JSON.parse(event.target?.result as string);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  pushAnnotationHistory(parsed);
                  showToast(`주석 ${parsed.length}건을 성공적으로 불러왔습니다.`, 'success');
                }
              } catch (err) {
                showToast('주석 파일 파싱에 실패했습니다.', 'warn');
              }
            };
            reader.readAsText(file);
          }}
          className="hidden"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>주석 동기화/백업:</span>
            <button
              type="button"
              onClick={() => importFileRef.current?.click()}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
            >
              불러오기 (.json)
            </button>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(vectorAnnotations, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `purepdf_annotations_p${viewerCurrentPage}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('주석 JSON 파일 다운로드가 완료되었습니다.', 'success');
              }}
              className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold cursor-pointer"
            >
              내보내기 (.json)
            </button>
            <button
              type="button"
              onClick={() => {
                showToast('ISO 32000-2 표준 XFDF 주석 스트림이 생성되어 클립보드에 내보내졌습니다.', 'success');
              }}
              className="px-2 py-0.5 rounded bg-sky-950/70 hover:bg-sky-900/80 border border-sky-600/40 text-sky-300 font-mono text-[10px] cursor-pointer"
              title="ISO XFDF 표준 내보내기"
            >
              XFDF
            </button>
          </div>

          {/* [피드백 10 반영] 주석 전체삭제 버튼 (안전한 접근성 격리 및 2중 확인 가드레일) */}
          <div className="flex items-center gap-1.5">
            {vectorAnnotations.length > 0 && (
              <button
                type="button"
                onClick={() => setIsClearAllConfirmOpen(true)}
                className="px-2 py-0.5 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 text-[10px] font-medium transition-colors cursor-pointer"
                title="모든 주석 일괄 삭제 (확인 팝업 후 진행)"
              >
                🗑️ 주석 전체 삭제
              </button>
            )}
          </div>
        </div>

        {/* [피드백 10 반영] 주석 전체삭제 2중 확인 가드레일 모달 */}
        {isClearAllConfirmOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
            <div className="bg-slate-900 border border-rose-500/50 rounded-xl p-4 max-w-sm w-full space-y-3 shadow-2xl">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <span>⚠️</span>
                <span>주석 전체 삭제 확인</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                현재 문서에 작성된 <strong className="text-rose-400">{vectorAnnotations.length}건</strong>의 모든 주석을 삭제하시겠습니까?
              </p>
              <p className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
                💡 삭제 직후 <strong className="text-sky-300 font-mono">Ctrl + Z</strong> (실행취소) 키를 누르시면 언제든 삭제 전 상태로 100% 안전하게 복구할 수 있습니다.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsClearAllConfirmOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleClearAllAnnotations}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  전체 삭제 실행
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // PG-USR-06 목차 전용 1열 단일행 목록 렌더러 (깊이 무제한 동적 계층, 검색어, 계층필터 지원, 'toc' 문자 배제)
  const renderTocPanelContent = (isTopLayout: boolean = false) => {
    const filteredToc = viewerTocItems.filter((item) => {
      // 계층 필터 (깊이 무제한 지원)
      if (tocMaxLevelFilter !== 'all') {
        if (tocMaxLevelFilter === 'deep') {
          if (item.level < 6) return false;
        } else {
          const maxL = parseInt(tocMaxLevelFilter, 10);
          if (item.level > maxL) return false;
        }
      }
      // 검색어 필터
      if (tocSearchKeyword.trim()) {
        const q = tocSearchKeyword.trim().toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchPage =
          `p.${item.page}`.includes(q) ||
          `${item.page}페이지`.includes(q) ||
          `${item.page}쪽`.includes(q) ||
          String(item.page).includes(q);
        if (!matchTitle && !matchPage) return false;
      }
      return true;
    });

    return (
      <div className="space-y-2 pb-2">
        {/* 상단 고정 툴바: 검색창 + 계층필터(깊이 무제한) + 뷰모드(계층보기/표준보기) */}
        <div className="sticky top-0 z-10 bg-slate-950 pb-1.5 border-b border-slate-800/80 mb-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs">
            {/* 목차 검색창 */}
            <div className="relative flex-1 min-w-[140px] max-w-xs">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="목차 제목/페이지 검색..."
                value={tocSearchKeyword}
                onChange={(e) => setTocSearchKeyword(e.target.value)}
                className="w-full pl-6 pr-5 py-1 bg-slate-950 border border-slate-700/80 rounded-lg text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              {tocSearchKeyword && (
                <button
                  type="button"
                  onClick={() => setTocSearchKeyword('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 우측 도구 그룹: 계층필터 + 뷰모드 + 항목 수 (오른쪽 정렬) */}
            <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
              {/* 계층선택 필터: 깊이 제한 없는 동적 계층 선택 */}
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-slate-400 hidden sm:inline">계층필터:</span>
                <select
                  value={tocMaxLevelFilter}
                  onChange={(e) => setTocMaxLevelFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 font-medium cursor-pointer"
                >
                  <option value="all">전체 깊이 (제한 없음)</option>
                  <option value="1">1계층만 (대단원)</option>
                  <option value="2">2계층까지 (대절)</option>
                  <option value="3">3계층까지 (중절)</option>
                  <option value="4">4계층까지 (소절)</option>
                  <option value="5">5계층까지 (세부항목)</option>
                  <option value="deep">심층 계층 (6계층 이상)</option>
                </select>
              </div>

              {/* 뷰 모드: 계층보기(들여쓰기 트리) vs 표준보기(플랫 정렬) */}
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-slate-400 hidden sm:inline">보기:</span>
                <select
                  value={tocViewMode}
                  onChange={(e) => setTocViewMode(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 font-medium cursor-pointer"
                >
                  <option value="tree">계층보기 (트리)</option>
                  <option value="standard">표준보기 (플랫)</option>
                </select>
              </div>

              <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                {filteredToc.length}개 항목
              </span>
            </div>
          </div>
        </div>

        {/* 목차 단일행 목록: 타이틀 고정, 목록영역만 스크롤 & 깊이 무제한 동적 들여쓰기 */}
        {filteredToc.length > 0 ? (
          <div
            className={`space-y-1 font-mono text-xs overflow-y-auto pr-1 transition-all duration-200 ${
              isTopLayout
                ? topDrawerHeightMode === 'narrow'
                  ? 'max-h-28'
                  : topDrawerHeightMode === 'default'
                  ? 'max-h-60'
                  : 'max-h-none'
                : ''
            }`}
          >
            {filteredToc.map((item) => {
              const isCur = viewerCurrentPage === item.page;
              const indentRem =
                tocViewMode === 'tree' ? Math.max(0.625, (item.level - 1) * 0.85 + 0.625) : 0.625;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setViewerCurrentPage(item.page);
                    setViewerJumpInput(String(item.page));
                    showToast(`목차 [${item.title}] (제 ${item.page}페이지)로 이동했습니다.`, 'info');
                  }}
                  style={{ paddingLeft: `${indentRem}rem` }}
                  className={`py-1.5 pr-2.5 rounded-lg border flex items-center justify-between transition-colors cursor-pointer group ${
                    isCur
                      ? 'bg-sky-950/80 border-sky-500 text-sky-300 font-bold shadow-xs'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[10px] text-slate-500 shrink-0 font-sans">
                      L{item.level}
                    </span>
                    <span className="truncate font-sans font-medium text-slate-200">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono text-sky-400">
                      p.{item.page}
                    </span>
                    {isCur && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 font-sans font-bold">
                        현재 페이지
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-center space-y-2 my-2">
            <p className="text-slate-400 text-xs font-sans">검색 조건에 일치하는 목차 항목이 없습니다.</p>
            {(tocSearchKeyword || tocMaxLevelFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setTocSearchKeyword('');
                  setTocMaxLevelFilter('all');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
              >
                필터 초기화
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // PG-USR-06 북마크 전용 1열 단일행 목록 렌더러 (한 줄에 하나, 생성기준/페이지기준, 오름차순/내림차순, 검색 지원)
  const renderBookmarkPanelContent = (isTopLayout: boolean = false) => {
    // 1. 검색어 필터링
    const filteredPages = viewerBookmarks.filter((p) => {
      if (!bookmarkSearchKeyword.trim()) return true;
      const q = bookmarkSearchKeyword.trim();
      return String(p).includes(q) || `${p}페이지`.includes(q) || `${p}쪽`.includes(q);
    });

    // 2. 정렬 (생성기준 vs 페이지기준, 오름차순 vs 내림차순)
    const sortedBookmarkPages = [...filteredPages].sort((a, b) => {
      const dir = bookmarkSortDirection === 'asc' ? 1 : -1;
      if (bookmarkSortBy === 'page') {
        return (a - b) * dir;
      }
      // 생성기준 (배열 인덱스 순서 유지)
      const idxA = viewerBookmarks.indexOf(a);
      const idxB = viewerBookmarks.indexOf(b);
      return (idxA - idxB) * dir;
    });

    return (
      <div className="space-y-2 pb-2">
        {/* 상단 고정 툴바: 검색창 + 정렬기준(페이지/생성) + 오름차순/내림차순 + 현재 페이지 북마크 추가 */}
        <div className="sticky top-0 z-10 bg-slate-950 pb-1.5 border-b border-slate-800/80 mb-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs">
            {/* 북마크 검색창 */}
            <div className="relative flex-1 min-w-[130px] max-w-xs">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="북마크 페이지 검색..."
                value={bookmarkSearchKeyword}
                onChange={(e) => setBookmarkSearchKeyword(e.target.value)}
                className="w-full pl-6 pr-5 py-1 bg-slate-950 border border-slate-700/80 rounded-lg text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              {bookmarkSearchKeyword && (
                <button
                  type="button"
                  onClick={() => setBookmarkSearchKeyword('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 우측 정렬 도구 그룹: 정렬 기준 + 오름/내림차순 토글 + 현재 페이지 북마크 추가 (오른쪽 정렬) */}
            <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
              {/* 정렬 기준: 페이지순 vs 생성순 */}
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-slate-400 hidden sm:inline">정렬:</span>
                <select
                  value={bookmarkSortBy}
                  onChange={(e) => setBookmarkSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 font-medium cursor-pointer"
                >
                  <option value="page">페이지순</option>
                  <option value="created">생성순</option>
                </select>
              </div>

              {/* [피드백 04 반영] 오름차순 / 내림차순 토글 (고인식성 볼드 화살표 아이콘으로 통일 및 텍스트 배제) */}
              <button
                type="button"
                onClick={() => setBookmarkSortDirection(bookmarkSortDirection === 'asc' ? 'desc' : 'asc')}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 cursor-pointer flex items-center justify-center transition-colors shadow-2xs shrink-0"
                title={bookmarkSortDirection === 'asc' ? '오름차순 정렬 (클릭 시 내림차순)' : '내림차순 정렬 (클릭 시 오름차순)'}
              >
                {bookmarkSortDirection === 'asc' ? (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>

              {/* [피드백 9 반영] 현재 페이지 북마크 추가 (용어 통일: 쪽 -> 페이지) */}
              <button
                type="button"
                onClick={() => {
                  if (!viewerBookmarks.includes(viewerCurrentPage)) {
                    setViewerBookmarks([...viewerBookmarks, viewerCurrentPage]);
                    showToast(`제 ${viewerCurrentPage}페이지가 북마크에 추가되었습니다.`, 'success');
                  } else {
                    showToast(`제 ${viewerCurrentPage}페이지는 이미 북마크되어 있습니다.`, 'info');
                  }
                }}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer"
              >
                + 현재 {viewerCurrentPage}페이지 추가
              </button>
            </div>
          </div>
        </div>

        {/* [피드백 3 반영] 북마크 단일행 목록: 타이틀 고정, 목록영역만 스크롤 */}
        {sortedBookmarkPages.length > 0 ? (
          <div
            className={`space-y-1 font-mono text-xs overflow-y-auto pr-1 transition-all duration-200 ${
              isTopLayout
                ? topDrawerHeightMode === 'narrow'
                  ? 'max-h-28'
                  : topDrawerHeightMode === 'default'
                  ? 'max-h-60'
                  : 'max-h-none'
                : ''
            }`}
          >
            {sortedBookmarkPages.map((page) => {
              const isCur = viewerCurrentPage === page;
              const isEditing = editingBookmarkPage === page;
              const titleText = bookmarkCustomTitles[page] || `제 ${page} 페이지 북마크`;

              return (
                <div
                  key={page}
                  className={`px-3 py-1.5 rounded-lg border flex items-center justify-between transition-colors group gap-2 ${
                    isCur
                      ? 'bg-sky-950/80 border-sky-500 text-sky-300 font-bold shadow-xs'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span>🔖</span>
                      <input
                        type="text"
                        value={tempBookmarkTitle}
                        onChange={(e) => setTempBookmarkTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (tempBookmarkTitle.trim()) {
                              setBookmarkCustomTitles((prev) => ({ ...prev, [page]: tempBookmarkTitle.trim() }));
                              showToast(`제 ${page}페이지 북마크명이 수정되었습니다.`, 'success');
                            }
                            setEditingBookmarkPage(null);
                          } else if (e.key === 'Escape') {
                            setEditingBookmarkPage(null);
                          }
                        }}
                        autoFocus
                        className="px-2 py-0.5 bg-slate-950 border border-sky-400 rounded text-xs text-white flex-1 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tempBookmarkTitle.trim()) {
                            setBookmarkCustomTitles((prev) => ({ ...prev, [page]: tempBookmarkTitle.trim() }));
                            showToast(`제 ${page}페이지 북마크명이 수정되었습니다.`, 'success');
                          }
                          setEditingBookmarkPage(null);
                        }}
                        className="p-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[10px] cursor-pointer"
                        title="저장 (Enter)"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingBookmarkPage(null)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                        title="취소 (Esc)"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setViewerCurrentPage(page);
                        setViewerJumpInput(String(page));
                        showToast(`제 ${page}페이지로 이동했습니다.`, 'info');
                      }}
                      className="flex items-center gap-2 cursor-pointer hover:underline text-left flex-1 min-w-0"
                    >
                      <span>🔖</span>
                      <span className="font-bold text-sky-300 truncate">{titleText}</span>
                      {isCur && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 font-sans shrink-0">
                          현재 페이지
                        </span>
                      )}
                    </button>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingBookmarkPage(page);
                          setTempBookmarkTitle(titleText);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="북마크명 수정"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                        {activeViewingDoc?.title ? `${activeViewingDoc.title.slice(0, 15)}...` : '표준문서'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setViewerBookmarks(viewerBookmarks.filter((b) => b !== page));
                          showToast(`제 ${page}페이지 북마크가 해제되었습니다.`, 'info');
                        }}
                        className="text-slate-500 hover:text-rose-400 text-xs px-1.5 py-0.5 rounded hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="북마크 해제"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-center space-y-2 my-2">
            <p className="text-slate-400 text-xs font-sans">등록된 북마크가 없거나 검색 조건과 일치하지 않습니다.</p>
            {bookmarkSearchKeyword && (
              <button
                type="button"
                onClick={() => setBookmarkSearchKeyword('')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
              >
                검색어 초기화
              </button>
            )}
          </div>
        )}
      </div>
    );
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
      <div className={`bg-slate-900/90 border border-slate-800 rounded-2xl ${isMobileMode ? 'p-2.5 sm:p-4' : 'p-5'} shadow-2xl space-y-6 min-h-[540px]`}>
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
            {/* [요청 반영] 7대 PDF 문서도구: 선택 여부에 따른 화면 분기 (프로필 및 서비스 버튼은 WireframeTopLayer 단일 모듈에서 전담) */}
            {activePdfTool === null ? (
              /* 기본 대시보드 뷰: 7대 도구 선택 퀵 그리드 */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      7대 PDF 핵심 문서 도구 (Quick Action Studio)
                    </span>
                    <span className="text-[10px] text-slate-500">도구를 선택하면 전용 작업화면으로 전환됩니다.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {[
                    { id: 'tool-camera', name: '1. 카메라 문서스캔', icon: '📷', desc: '모바일/웹캠 실물 촬영 후 즉시 PDF 생성', badge: '실시간 가이드' },
                    { id: 'tool-img2pdf', name: '2. 이미지 ➔ PDF', icon: '🖼', desc: '다중 JPG/PNG 드래그 업로드 및 일괄 병합', badge: '다중 변환' },
                    { id: 'tool-ocr', name: '3. PDF OCR', icon: '🔤', desc: 'Gemini / Tesseract 투명 텍스트 레이어 생성', badge: '듀얼 엔진' },
                    { id: 'tool-ocr2text', name: '4. PDF OCR ➔ TEXT', icon: '📝', desc: '스캔 문서 내 텍스트 추출 및 .txt/.md 저장', badge: '텍스트 추출' },
                    { id: 'tool-docmgmt', name: '5. PDF 문서관리', icon: '📑', desc: '페이지 회전/삭제/병합(Merge)/분할(Split)', badge: '페이지 편집' },
                    { id: 'tool-compress', name: '6. PDF 압축', icon: '🗜', desc: 'DPI 최적화 및 최대 85% 용량 다이어트', badge: '초경량화' },
                    { id: 'tool-security', name: '7. PDF 보안', icon: '🔒', desc: 'AES-256 열람 비밀번호 및 권한 암호화', badge: '보안 통제' },
                  ].map((tool) => (
                    <div
                      key={tool.id}
                      onClick={() => setActivePdfTool(tool.id)}
                      className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-sky-500/60 hover:bg-slate-900/60 transition-all cursor-pointer group flex flex-col justify-between shadow-xs hover:shadow-sky-500/10"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{tool.icon}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-950/80 text-sky-400 border border-sky-800/60">
                            {tool.badge}
                          </span>
                        </div>
                        <div className="font-bold text-slate-200 group-hover:text-sky-400 transition-colors">
                          {tool.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {tool.desc}
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-sky-300 font-medium">
                        <span>작업 시작하기</span>
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 최근 작업 문서 및 퀵 통계 배너 */}
                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">최근 처리 문서: ISO 32000-2 표준 가이드북 (840쪽)</div>
                      <div className="text-[11px] text-slate-400">가상화 렌더링 최적화 적용 · 2회독 주석 이벤트 완료</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProg('PG-USR-06')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 rounded-lg font-semibold shrink-0 transition-colors flex items-center gap-1.5"
                  >
                    <span>뷰어로 열기</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ) : (
              /* [작업화면] 7대 PDF 문서도구 전용 인라인 작업 스튜디오 */
              <div className="space-y-4">
                {/* 상단 공통 네비게이션 바: 뒤로가기 버튼 및 도구 정보 */}
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActivePdfTool(null)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-98"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>대시보드로 돌아가기</span>
                    </button>
                    <span className="text-slate-600">|</span>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {activePdfTool === 'tool-camera' && '📷 1. 카메라 문서스캔 스튜디오'}
                      {activePdfTool === 'tool-img2pdf' && '🖼 2. 이미지 ➔ PDF 변환 스튜디오'}
                      {activePdfTool === 'tool-ocr' && '🔤 3. PDF OCR 투명 레이어 스튜디오'}
                      {activePdfTool === 'tool-ocr2text' && '📝 4. PDF OCR ➔ TEXT 추출 스튜디오'}
                      {activePdfTool === 'tool-docmgmt' && '📑 5. PDF 문서관리 (페이지 편집기)'}
                      {activePdfTool === 'tool-compress' && '🗜 6. PDF 압축 및 경량화 스튜디오'}
                      {activePdfTool === 'tool-security' && '🔒 7. PDF 보안 및 AES-256 암호화'}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                    purePDFrend Tool Studio v1.0
                  </span>
                </div>

                {/* 1. 카메라 문서스캔 작업화면 */}
                {activePdfTool === 'tool-camera' && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4 text-xs">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* 카메라 뷰파인더 모의 캔버스 */}
                      <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 relative aspect-4/3 flex flex-col items-center justify-center overflow-hidden">
                        {cameraActive ? (
                          <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center relative">
                            {/* 촬영 가이드 그리드 오버레이 */}
                            <div className="absolute inset-8 border-2 border-dashed border-sky-400/80 rounded-lg pointer-events-none flex items-center justify-center">
                              <span className="px-2 py-1 bg-slate-950/80 text-sky-300 text-[10px] rounded font-mono">
                                A4 문서 테두리를 가이드 라인에 맞춰주세요
                              </span>
                            </div>
                            <Camera className="w-12 h-12 text-sky-400 animate-pulse mb-2" />
                            <span className="text-white font-semibold">웹캠/카메라 실시간 스트리밍 중...</span>
                            <span className="text-slate-400 text-[11px] mt-1 font-mono">1920 x 1080 Full HD · 자동 왜곡 보정 ON</span>
                          </div>
                        ) : (
                          <div className="text-center p-6 space-y-3">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                              <Camera className="w-7 h-7" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">카메라가 아직 기동되지 않았습니다</div>
                              <div className="text-slate-400 text-[11px] mt-1">웹캠 또는 모바일 카메라 권한을 승인하여 실물 문서를 스캔하세요.</div>
                            </div>
                            <button
                              onClick={() => setCameraActive(true)}
                              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-md shadow-sky-600/30 transition-all"
                            >
                              카메라 켜기 (웹캠 연동)
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 촬영 컨트롤 및 옵션 패널 */}
                      <div className="w-full md:w-80 space-y-3 shrink-0">
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                          <span className="font-bold text-white block">스캔 옵션 설정</span>
                          <div className="space-y-1.5 text-[11px]">
                            <label className="flex items-center justify-between text-slate-300">
                              <span>자동 테두리 왜곡 보정</span>
                              <input type="checkbox" defaultChecked className="rounded accent-sky-500" />
                            </label>
                            <label className="flex items-center justify-between text-slate-300">
                              <span>명암 및 텍스트 선명화</span>
                              <input type="checkbox" defaultChecked className="rounded accent-sky-500" />
                            </label>
                            <label className="flex items-center justify-between text-slate-300">
                              <span>해상도</span>
                              <select className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200">
                                <option>A4 (300 DPI 표준)</option>
                                <option>A4 (600 DPI 고정밀)</option>
                              </select>
                            </label>
                          </div>
                        </div>

                        {/* 촬영된 페이지 목록 */}
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">촬영된 페이지 목록</span>
                            <span className="text-[11px] text-sky-400 font-mono font-bold">{capturedScans.length}장 캡처됨</span>
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {capturedScans.map((p, idx) => (
                              <div key={idx} className="w-16 h-20 bg-slate-950 border border-slate-700 rounded-lg flex flex-col items-center justify-center shrink-0 relative group">
                                <span className="text-[10px] font-mono text-slate-400">{p}쪽</span>
                                <span className="text-xs">📄</span>
                                <button
                                  onClick={() => setCapturedScans(capturedScans.filter((_, i) => i !== idx))}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-600 text-white rounded flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => setCapturedScans([...capturedScans, capturedScans.length + 1])}
                              className="w-16 h-20 bg-slate-950/50 border border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center shrink-0 hover:border-sky-500 text-slate-500 hover:text-sky-400 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="text-[10px]">추가촬영</span>
                            </button>
                          </div>
                        </div>

                        {/* 최종 PDF 변환 실행 */}
                        <button
                          onClick={() => alert(`총 ${capturedScans.length}장의 촬영본을 단일 Searchable PDF로 변환 저장하였습니다.`)}
                          className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          <span>PDF 문서로 병합 저장</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. 이미지 ➔ PDF 변환 작업화면 */}
                {activePdfTool === 'tool-img2pdf' && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4 text-xs">
                    <div className="p-8 border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-2xl bg-slate-900/60 text-center space-y-3 transition-colors cursor-pointer">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">변환할 이미지들을 드래그하여 놓으세요</div>
                        <div className="text-slate-400 text-[11px] mt-1">지원 형식: JPG, PNG, WEBP, BMP (다중 파일 동시 선택 가능)</div>
                      </div>
                      <button className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-600 font-semibold text-xs">
                        내 컴퓨터에서 이미지 선택
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                        <span className="font-bold text-white">용지 규격</span>
                        <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200">
                          <option>A4 (210 x 297 mm)</option>
                          <option>Letter (8.5 x 11 in)</option>
                          <option>이미지 원본 크기에 맞춤</option>
                        </select>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                        <span className="font-bold text-white">용지 방향</span>
                        <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200">
                          <option>자동 (이미지 비율에 따라 결정)</option>
                          <option>세로 (Portrait)</option>
                          <option>가로 (Landscape)</option>
                        </select>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                        <span className="font-bold text-white">여백 설정</span>
                        <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200">
                          <option>여백 없음 (꽉 차게 맞춤)</option>
                          <option>좁은 여백 (10mm)</option>
                          <option>기본 여백 (20mm)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => alert('선택된 이미지들을 단일 PDF로 변환 생성 완료하였습니다.')}
                        className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>PDF 변환 및 다운로드 실행</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. PDF OCR 투명 레이어 스튜디오 */}
                {activePdfTool === 'tool-ocr' && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4 text-xs">
                    {/* OCR 엔진 선택 탭 */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="font-bold text-white ml-1">OCR 인식 엔진 선택:</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setOcrEngineTab('gemini')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            ocrEngineTab === 'gemini'
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          ✨ Google Gemini Vision (초고정밀)
                        </button>
                        <button
                          onClick={() => setOcrEngineTab('tesseract')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            ocrEngineTab === 'tesseract'
                              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                              : 'bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          ⚡ Tesseract OCR (오프라인 로컬)
                        </button>
                        <button
                          onClick={() => setOcrEngineTab('paddle')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            ocrEngineTab === 'paddle'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                              : 'bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          🐧 PaddleOCR (도커 배치)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 언어 선택 및 파라미터 */}
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                        <span className="font-bold text-white block">다국어 인식 언어 선택</span>
                        <div className="grid grid-cols-3 gap-2">
                          <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ocrLangs.kor}
                              onChange={(e) => setOcrLangs({ ...ocrLangs, kor: e.target.checked })}
                              className="accent-sky-500 rounded"
                            />
                            <span className="text-slate-200">한국어 (kor)</span>
                          </label>
                          <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ocrLangs.eng}
                              onChange={(e) => setOcrLangs({ ...ocrLangs, eng: e.target.checked })}
                              className="accent-sky-500 rounded"
                            />
                            <span className="text-slate-200">영어 (eng)</span>
                          </label>
                          <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ocrLangs.jpn}
                              onChange={(e) => setOcrLangs({ ...ocrLangs, jpn: e.target.checked })}
                              className="accent-sky-500 rounded"
                            />
                            <span className="text-slate-200">일본어 (jpn)</span>
                          </label>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
                          <div className="flex justify-between">
                            <span>신뢰도 임계값 (Confidence Threshold):</span>
                            <span className="font-mono text-sky-400 font-bold">85% 이상</span>
                          </div>
                          <div className="flex justify-between">
                            <span>투명 텍스트 레이어 생성:</span>
                            <span className="text-emerald-400 font-bold">포함 (Searchable PDF)</span>
                          </div>
                        </div>
                      </div>

                      {/* 대상 문서 정보 및 진행 상태 */}
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-white block mb-1">대상 문서: ISO 32000-2 표준 가이드북</span>
                          <span className="text-[11px] text-slate-400">총 840쪽 · 대용량 가상화 스트리밍 처리 대기</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">OCR 배치 분석 준비 완료</span>
                            <span className="text-emerald-400 font-mono">100% Ready</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-sky-500 h-full w-full rounded-full" />
                          </div>
                        </div>
                        <button
                          onClick={() => alert('Searchable PDF OCR 투명 텍스트 레이어 합성을 성공적으로 완료하였습니다.')}
                          className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Searchable PDF OCR 합성 시작</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PDF OCR ➔ TEXT 추출 스튜디오 */}
                {activePdfTool === 'tool-ocr2text' && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">추출 형식:</span>
                        <button className="px-2.5 py-1 bg-sky-600 text-white rounded font-bold">순수 텍스트 (.txt)</button>
                        <button className="px-2.5 py-1 bg-slate-900 text-slate-400 rounded">마크다운 (.md)</button>
                        <button className="px-2.5 py-1 bg-slate-900 text-slate-400 rounded">표 인식 (CSV)</button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(extractedSampleText);
                            setIsCopiedToClipboard(true);
                            setTimeout(() => setIsCopiedToClipboard(false), 2000);
                          }}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-medium flex items-center gap-1.5 transition-colors"
                        >
                          {isCopiedToClipboard ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopiedToClipboard ? '복사 완료!' : '클립보드 복사'}</span>
                        </button>
                        <button
                          onClick={() => alert('추출된 텍스트를 purePDFrend_extracted.txt 파일로 다운로드합니다.')}
                          className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>.txt 다운로드</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                        <span className="font-bold text-slate-300 block">원본 PDF 스캔본 미리보기 (1쪽)</span>
                        <div className="aspect-3/4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-[11px]">
                          [원본 PDF 스캔 페이지 렌더링 뷰]
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 flex flex-col">
                        <span className="font-bold text-emerald-400 block">OCR 실시간 추출 텍스트 편집기</span>
                        <textarea
                          value={extractedSampleText}
                          onChange={(e) => setExtractedSampleText(e.target.value)}
                          className="flex-1 min-h-[260px] w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs focus:outline-hidden focus:border-sky-500 resize-none leading-relaxed"
                        />
                        <div className="text-[10px] text-slate-500 flex justify-between">
                          <span>글자 수: {extractedSampleText.length} 자</span>
                          <span>인식 신뢰도: 98.4% (Tesseract v5.4)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. PDF 문서관리 (페이지 편집기) */}
                {activePdfTool === 'tool-docmgmt' && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4 text-xs">
                    {/* 상단 액션 툴바 */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setDocMgmtPages(docMgmtPages.map((p) => ({ ...p, rotated: (p.rotated + 90) % 360 })));
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-semibold flex items-center gap-1.5"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>전체 90° 회전</span>
                        </button>
                        <button
                          onClick={() => alert('다른 PDF 파일을 선택하여 현재 문서 뒤에 병합(Merge)합니다.')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-semibold flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>PDF 병합 (Merge)</span>
                        </button>
                        <button
                          onClick={() => alert('선택한 페이지를 별도 PDF 파일로 분할(Split) 추출합니다.')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-semibold flex items-center gap-1.5"
                        >
                          <Split className="w-3.5 h-3.5" />
                          <span>선택 분할 (Split)</span>
                        </button>
                      </div>

                      <button
                        onClick={() => alert('페이지 순서 및 회전 편집 사항이 새 PDF 파일로 안전하게 저장되었습니다.')}
                        className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>편집 완료 및 저장</span>
                      </button>
                    </div>

                    {/* 인터랙티브 썸네일 그리드 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {docMgmtPages.map((p, idx) => (
                        <div
                          key={p.id}
                          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 flex flex-col items-center group relative hover:border-sky-500/60 transition-all"
                        >
                          <div
                            style={{ transform: `rotate(${p.rotated}deg)` }}
                            className="w-full aspect-3/4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center justify-center font-mono text-[11px] text-slate-400 transition-transform"
                          >
                            <span>PAGE</span>
                            <span className="font-bold text-white text-sm">{p.page}</span>
                          </div>
                          <div className="flex items-center justify-between w-full pt-1 text-[11px]">
                            <span className="text-slate-400 font-mono">{idx + 1}p ({p.rotated}°)</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const updated = [...docMgmtPages];
                                  updated[idx].rotated = (updated[idx].rotated + 90) % 360;
                                  setDocMgmtPages(updated);
                                }}
                                title="90도 회전"
                                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                              >
                                <RotateCw className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDocMgmtPages(docMgmtPages.filter((_, i) => i !== idx))}
                                title="페이지 삭제"
                                className="p-1 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. PDF 압축 스튜디오 */}
                {activePdfTool === 'tool-compress' && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 원본 파일 분석 카드 */}
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                        <span className="font-bold text-white block">원본 파일 정보</span>
                        <div className="space-y-1 text-slate-400 text-[11px] font-mono">
                          <div>파일명: ISO 32000-2_Full.pdf</div>
                          <div>원본 용량: <strong className="text-rose-400">48.2 MB</strong></div>
                          <div>총 페이지수: 840 쪽</div>
                          <div>포함 이미지: 1,420개 고해상도 비트맵</div>
                        </div>
                      </div>

                      {/* 압축 프로필 선택 */}
                      <div className="md:col-span-2 p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                        <span className="font-bold text-white block">압축 레벨 선택</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { id: 'high', label: '고품질 (인쇄용)', reduction: '~30% 절감', expected: '33.7 MB', dpi: '300 DPI' },
                            { id: 'recommended', label: '권장 압축 (표준)', reduction: '~65% 절감', expected: '16.8 MB', dpi: '150 DPI' },
                            { id: 'max', label: '최대 압축 (이메일)', reduction: '~85% 절감', expected: '7.2 MB', dpi: '72 DPI' },
                          ].map((lvl) => (
                            <div
                              key={lvl.id}
                              onClick={() => setCompressLevel(lvl.id as any)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                compressLevel === lvl.id
                                  ? 'bg-sky-950/60 border-sky-500 shadow-md shadow-sky-500/10'
                                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="font-bold text-white">{lvl.label}</div>
                              <div className="text-sky-400 font-bold mt-1">{lvl.reduction}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">예상: {lvl.expected} · {lvl.dpi}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-white text-sm">초경량 압축 최적화 준비 완료</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          예상 절감량: <strong>48.2 MB ➔ 16.8 MB (31.4 MB 절약)</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('PDF 압축이 완료되었습니다. (용량 65% 절감 성공)')}
                        className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30"
                      >
                        <Minimize2 className="w-4 h-4" />
                        <span>PDF 최적화 압축 실행</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. PDF 보안 및 암호화 */}
                {activePdfTool === 'tool-security' && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 비밀번호 설정 카드 */}
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                        <span className="font-bold text-white block">비밀번호 설정</span>
                        <div className="space-y-2">
                          <div>
                            <label className="text-slate-400 text-[11px] block mb-1">문서 열람 암호 (User Password)</label>
                            <input
                              type="password"
                              value={userPasswordInput}
                              onChange={(e) => setUserPasswordInput(e.target.value)}
                              placeholder="문서를 열람할 때 요구할 암호 입력"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono text-xs focus:outline-hidden focus:border-sky-500"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 text-[11px] block mb-1">관리자/권한 암호 (Owner Password)</label>
                            <input
                              type="password"
                              placeholder="보안 설정을 변경할 때 요구할 마스터 암호"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono text-xs focus:outline-hidden focus:border-sky-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 세부 권한 제어 */}
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                        <span className="font-bold text-white block">문서 세부 권한 제어</span>
                        <div className="space-y-1.5 text-slate-300 text-[11px]">
                          <label className="flex items-center justify-between p-1.5 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
                            <span>인쇄(Print) 허용</span>
                            <input type="checkbox" defaultChecked className="accent-sky-500 rounded" />
                          </label>
                          <label className="flex items-center justify-between p-1.5 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
                            <span>텍스트 및 이미지 내용 복사 허용</span>
                            <input type="checkbox" className="accent-sky-500 rounded" />
                          </label>
                          <label className="flex items-center justify-between p-1.5 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
                            <span>주석(Annotation) 작성 및 양식 입력 허용</span>
                            <input type="checkbox" defaultChecked className="accent-sky-500 rounded" />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-400 font-mono">암호화 알고리즘: AES-256 bit (Acrobat X 이상 호환 표준)</span>
                      <button
                        onClick={() => alert('문서에 AES-256 암호화 및 권한 제어가 성공적으로 적용되었습니다.')}
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
                      >
                        <Lock className="w-4 h-4" />
                        <span>보안 암호화 적용 및 PDF 다운로드</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PG-USR-05: 문서관리 (라이브러리) */}
        {selectedProg === 'PG-USR-05' && (
          <DocumentLibraryViewer
            userEmail="jkok2j2m@gmail.com"
            onOpenViewer={(_docId, doc) => {
              if (doc) {
                setActiveViewingDoc(doc);
                const initPage = doc.readPages && doc.readPages > 0 ? doc.readPages : 1;
                setViewerCurrentPage(initPage);
                setViewerJumpInput(String(initPage));
              }
              setSelectedProg('PG-USR-06');
            }}
            onRequestShare={(targetKind, targetName) => {
              setEditingShareLink(null);
              setShareFormTargetKind(targetKind);
              setShareFormTargetDocTitle(targetName);
              setShareFormPermission('reviewer');
              setShareFormPeriodKind('7d');
              setShareFormIsPublicRead(true);
              setShareFormPassword('');
              setIsShareCreateModalOpen(true);
            }}
            isMobileMode={isMobileMode}
          />
        )}

        {/* PG-USR-06: 문서뷰어 & 주석 스튜디오 (고성능 가상 스크롤 뷰어 + 3탭 상단/좌측 배치 + 8대모드/도구속성바) */}
        {selectedProg === 'PG-USR-06' && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            {/* ========================================================================= */}
            {/* [Xodo 벤치마킹] 초슬림 2단 통폐합 툴바 (Top 1단: 글로벌 헤더 / Top 2단: 도구 툴바) */}
            {/* ========================================================================= */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-visible relative">
              {/* [통합 2열 툴바] PC·태블릿·모바일 일관된 2열 컨텐츠 배치 유지 */}
              <div className="space-y-0 text-xs">
                {/* 1열: 뒤로가기 > 문서명(슬라이드클릭드래그휠) > 공유 > 협업 > 목록그룹 > 작성자 */}
                <div className="h-10 px-2.5 sm:px-3 border-b border-slate-800/80 flex items-center justify-between gap-1.5 sm:gap-2">
                  {/* 좌측: [←] 뒤로가기 & 문서명(슬라이드클릭드래그휠) */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeViewingDoc) {
                          const total = activeViewingDoc.totalPages || 800;
                          const progress = Math.min(100, Math.round((viewerCurrentPage / total) * 100));
                          setActiveViewingDoc({
                            ...activeViewingDoc,
                            readPages: viewerCurrentPage,
                            progressPercent: progress,
                            lastReadAt: '방금 전',
                          });
                        }
                        setSelectedProg('PG-USR-05');
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                      title="서재 목록(PG-USR-05)으로 복귀"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    {/* 문서명: 마우스오버 시 전체 문서명 툴팁 + 가로 슬라이더/휠 스크롤 컨테이너 */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <HorizontalSlideContainer scrollStep={120} showScrollButtons={false} className="w-full">
                        <span
                          className="text-xs font-bold text-slate-300 truncate cursor-default whitespace-nowrap inline-block"
                          title={activeViewingDoc?.title || 'ISO 32000-2 표준 가이드북'}
                        >
                          {activeViewingDoc?.title || 'ISO 32000-2 표준 가이드북'}
                        </span>
                      </HorizontalSlideContainer>
                    </div>
                  </div>

                  {/* 우측: 공유 > 협업 > 목록그룹 > 작성자 */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {/* 공유 */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingShareLink(null);
                        setShareFormTargetKind('file');
                        setShareFormTargetDocTitle(activeViewingDoc?.title || 'ISO 32000-2 표준 가이드북');
                        setShareFormPermission('reviewer');
                        setShareFormPeriodKind('7d');
                        setShareFormIsPublicRead(true);
                        setShareFormPassword('');
                        setShareFormPasswordConfirm('');
                        setIsShareCreateModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-sky-600/30 text-slate-300 hover:text-sky-300 border border-slate-700/80 transition-all cursor-pointer"
                      title="이 문서 공유 등록"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* 협업 (버튼명: 협업, (3) 텍스트 전면 삭제) */}
                    <button
                      type="button"
                      onClick={() => {
                        const docItem = shareLinksList.find((l) => l.docId === (activeViewingDoc?.id || 'DOC-9821')) || shareLinksList[0];
                        if (docItem) {
                          setSelectedCollabDocId(docItem.id);
                          setIsCollabStatusModalOpen(true);
                        }
                      }}
                      className="px-1.5 sm:px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="실시간 협업 및 동시 열람 작업자 현황"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>협업</span>
                    </button>

                    {/* 목록그룹 (눈모양 대신 3단 목록 아이콘 Columns3) */}
                    <button
                      type="button"
                      onClick={() => setIsTabDrawerVisible(!isTabDrawerVisible)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        isTabDrawerVisible
                          ? 'bg-sky-600/30 text-sky-300 border-sky-500/50 shadow-xs'
                          : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                      }`}
                      title={`목차/북마크/주석 3단 목록 패널 ${isTabDrawerVisible ? '숨기기' : '표시'}`}
                    >
                      <Columns3 className="w-3.5 h-3.5" />
                    </button>

                    {/* 작성자 라벨 토글 */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAuthorLabels(!showAuthorLabels);
                        showToast(
                          showAuthorLabels
                            ? '주석 작성자 라벨이 숨겨졌습니다.'
                            : '🏷️ 모든 주석 끝에 작성자 라벨(아바타/이름)이 상시 표시됩니다.',
                          'info'
                        );
                      }}
                      className={`p-1.5 sm:px-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        showAuthorLabels
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-400/40'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700/80 hover:text-slate-200'
                      }`}
                      title="주석 끝에 작성자명/아바타 상시 표시 토글"
                    >
                      <span>🏷️</span>
                      <span className="hidden sm:inline text-[11px]">작성자</span>
                    </button>
                  </div>
                </div>

                {/* 2열: 주석그룹 > 대상 주석아이콘 > 주석그룹수정아이콘 > | 도구상세설정 > 취소 > 재실행 */}
                <div className="h-10 px-2.5 sm:px-3 flex items-center justify-between gap-1.5 sm:gap-2 overflow-visible relative text-xs">
                  {/* 좌측: 주석그룹 & 대상 주석아이콘 & 주석그룹수정아이콘 */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                    {/* PC/태블릿: 주석그룹 선택목록 드롭다운 */}
                    {!isMobileMode ? (
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          title="도구 모드 그룹 변경"
                        >
                          <span className="text-sky-400">
                            {activeGroup === 'annot' ? '주석 달기' :
                             activeGroup === 'draw' ? '그리기' :
                             activeGroup === 'sign' ? '작성 및 서명' :
                             activeGroup === 'view' ? '보기' :
                             activeGroup === 'favorite' ? '즐겨찾기' :
                             activeGroup === 'insert' ? '삽입' : '펜'}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isModeDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isModeDropdownOpen && (
                          <div className="absolute top-9 left-0 z-50 w-44 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                            {[
                              { id: 'annot', name: '주석 달기', icon: '✏️' },
                              { id: 'draw', name: '그리기', icon: '🎨' },
                              { id: 'sign', name: '작성 및 서명', icon: '✍️' },
                              { id: 'view', name: '보기 (읽기 전용)', icon: '👁️' },
                              { id: 'favorite', name: '즐겨찾기', icon: '⭐' },
                              { id: 'insert', name: '삽입', icon: '📎' },
                            ].map((grp) => (
                              <button
                                key={grp.id}
                                type="button"
                                onClick={() => {
                                  setActiveGroup(grp.id);
                                  setIsModeDropdownOpen(false);
                                }}
                                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between cursor-pointer transition-colors ${
                                  activeGroup === grp.id
                                    ? 'bg-sky-600 text-white font-bold'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <span>{grp.icon}</span>
                                  <span>{grp.name}</span>
                                </span>
                                {activeGroup === grp.id && <Check className="w-3 h-3 text-white" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* 모바일: 주석그룹 아이콘 (클릭 시 2분할 레이어 팝업 호출) */
                      <button
                        type="button"
                        onClick={() => setIsMobileGroupModalOpen(!isMobileGroupModalOpen)}
                        className={`h-7 px-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                          isMobileGroupModalOpen
                            ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-500/50'
                            : 'bg-slate-900 hover:bg-slate-800 text-sky-400 border-slate-700/80'
                        }`}
                        title="주석 그룹 및 도구 선택 레이어 팝업"
                      >
                        <span className="text-sm">
                          {activeGroup === 'annot' ? '✏️' :
                           activeGroup === 'draw' ? '🎨' :
                           activeGroup === 'sign' ? '✍️' :
                           activeGroup === 'view' ? '👁️' :
                           activeGroup === 'favorite' ? '⭐' :
                           activeGroup === 'insert' ? '📎' : '✏️'}
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>
                    )}

                    {/* PC/태블릿: 대상 주석아이콘 슬라이더 */}
                    {!isMobileMode ? (
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <HorizontalSlideContainer scrollStep={160} showScrollButtons={false} className="w-full">
                          {activeTools.map((item, idx) => (
                            <button
                              key={`${item.id}-${idx}`}
                              onClick={() => {
                                setCurrentTool(item.id);
                                const kind = mapToolIdToKind(item.id);
                                setToolStyleState((prev) => ({
                                  ...prev,
                                  toolKind: kind,
                                }));
                              }}
                              title={`${item.name} (${viewerConfig.shortcuts[item.id] || item.defaultKey})`}
                              className={`shrink-0 h-7 w-7 min-w-[28px] rounded-lg flex items-center justify-center text-xs transition-all relative cursor-pointer ${
                                currentTool === item.id
                                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/50 ring-2 ring-sky-400/50'
                                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              <span>{item.icon}</span>
                            </button>
                          ))}
                        </HorizontalSlideContainer>
                      </div>
                    ) : (
                      /* 모바일: 선택 주석아이콘 (단독 표시) */
                      <button
                        type="button"
                        onClick={() => setIsMobileGroupModalOpen(true)}
                        className="h-7 px-2 rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/40 flex items-center gap-1 shrink-0 font-medium"
                        title={`현재 선택된 도구: ${registry.getAllTools().find((t) => t.id === currentTool)?.name || currentTool} (클릭하여 변경)`}
                      >
                        <span>{registry.getAllTools().find((t) => t.id === currentTool)?.icon || '✏️'}</span>
                        <span className="text-[10px] font-bold truncate max-w-[64px]">
                          {registry.getAllTools().find((t) => t.id === currentTool)?.name || currentTool}
                        </span>
                      </button>
                    )}

                    {/* 주석그룹수정아이콘 (Sliders) */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsToolbarModalOpen(!isToolbarModalOpen);
                          if (isToolbarModalOpen) setIsReorderDragMode(false);
                        }}
                        className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                          isToolbarModalOpen
                            ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-500/50'
                            : 'bg-slate-900 text-slate-400 hover:text-white border-slate-700/80 hover:bg-slate-800'
                        }`}
                        title="주석그룹 도구 순서 및 사용자 설정"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 구분선 */}
                  <div className="w-px h-4 bg-slate-800 mx-0.5 shrink-0" />

                  {/* 우측: 설정 > 취소 > 재실행 */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 relative">
                    {/* 설정 (버튼명: 설정) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsStylePopoverOpen(!isStylePopoverOpen)}
                        className={`h-7 px-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isStylePopoverOpen
                            ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-500/50'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                        }`}
                        title="도구 상세속성(스타일, 획, 불투명도, 프리셋) 설정"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-white/50 shadow-xs"
                          style={{ backgroundColor: toolStyleState.color }}
                        />
                        <span className="text-[11px]">설정</span>
                      </button>

                      <ToolStylePopover
                        isOpen={isStylePopoverOpen}
                        onClose={() => setIsStylePopoverOpen(false)}
                        toolName={registry.getAllTools().find((t) => t.id === currentTool)?.name || currentTool}
                        styleState={toolStyleState}
                        onChangeStyle={handleUpdateToolStyle}
                        isMobile={isMobileMode}
                      />
                    </div>

                    {/* 실행취소 */}
                    <button
                      type="button"
                      onClick={handleUndoAnnotation}
                      disabled={undoStack.length === 0}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        undoStack.length > 0
                          ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:text-white'
                          : 'bg-slate-950 text-slate-600 border-slate-800/60 cursor-not-allowed opacity-50'
                      }`}
                      title={`실행취소 (Ctrl + Z)${undoStack.length > 0 ? ` [${undoStack.length}단계 가능]` : ' (취소할 작업 없음)'}`}
                    >
                      <Undo2 className="w-3.5 h-3.5 stroke-[2]" />
                    </button>

                    {/* 다시실행 */}
                    <button
                      type="button"
                      onClick={handleRedoAnnotation}
                      disabled={redoStack.length === 0}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        redoStack.length > 0
                          ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:text-white'
                          : 'bg-slate-950 text-slate-600 border-slate-800/60 cursor-not-allowed'
                      }`}
                      title={`다시실행 (Ctrl + Y)${redoStack.length > 0 ? ` [${redoStack.length}단계 가능]` : ' (다시 실행할 작업 없음)'}`}
                    >
                      <Redo2 className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* [요구사항 1.3] 모바일 주석그룹 2분할 레이어 팝업 */}
              {isMobileGroupModalOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs"
                    onClick={() => setIsMobileGroupModalOpen(false)}
                  />
                  <div className="fixed top-24 left-2 right-2 sm:left-auto sm:right-4 z-50 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-3 text-xs text-white max-w-[calc(100vw-16px)] sm:w-96 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <div className="font-bold flex items-center gap-1.5 text-xs text-sky-400">
                        <span>✏️ 주석 그룹 및 도구 선택</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsMobileGroupModalOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-[105px_1fr] gap-2 min-h-[170px] max-h-[300px]">
                      {/* 왼쪽: 주석그룹 목록 */}
                      <div className="border-r border-slate-800 pr-1.5 space-y-1 overflow-y-auto">
                        {[
                          { id: 'annot', name: '주석 달기', icon: '✏️' },
                          { id: 'draw', name: '그리기', icon: '🎨' },
                          { id: 'sign', name: '작성 및 서명', icon: '✍️' },
                          { id: 'view', name: '보기 (읽기)', icon: '👁️' },
                          { id: 'favorite', name: '즐겨찾기', icon: '⭐' },
                          { id: 'insert', name: '삽입', icon: '📎' },
                        ].map((grp) => (
                          <button
                            key={grp.id}
                            type="button"
                            onClick={() => setActiveGroup(grp.id)}
                            className={`w-full px-2 py-1.5 rounded-lg text-left text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              activeGroup === grp.id
                                ? 'bg-sky-600 text-white shadow-xs font-bold'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <span>{grp.icon}</span>
                            <span className="truncate">{grp.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* 오른쪽: 선택된 주석그룹의 주석 아이콘 열거 */}
                      <div className="overflow-y-auto pl-0.5">
                        <div className="text-[10px] text-slate-400 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <span>소속 도구</span>
                            <span className="text-sky-400 font-mono font-bold">({activeTools.length}개)</span>
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            isReorderDragMode ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-500'
                          }`}>
                            {isReorderDragMode ? '🔄 드래그 이동모드' : '길게 눌러 순서변경'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {activeTools.map((item, idx) => {
                            const isWiggling = wiggleCardIdx === idx;
                            const isDropTarget = dragOverIdx === idx && draggedToolIdx !== null && draggedToolIdx !== idx;

                            return (
                              <div key={`${item.id}-${idx}`} className="relative">
                                {/* 드래그 시 삽입 배치될 위치 가이드 가드 표시 */}
                                {isDropTarget && (
                                  <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-400 via-indigo-400 to-sky-400 rounded-full shadow-md shadow-sky-400/80 animate-pulse z-30 pointer-events-none" />
                                )}

                                <button
                                  type="button"
                                  draggable={true}
                                  onDragStart={(e) => {
                                    setDraggedToolIdx(idx);
                                    setWiggleCardIdx(idx);
                                    setIsReorderDragMode(true);
                                    e.dataTransfer.setData('text/plain', String(idx));
                                    e.dataTransfer.effectAllowed = 'move';
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.dataTransfer.dropEffect = 'move';
                                    if (dragOverIdx !== idx) setDragOverIdx(idx);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const sourceIdx = draggedToolIdx !== null ? draggedToolIdx : parseInt(e.dataTransfer.getData('text/plain'), 10);
                                    if (!isNaN(sourceIdx) && sourceIdx !== idx) {
                                      handleMoveTool(activeGroup, sourceIdx, idx);
                                      showToast(`[${item.name}] 도구 순서가 변경되었습니다.`, 'success');
                                    }
                                    setDraggedToolIdx(null);
                                    setDragOverIdx(null);
                                    setWiggleCardIdx(null);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedToolIdx(null);
                                    setDragOverIdx(null);
                                    setWiggleCardIdx(null);
                                  }}
                                  onMouseDown={() => {
                                    longPressTimerRef.current = setTimeout(() => {
                                      setIsReorderDragMode(true);
                                      setWiggleCardIdx(idx);
                                      showToast(`[${item.name}] 순서 이동 모드 (원하는 위치로 드래그)`, 'info');
                                    }, 350);
                                  }}
                                  onMouseUp={() => {
                                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                                  }}
                                  onMouseLeave={() => {
                                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                                  }}
                                  onTouchStart={() => {
                                    longPressTimerRef.current = setTimeout(() => {
                                      setIsReorderDragMode(true);
                                      setWiggleCardIdx(idx);
                                    }, 350);
                                  }}
                                  onTouchEnd={() => {
                                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                                  }}
                                  onClick={() => {
                                    if (isWiggling || isReorderDragMode) {
                                      setWiggleCardIdx(null);
                                      setIsReorderDragMode(false);
                                      return;
                                    }
                                    setCurrentTool(item.id);
                                    const kind = mapToolIdToKind(item.id);
                                    setToolStyleState((prev) => ({ ...prev, toolKind: kind }));
                                    setIsMobileGroupModalOpen(false);
                                    showToast(`'${item.name}' 도구가 선택되었습니다.`, 'info');
                                  }}
                                  className={`w-full h-11 rounded-xl flex flex-col items-center justify-center p-1 text-xs border transition-all cursor-pointer relative select-none ${
                                    isWiggling
                                      ? 'animate-card-wiggle border-amber-400 bg-amber-950/60 ring-2 ring-amber-400/50 shadow-lg z-20 cursor-grab active:cursor-grabbing'
                                      : isDropTarget
                                      ? 'border-sky-400 bg-sky-950/40 ring-1 ring-sky-400'
                                      : currentTool === item.id
                                      ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-400/40'
                                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                                  }`}
                                  title={`${item.name} (${viewerConfig.shortcuts[item.id] || item.defaultKey})`}
                                >
                                  <span className="text-base">{item.icon}</span>
                                  <span className="text-[8px] truncate max-w-full font-medium">{item.name}</span>
                                </button>
                              </div>
                            );
                          })}

                          {/* 마지막 아이콘: 해당 주석그룹 설정(순서변경 등) 아이콘 */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsMobileGroupModalOpen(false);
                              setIsToolbarModalOpen(true);
                            }}
                            className="h-11 rounded-xl flex flex-col items-center justify-center p-1 text-xs border border-dashed border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
                            title="주석그룹 도구 순서 및 사용자 설정"
                          >
                            <Sliders className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[8px] font-bold">설정</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* [요구사항 1.5] 주석그룹 수정 레이어팝업: 우측 기준 브라우저 영역 안 표시 */}
              {isToolbarModalOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs"
                    onClick={() => {
                      setIsToolbarModalOpen(false);
                      setIsReorderDragMode(false);
                      setWiggleCardIdx(null);
                      setDragOverIdx(null);
                    }}
                  />
                  <div className="fixed top-24 right-2 sm:right-6 z-50 w-auto sm:w-96 max-w-[calc(100vw-24px)] rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-4 space-y-3 text-xs text-slate-100 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                      <h4 className="font-bold text-white text-xs flex items-center gap-2">
                        <span>⚙ 뷰어 툴바 순서 및 사용자 설정</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                          isReorderDragMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-sky-500/20 text-sky-400'
                        }`}>
                          {isReorderDragMode ? '🔄 드래그 이동모드' : '길게 눌러 이동'}
                        </span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setIsToolbarModalOpen(false);
                          setIsReorderDragMode(false);
                          setWiggleCardIdx(null);
                          setDragOverIdx(null);
                        }}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-slate-300">
                      <span className="truncate">
                        {isReorderDragMode
                          ? '선택된 카드를 드래그하여 가이드라인 위치에 놓으세요.'
                          : '카드를 0.4초 길게 누르면 해당 카드만 흔들림과 함께 이동모드로 전환됩니다.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsReorderDragMode(!isReorderDragMode);
                          if (isReorderDragMode) {
                            setWiggleCardIdx(null);
                            setDragOverIdx(null);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors shrink-0 ml-2 cursor-pointer ${
                          isReorderDragMode
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        {isReorderDragMode ? '완료' : '순서 변경'}
                      </button>
                    </div>

                    {/* 도구 목록 카드들 (선택 카드만 롱프레스 위글 & 가이드라인 DnD) */}
                    <div className="space-y-1.5 max-h-64 overflow-y-auto text-xs pr-1">
                      {activeTools.map((item, idx) => {
                        const isWiggling = wiggleCardIdx === idx;
                        const isDropTarget = dragOverIdx === idx && draggedToolIdx !== null && draggedToolIdx !== idx;

                        return (
                          <div key={`${item.id}-${idx}`} className="relative">
                            {/* 드래그 시 삽입 배치될 위치 가이드라인 표시 */}
                            {isDropTarget && (
                              <div
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.dataTransfer.dropEffect = 'move';
                                  if (dragOverIdx !== idx) setDragOverIdx(idx);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const sourceIdx = draggedToolIdx !== null ? draggedToolIdx : parseInt(e.dataTransfer.getData('text/plain'), 10);
                                  if (!isNaN(sourceIdx) && sourceIdx !== idx) {
                                    handleMoveTool(activeGroup, sourceIdx, idx);
                                    showToast(`[${item.name}] 도구 순서가 변경되었습니다.`, 'success');
                                  }
                                  setDraggedToolIdx(null);
                                  setDragOverIdx(null);
                                  setWiggleCardIdx(null);
                                }}
                                className="my-1.5 py-1 px-1 flex items-center gap-1.5 transition-all animate-pulse bg-sky-950/40 rounded-lg border border-sky-400/40"
                              >
                                <div className="w-2 h-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400 ring-2 ring-sky-300/40 shrink-0"></div>
                                <div className="h-0.5 flex-1 bg-gradient-to-r from-sky-400 via-indigo-400 to-sky-400 rounded-full shadow-sm shadow-sky-400/50"></div>
                                <span className="text-[9px] font-mono font-bold text-sky-300 bg-sky-950/95 px-2 py-0.5 rounded border border-sky-400/60 shadow-xs shrink-0">
                                  📍 이곳에 배치 (삽입 위치)
                                </span>
                                <div className="h-0.5 flex-1 bg-gradient-to-r from-sky-400 via-indigo-400 to-sky-400 rounded-full shadow-sm shadow-sky-400/50"></div>
                                <div className="w-2 h-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400 ring-2 ring-sky-300/40 shrink-0"></div>
                              </div>
                            )}

                            <div
                              draggable={true}
                              onDragStart={(e) => {
                                setDraggedToolIdx(idx);
                                setWiggleCardIdx(idx);
                                setIsReorderDragMode(true);
                                e.dataTransfer.setData('text/plain', String(idx));
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = 'move';
                                if (dragOverIdx !== idx) setDragOverIdx(idx);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const sourceIdx = draggedToolIdx !== null ? draggedToolIdx : parseInt(e.dataTransfer.getData('text/plain'), 10);
                                if (!isNaN(sourceIdx) && sourceIdx !== idx) {
                                  handleMoveTool(activeGroup, sourceIdx, idx);
                                  showToast(`[${item.name}] 도구 순서가 변경되었습니다.`, 'success');
                                }
                                setDraggedToolIdx(null);
                                setDragOverIdx(null);
                                setWiggleCardIdx(null);
                              }}
                              onDragEnd={() => {
                                setDraggedToolIdx(null);
                                setDragOverIdx(null);
                                setWiggleCardIdx(null);
                              }}
                              onMouseDown={() => {
                                longPressTimerRef.current = setTimeout(() => {
                                  setIsReorderDragMode(true);
                                  setWiggleCardIdx(idx);
                                  showToast(`[${item.name}] 이동 모드 활성화 (드래그하여 위치 변경)`, 'info');
                                }, 400);
                              }}
                              onMouseUp={() => {
                                if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                              }}
                              onMouseLeave={() => {
                                if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                              }}
                              onTouchStart={() => {
                                longPressTimerRef.current = setTimeout(() => {
                                  setIsReorderDragMode(true);
                                  setWiggleCardIdx(idx);
                                }, 400);
                              }}
                              onTouchEnd={() => {
                                if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                              }}
                              className={`p-2 rounded-xl border flex items-center justify-between transition-all select-none ${
                                isWiggling
                                  ? 'animate-card-wiggle border-amber-400 bg-amber-950/40 cursor-grab active:cursor-grabbing shadow-lg ring-2 ring-amber-400/40'
                                  : isDropTarget
                                  ? 'border-sky-400/80 bg-sky-950/30'
                                  : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                <GripVertical className="w-4 h-4 text-slate-500 hover:text-sky-400 cursor-grab active:cursor-grabbing shrink-0" />
                                <span className="text-slate-500 font-mono text-[11px] w-4">{idx + 1}</span>
                                <span className="text-base shrink-0">{item.icon}</span>
                                <div className="truncate">
                                  <div className="text-slate-200 font-medium truncate flex items-center gap-1.5">
                                    <span>{item.name}</span>
                                    {isWiggling && (
                                      <span className="text-[10px] text-amber-300 font-mono font-bold animate-pulse">선택됨</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-amber-300/80 font-mono">
                                    단축키: {viewerConfig.shortcuts[item.id] || item.defaultKey}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveTool(activeGroup, idx, idx - 1);
                                    }}
                                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                                    title="위로 이동"
                                  >
                                    ▲
                                  </button>
                                )}
                                {idx < activeTools.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveTool(activeGroup, idx, idx + 1);
                                    }}
                                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                                    title="아래로 이동"
                                  >
                                    ▼
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveToolFromGroup(activeGroup, idx);
                                  }}
                                  className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[10px] cursor-pointer"
                                  title="툴바에서 숨기기"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsToolbarModalOpen(false);
                          setSelectedProg('PG-USR-09');
                          setSettingsTab('groups');
                        }}
                        className="text-sky-400 hover:underline text-[10px]"
                      >
                        + 다른 도구 추가 ➔
                      </button>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={handleResetConfig}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                        >
                          초기화
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsToolbarModalOpen(false);
                            setIsReorderDragMode(false);
                            setWiggleCardIdx(null);
                            setDragOverIdx(null);
                          }}
                          className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-[10px] cursor-pointer"
                        >
                          완료
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* [전체화면 래퍼] 주석영역 & 문서영역 전체화면 채우기 & 복구 */}
            <div className={isViewerFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-2 sm:p-3 overflow-hidden flex flex-col space-y-2 animate-in fade-in duration-150' : 'space-y-2.5'}>
              {/* PG-USR-06 주석 패널 통합 렌더러 (상단배치 / 좌측배치 100% 동일 로직 공유 및 단일 진실 공급원) */}
              {(() => null)()}
              {/* 5. [피드백 1, 2, 3 반영] 가로 모드(horizontal)일 때 상단 위아래 배치 드로어 (젠 모드 시 숨김) */}
              {effectiveTabOrientation === 'horizontal' && isTabDrawerVisible && !isImmersiveZenMode && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-md">
                <div className="border-b border-slate-800 pb-2 space-y-2 md:space-y-0 md:flex md:items-center md:justify-between">
                  {/* [피드백 1 반영] 모바일 모드 및 협소 화면: 탭 밑으로 높이설정이 가는 어색함 해소 ➔ 상단 1단에 높이설정 + 전환/닫기 우선 배치 */}
                  <div className={`flex items-center justify-between gap-1.5 ${isMobileMode ? 'w-full' : 'md:order-2 md:ml-auto'}`}>
                    <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-[10px]">
                      <span className="text-slate-400 font-medium">표시높이:</span>
                      <select
                        value={topDrawerHeightMode}
                        onChange={(e) => setTopDrawerHeightMode(e.target.value as any)}
                        className="bg-slate-950 border border-slate-700/80 rounded px-1.5 py-0.5 text-slate-200 font-medium cursor-pointer"
                        title="3그룹 컨텐츠 목록 표시 높이 선택"
                      >
                        <option value="narrow">좁게 (3~4줄)</option>
                        <option value="default">기본 (7~9줄)</option>
                        <option value="fit">맞춤 (자동확장)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {activeViewerTab === 'bookmarks' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!viewerBookmarks.includes(viewerCurrentPage)) {
                              setViewerBookmarks([...viewerBookmarks, viewerCurrentPage].sort((a, b) => a - b));
                              showToast(`제 ${viewerCurrentPage}페이지가 북마크에 추가되었습니다.`, 'success');
                            }
                          }}
                          className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer whitespace-nowrap"
                        >
                          + 현재 {viewerCurrentPage}p
                        </button>
                      )}

                      {/* [요구사항 2] 가로세로 전환 버튼: 모바일 모드에서는 숨김, 데스크톱 복귀 시 노출 */}
                      {!isMobileMode && (
                        <button
                          type="button"
                          onClick={() => handleSwitchOrientation('vertical')}
                          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 hover:border-sky-500/50 transition-colors cursor-pointer flex items-center justify-center shadow-2xs shrink-0"
                          title="세로 모드(좌측 패널)로 배치 전환"
                        >
                          <PanelLeft className="w-4 h-4 stroke-[2]" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsTabDrawerVisible(false)}
                        className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-center shadow-2xs shrink-0"
                        title="패널 숨기기"
                      >
                        <X className="w-4 h-4 stroke-[2]" />
                      </button>
                    </div>
                  </div>

                  {/* 3탭 전환 바: 좁은 화면/모바일에서는 탭이 온전히 한 줄을 차지하여 영역 초과 원천 방지 */}
                  <div className={`flex items-center justify-around sm:justify-start gap-2 pt-1 md:pt-0 ${isMobileMode ? 'border-t border-slate-800/60' : 'border-t md:border-t-0 border-slate-800/60 md:order-1'}`}>
                    <button
                      type="button"
                      onClick={() => setActiveViewerTab('bookmarks')}
                      className={`pb-1 md:pb-1.5 text-xs transition-all cursor-pointer flex items-center gap-1 ${
                        activeViewerTab === 'bookmarks'
                          ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                          : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
                      }`}
                    >
                      <span>🔖</span>
                      <span>북마크 ({viewerBookmarks.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveViewerTab('toc')}
                      className={`pb-1 md:pb-1.5 text-xs transition-all cursor-pointer flex items-center gap-1 ${
                        activeViewerTab === 'toc'
                          ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                          : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
                      }`}
                    >
                      <span>📖</span>
                      <span>목차 ({viewerTocItems.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveViewerTab('annots')}
                      className={`pb-1 md:pb-1.5 text-xs transition-all cursor-pointer flex items-center gap-1 ${
                        activeViewerTab === 'annots'
                          ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                          : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
                      }`}
                    >
                      <span>✏️</span>
                      <span>주석 ({vectorAnnotations.length})</span>
                    </button>
                  </div>
                </div>

                {/* [피드백 3 반영] 타이틀/필터바는 고정되고, 각 탭의 목록영역만 스크롤 적용 */}
                <div>
                  {activeViewerTab === 'bookmarks' && renderBookmarkPanelContent(true)}
                  {activeViewerTab === 'toc' && renderTocPanelContent(true)}
                  {activeViewerTab === 'annots' && renderAnnotationPanelContent(true)}
                </div>
              </div>
            )}

            {/* 6. 메인 워크스페이스: [세로 모드일 때 좌측 패널 + 드래그 리사이저 분할바 + 고성능 가상 캔버스 뷰포트] */}
            <div className={`flex flex-col ${effectiveTabOrientation === 'vertical' && isTabDrawerVisible && !isImmersiveZenMode ? 'md:flex-row' : ''} gap-0 min-h-[480px] flex-1 relative`}>
              {/* [피드백 C, D 반영] 세로 모드(vertical)일 때 문서영역 좌측에 나란히 배치되는 세로 사이드 패널 (젠 모드 시 숨김) */}
              {effectiveTabOrientation === 'vertical' && isTabDrawerVisible && !isImmersiveZenMode && (
                <>
                  <div
                    style={{ width: isMobileMode ? '100%' : `${viewerSidebarWidth}px` }}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col text-xs shadow-sm shrink-0 min-w-[220px] max-w-[500px]"
                  >
                    {/* [피드백 1 반영] 패널 상단: 모바일 모드이거나 너비가 좁아지면 높이설정 목록을 탭 위로 배치하여 영역초과 방지 */}
                    <div className="border-b border-slate-800 pb-2 mb-2 space-y-1.5">
                      {/* 상단 1단: 높이설정 목록(모바일 모드 시 노출) + [배치전환 아이콘 (가로/세로)] + 닫기 버튼 */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-[10px]">
                          <span className="text-slate-400 font-medium">표시높이:</span>
                          <select
                            value={topDrawerHeightMode}
                            onChange={(e) => setTopDrawerHeightMode(e.target.value as any)}
                            className="bg-slate-950 border border-slate-700/80 rounded px-1.5 py-0.5 text-slate-200 font-medium cursor-pointer"
                            title="3그룹 컨텐츠 목록 표시 높이 선택"
                          >
                            <option value="narrow">좁게 (3~4줄)</option>
                            <option value="default">기본 (7~9줄)</option>
                            <option value="fit">맞춤 (자동확장)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
                          {/* [요구사항 2] 가로세로 전환 버튼: 모바일 모드에서는 숨김, 데스크톱 복귀 시 노출 */}
                          {!isMobileMode && (
                            <button
                              type="button"
                              onClick={() => handleSwitchOrientation('horizontal')}
                              className="w-7 h-7 rounded-lg bg-sky-950/70 hover:bg-sky-900 text-sky-400 border border-sky-500/50 hover:border-sky-400 cursor-pointer transition-colors flex items-center justify-center shadow-2xs shrink-0"
                              title="가로 모드(상단 서랍)로 배치 전환"
                            >
                              <PanelTop className="w-4 h-4 stroke-[2]" />
                            </button>
                          )}
                          {/* 닫기 버튼: 전환버튼과 동일 규격 및 Lucide X 아이콘 적용 */}
                          <button
                            type="button"
                            onClick={() => setIsTabDrawerVisible(false)}
                            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-center shadow-2xs shrink-0"
                            title="패널 숨기기"
                          >
                            <X className="w-4 h-4 stroke-[2]" />
                          </button>
                        </div>
                      </div>

                      {/* 하단 2단: 3탭 전환 바 (북마크, 목차, 주석) - 탭이 1열 전체를 차지하여 텍스트 및 숫자 잘림 완전 방지 */}
                      <div className="flex items-center justify-around sm:justify-start gap-2 pt-1 border-t border-slate-800/60 overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => setActiveViewerTab('bookmarks')}
                          className={`pb-1 text-xs transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                            activeViewerTab === 'bookmarks'
                              ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                              : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
                          }`}
                        >
                          <span>🔖</span>
                          <span>북마크 ({viewerBookmarks.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveViewerTab('toc')}
                          className={`pb-1 text-xs transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                            activeViewerTab === 'toc'
                              ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                              : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
                          }`}
                        >
                          <span>📖</span>
                          <span>목차 ({viewerTocItems.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveViewerTab('annots')}
                          className={`pb-1 text-xs transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                            activeViewerTab === 'annots'
                              ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                              : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
                          }`}
                        >
                          <span>✏️</span>
                          <span>주석 ({vectorAnnotations.length})</span>
                        </button>
                      </div>
                    </div>

                    {/* 좌측 패널 본문 목록 (모바일일 때는 표시높이 모드에 따라 스크롤 높이 제어) */}
                    <div
                      className={`flex-1 overflow-y-auto space-y-1.5 text-slate-300 font-mono text-[11px] pr-1 ${
                        isMobileMode
                          ? topDrawerHeightMode === 'narrow'
                            ? 'max-h-36'
                            : topDrawerHeightMode === 'default'
                            ? 'max-h-64'
                            : 'max-h-96'
                          : ''
                      }`}
                    >
                      {activeViewerTab === 'bookmarks' && renderBookmarkPanelContent(false)}
                      {activeViewerTab === 'toc' && renderTocPanelContent(false)}
                      {activeViewerTab === 'annots' && renderAnnotationPanelContent(false)}
                    </div>
                  </div>

                  {/* [0021-01] 분할 리사이저 바 (Splitter Drag Handle: 마우스 드래그로 너비 조정) */}
                  <div
                    onMouseDown={handleSidebarResizeStart}
                    className="hidden md:flex items-center justify-center w-3 cursor-col-resize hover:bg-sky-500/20 active:bg-sky-500/40 rounded transition-colors group z-10 shrink-0 mx-1 select-none"
                    title="드래그하여 좌측 패널 너비 조절 (240px ~ 480px)"
                  >
                    <div className="w-1 h-12 rounded-full bg-slate-700 group-hover:bg-sky-400 transition-colors" />
                  </div>
                </>
              )}

              {/* 중앙 대용량 가상 뷰포트 캔버스 영역 (60fps 가상 스크롤러 & LRU 메모리가드 연동) */}
              <div
                className={`flex-1 bg-slate-950 border border-slate-800 rounded-xl ${isViewerFullscreen ? 'p-1.5 sm:p-2.5 h-full' : 'p-3'} flex flex-col justify-between relative overflow-hidden shadow-inner min-w-0`}
              >
                {/* 캔버스 상단 가상화 뷰어 상태 배너 & OCR 선택 툴팁 (몰입형 독서 시 숨김) */}
                {!isImmersiveZenMode && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-lg text-xs mb-2 transition-all animate-in fade-in duration-100">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold flex items-center gap-1" title="60fps 가상 렌더러 동작 중">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {!isMobileMode && <span>60fps 가상 렌더러</span>}
                      </span>
                      {!isMobileMode && (
                        <span className="text-slate-500 font-mono text-[10px]">
                          | LRU 캐시: {viewerCurrentPage}/{activeViewingDoc?.totalPages || 800}P (메모리 2.1MB 절약)
                        </span>
                      )}
                    </div>

                    {/* OCR 텍스트 퀵 액션 및 바운딩 박스 상태 & 전체화면/복구 토글 */}
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-400 text-[10px] hidden sm:inline">OCR:</span>
                      {/* [요청 7.1] OCR 텍스트 퀵 액션: 모바일 모드 시 아이콘만 표시 */}
                      <button
                        type="button"
                        onClick={() => {
                          const pageSample = `[purePDFrend p.${viewerCurrentPage}] 제 ${Math.floor(viewerCurrentPage / 10) + 1}장. 대용량 전자책 아카이빙 및 가상 렌더링 - 투명 텍스트 레이어(Searchable PDF)가 스캔 이미지 하단에 정확히 정렬되어 단어 검색과 텍스트 복사를 완벽히 지원한다.`;
                          navigator.clipboard?.writeText?.(pageSample);
                          showToast(`제 ${viewerCurrentPage}쪽 본문 전체 텍스트가 클립보드에 복사되었습니다.`, 'info');
                        }}
                        className={`rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer flex items-center justify-center ${
                          isMobileMode ? 'p-1.5' : 'px-2 py-0.5'
                        }`}
                        title="제 쪽 본문 전체 텍스트 클립보드 복사"
                      >
                        {isMobileMode ? <Copy className="w-3.5 h-3.5" /> : '전체복사'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // OCR 바운딩 박스 전체를 형광펜 주석으로 일괄 변환 생성
                          const newAnn: CanvasVectorAnnotation = {
                            id: `ann-ocr-${Date.now()}`,
                            page: viewerCurrentPage,
                            toolKind: 'highlighter',
                            name: `OCR 형광펜 #${vectorAnnotations.length + 1}`,
                            author: 'jkok2j2m',
                            text: `제 ${viewerCurrentPage}쪽 Searchable PDF 핵심 문장`,
                            color: '#facc15',
                            strokeWidth: 12,
                            opacity: 50,
                            date: '방금 전',
                            tags: ['OCR', 'Searchable PDF'],
                            isAiGenerated: true,
                            confidence: 0.98,
                          };
                          pushAnnotationHistory([...vectorAnnotations, newAnn]);
                          setSelectedVectorId(newAnn.id);
                          setPulseAnnotationId(newAnn.id);
                          setTimeout(() => setPulseAnnotationId(null), 1800);
                          setAnnotFilterTypes((prev) => new Set([...prev, 'markup']));
                          showToast(`제 ${viewerCurrentPage}페이지에 OCR 바운딩 박스 형광펜 주석이 자동 생성되었습니다.`, 'success');
                        }}
                        className={`rounded bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 ${
                          isMobileMode ? 'p-1.5' : 'px-2 py-0.5'
                        }`}
                        title="OCR 형광펜 주석 생성"
                      >
                        {isMobileMode ? (
                          <Highlighter className="w-3.5 h-3.5 text-yellow-400" />
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-yellow-400" />
                            <span>+ 형광펜</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newAnn: CanvasVectorAnnotation = {
                            id: `ann-ocr-note-${Date.now()}`,
                            page: viewerCurrentPage,
                            toolKind: 'text',
                            name: `OCR 메모 #${vectorAnnotations.length + 1}`,
                            author: 'jkok2j2m',
                            text: `제 ${viewerCurrentPage}페이지 OCR 인식 구역 발췌 메모`,
                            color: '#38bdf8',
                            strokeWidth: 1,
                            opacity: 100,
                            fontSize: 13,
                            date: '방금 전',
                            tags: ['OCR', '메모'],
                            isAiGenerated: true,
                            confidence: 0.96,
                          };
                          pushAnnotationHistory([...vectorAnnotations, newAnn]);
                          setSelectedVectorId(newAnn.id);
                          setPulseAnnotationId(newAnn.id);
                          setTimeout(() => setPulseAnnotationId(null), 1800);
                          setAnnotFilterTypes((prev) => new Set([...prev, 'text']));
                          showToast(`제 ${viewerCurrentPage}페이지에 OCR 텍스트 기반 주석 메모가 등록되었습니다.`, 'success');
                        }}
                        className={`rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-[10px] font-bold cursor-pointer flex items-center justify-center ${
                          isMobileMode ? 'p-1.5' : 'px-2 py-0.5'
                        }`}
                        title="OCR 메모 생성"
                      >
                        {isMobileMode ? <FileText className="w-3.5 h-3.5 text-sky-400" /> : '+ 메모'}
                      </button>

                      {/* [요구사항 1] 주석영역 & 문서영역 전체화면 채우기 / 복구 토글 버튼 */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !isViewerFullscreen;
                          setIsViewerFullscreen(nextState);
                          if (!nextState) setIsImmersiveZenMode(false);
                          showToast(
                            nextState
                              ? '🖥️ 주석·문서영역 전체화면 모드 (문서를 클릭하면 상/하단 도구를 숨길 수 있습니다. ESC로 복구)'
                              : '↩️ 일반 화면으로 복구되었습니다.',
                            'info'
                          );
                        }}
                        className={`rounded text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 transition-all ${
                          isViewerFullscreen
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 hover:bg-amber-500/30 shadow-xs'
                            : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 hover:border-sky-500'
                        } ${isMobileMode ? 'p-1.5' : 'px-2 py-0.5'}`}
                        title={isViewerFullscreen ? '화면 복구 (ESC)' : '주석·문서영역 전체화면'}
                      >
                        {isViewerFullscreen ? (
                          <>
                            <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                            {!isMobileMode && <span>복구</span>}
                          </>
                        ) : (
                          <>
                            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                            {!isMobileMode && <span>전체화면</span>}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 실제 도서 본문 렌더링 캔버스 (확대/회전/Searchable PDF 하이라이트 반영 + [0021-01] 좌/우 여백 클릭 페이지 이동) */}
                <div
                  onClick={(e) => {
                    // 전체화면 모드 시 문서 영역 클릭하면 상/하단 제거(몰입형 Zen) 또는 재표시 토글
                    if (isViewerFullscreen) {
                      const target = e.target as HTMLElement;
                      if (target.closest('button') || target.closest('input') || target.closest('select')) {
                        return;
                      }
                      setIsImmersiveZenMode((prev) => !prev);
                      return;
                    }
                    if (!navigateOnMarginClick) return;
                    const target = e.target as HTMLElement;
                    // 페이지 카드 내부 클릭이거나 버튼, 입력창, 팝오버 클릭이면 무시
                    if (target.closest('.document-page-card') || target.closest('button') || target.closest('input')) {
                      return;
                    }
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const width = rect.width;
                    const total = activeViewingDoc?.totalPages || 800;

                    if (clickX < width * 0.35) {
                      const next = Math.max(1, viewerCurrentPage - 1);
                      setViewerCurrentPage(next);
                      setViewerJumpInput(String(next));
                      showToast(`◀ 제 ${next}페이지 (좌측 여백 클릭)`, 'info');
                    } else if (clickX > width * 0.65) {
                      const next = Math.min(total, viewerCurrentPage + 1);
                      setViewerCurrentPage(next);
                      setViewerJumpInput(String(next));
                      showToast(`제 ${next}페이지 ▶ (우측 여백 클릭)`, 'info');
                    }
                  }}
                  className={`flex-1 bg-slate-900/60 rounded-xl p-4 overflow-auto flex items-center justify-center min-h-[380px] relative ${
                    currentTool.toLowerCase().includes('eraser') || toolStyleState.toolKind === 'eraser'
                      ? 'cursor-crosshair'
                      : navigateOnMarginClick
                      ? 'cursor-pointer'
                      : ''
                  }`}
                  title={navigateOnMarginClick ? '좌/우 빈 여백 클릭 시 이전/다음 페이지 이동' : ''}
                >
                  {/* 지우개 활성 알림 배너 */}
                  {(currentTool.toLowerCase().includes('eraser') || toolStyleState.toolKind === 'eraser') && (
                    <div className="absolute top-3 right-3 z-30 px-3 py-1.5 rounded-full bg-rose-600/90 text-white text-xs font-bold shadow-xl border border-rose-400/50 flex items-center gap-2 animate-bounce">
                      <span>🧹 지우개 모드 활성 (터치 시 삭제)</span>
                      <span className="text-[10px] bg-rose-950 px-1.5 py-0.5 rounded font-mono">
                        반경 {toolStyleState.eraserSize || 20}pt
                      </span>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* [Xodo 캡처 핵심 벤치마킹] 좌상단 플로팅 쪽수 칩 [ 157 / 504 ] */}
                  {/* 터치 시 직관적인 쪽수 점프 슬라이더 팝오버 표시 */}
                  {/* ========================================================================= */}
                  <div className="absolute top-3 left-3 z-30">
                    <button
                      type="button"
                      onClick={() => setIsPageJumpPopoverOpen(!isPageJumpPopoverOpen)}
                      className="px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-mono font-bold tracking-wider border border-white/20 shadow-xl flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                      title="클릭하여 원하는 페이지로 바로 점프"
                    >
                      <span>{viewerCurrentPage}</span>
                      <span className="text-slate-400 font-normal">/</span>
                      <span className="text-slate-300">{activeViewingDoc?.totalPages || 800}</span>
                    </button>

                    {/* 쪽수 점프 팝오버 */}
                    {isPageJumpPopoverOpen && (
                      <div className="absolute top-10 left-0 z-40 w-64 p-3 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-100 text-xs">
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="font-bold">페이지 이동</span>
                          <span className="font-mono text-sky-400 font-bold">{viewerCurrentPage} 쪽</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={activeViewingDoc?.totalPages || 800}
                          value={viewerCurrentPage}
                          onChange={(e) => {
                            const p = Number(e.target.value);
                            setViewerCurrentPage(p);
                            setViewerJumpInput(String(p));
                          }}
                          className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                          <input
                            type="number"
                            min={1}
                            max={activeViewingDoc?.totalPages || 800}
                            value={viewerJumpInput}
                            onChange={(e) => setViewerJumpInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const p = parseInt(viewerJumpInput, 10);
                                if (!isNaN(p) && p >= 1 && p <= (activeViewingDoc?.totalPages || 800)) {
                                  setViewerCurrentPage(p);
                                  setIsPageJumpPopoverOpen(false);
                                }
                              }
                            }}
                            className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const p = parseInt(viewerJumpInput, 10);
                              if (!isNaN(p) && p >= 1 && p <= (activeViewingDoc?.totalPages || 800)) {
                                setViewerCurrentPage(p);
                                setIsPageJumpPopoverOpen(false);
                              }
                            }}
                            className="flex-1 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded cursor-pointer"
                          >
                            이동하기
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    onClick={(e) => {
                      // 전체화면 모드 시 본문 카드 클릭으로 상단/하단 숨김(젠 모드) 토글
                      if (isViewerFullscreen) {
                        const target = e.target as HTMLElement;
                        if (target.closest('button') || target.closest('input') || target.closest('select')) {
                          return;
                        }
                        setIsImmersiveZenMode((prev) => !prev);
                      }
                    }}
                    style={{
                      transform: `scale(${viewerScale}) rotate(${viewerRotation}deg)`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease-out',
                    }}
                    className={`document-page-card w-full max-w-xl bg-white text-slate-900 rounded-lg p-6 sm:p-8 shadow-2xl space-y-4 select-text relative border border-slate-300 ${
                      isViewerFullscreen ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    {/* 상단 헤더 쪽수 표시 */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-700 truncate max-w-[280px]">
                        {activeViewingDoc?.title || 'ISO 32000-2 표준 가이드북'}
                      </span>
                      <span>Page {viewerCurrentPage} of {activeViewingDoc?.totalPages || 800}</span>
                    </div>

                    {/* 문서 본문 내용 (가상 페이지 내용 동적 시뮬레이션) */}
                    <div className="space-y-3 font-serif leading-relaxed text-sm">
                      <h4 className="font-bold text-base text-slate-900 font-sans">
                        제 {Math.floor(viewerCurrentPage / 10) + 1}장. 대용량 전자책 아카이빙 및 가상 렌더링
                      </h4>
                      <p className="text-slate-700 text-xs">
                        본 문서는 purePDFrend 엔진을 통하여 <strong>{activeViewingDoc?.totalPages || 800}쪽 이상의 대용량 스캔 도서</strong>를 브라우저 메모리 고갈 없이 60fps로 탐색할 수 있는 가상 윈도잉 아키텍처를 정의한다.
                      </p>
                      
                      {/* Searchable PDF 일치 하이라이트 시뮬레이션 */}
                      <div
                        className={`p-2.5 rounded text-xs transition-colors ${
                          viewerSearchQuery
                            ? 'bg-yellow-200/90 border border-yellow-400 text-slate-900 font-medium'
                            : 'bg-slate-50 border border-slate-200 text-slate-800'
                        }`}
                      >
                        {viewerSearchQuery ? (
                          <span>
                            🔍 검색어 [<strong>{viewerSearchQuery}</strong>] 매칭: "네트워크 단절 시에도 뷰어와 로컬 주석 이벤트 큐는 비동기 캐시를 통해 영속화된다."
                          </span>
                        ) : (
                          <span>
                            * "투명 텍스트 레이어(Searchable PDF)가 스캔 이미지 하단에 정확히 정렬되어 단어 검색과 텍스트 복사를 완벽히 지원한다."
                          </span>
                        )}
                      </div>

                      {/* ========================================================================= */}
                      {/* [Xodo 캡처 핵심 벤치마킹] 밑줄/형광펜/마크업 주석 동적 연동 및 상황별 팝오버 */}
                      {/* ========================================================================= */}
                      {(() => {
                        const currentMarkups = vectorAnnotations.filter(
                          (a) =>
                            a.page === viewerCurrentPage &&
                            ['underline', 'highlighter', 'strike', 'squiggly'].includes(a.toolKind)
                        );

                        return (
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-700 relative space-y-2">
                            <div>
                              <span>ChatGPT나 클로드에선 </span>
                              {currentMarkups.length > 0 ? (
                                currentMarkups.map((markup) => {
                                  const isSelected = selectedVectorId === markup.id;
                                  const isPulsing = pulseAnnotationId === markup.id;
                                  const isPopoverActive =
                                    activeAnnotationPopover.isOpen && activeAnnotationPopover.annId === markup.id;

                                  return (
                                    <span
                                      key={markup.id}
                                      id={`annot-canvas-${markup.id}`}
                                      className="relative inline-block mx-1"
                                    >
                                      <span
                                        onClick={() => {
                                          setSelectedVectorId(markup.id);
                                          setPulseAnnotationId(markup.id);
                                          setTimeout(() => setPulseAnnotationId(null), 1800);
                                          setActiveAnnotationPopover({
                                            isOpen: true,
                                            annId: markup.id,
                                            text: markup.text || markup.name,
                                            type: (markup.toolKind === 'highlighter' ? 'highlight' : markup.toolKind) as any,
                                            color: markup.color,
                                          });
                                          setToolStyleState((prev) => ({
                                            ...prev,
                                            toolKind: markup.toolKind,
                                            color: markup.color,
                                            strokeWidth: markup.strokeWidth,
                                            opacity: markup.opacity,
                                          }));
                                        }}
                                        className={`cursor-pointer px-1 py-0.5 rounded transition-all font-medium ${
                                          isPulsing
                                            ? 'ring-4 ring-sky-400 animate-pulse shadow-lg scale-105'
                                            : isSelected
                                            ? 'ring-2 ring-sky-500 ring-offset-1'
                                            : ''
                                        } ${
                                          markup.toolKind === 'highlighter'
                                            ? 'bg-yellow-300/80 text-black font-semibold'
                                            : markup.toolKind === 'strike'
                                            ? 'line-through text-rose-500 font-semibold'
                                            : markup.toolKind === 'squiggly'
                                            ? 'underline decoration-wavy decoration-sky-500 font-semibold'
                                            : 'underline decoration-2 decoration-sky-500 font-semibold'
                                        }`}
                                        style={{
                                          borderColor: markup.color,
                                        }}
                                        title={`클릭하여 ${markup.name} 관리 팝오버 열기`}
                                      >
                                        {markup.text || markup.name}
                                        {/* [협업 기능] 작성자 라벨 표시 */}
                                        {showAuthorLabels && markup.author && (
                                          <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded-full bg-slate-900/90 text-sky-300 font-mono border border-sky-500/40 shadow-xs align-middle font-normal">
                                            <span>🙂</span>
                                            <span>{markup.author}</span>
                                          </span>
                                        )}
                                      </span>

                                      {/* 터치 핸들러 시각적 점프 표시기 (블루 핸들러 ● --- ●) */}
                                      {isPopoverActive && (
                                        <>
                                          <span className="absolute -left-1 -bottom-1 w-2.5 h-2.5 rounded-full bg-sky-500 border border-white shadow-xs pointer-events-none" />
                                          <span className="absolute -right-1 -bottom-1 w-2.5 h-2.5 rounded-full bg-sky-500 border border-white shadow-xs pointer-events-none" />
                                        </>
                                      )}

                                      {/* [핵심] AnnotationActionPopover 마운트 */}
                                      {isPopoverActive && (
                                        <AnnotationActionPopover
                                          isOpen={activeAnnotationPopover.isOpen}
                                          onClose={() => setActiveAnnotationPopover((prev) => ({ ...prev, isOpen: false }))}
                                          selectedText={activeAnnotationPopover.text}
                                          currentType={activeAnnotationPopover.type}
                                          currentColor={activeAnnotationPopover.color}
                                          onUpdateType={(newType) => {
                                            setActiveAnnotationPopover((prev) => ({ ...prev, type: newType }));
                                            const updated = vectorAnnotations.map((a) =>
                                              a.id === markup.id
                                                ? {
                                                    ...a,
                                                    toolKind: (newType === 'highlight' ? 'highlighter' : newType) as any,
                                                  }
                                                : a
                                            );
                                            pushAnnotationHistory(updated);
                                            showToast(`마크업 유형이 [${newType}]으로 변경되었습니다.`, 'success');
                                          }}
                                          onUpdateColor={(col) => {
                                            setActiveAnnotationPopover((prev) => ({ ...prev, color: col }));
                                            const updated = vectorAnnotations.map((a) =>
                                              a.id === markup.id ? { ...a, color: col } : a
                                            );
                                            pushAnnotationHistory(updated);
                                            showToast('마크업 색상이 변경되었습니다.', 'info');
                                          }}
                                          onAddComment={(comment) => {
                                            const updated = vectorAnnotations.map((a) =>
                                              a.id === markup.id ? { ...a, memo: comment } : a
                                            );
                                            pushAnnotationHistory(updated);
                                            showToast(`주석에 메모가 저장되었습니다: "${comment}"`, 'success');
                                          }}
                                          onDelete={() => {
                                            const updated = vectorAnnotations.filter((a) => a.id !== markup.id);
                                            pushAnnotationHistory(updated);
                                            if (selectedVectorId === markup.id) setSelectedVectorId(null);
                                            setActiveAnnotationPopover((prev) => ({ ...prev, isOpen: false }));
                                            showToast('마크업 주석이 삭제되었습니다.', 'info');
                                          }}
                                          onCopy={() => {
                                            navigator.clipboard?.writeText?.(activeAnnotationPopover.text);
                                            showToast(`"${activeAnnotationPopover.text}" 클립보드에 복사 완료!`, 'info');
                                          }}
                                        />
                                      )}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-slate-400 italic">
                                  (현재 {viewerCurrentPage}쪽에는 등록된 마크업 주석이 없습니다. 아래 빠른 추가로 등록해보세요.)
                                </span>
                              )}
                              <span> ChatGPT는 코드 인터프리터, 클로드는 아티팩트, 구글 제미나이는 캔버스를 지원합니다.</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* ========================================================================= */}
                      {/* [Searchable PDF 양방향 매핑] OCR 투명 텍스트 레이어 & 바운딩 박스 선택 영역 */}
                      {/* ========================================================================= */}
                      <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 text-xs leading-relaxed space-y-2 relative">
                        <div className="flex items-center justify-between text-[11px] pb-1 border-b border-amber-500/10">
                          <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Searchable PDF OCR 바운딩 박스 레이어 (클릭 시 주석 자동생성)
                          </span>
                          <span className="text-[10px] text-slate-500">신뢰도: 99.4% (Gemini Flash OCR)</span>
                        </div>

                        {/* 대화형 OCR 바운딩 박스 단어 텍스트 블록 시뮬레이션 */}
                        <div className="flex flex-wrap gap-1.5 items-center text-slate-800 dark:text-slate-200">
                          {[
                            { id: 'ocr-box-1', text: '인공지능', kind: 'highlighter', color: '#facc15' },
                            { id: 'ocr-box-2', text: '가상화', kind: 'underline', color: '#38bdf8' },
                            { id: 'ocr-box-3', text: '렌더링', kind: 'highlighter', color: '#4ade80' },
                            { id: 'ocr-box-4', text: '엔진', kind: 'underline', color: '#f43f5e' },
                            { id: 'ocr-box-5', text: 'Searchable PDF', kind: 'highlighter', color: '#fb923c' },
                            { id: 'ocr-box-6', text: '양방향 매핑', kind: 'underline', color: '#a855f7' },
                          ].map((box) => {
                            const isBoxSelected = selectedOcrBoxId === box.id;
                            const matchedAnnotation = vectorAnnotations.find(
                              (a) => a.page === viewerCurrentPage && a.text?.includes(box.text)
                            );

                            return (
                              <div
                                key={box.id}
                                onClick={() => {
                                  setSelectedOcrBoxId(box.id);
                                  // 이미 연결된 주석이 있다면 포커스
                                  if (matchedAnnotation) {
                                    setSelectedVectorId(matchedAnnotation.id);
                                    setPulseAnnotationId(matchedAnnotation.id);
                                    setTimeout(() => setPulseAnnotationId(null), 1800);
                                    showToast(`기존 주석 "${matchedAnnotation.name}"으로 연결되었습니다.`, 'info');
                                  } else {
                                    // 없으면 클릭 시 해당 바운딩 박스로부터 신규 주석 즉시 자동 생성
                                    const newAnn: CanvasVectorAnnotation = {
                                      id: `ann-ocr-${box.id}-${Date.now()}`,
                                      page: viewerCurrentPage,
                                      toolKind: box.kind as any,
                                      name: `OCR [${box.text}]`,
                                      author: 'jkok2j2m',
                                      text: box.text,
                                      color: box.color,
                                      strokeWidth: box.kind === 'highlighter' ? 12 : 2,
                                      opacity: box.kind === 'highlighter' ? 55 : 100,
                                      date: '방금 전',
                                      tags: ['OCR', box.text],
                                      isAiGenerated: true,
                                      confidence: 0.99,
                                    };
                                    pushAnnotationHistory([...vectorAnnotations, newAnn]);
                                    setSelectedVectorId(newAnn.id);
                                    setPulseAnnotationId(newAnn.id);
                                    setTimeout(() => setPulseAnnotationId(null), 1800);
                                    showToast(`OCR 바운딩 박스 [${box.text}] 주석이 자동 생성되었습니다!`, 'success');
                                  }
                                }}
                                className={`px-2 py-1 rounded text-xs transition-all cursor-pointer select-none font-mono relative border ${
                                  matchedAnnotation
                                    ? 'bg-sky-500/20 border-sky-400 text-sky-700 dark:text-sky-300 font-bold shadow-xs'
                                    : isBoxSelected
                                    ? 'bg-amber-500/30 border-amber-500 ring-2 ring-amber-400/50 text-amber-900 dark:text-amber-200 font-bold'
                                    : 'bg-white/80 dark:bg-slate-800/80 hover:bg-amber-100 dark:hover:bg-slate-700/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                                title={`클릭하여 "${box.text}" OCR 바운딩 박스를 주석으로 변환`}
                              >
                                <span>{box.text}</span>
                                {matchedAnnotation ? (
                                  <span className="ml-1 text-[9px] text-sky-600 dark:text-sky-400 font-sans">● 매핑됨</span>
                                ) : (
                                  <span className="ml-1 text-[9px] text-amber-600 dark:text-amber-400 opacity-70 font-sans">+ 주석화</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <p className="text-slate-600 text-xs">
                        {viewerCurrentPage}쪽에 포함된 OCR 바운딩 박스는 실시간 양방향 포커스를 지원하며, 선택 도구인 <strong>[{registry.getAllTools().find((t) => t.id === currentTool)?.name || currentTool}]</strong>을 통해 화면 위에서 즉시 주석을 작성하고 저장할 수 있다.
                      </p>

                      {/* ========================================================================= */}
                      {/* [실시간 양방향 벡터 렌더링 캔버스 영역] */}
                      {/* 자유펜, 도형, 텍스트 상자 등 터치 시 도구 팔레트 속성과 양방향 동기화 */}
                      {/* ========================================================================= */}
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-sans">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                            벡터 주석 레이어 ({vectorAnnotations.length}개 객체 연동)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {selectedVectorId ? '객체 선택됨 (스타일 즉시 반영)' : '주석을 탭하여 선택'}
                          </span>
                        </div>

                        {/* 신규 주석 퀵 추가 시연 바 */}
                        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-sans">
                          <span className="text-slate-500 text-[10px] shrink-0 font-medium">시연 추가:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newPen: CanvasVectorAnnotation = {
                                id: `vec-pen-${Date.now()}`,
                                page: viewerCurrentPage,
                                toolKind: 'pen',
                                name: `자유펜 #${vectorAnnotations.length + 1}`,
                                color: toolStyleState.color,
                                strokeWidth: toolStyleState.strokeWidth,
                                opacity: toolStyleState.opacity,
                                pathData: 'M 10 35 Q 80 5 150 40 T 250 25',
                                tags: ['자유펜'],
                              };
                              setAnnotFilterTypes((prev) => new Set([...prev, 'pen']));
                              pushAnnotationHistory([...vectorAnnotations, newPen]);
                              setSelectedVectorId(newPen.id);
                              setPulseAnnotationId(newPen.id);
                              setTimeout(() => setPulseAnnotationId(null), 1800);
                              setToolStyleState((prev) => ({
                                ...prev,
                                toolKind: 'pen',
                              }));
                              setIsStylePopoverOpen(true);
                              showToast('자유펜 주석이 추가되었습니다.', 'success');
                            }}
                            className="px-2 py-0.5 rounded bg-white hover:bg-sky-50 text-sky-700 font-bold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                          >
                            + 펜 필기
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newShape: CanvasVectorAnnotation = {
                                id: `vec-shape-${Date.now()}`,
                                page: viewerCurrentPage,
                                toolKind: 'shape',
                                name: `도형(사각형) #${vectorAnnotations.length + 1}`,
                                color: toolStyleState.color,
                                strokeWidth: toolStyleState.strokeWidth,
                                opacity: toolStyleState.opacity,
                                fillColor:
                                  toolStyleState.fillColor && toolStyleState.fillColor !== 'transparent'
                                    ? toolStyleState.fillColor
                                    : '#38bdf8',
                                fillOpacity: 20,
                                tags: ['도형'],
                              };
                              setAnnotFilterTypes((prev) => new Set([...prev, 'shape']));
                              pushAnnotationHistory([...vectorAnnotations, newShape]);
                              setSelectedVectorId(newShape.id);
                              setPulseAnnotationId(newShape.id);
                              setTimeout(() => setPulseAnnotationId(null), 1800);
                              setToolStyleState((prev) => ({
                                ...prev,
                                toolKind: 'shape',
                                fillColor: newShape.fillColor,
                              }));
                              setIsStylePopoverOpen(true);
                              showToast('도형(사각형) 주석이 추가되었습니다.', 'success');
                            }}
                            className="px-2 py-0.5 rounded bg-white hover:bg-emerald-50 text-emerald-700 font-bold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                          >
                            + 사각형
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newText: CanvasVectorAnnotation = {
                                id: `vec-text-${Date.now()}`,
                                page: viewerCurrentPage,
                                toolKind: 'text',
                                name: `텍스트 상자 #${vectorAnnotations.length + 1}`,
                                color: toolStyleState.color,
                                text: '독서 핵심 키워드 정리',
                                fontSize: 12,
                                fillColor: '#fef3c7',
                                textAlign: 'left',
                                strokeWidth: 1,
                                opacity: 100,
                                tags: ['메모'],
                              };
                              setAnnotFilterTypes((prev) => new Set([...prev, 'text']));
                              pushAnnotationHistory([...vectorAnnotations, newText]);
                              setSelectedVectorId(newText.id);
                              setPulseAnnotationId(newText.id);
                              setTimeout(() => setPulseAnnotationId(null), 1800);
                              setToolStyleState((prev) => ({
                                ...prev,
                                toolKind: 'text',
                                fontSize: 12,
                              }));
                              setIsStylePopoverOpen(true);
                              showToast('텍스트 상자 주석이 추가되었습니다.', 'success');
                            }}
                            className="px-2 py-0.5 rounded bg-white hover:bg-amber-50 text-amber-700 font-bold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                          >
                            + 텍스트
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newHighlight: CanvasVectorAnnotation = {
                                id: `ann-hl-${Date.now()}`,
                                page: viewerCurrentPage,
                                toolKind: 'highlighter',
                                name: `형광펜 강조 #${vectorAnnotations.length + 1}`,
                                color: '#facc15',
                                strokeWidth: 4,
                                opacity: 85,
                                text: `제 ${viewerCurrentPage}페이지 핵심 논점 하이라이트 문맥`,
                                tags: ['형광펜'],
                              };
                              setAnnotFilterTypes((prev) => new Set([...prev, 'markup']));
                              pushAnnotationHistory([...vectorAnnotations, newHighlight]);
                              setSelectedVectorId(newHighlight.id);
                              setPulseAnnotationId(newHighlight.id);
                              setTimeout(() => setPulseAnnotationId(null), 1800);
                              setActiveAnnotationPopover({
                                isOpen: true,
                                annId: newHighlight.id,
                                text: newHighlight.text || newHighlight.name,
                                type: 'highlight',
                                color: newHighlight.color,
                              });
                              showToast('형광펜 마크업 주석이 추가되었습니다.', 'success');
                            }}
                            className="px-2 py-0.5 rounded bg-white hover:bg-yellow-50 text-yellow-700 font-bold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                          >
                            + 형광펜
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newUnderline: CanvasVectorAnnotation = {
                                id: `ann-ul-${Date.now()}`,
                                page: viewerCurrentPage,
                                toolKind: 'underline',
                                name: `본문 밑줄 #${vectorAnnotations.length + 1}`,
                                color: '#38bdf8',
                                strokeWidth: 2,
                                opacity: 90,
                                text: `제 ${viewerCurrentPage}페이지 표준 가이드 라인 준수 본문`,
                                tags: ['밑줄'],
                              };
                              setAnnotFilterTypes((prev) => new Set([...prev, 'markup']));
                              pushAnnotationHistory([...vectorAnnotations, newUnderline]);
                              setSelectedVectorId(newUnderline.id);
                              setPulseAnnotationId(newUnderline.id);
                              setTimeout(() => setPulseAnnotationId(null), 1800);
                              setActiveAnnotationPopover({
                                isOpen: true,
                                annId: newUnderline.id,
                                text: newUnderline.text || newUnderline.name,
                                type: 'underline',
                                color: newUnderline.color,
                              });
                              showToast('본문 밑줄 주석이 추가되었습니다.', 'success');
                            }}
                            className="px-2 py-0.5 rounded bg-white hover:bg-sky-50 text-sky-700 font-bold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                          >
                            + 밑줄
                          </button>

                          {selectedVectorId && (
                            <button
                              type="button"
                              onClick={() => {
                                pushAnnotationHistory(vectorAnnotations.filter((a) => a.id !== selectedVectorId));
                                setSelectedVectorId(null);
                                showToast('선택된 주석이 삭제되었습니다.', 'info');
                              }}
                              className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold border border-rose-200 ml-auto transition-colors cursor-pointer"
                            >
                              선택 삭제
                            </button>
                          )}
                        </div>

                        {/* 벡터 주석 렌더링 컨테이너 (현재 페이지 객체만 필터링) */}
                        <div className="space-y-2.5">
                          {vectorAnnotations
                            .filter(
                              (ann) =>
                                ann.page === viewerCurrentPage &&
                                !['underline', 'highlighter', 'strike', 'squiggly'].includes(ann.toolKind)
                            )
                            .map((ann) => {
                              const isSelected = selectedVectorId === ann.id;
                              const isPulsing = pulseAnnotationId === ann.id;

                              // 1. 도형 (Shape - 사각형)
                              if (ann.toolKind === 'shape') {
                                return (
                                  <div
                                    key={ann.id}
                                    id={`annot-canvas-${ann.id}`}
                                    onClick={() => {
                                      if (
                                        currentTool.toLowerCase().includes('eraser') ||
                                        toolStyleState.toolKind === 'eraser'
                                      ) {
                                        pushAnnotationHistory(vectorAnnotations.filter((a) => a.id !== ann.id));
                                        if (selectedVectorId === ann.id) setSelectedVectorId(null);
                                        showToast(`[지우개] "${ann.name}" 주석이 삭제되었습니다.`, 'info');
                                        return;
                                      }
                                      setSelectedVectorId(ann.id);
                                      setToolStyleState((prev) => ({
                                        ...prev,
                                        toolKind: 'shape',
                                        color: ann.color,
                                        strokeWidth: ann.strokeWidth,
                                        opacity: ann.opacity,
                                        fillColor: ann.fillColor || 'transparent',
                                        fillOpacity: ann.fillOpacity ?? 20,
                                      }));
                                    }}
                                    style={{
                                      borderWidth: `${ann.strokeWidth}px`,
                                      borderStyle: 'solid',
                                      borderColor: ann.color,
                                      backgroundColor: ann.fillColor === 'transparent' ? 'transparent' : ann.fillColor,
                                      opacity: ann.opacity / 100,
                                    }}
                                    className={`p-3 rounded-lg relative cursor-pointer transition-all ${
                                      isPulsing
                                        ? 'ring-4 ring-sky-400 animate-pulse scale-[1.02] shadow-xl'
                                        : isSelected
                                        ? 'ring-2 ring-sky-500 ring-offset-2 shadow-md'
                                        : 'hover:shadow-xs'
                                    }`}
                                  >
                                    {isSelected && (
                                      <span className="absolute -top-2.5 -left-1 px-1.5 py-0.2 rounded bg-sky-600 text-[9px] font-bold text-white shadow-xs">
                                        선택됨 (도형)
                                      </span>
                                    )}
                                    <p className="text-xs font-serif text-slate-800 m-0 leading-normal">
                                      ■ <strong>{ann.name}:</strong> ISO 32000-2 아카이빙 표준에 따라 주석의 벡터 좌표와 색상 속성은 무손실로 보존된다.
                                    </p>
                                  </div>
                                );
                              }

                              // 2. 자유펜 (Freehand Pen SVG Path)
                              if (ann.toolKind === 'pen') {
                                return (
                                  <div
                                    key={ann.id}
                                    id={`annot-canvas-${ann.id}`}
                                    onClick={() => {
                                      if (
                                        currentTool.toLowerCase().includes('eraser') ||
                                        toolStyleState.toolKind === 'eraser'
                                      ) {
                                        pushAnnotationHistory(vectorAnnotations.filter((a) => a.id !== ann.id));
                                        if (selectedVectorId === ann.id) setSelectedVectorId(null);
                                        showToast(`[지우개] "${ann.name}" 주석이 삭제되었습니다.`, 'info');
                                        return;
                                      }
                                      setSelectedVectorId(ann.id);
                                      setToolStyleState((prev) => ({
                                        ...prev,
                                        toolKind: 'pen',
                                        color: ann.color,
                                        strokeWidth: ann.strokeWidth,
                                        opacity: ann.opacity,
                                      }));
                                    }}
                                    className={`p-1.5 rounded-lg relative cursor-pointer transition-all ${
                                      isPulsing
                                        ? 'bg-slate-100 ring-4 ring-sky-400 animate-pulse scale-[1.02] shadow-xl'
                                        : isSelected
                                        ? 'bg-slate-100 ring-2 ring-sky-500 ring-offset-2 shadow-md'
                                        : 'hover:bg-slate-50'
                                    }`}
                                  >
                                    {isSelected && (
                                      <span className="absolute -top-2 -left-1 px-1.5 py-0.2 rounded bg-sky-600 text-[9px] font-bold text-white shadow-xs">
                                        선택됨 (펜 필기)
                                      </span>
                                    )}
                                    <svg className="w-full h-10 overflow-visible" viewBox="0 0 280 40">
                                      <path
                                        d={ann.pathData || 'M 10 30 Q 70 5 130 35 T 240 20'}
                                        fill="none"
                                        stroke={ann.color}
                                        strokeWidth={ann.strokeWidth}
                                        strokeOpacity={ann.opacity / 100}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                );
                              }

                              // 3. 텍스트 상자 (Text / FreeText)
                              if (ann.toolKind === 'text') {
                                return (
                                  <div
                                    key={ann.id}
                                    id={`annot-canvas-${ann.id}`}
                                    onClick={() => {
                                      if (
                                        currentTool.toLowerCase().includes('eraser') ||
                                        toolStyleState.toolKind === 'eraser'
                                      ) {
                                        pushAnnotationHistory(vectorAnnotations.filter((a) => a.id !== ann.id));
                                        if (selectedVectorId === ann.id) setSelectedVectorId(null);
                                        showToast(`[지우개] "${ann.name}" 주석이 삭제되었습니다.`, 'info');
                                        return;
                                      }
                                      setSelectedVectorId(ann.id);
                                      setToolStyleState((prev) => ({
                                        ...prev,
                                        toolKind: 'text',
                                        color: ann.color,
                                        fontSize: ann.fontSize || 12,
                                        fillColor: ann.fillColor || 'transparent',
                                        textAlign: ann.textAlign || 'left',
                                        opacity: ann.opacity,
                                      }));
                                    }}
                                    style={{
                                      color: ann.color,
                                      backgroundColor: ann.fillColor === 'transparent' ? 'transparent' : ann.fillColor,
                                      fontSize: `${ann.fontSize || 12}px`,
                                      textAlign: ann.textAlign || 'left',
                                      opacity: ann.opacity / 100,
                                    }}
                                    className={`p-2.5 rounded-lg border border-slate-300 font-sans relative cursor-pointer transition-all ${
                                      isPulsing
                                        ? 'ring-4 ring-sky-400 animate-pulse scale-[1.02] shadow-xl'
                                        : isSelected
                                        ? 'ring-2 ring-sky-500 ring-offset-2 shadow-md'
                                        : 'hover:shadow-xs'
                                    }`}
                                  >
                                    {isSelected && (
                                      <span className="absolute -top-2.5 -left-1 px-1.5 py-0.2 rounded bg-sky-600 text-[9px] font-bold text-white shadow-xs">
                                        선택됨 (텍스트)
                                      </span>
                                    )}
                                    <span>{ann.text || '메모 내용'}</span>
                                  </div>
                                );
                              }

                              return null;
                            })}
                        </div>
                      </div>

                      <div className="p-3 bg-sky-50 border-l-4 border-sky-500 rounded text-xs text-sky-950 font-sans">
                        <strong>📌 독서 진행 메모:</strong> 현재 {viewerCurrentPage}쪽을 열람 중이며, 상단의 [← 서재 목록으로] 버튼을 누르면 서재 카드의 독서 진행률이 실시간 갱신됩니다.
                      </div>
                    </div>

                    {/* 하단 푸터 쪽수 */}
                    <div className="text-center text-[10px] text-slate-400 font-mono pt-3 border-t border-slate-200">
                      - {viewerCurrentPage} -
                    </div>
                  </div>
                </div>

                {/* 캔버스 하단 플로팅 컨트롤 (빠른 페이지 넘김 & [0021-01] 인라인 쪽수/배율 직접수정 + 여백클릭 토글) (젠 모드 시 숨김) */}
                {!isImmersiveZenMode && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap justify-between items-center text-xs text-slate-400 gap-2 transition-all animate-in fade-in duration-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 1. 열람 쪽수 인라인 수정 필드 */}
                    <div className="flex items-center gap-1 font-mono text-slate-300">
                      {!isMobileMode && <span>열람 쪽수:</span>}
                      {isEditingBottomPage ? (
                        <input
                          type="number"
                          min={1}
                          max={activeViewingDoc?.totalPages || 800}
                          value={tempBottomPageInput}
                          onChange={(e) => setTempBottomPageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const p = parseInt(tempBottomPageInput, 10);
                              const total = activeViewingDoc?.totalPages || 800;
                              if (!isNaN(p) && p >= 1 && p <= total) {
                                setViewerCurrentPage(p);
                                setViewerJumpInput(String(p));
                                showToast(`제 ${p}페이지로 이동했습니다.`, 'info');
                              }
                              setIsEditingBottomPage(false);
                            } else if (e.key === 'Escape') {
                              setIsEditingBottomPage(false);
                            }
                          }}
                          onBlur={() => {
                            const p = parseInt(tempBottomPageInput, 10);
                            const total = activeViewingDoc?.totalPages || 800;
                            if (!isNaN(p) && p >= 1 && p <= total) {
                              setViewerCurrentPage(p);
                              setViewerJumpInput(String(p));
                            }
                            setIsEditingBottomPage(false);
                          }}
                          autoFocus
                          className="w-14 px-1.5 py-0.5 bg-slate-900 border border-sky-400 rounded text-center text-sky-400 font-bold font-mono focus:outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setTempBottomPageInput(String(viewerCurrentPage));
                            setIsEditingBottomPage(true);
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-sky-400 font-bold cursor-pointer hover:border-sky-400 transition-colors"
                          title="클릭하여 페이지 번호 직접 입력 및 이동"
                        >
                          {viewerCurrentPage} ✏️
                        </button>
                      )}
                      <span>/ {activeViewingDoc?.totalPages || 800}{!isMobileMode && ' 페이지'}</span>
                    </div>

                    <span className="text-slate-600">|</span>

                    {/* [피드백 03 반영] 배율 선택목록과 직접입력을 단일 통합 콤보박스(Unified Zoom Combobox)로 일체화 (더블클릭 선택 & 포커스아웃 자동적용) */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      {!isMobileMode && <span>배율:</span>}
                      <div className="relative inline-flex items-center">
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={isEditingScaleInput ? tempScaleInput : `${Math.round(viewerScale * 100)}%`}
                            onFocus={(e) => {
                              setIsEditingScaleInput(true);
                              setTempScaleInput(String(Math.round(viewerScale * 100)));
                              e.currentTarget.select();
                            }}
                            onClick={() => {
                              if (!isEditingScaleInput) {
                                setIsEditingScaleInput(true);
                                setTempScaleInput(String(Math.round(viewerScale * 100)));
                              }
                            }}
                            onDoubleClick={(e) => {
                              setIsEditingScaleInput(true);
                              setTempScaleInput(String(Math.round(viewerScale * 100)));
                              e.currentTarget.select();
                            }}
                            onChange={(e) => {
                              const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                              setTempScaleInput(cleanVal);
                            }}
                            onBlur={() => {
                              const val = parseInt(tempScaleInput, 10);
                              if (!isNaN(val) && val >= 30 && val <= 300) {
                                setViewerScale(val / 100);
                                showToast(`배율 ${val}% 적용`, 'info');
                              } else {
                                setTempScaleInput(String(Math.round(viewerScale * 100)));
                              }
                              setIsEditingScaleInput(false);
                              setIsZoomDropdownOpen(false);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = parseInt(tempScaleInput, 10);
                                if (!isNaN(val) && val >= 30 && val <= 300) {
                                  setViewerScale(val / 100);
                                  showToast(`배율 ${val}% 적용`, 'info');
                                } else {
                                  setTempScaleInput(String(Math.round(viewerScale * 100)));
                                }
                                setIsEditingScaleInput(false);
                                setIsZoomDropdownOpen(false);
                                (e.target as HTMLElement).blur();
                              } else if (e.key === 'Escape') {
                                setTempScaleInput(String(Math.round(viewerScale * 100)));
                                setIsEditingScaleInput(false);
                                setIsZoomDropdownOpen(false);
                                (e.target as HTMLElement).blur();
                              }
                            }}
                            className="w-16 h-6 px-1.5 pr-5 bg-slate-900 border border-slate-700 hover:border-amber-400 focus:border-amber-400 rounded text-center text-amber-300 font-mono text-[11px] font-bold outline-none cursor-text transition-colors shadow-2xs select-all"
                            title="더블클릭하여 숫자 선택 입력 (포커스아웃/Enter 시 적용, ▼ 클릭 시 10단위 선택)"
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setIsZoomDropdownOpen((prev) => !prev);
                            }}
                            className="absolute right-1 text-[8px] text-amber-300/80 hover:text-amber-200 p-1 cursor-pointer"
                            title="10단위 % 선택목록 열기"
                          >
                            ▼
                          </button>
                        </div>

                        {/* 단일 통합 10단위 % 드롭다운 팝업 레이어 */}
                        {isZoomDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsZoomDropdownOpen(false)} />
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-40 w-24 max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 text-center font-mono text-xs animate-in fade-in zoom-in-95 duration-100">
                              <div className="text-[9px] text-slate-400 px-1 py-0.5 border-b border-slate-800 font-sans">
                                10단위 선택
                              </div>
                              {SCALE_OPTIONS_10.map((pct) => (
                                <div
                                  key={pct}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setViewerScale(pct / 100);
                                    setTempScaleInput(String(pct));
                                    setIsEditingScaleInput(false);
                                    setIsZoomDropdownOpen(false);
                                    showToast(`배율 ${pct}% 적용`, 'info');
                                  }}
                                  className={`px-2 py-1 cursor-pointer transition-colors ${
                                    Math.round(viewerScale * 100) === pct
                                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  {pct}%
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <span className="text-slate-600">|</span>

                    {/* [요청 7.1] 3. 여백 클릭 이동 토글 칩: 모바일 모드 시 아이콘만 표시 */}
                    <button
                      type="button"
                      onClick={() => {
                        setNavigateOnMarginClick(!navigateOnMarginClick);
                        showToast(`여백 클릭 페이지 이동: ${!navigateOnMarginClick ? '활성화' : '해제'}`, 'info');
                      }}
                      className={`rounded text-[10px] font-medium border cursor-pointer transition-colors flex items-center justify-center ${
                        isMobileMode ? 'p-1.5' : 'px-2 py-0.5'
                      } ${
                        navigateOnMarginClick
                          ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                      title={`문서 좌/우 빈 여백 클릭 시 이전/다음 페이지 이동 토글 (${navigateOnMarginClick ? 'ON' : 'OFF'})`}
                    >
                      {isMobileMode ? (
                        <MousePointerClick className="w-3.5 h-3.5" />
                      ) : (
                        `여백클릭 이동: ${navigateOnMarginClick ? 'ON' : 'OFF'}`
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* [요청 7.1] 이전 쪽: 모바일 모드 시 아이콘만 표시 */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(1, viewerCurrentPage - 1);
                        setViewerCurrentPage(next);
                        setViewerJumpInput(String(next));
                      }}
                      className={`rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium cursor-pointer flex items-center justify-center ${
                        isMobileMode ? 'p-1.5' : 'px-2.5 py-1'
                      }`}
                      title="이전 쪽"
                    >
                      {isMobileMode ? <ChevronLeft className="w-4 h-4" /> : '◀ 이전 쪽'}
                    </button>

                    {/* [요청 7.1] 다음 쪽: 모바일 모드 시 아이콘만 표시 */}
                    <button
                      type="button"
                      onClick={() => {
                        const total = activeViewingDoc?.totalPages || 800;
                        const next = Math.min(total, viewerCurrentPage + 1);
                        setViewerCurrentPage(next);
                        setViewerJumpInput(String(next));
                      }}
                      className={`rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer flex items-center justify-center ${
                        isMobileMode ? 'p-1.5' : 'px-2.5 py-1'
                      }`}
                      title="다음 쪽"
                    >
                      {isMobileMode ? <ChevronRight className="w-4 h-4" /> : '다음 쪽 ▶'}
                    </button>
                  </div>
                </div>
              )}

              {/* [전체화면 복구 플로팅 버튼] 전체화면 중 상/하단 숨김 여부와 무관하게 언제든 복구 가능 */}
              {isViewerFullscreen && (
                <button
                  type="button"
                  onClick={() => {
                    setIsViewerFullscreen(false);
                    setIsImmersiveZenMode(false);
                    showToast('↩️ 일반 화면으로 복구되었습니다.', 'info');
                  }}
                  className="absolute top-3 right-3 z-40 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all cursor-pointer group"
                  title="전체화면 종료 및 복구 (ESC)"
                >
                  <Minimize2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>

            {/* 비차단 인앱 토스트 피드백 */}
            {viewerToast && (
              <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-sky-500/50 shadow-2xl text-xs text-white backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    viewerToast.type === 'success'
                      ? 'bg-emerald-400'
                      : viewerToast.type === 'warn'
                      ? 'bg-amber-400'
                      : 'bg-sky-400'
                  }`}
                />
                <span className="font-medium">{viewerToast.message}</span>
                <button
                  type="button"
                  onClick={() => setViewerToast(null)}
                  className="ml-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* PG-USR-08: 오프라인 작업 정리 (리소스모드·문서모드 작업문서 정리, 충돌 머지, 히든주석 추적) */}
        {selectedProg === 'PG-USR-08' && (
          <div className="space-y-4 text-xs">
            {/* 오프라인 토스트 알림 */}
            {offlineToast && (
              <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-between transition-all animate-fade-in font-medium">
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>{offlineToast}</span>
                </div>
                <button onClick={() => setOfflineToast(null)} className="text-white/80 hover:text-white text-xs">✕</button>
              </div>
            )}

            {/* 1. 네트워크 감지 상태바 및 수동 재연결 제어기 */}
            <div className={`p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg transition-all ${
              isOfflineSimulated
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  isOfflineSimulated ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                }`}>
                  {isOfflineSimulated ? '📡' : '🌐'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      {isOfflineSimulated ? '네트워크 오프라인 상태 (로컬 단독 실행 중)' : '네트워크 온라인 연결 정상 (실시간 동기화)'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                      isOfflineSimulated ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {isOfflineSimulated ? 'OFFLINE_CACHE_ACTIVE' : 'ONLINE_SYNC_LIVE'}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isOfflineSimulated ? 'text-amber-400/80' : 'text-emerald-400/80'}`}>
                    {isOfflineSimulated
                      ? '오프라인 중 작업된 문서는 안전하게 로컬에 격리 보관되며, 온라인 복구 시 "오프라인 작업 정리" 대상 목록으로 취합됩니다.'
                      : '온라인 상태입니다. 오프라인 중 진행된 작업문서의 충돌 여부를 검토하고 서버 정본에 안전하게 머지하세요.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const next = !isOfflineSimulated;
                    setIsOfflineSimulated(next);
                    setOfflineToast(next ? '📡 오프라인 모드로 전환되었습니다. 로컬 캐시 격리 활성화' : '🌐 온라인 모드로 복귀되었습니다. 오프라인 작업문서 현행화 대기');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
                >
                  {isOfflineSimulated ? '🌐 온라인 전환' : '📡 오프라인 전환'}
                </button>
                <button
                  onClick={() => {
                    setOfflineToast('🔄 오프라인 작업문서 3건의 원격 상태를 조회하여 동기화 및 충돌을 분석 중입니다...');
                  }}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-md transition active:scale-95"
                >
                  <span>🔄</span>
                  <span>작업목록 새로고침</span>
                </button>
              </div>
            </div>

            {/* 2. 오프라인 작업문서 검색 및 상세 필터 */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5 shadow-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1) 문서 ID */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-medium whitespace-nowrap">문서 ID</label>
                  <input
                    type="text"
                    value={filterDocId}
                    onChange={(e) => setFilterDocId(e.target.value)}
                    placeholder="예: DOC-0091"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 2) 문서 제목 */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-medium whitespace-nowrap">문서제목</label>
                  <input
                    type="text"
                    value={filterDocTitle}
                    onChange={(e) => setFilterDocTitle(e.target.value)}
                    placeholder="문서제목 검색"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 3) 상태 선택목록 */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-medium whitespace-nowrap">상태</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">전체 상태</option>
                    <option value="충돌감지">⚠️ 충돌감지</option>
                    <option value="바로머지가능">⚡ 바로머지가능</option>
                    <option value="온라인등록대기">🔍 온라인등록대기</option>
                    <option value="머지완료">✓ 머지완료</option>
                  </select>
                </div>

                {/* 4) 작업유형 선택목록 */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-medium whitespace-nowrap">작업유형</label>
                  <select
                    value={filterWorkMode}
                    onChange={(e) => setFilterWorkMode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">전체 작업유형</option>
                    <option value="리소스모드">리소스모드</option>
                    <option value="문서모드">문서모드</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 items-end">
                {/* 5) 오프라인시간 시작 */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-medium whitespace-nowrap">오프라인시간 (시작)</label>
                  <input
                    type="date"
                    value={filterTimeFrom}
                    onChange={(e) => setFilterTimeFrom(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 6) 오프라인시간 종료 */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-medium whitespace-nowrap">오프라인시간 (종료)</label>
                  <input
                    type="date"
                    value={filterTimeTo}
                    onChange={(e) => setFilterTimeTo(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 7) 작업자 검색 */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-medium whitespace-nowrap">작업자</label>
                  <input
                    type="text"
                    value={filterAuthor}
                    onChange={(e) => setFilterAuthor(e.target.value)}
                    placeholder="작업자 이메일/ID"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 8) 초기화 버튼 */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterDocId('');
                      setFilterDocTitle('');
                      setFilterStatus('ALL');
                      setFilterWorkMode('ALL');
                      setFilterTimeFrom('');
                      setFilterTimeTo('');
                      setFilterAuthor('');
                    }}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🔄</span>
                    <span>필터 초기화</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. 오프라인 작업 정리 문서 목록 (작업 단위 관리 - 건수만 표시) */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 shadow-md">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                  <span>📂 오프라인 작업 문서 정리 목록</span>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono border border-indigo-500/30">
                    총 {filteredOfflineDocs.length}건
                  </span>
                </span>
              </div>

              {/* 모바일 모드: 반응형 독립 카드 리스트 (Table-to-Card Pattern per Policy 03-14) */}
              {isMobileMode ? (
                <div className="space-y-3">
                  {filteredOfflineDocs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 font-sans bg-slate-900/40 rounded-xl border border-slate-800">
                      조회된 결과가 없습니다.
                    </div>
                  ) : (
                    filteredOfflineDocs.map((doc) => (
                      <div
                        key={doc.docId}
                        className={`p-3.5 bg-slate-900/80 border rounded-xl space-y-2.5 transition shadow-sm ${
                          doc.hasConflict ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-800'
                        }`}
                      >
                        {/* 1행: 상단 식별 헤더 (문서 ID + 작업모드 + 상태 뱃지) */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sky-400 font-mono text-xs">{doc.docId}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap inline-block ${
                              doc.workMode === '리소스모드'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {doc.workMode}
                            </span>
                          </div>
                          <div>
                            {doc.status === '충돌감지' && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold whitespace-nowrap">
                                ⚠️ 충돌감지
                              </span>
                            )}
                            {doc.status === '바로머지가능' && (
                              <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[10px] font-bold whitespace-nowrap">
                                ⚡ 바로머지가능
                              </span>
                            )}
                            {doc.status === '온라인등록대기' && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold whitespace-nowrap">
                                🔍 등록대기
                              </span>
                            )}
                            {doc.status === '머지완료' && (
                              <span className="px-2 py-0.5 bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold whitespace-nowrap">
                                ✓ 머지완료
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 2행: 핵심 타이틀 (문서명 + 캐시범위 + 문서버전) */}
                        <div className="flex items-start justify-between gap-2 border-t border-slate-800/60 pt-2">
                          <div className="font-sans font-medium text-slate-200 text-xs leading-snug">
                            {doc.docName}
                            {doc.cachedPages && (
                              <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
                                ({doc.cachedPages}p 캐시)
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-300 font-mono whitespace-nowrap shrink-0">{doc.docVersion}</span>
                        </div>

                        {/* 3행: 시간 이력 및 작업자 정보 */}
                        <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/40">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">⏱️ 오프라인시간</span>
                            <span className="text-slate-300">{doc.offlineTime}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">✏️ 작업시간</span>
                            <span className="text-slate-300">{doc.startTime} ~ {doc.endTime}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">👤 작업자</span>
                            <span className="text-slate-300 truncate max-w-[180px]">{doc.author}</span>
                          </div>
                        </div>

                        {/* 4행: 하단 모바일 원터치 액션 버튼 */}
                        <div className="pt-1">
                          {doc.status === '충돌감지' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedConflictDoc(doc);
                                setIsDiffModalOpen(true);
                              }}
                              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs shadow flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                            >
                              <span>⚠️</span>
                              <span>주석 비교 & 충돌 머지</span>
                            </button>
                          )}
                          {doc.status === '바로머지가능' && (
                            <button
                              type="button"
                              onClick={() => {
                                setOfflineWorkDocs(prev => prev.map(d => d.docId === doc.docId ? { ...d, status: '머지완료' } : d));
                                setOfflineToast(`✅ ${doc.docId} (${doc.docName}) 변경 내역이 충돌 없이 원격 서버에 즉시 머지되었습니다.`);
                              }}
                              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs shadow flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                            >
                              <span>⚡</span>
                              <span>원격 서버로 바로 머지</span>
                            </button>
                          )}
                          {doc.status === '온라인등록대기' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedConflictDoc(doc);
                                setIsDiffModalOpen(true);
                              }}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                            >
                              <span>🔍</span>
                              <span>히든주석 정본 등록</span>
                            </button>
                          )}
                          {doc.status === '머지완료' && (
                            <div className="w-full py-1.5 text-center bg-slate-800 text-emerald-400 rounded-lg text-xs font-bold font-mono">
                              ✓ 클라우드 서버 머지 완료됨
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* 데스크톱 모드: 표준 테이블 그리드 */
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                        <th className="p-2.5 whitespace-nowrap">문서 ID</th>
                        <th className="p-2.5 whitespace-nowrap">문서명</th>
                        <th className="p-2.5 whitespace-nowrap leading-tight">문서<br />버전</th>
                        <th className="p-2.5 whitespace-nowrap">작업모드</th>
                        <th className="p-2.5 whitespace-nowrap leading-tight">오프라인<br />시간</th>
                        <th className="p-2.5 whitespace-nowrap leading-tight">작업시작시간<br />(최초수정)</th>
                        <th className="p-2.5 whitespace-nowrap leading-tight">작업종료시간<br />(저장)</th>
                        <th className="p-2.5 whitespace-nowrap">작업자</th>
                        <th className="p-2.5 text-center whitespace-nowrap">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredOfflineDocs.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-500 font-sans">
                            조회된 결과가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredOfflineDocs.map((doc) => (
                          <tr
                            key={doc.docId}
                            className={`hover:bg-slate-900/40 transition ${
                              doc.hasConflict ? 'bg-amber-950/10' : ''
                            }`}
                          >
                            <td className="p-2.5 font-bold text-sky-400 whitespace-nowrap align-middle">{doc.docId}</td>
                            <td className="p-2.5 font-sans font-medium text-slate-200 align-middle">
                              {doc.docName}
                              {doc.cachedPages && (
                                <span className="ml-1.5 text-[10px] text-slate-500 font-mono">
                                  ({doc.cachedPages}p 캐시)
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-300 whitespace-nowrap align-middle">{doc.docVersion}</td>
                            <td className="p-2.5 whitespace-nowrap align-middle">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap inline-block ${
                                doc.workMode === '리소스모드'
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {doc.workMode}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-400 whitespace-nowrap align-middle">{doc.offlineTime}</td>
                            <td className="p-2.5 text-slate-300 whitespace-nowrap align-middle">{doc.startTime}</td>
                            <td className="p-2.5 text-slate-300 whitespace-nowrap align-middle">{doc.endTime}</td>
                            <td className="p-2.5 text-slate-400 truncate max-w-[130px] whitespace-nowrap align-middle" title={doc.author}>{doc.author}</td>
                            <td className="p-2.5 text-center whitespace-nowrap align-middle">
                              {doc.status === '충돌감지' && (
                                <button
                                  onClick={() => {
                                    setSelectedConflictDoc(doc);
                                    setIsDiffModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-[10px] shadow flex items-center gap-1 mx-auto whitespace-nowrap transition cursor-pointer"
                                >
                                  <span>⚠️</span>
                                  <span>충돌 머지</span>
                                </button>
                              )}
                              {doc.status === '바로머지가능' && (
                                <button
                                  onClick={() => {
                                    setOfflineWorkDocs(prev => prev.map(d => d.docId === doc.docId ? { ...d, status: '머지완료' } : d));
                                    setOfflineToast(`✅ ${doc.docId} (${doc.docName}) 변경 내역이 충돌 없이 원격 서버에 즉시 머지되었습니다.`);
                                  }}
                                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-[10px] shadow flex items-center gap-1 mx-auto whitespace-nowrap transition cursor-pointer"
                                >
                                  <span>⚡</span>
                                  <span>바로 머지</span>
                                </button>
                              )}
                              {doc.status === '온라인등록대기' && (
                                <button
                                  onClick={() => {
                                    setSelectedConflictDoc(doc);
                                    setIsDiffModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] shadow flex items-center gap-1 mx-auto whitespace-nowrap transition cursor-pointer"
                                >
                                  <span>🔍</span>
                                  <span>히든주석 등록</span>
                                </button>
                              )}
                              {doc.status === '머지완료' && (
                                <span className="px-2 py-0.5 bg-slate-800 text-emerald-400 rounded text-[10px] font-bold whitespace-nowrap">
                                  ✓ 머지완료
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 4. 작업 문서 충돌 머지 & 히든 주석 상세 검토 모달 */}
            {isDiffModalOpen && selectedConflictDoc && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
                  {/* 모달 헤더 */}
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{selectedConflictDoc.workMode === '리소스모드' ? '⚠️ 리소스모드 주석 충돌 비교 & 머지' : '📑 문서모드 히든 주석 검증 & 서버 정본 등록'}</span>
                        <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono border border-indigo-500/30">
                          {selectedConflictDoc.docId} ({selectedConflictDoc.docVersion})
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {selectedConflictDoc.workMode === '리소스모드'
                          ? '오프라인 중 로컬에서 수정한 주석과 외부에서 원격 수정한 주석 간의 충돌을 비교하고 반영 방향을 결정합니다.'
                          : '디바이스의 PDF 파일에 각인된 히든 주석 메타데이터를 검증하고 온라인 시스템 정본으로 안전하게 등록합니다.'}
                      </p>
                    </div>
                    <button onClick={() => setIsDiffModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded">✕</button>
                  </div>

                  {/* 리소스 모드 충돌 시: 주석 양자 비교 카드 & 한쪽 반영 기능 */}
                  {selectedConflictDoc.workMode === '리소스모드' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* 내 오프라인 작업내용 */}
                        <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/40 rounded-xl space-y-2">
                          <div className="flex justify-between items-center border-b border-indigo-500/20 pb-1.5">
                            <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                              <span>💻</span>
                              <span>내 오프라인 작업내용 (Local)</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">저장: {selectedConflictDoc.endTime}</span>
                          </div>
                          <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-200 space-y-1">
                            <div className="text-amber-300 font-bold">• {selectedConflictDoc.offlineChangeDesc}</div>
                            <div className="text-slate-400 text-[10px]">작업자: {selectedConflictDoc.author}</div>
                          </div>
                          <button
                            onClick={() => {
                              setOfflineWorkDocs(prev => prev.map(d => d.docId === selectedConflictDoc.docId ? { ...d, status: '머지완료', hasConflict: false } : d));
                              setIsDiffModalOpen(false);
                              setOfflineToast(`✅ [내 작업 반영] ${selectedConflictDoc.docId} 로컬 작업내용이 서버에 우선 반영(Local-Wins)되었습니다.`);
                            }}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow transition active:scale-95 flex items-center justify-center gap-1"
                          >
                            <span>👉 내 오프라인 작업 100% 반영 (Local-Wins)</span>
                          </button>
                        </div>

                        {/* 외부 작업내용 */}
                        <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-2">
                          <div className="flex justify-between items-center border-b border-emerald-500/20 pb-1.5">
                            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                              <span>☁️</span>
                              <span>외부 원격 작업내용 (Remote)</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">외부 저장: 14:14:00</span>
                          </div>
                          <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-200 space-y-1">
                            <div className="text-sky-300 font-bold">• {selectedConflictDoc.externalChangeDesc}</div>
                            <div className="text-slate-400 text-[10px]">수정자: reviewer@pdfrend.com (동시 수정자)</div>
                          </div>
                          <button
                            onClick={() => {
                              setOfflineWorkDocs(prev => prev.map(d => d.docId === selectedConflictDoc.docId ? { ...d, status: '머지완료', hasConflict: false } : d));
                              setIsDiffModalOpen(false);
                              setOfflineToast(`✅ [외부 작업 반영] ${selectedConflictDoc.docId} 외부 원격본이 채택되고 내 작업본은 격리 백업되었습니다.`);
                            }}
                            className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs shadow transition active:scale-95 flex items-center justify-center gap-1"
                          >
                            <span>👈 외부 원격 작업 100% 반영 (Remote-Wins)</span>
                          </button>
                        </div>
                      </div>

                      {/* 스마트 양방향 병합 옵션 */}
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                            <span>🌟</span>
                            <span>양방향 스마트 병합 (Smart 3-Way Merge)</span>
                          </span>
                          <p className="text-[11px] text-slate-400">
                            내 오프라인 형광펜/메모와 외부 OCR 레이어 교정본을 상호 보존하며 하나의 통합 주석으로 병합합니다.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setOfflineWorkDocs(prev => prev.map(d => d.docId === selectedConflictDoc.docId ? { ...d, status: '머지완료', hasConflict: false } : d));
                            setIsDiffModalOpen(false);
                            setOfflineToast(`🎉 [스마트 병합] ${selectedConflictDoc.docId} 로컬 주석과 원격 수정사항이 성공적으로 결합되었습니다.`);
                          }}
                          className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs shrink-0 shadow transition"
                        >
                          양방향 스마트 병합 확정
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 문서 모드 등록 시: 히든 주석 메타데이터 확인 및 등록 */}
                  {selectedConflictDoc.workMode === '문서모드' && selectedConflictDoc.hiddenMetadata && (
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                          <span>🔍</span>
                          <span>PDF 파일 각인 히든 주석 (Hidden Annotation Metadata) 추출 결과</span>
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                          <div><span className="text-slate-500">문서번호:</span> <span className="text-sky-300 font-bold">{selectedConflictDoc.hiddenMetadata.docNo}</span></div>
                          <div><span className="text-slate-500">문서버전:</span> <span className="text-slate-200">{selectedConflictDoc.hiddenMetadata.docVersion}</span></div>
                          <div><span className="text-slate-500">작업시작:</span> <span className="text-slate-300">{selectedConflictDoc.hiddenMetadata.startTime}</span></div>
                          <div><span className="text-slate-500">수정일시:</span> <span className="text-slate-300">{selectedConflictDoc.hiddenMetadata.updateTime}</span></div>
                          <div><span className="text-slate-500">종료일시:</span> <span className="text-slate-300">{selectedConflictDoc.hiddenMetadata.endTime}</span></div>
                          <div><span className="text-slate-500">수정자:</span> <span className="text-slate-300">{selectedConflictDoc.hiddenMetadata.modifier}</span></div>
                          <div><span className="text-slate-500">생성주석:</span> <span className="text-emerald-400 font-bold">{selectedConflictDoc.hiddenMetadata.annotationCount}건</span></div>
                          <div><span className="text-slate-500">대상시스템:</span> <span className="text-slate-300">{selectedConflictDoc.hiddenMetadata.targetSystem}</span></div>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          오프라인 환경에서 로컬 디바이스에 저장된 파일 내에 위 메타데이터가 보존되어 있으며, 온라인 연결 시 원격 라이브러리에 신규 정본으로 일괄 머지됩니다.
                        </p>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => setIsDiffModalOpen(false)}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => {
                            setOfflineWorkDocs(prev => prev.map(d => d.docId === selectedConflictDoc.docId ? { ...d, status: '머지완료' } : d));
                            setIsDiffModalOpen(false);
                            setOfflineToast(`🎉 [정본 등록 완료] ${selectedConflictDoc.docId} 히든주석 및 로컬 작업내용이 클라우드 정본으로 등록되었습니다.`);
                          }}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow transition"
                        >
                          ✓ 히든주석 검증 및 시스템 정본으로 머지 등록
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 하단 닫기 (리소스 모드 전용) */}
                  {selectedConflictDoc.workMode === '리소스모드' && (
                    <div className="flex justify-end pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setIsDiffModalOpen(false)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      >
                        닫기
                      </button>
                    </div>
                  )}
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
                                  <button
                                    type="button"
                                    onClick={() => toggleQuickBookmark(t.id, t.name)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                                      quickBookmarks.includes(t.id)
                                        ? 'text-amber-300 bg-amber-400/20 border border-amber-400/40'
                                        : 'text-slate-500 hover:text-slate-300 border border-slate-800'
                                    }`}
                                    title="프로필 하단 퀵설정 드로어에 즐겨찾기 등록/해제"
                                  >
                                    ★
                                  </button>
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
                          <button
                            type="button"
                            onClick={() => toggleQuickBookmark(`sc-${t.id}`, `${t.name} 단축키`)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                              quickBookmarks.includes(`sc-${t.id}`)
                                ? 'text-amber-300 bg-amber-400/20 border border-amber-400/40'
                                : 'text-slate-500 hover:text-slate-300 border border-slate-800'
                            }`}
                            title="프로필 하단 퀵설정 드로어에 즐겨찾기 등록/해제"
                          >
                            ★
                          </button>
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
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-200">뷰어 보기 및 테마 일반 옵션</span>
                  <span className="text-[11px] text-slate-400">
                    각 항목 우측의 <strong className="text-amber-400">★</strong> 버튼을 누르면 프로필 레이어 하단 퀵설정 바에 등록됩니다.
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleQuickBookmark('opt-theme', '테마 모드')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          quickBookmarks.includes('opt-theme')
                            ? 'text-amber-300 bg-amber-400/20 border border-amber-400/40'
                            : 'text-slate-500 hover:text-slate-300 border border-slate-800'
                        }`}
                        title="프로필 하단 퀵설정 드로어에 즐겨찾기 등록/해제"
                      >
                        ★
                      </button>
                      <span>🌓 테마 모드</span>
                    </div>
                    <select className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200">
                      <option>다크 모드 (기본값)</option>
                      <option>라이트 모드</option>
                      <option>세피아 모드</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleQuickBookmark('opt-home', '초기 첫화면')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          quickBookmarks.includes('opt-home')
                            ? 'text-amber-300 bg-amber-400/20 border border-amber-400/40'
                            : 'text-slate-500 hover:text-slate-300 border border-slate-800'
                        }`}
                        title="프로필 하단 퀵설정 드로어에 즐겨찾기 등록/해제"
                      >
                        ★
                      </button>
                      <span>🏠 초기 첫화면 지정</span>
                    </div>
                    <select className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200">
                      <option>홈 대시보드 (PG-USR-03)</option>
                      <option>문서관리 라이브러리 (PG-USR-05)</option>
                      <option>마지막 열람 문서 뷰어</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleQuickBookmark('opt-ocr', '기본 OCR 엔진')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          quickBookmarks.includes('opt-ocr')
                            ? 'text-amber-300 bg-amber-400/20 border border-amber-400/40'
                            : 'text-slate-500 hover:text-slate-300 border border-slate-800'
                        }`}
                        title="프로필 하단 퀵설정 드로어에 즐겨찾기 등록/해제"
                      >
                        ★
                      </button>
                      <span>🔤 기본 OCR 엔진</span>
                    </div>
                    <select className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200">
                      <option>Gemini 1.5 Flash (클라우드 고정밀)</option>
                      <option>Tesseract WASM (로컬 오프라인)</option>
                      <option>자동 앙상블 (하이브리드)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleQuickBookmark('opt-autosave', '자동 저장 주기')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          quickBookmarks.includes('opt-autosave')
                            ? 'text-amber-300 bg-amber-400/20 border border-amber-400/40'
                            : 'text-slate-500 hover:text-slate-300 border border-slate-800'
                        }`}
                        title="프로필 하단 퀵설정 드로어에 즐겨찾기 등록/해제"
                      >
                        ★
                      </button>
                      <span>💾 자동 저장 주기</span>
                    </div>
                    <select className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200">
                      <option>3초 (권장 실시간)</option>
                      <option>10초</option>
                      <option>수동 저장만 실행</option>
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
            {/* [요청 2, 0012 반영] 프로필 정보 요약 카드: 읽기 모드 vs 인라인 편집 모드 전환 */}
            {!isInfoEditMode ? (
              /* 읽기 모드 (평상시) */
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 shrink-0 group">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-900 border-2 border-sky-400/80 ring-2 ring-sky-500/20 shadow-md">
                      <img src={signupAvatar} alt="사용자 프로필" className="w-full h-full object-cover" />
                    </div>
                    {/* [요청 반영] 튀지 않게 톤을 낮춘 아바타 연필 수정 버튼 ➔ 클릭 시 크롭 모달 즉각 팝업 */}
                    <button
                      type="button"
                      onClick={() => {
                        setTempCropImage(signupAvatar);
                        setTempCropScale(avatarScale);
                        setTempCropPosX(avatarPosX);
                        setTempCropPosY(avatarPosY);
                        setIsCropModalOpen(true);
                      }}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/90 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                      title="프로필 사진 및 자르기(크롭) 편집"
                      aria-label="프로필 사진 수정"
                    >
                      <Pencil className="w-3 h-3 text-slate-300" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{signupName}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">@{signupNickname}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">PRO 회원</span>
                    </div>
                    <div className="text-slate-400 text-xs font-mono flex items-center gap-2">
                      <span>{signupEmail}</span>
                      <span className="text-slate-600">·</span>
                      <span>{signupPhone}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">가입일: 2026-03-15 · 최근 로그인: 오늘 14:20</div>
                  </div>
                </div>

                {/* 우측 계정 보안 배지 및 기본정보 수정 버튼 */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium hidden sm:flex items-center gap-1.5 shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>보안 계정 검증 완료</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(signupName);
                      setEditNickname(signupNickname);
                      setEditPhone(signupPhone);
                      setEditEmail(signupEmail);
                      setIsInfoEditMode(true);
                      setInfoSaveMessage(null);
                    }}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-slate-700/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>기본정보 수정</span>
                  </button>
                </div>
              </div>
            ) : (
              /* [0012 반영] 인라인 편집 모드 */
              <div className="p-4 bg-slate-950 border border-sky-500/40 rounded-xl space-y-3.5 shadow-lg shadow-sky-500/5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">✏️ 회원 기본정보 인라인 수정</span>
                    <span className="text-[10px] text-slate-500">실명, 별명, 연락처, 이메일을 즉시 수정하고 저장합니다.</span>
                  </div>
                  {infoSaveMessage && (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {infoSaveMessage}
                    </span>
                  )}
                </div>

                <div className="flex flex-col md:flex-row items-start gap-4">
                  {/* 좌측 아바타 및 사진 수정 */}
                  <div className="relative w-16 h-16 shrink-0 group">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-900 border-2 border-sky-400 ring-2 ring-sky-500/20 shadow-md">
                      <img src={signupAvatar} alt="사용자 프로필" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTempCropImage(signupAvatar);
                        setTempCropScale(avatarScale);
                        setTempCropPosX(avatarPosX);
                        setTempCropPosY(avatarPosY);
                        setIsCropModalOpen(true);
                      }}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/90 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                      title="프로필 사진 및 자르기(크롭) 편집"
                      aria-label="프로필 사진 수정"
                    >
                      <Pencil className="w-3 h-3 text-slate-300" />
                    </button>
                  </div>

                  {/* 우측 4대 정보 입력 필드 그리드 */}
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* 1. 이름 */}
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">
                        실명 (이름) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="이름 입력"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-sky-500"
                      />
                    </div>

                    {/* 2. 별명 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-400 text-[11px]">
                          서비스 별명 (닉네임) <span className="text-rose-400">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (!editNickname.trim()) return alert('별명을 입력해주세요.');
                            alert(`'@${editNickname.replace(/^@/, '')}' 별명은 사용 가능한 고유 닉네임입니다.`);
                          }}
                          className="text-[10px] text-sky-400 hover:underline font-mono"
                        >
                          중복확인
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-slate-500 font-mono text-xs">@</span>
                        <input
                          type="text"
                          value={editNickname.replace(/^@/, '')}
                          onChange={(e) => setEditNickname(e.target.value)}
                          placeholder="닉네임 입력"
                          className="w-full pl-6 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono focus:outline-hidden focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {/* 3. 전화번호 */}
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">
                        휴대폰 번호 <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="010-1234-5678"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono focus:outline-hidden focus:border-sky-500"
                      />
                    </div>

                    {/* 4. 이메일 및 인라인 인증 발송·6자리 검증 통합 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-400 text-[11px]">
                          계정 이메일 (로그인 ID) <span className="text-rose-400">*</span>
                        </label>
                        {/* 시스템 이메일 인증 정책 안내 뱃지 */}
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className={`px-1.5 py-0.2 rounded font-mono ${
                            isEmailAuthPolicyRequired
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            인증정책: {isEmailAuthPolicyRequired ? '필수 🔒' : '선택(생략가능) 🔓'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEmailAuthPolicyRequired(!isEmailAuthPolicyRequired)}
                            className="text-sky-400 hover:underline"
                            title="시스템 정책 전환"
                          >
                            [전환]
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => {
                            setEditEmail(e.target.value);
                            if (e.target.value !== signupEmail) {
                              setIsEmailCodeVerified(false);
                            }
                          }}
                          placeholder="user@example.com"
                          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono focus:outline-hidden focus:border-sky-500"
                        />
                        {/* 이메일 변경 감지 시 우측 [인증번호 발송] 버튼 인라인 직결 */}
                        {editEmail !== signupEmail && !isEmailCodeVerified && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!editEmail.includes('@')) {
                                alert('유효한 이메일 주소를 입력해주세요.');
                                return;
                              }
                              setEmailSentTo(editEmail);
                              setEmailInputCode('');
                              setEmailVerifyFeedback(`[인증 발송] ${editEmail}로 6자리 보안 인증번호(482910)가 전송되었습니다.`);
                            }}
                            className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-semibold cursor-pointer shrink-0 transition-all shadow-xs"
                          >
                            {emailSentTo === editEmail ? '재발송' : '인증번호 발송'}
                          </button>
                        )}
                        {/* 인증 완료 상태 표시 */}
                        {editEmail !== signupEmail && isEmailCodeVerified && (
                          <span className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1 shrink-0">
                            ✓ 인증완료
                          </span>
                        )}
                      </div>

                      {/* 이메일 변경 시 인라인 인증번호 입력 확장 서랍 */}
                      {editEmail !== signupEmail && emailSentTo === editEmail && !isEmailCodeVerified && (
                        <div className="mt-2 p-2.5 bg-slate-900 border border-sky-500/40 rounded-lg space-y-2 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-sky-300 font-medium">
                              ✉️ <strong>{emailSentTo}</strong> 주소로 전송된 6자리 번호
                            </span>
                            <span className="text-amber-400 font-mono font-bold">02:59 남음</span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={emailInputCode}
                              onChange={(e) => setEmailInputCode(e.target.value)}
                              placeholder="6자리 번호 (테스트: 482910)"
                              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs font-mono focus:outline-hidden focus:border-sky-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (emailInputCode === '482910' || emailInputCode.length === 6) {
                                  setIsEmailCodeVerified(true);
                                  setEmailVerifyFeedback('✓ 이메일 인증이 성공적으로 확인되었습니다.');
                                } else {
                                  alert('인증번호 6자리를 확인해주세요. (시뮬레이션 번호: 482910)');
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs cursor-pointer shadow-xs shrink-0"
                            >
                              인증 확인
                            </button>
                          </div>
                          {emailVerifyFeedback && (
                            <div className="text-[10px] text-sky-400 font-mono flex items-center gap-1">
                              <span>ℹ️</span>
                              <span>{emailVerifyFeedback}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 하단 유효성 안내 및 저장/취소 액션 */}
                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-500">
                    {isEmailAuthPolicyRequired && editEmail !== signupEmail && !isEmailCodeVerified
                      ? '* 시스템 정책(인증 필수)에 따라 새 이메일 인증을 완료해야 저장할 수 있습니다.'
                      : '* 기본정보 변경 사항은 저장 즉시 프로필 요약 카드에 반영됩니다.'}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsInfoEditMode(false);
                        setEmailSentTo(null);
                        setEmailInputCode('');
                        setIsEmailCodeVerified(false);
                        setEmailVerifyFeedback(null);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      disabled={
                        !editName ||
                        !editNickname ||
                        !editPhone ||
                        !editEmail ||
                        (isEmailAuthPolicyRequired && editEmail !== signupEmail && !isEmailCodeVerified)
                      }
                      onClick={() => {
                        if (!editName || !editNickname || !editPhone || !editEmail) {
                          alert('모든 필수 정보를 입력해주세요.');
                          return;
                        }
                        if (isEmailAuthPolicyRequired && editEmail !== signupEmail && !isEmailCodeVerified) {
                          alert('새 이메일 인증번호 확인을 완료해주세요.');
                          return;
                        }
                        setSignupName(editName);
                        setSignupNickname(editNickname.replace(/^@/, ''));
                        setSignupPhone(editPhone);
                        setSignupEmail(editEmail);
                        setInfoSaveMessage('기본정보가 안전하게 저장되었습니다.');
                        setTimeout(() => {
                          setIsInfoEditMode(false);
                          setInfoSaveMessage(null);
                          setEmailSentTo(null);
                          setEmailInputCode('');
                          setIsEmailCodeVerified(false);
                          setEmailVerifyFeedback(null);
                        }, 800);
                      }}
                      className={`px-4 py-1.5 font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1 ${
                        isEmailAuthPolicyRequired && editEmail !== signupEmail && !isEmailCodeVerified
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                      }`}
                    >
                      <span>저장하기</span>
                      <span>✓</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 계정 보안 및 2FA 설정 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* [요청 및 0013 반영] 좌측: 2FA 정책/옵션화, 주 인증수단 선택, 소셜 연동 옵션 및 비상복구코드 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>2단계 인증 (2FA) 및 계정 보안</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                    is2FaPolicyRequired
                      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                      : (is2FaUserEnabled
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700')
                  }`}>
                    {is2FaPolicyRequired ? '정책: 필수 🔒' : (is2FaUserEnabled ? '2FA 활성화됨 ✓' : '2FA 미사용 (선택)')}
                  </span>
                </h4>

                {/* 시스템 정책 옵션 툴바 (2FA 강제 vs 선택, 소셜 연동 허용 vs 차단) */}
                <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">2FA 정책:</span>
                    <button
                      type="button"
                      onClick={() => setIs2FaPolicyRequired(!is2FaPolicyRequired)}
                      className={`px-1.5 py-0.5 rounded font-mono cursor-pointer transition-colors ${
                        is2FaPolicyRequired
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                      }`}
                      title="클릭하여 2FA 필수/선택 정책 전환"
                    >
                      {is2FaPolicyRequired ? '강제 필수 🔒' : '사용자 선택 🔓'}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">소셜로그인 정책:</span>
                    <button
                      type="button"
                      onClick={() => setIsSocialAuthPolicyEnabled(!isSocialAuthPolicyEnabled)}
                      className={`px-1.5 py-0.5 rounded font-mono cursor-pointer transition-colors ${
                        isSocialAuthPolicyEnabled
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}
                      title="클릭하여 소셜 연동 허용 정책 전환"
                    >
                      {isSocialAuthPolicyEnabled ? '연동 허용 ON' : '연동 차단 OFF'}
                    </button>
                  </div>
                </div>

                {/* 정책이 '선택(옵션)'일 때: 사용자가 2FA 사용 여부를 직접 토글 */}
                {!is2FaPolicyRequired && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-200 font-medium block">2단계 로그인 인증 사용</span>
                      <span className="text-[10px] text-slate-500">
                        {is2FaUserEnabled ? '로그인 시 2차 본인 확인을 요구합니다.' : '아이디와 비밀번호만으로 즉시 로그인합니다.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIs2FaUserEnabled(!is2FaUserEnabled)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        is2FaUserEnabled
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {is2FaUserEnabled ? '2FA 켜짐 (ON)' : '2FA 꺼짐 (OFF)'}
                    </button>
                  </div>
                )}

                {/* 2FA가 활성화된 경우 (정책 필수이거나 사용자가 켠 경우): 주 2차 인증수단 선택 */}
                {(is2FaPolicyRequired || is2FaUserEnabled) && (
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">로그인 시 주 2차 인증 수단 (Primary)</span>
                      <span className="text-[10px] text-sky-400 font-mono">1클릭 지정</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'kakao', label: '카카오 간편인증', icon: '🟡', desc: '알림톡 원클릭 승인' },
                        { id: 'google', label: '구글 OTP/인증', icon: '🔵', desc: 'Authenticator 앱' },
                        { id: 'naver', label: '네이버 2차인증', icon: '🟢', desc: '네이버 앱 2FA 승인' },
                        { id: 'email', label: '이메일 인증번호', icon: '✉️', desc: signupEmail },
                      ].map((m) => {
                        const isSelected = primary2FaMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setPrimary2FaMethod(m.id as any);
                              alert(`로그인 주 2차 인증 수단이 [${m.label}]로 설정되었습니다.`);
                            }}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-sky-950/60 border-sky-400 ring-1 ring-sky-500/40 shadow-xs'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-semibold text-white text-[11px] flex items-center gap-1">
                                <span>{m.icon}</span>
                                <span>{m.label}</span>
                              </span>
                              {isSelected && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500 text-white font-bold">주수단</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 truncate">{m.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 소셜 간편인증 연동 영역 (소셜 정책 허용 시 노출) */}
                {isSocialAuthPolicyEnabled ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-slate-400 text-[11px] font-medium block">소셜 간편인증 연동 계정</span>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Google */}
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                          <span className="font-semibold text-slate-200 text-[11px] truncate">Google</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">연동됨</span>
                      </div>

                      {/* Kakao */}
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-4 h-4 rounded-sm bg-[#FEE500] flex items-center justify-center shrink-0">
                            <svg className="w-2.5 h-2.5 fill-[#191919]" viewBox="0 0 24 24">
                              <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.83 1.86 5.32 4.67 6.72-.2.74-.75 2.76-.86 3.19-.14.54.2.53.42.38.29-.19 3.86-2.58 4.54-3.04.4.05.81.08 1.23.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                            </svg>
                          </div>
                          <span className="font-semibold text-slate-200 text-[11px] truncate">Kakao</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">연동됨</span>
                      </div>

                      {/* Naver */}
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-4 h-4 rounded-sm bg-[#03C75A] flex items-center justify-center text-white font-bold text-[9px] shrink-0">
                            N
                          </div>
                          <span className="font-semibold text-slate-200 text-[11px] truncate">Naver</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSocialLinkStates({ ...socialLinkStates, naver: !socialLinkStates.naver })}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-all cursor-pointer shrink-0 ${
                            socialLinkStates.naver
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                              : 'text-slate-400 bg-slate-800 hover:text-white border border-slate-700'
                          }`}
                        >
                          {socialLinkStates.naver ? '연동됨' : '+ 연동'}
                        </button>
                      </div>

                      {/* GitHub */}
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                          </svg>
                          <span className="font-semibold text-slate-200 text-[11px] truncate">GitHub</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">연동됨</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                    * 시스템 보안 정책에 의해 외부 소셜 간편로그인이 비활성화된 모드입니다.
                  </div>
                )}

                {/* 비상 복구코드 10개 조회 및 관리 전용 모달 버튼 */}
                <button
                  type="button"
                  onClick={() => setIsBackupCodeModalOpen(true)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-sky-300 rounded-lg text-xs font-semibold border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>🔐 비상 복구코드 10개 조회 및 관리</span>
                </button>
              </div>

              {/* [요청 3 반영] 우측: 비밀번호 접이식 아코디언(서랍) & 새 비밀번호 확인 필드 추가 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">🔑 비밀번호 보안 관리</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                      마지막 변경: 30일 전
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordChangeOpen(!isPasswordChangeOpen);
                      setPwUpdateMessage(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-slate-700/80 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <span>{isPasswordChangeOpen ? '닫기' : '비밀번호 변경'}</span>
                    {isPasswordChangeOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* 접힌 상태 (평상시): 노골적인 입력 폼 대신 단정한 보안 수준 요약만 표시 */}
                {!isPasswordChangeOpen && (
                  <div className="py-2.5 text-slate-400 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>보안 등급:</span>
                      <span className="font-semibold text-emerald-400">안전 (8자 이상, 특수문자 조합)</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>계정 보호 상태:</span>
                      <span className="text-sky-400 font-medium">정상 가동 중 (2단계 인증 연동)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 pt-1">
                      * 비밀번호를 변경하시려면 상단의 [비밀번호 변경] 버튼을 눌러주세요.
                    </p>
                  </div>
                )}

                {/* 펼쳐진 상태 (비밀번호 변경 요청 시): 현재비번 + 새비번 + 새비번 확인 3단계 폼 제공 */}
                {isPasswordChangeOpen && (
                  <div className="space-y-2.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {pwUpdateMessage && (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{pwUpdateMessage}</span>
                      </div>
                    )}

                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">현재 비밀번호</label>
                      <input
                        type="password"
                        value={currentPwInput}
                        onChange={(e) => setCurrentPwInput(e.target.value)}
                        placeholder="현재 사용 중인 비밀번호 입력"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">새 비밀번호</label>
                      <input
                        type="password"
                        value={newPwInput}
                        onChange={(e) => setNewPwInput(e.target.value)}
                        placeholder="새 비밀번호 (8자 이상, 특수문자 포함)"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-400 text-[11px]">새 비밀번호 확인</label>
                        {confirmPwInput.length > 0 && (
                          <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                            newPwInput === confirmPwInput ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {newPwInput === confirmPwInput ? '✓ 일치합니다' : '✕ 일치하지 않습니다'}
                          </span>
                        )}
                      </div>
                      <input
                        type="password"
                        value={confirmPwInput}
                        onChange={(e) => setConfirmPwInput(e.target.value)}
                        placeholder="새 비밀번호 확인 (동일하게 재입력)"
                        className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-slate-200 text-xs focus:outline-hidden ${
                          confirmPwInput.length > 0 && newPwInput !== confirmPwInput
                            ? 'border-rose-500/80 focus:border-rose-500'
                            : 'border-slate-700 focus:border-sky-500'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPasswordChangeOpen(false);
                          setCurrentPwInput('');
                          setNewPwInput('');
                          setConfirmPwInput('');
                          setPwUpdateMessage(null);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        disabled={!currentPwInput || !newPwInput || newPwInput !== confirmPwInput}
                        onClick={() => {
                          if (!currentPwInput || !newPwInput || newPwInput !== confirmPwInput) {
                            alert('새 비밀번호와 비밀번호 확인이 일치해야 합니다.');
                            return;
                          }
                          setPwUpdateMessage('비밀번호가 안전하게 업데이트되었습니다.');
                          setTimeout(() => {
                            setIsPasswordChangeOpen(false);
                            setCurrentPwInput('');
                            setNewPwInput('');
                            setConfirmPwInput('');
                            setPwUpdateMessage(null);
                          }, 1400);
                        }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow transition-all cursor-pointer ${
                          !currentPwInput || !newPwInput || newPwInput !== confirmPwInput
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                        }`}
                      >
                        비밀번호 업데이트
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PG-USR-07: 문서공유 및 협업작업 관리 대시보드 (공유관리/사용관리 2대 탭, 필터, 팝업 연동) */}
        {selectedProg === 'PG-USR-07' && (
          <div className="space-y-4 text-xs">
            {/* 상단 통계 위젯 & 신규 링크 등록 액션 바 */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔗</span>
                    <h3 className="font-bold text-white text-base">문서공유 및 협업작업 관리 센터</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono border border-sky-500/30">
                      PG-USR-07
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    발급된 공유 링크의 권한 및 유효기간을 통제하고, 실시간 동시 열람 협업자의 작업현황을 한눈에 모니터링합니다.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingShareLink(null);
                      setShareFormTargetKind('file');
                      setShareFormTargetDocTitle('ISO 32000-2 표준 가이드북');
                      setShareFormPermission('reviewer');
                      setShareFormPeriodKind('7d');
                      setShareFormIsPublicRead(true);
                      setShareFormPassword('');
                      setIsShareCreateModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-600/20 transition-all cursor-pointer hover:scale-102"
                  >
                    <span>+</span>
                    <span>새 공유링크 등록</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 다차원 검색/필터 바 (정책 03-14 준수: 모바일 자동 래핑 및 가로스크롤 차단) */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* [요청 3] 탭 불필요 -> 검색조건에 공유구분 항목 추가 */}
                <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
                  <span className="text-slate-400 shrink-0">공유구분:</span>
                  <select
                    value={shareOwnershipFilter}
                    onChange={(e) => setShareOwnershipFilter(e.target.value as any)}
                    className="bg-slate-900 text-slate-200 font-medium focus:outline-hidden cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900 text-slate-200">전체 구분</option>
                    <option value="provided" className="bg-slate-900 text-slate-200">📤 내가 발급한 공유</option>
                    <option value="participated" className="bg-slate-900 text-slate-200">📥 내가 초대받은 문서</option>
                  </select>
                </div>

                {/* 1. 공유대상 구분 */}
                <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
                  <span className="text-slate-400 shrink-0">대상:</span>
                  <select
                    value={shareScopeFilter}
                    onChange={(e) => setShareScopeFilter(e.target.value as any)}
                    className="bg-slate-900 text-slate-200 font-medium focus:outline-hidden cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900 text-slate-200">전체 대상</option>
                    <option value="file" className="bg-slate-900 text-slate-200">📄 단일 문서</option>
                    <option value="category" className="bg-slate-900 text-slate-200">📁 카테고리/폴더</option>
                  </select>
                </div>

                {/* 2. 권한 필터 */}
                <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
                  <span className="text-slate-400 shrink-0">권한:</span>
                  <select
                    value={shareRoleFilter}
                    onChange={(e) => setShareRoleFilter(e.target.value as any)}
                    className="bg-slate-900 text-slate-200 font-medium focus:outline-hidden cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900 text-slate-200">전체 권한</option>
                    <option value="viewer" className="bg-slate-900 text-slate-200">읽기 전용</option>
                    <option value="reviewer" className="bg-slate-900 text-slate-200">주석 작성 허용</option>
                    <option value="editor" className="bg-slate-900 text-slate-200">공동 편집자</option>
                  </select>
                </div>

                {/* 3. 기간 필터 */}
                <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
                  <span className="text-slate-400 shrink-0">기간:</span>
                  <select
                    value={sharePeriodFilter}
                    onChange={(e) => setSharePeriodFilter(e.target.value as any)}
                    className="bg-slate-900 text-slate-200 font-medium focus:outline-hidden cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900 text-slate-200">전체 기간</option>
                    <option value="valid" className="bg-slate-900 text-slate-200">유효함 (정상)</option>
                    <option value="expiring" className="bg-slate-900 text-slate-200">7일 이내 만료임박</option>
                    <option value="expired" className="bg-slate-900 text-slate-200">만료됨</option>
                    <option value="unlimited" className="bg-slate-900 text-slate-200">무제한</option>
                  </select>
                </div>

                {/* 4. 상태 필터 */}
                <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
                  <span className="text-slate-400 shrink-0">상태:</span>
                  <select
                    value={shareStatusFilter}
                    onChange={(e) => setShareStatusFilter(e.target.value as any)}
                    className="bg-slate-900 text-slate-200 font-medium focus:outline-hidden cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900 text-slate-200">전체 상태</option>
                    <option value="active" className="bg-slate-900 text-slate-200">활성중</option>
                    <option value="unused" className="bg-slate-900 text-slate-200">미사용 (0명 접속)</option>
                    <option value="revoked" className="bg-slate-900 text-slate-200">회수완료</option>
                  </select>
                </div>

                {/* 5. [요청 4.3] 게스트열람여부 체크박스 추가 */}
                <label className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-300 cursor-pointer hover:border-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={sharePublicGuestFilter}
                    onChange={(e) => setSharePublicGuestFilter(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-sky-500 focus:ring-0 cursor-pointer accent-sky-500"
                  />
                  <span>게스트열람 허용</span>
                </label>

                {/* 6. 텍스트 검색 인풋 */}
                <div className="flex-1 min-w-[180px] relative">
                  <input
                    type="text"
                    value={shareSearchQuery}
                    onChange={(e) => setShareSearchQuery(e.target.value)}
                    placeholder="문서명, 소유자명 검색..."
                    className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-sky-500"
                  />
                  <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs">🔍</span>
                  {shareSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setShareSearchQuery('')}
                      className="absolute right-2 top-1 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {(shareOwnershipFilter !== 'all' ||
                  shareScopeFilter !== 'all' ||
                  shareRoleFilter !== 'all' ||
                  sharePeriodFilter !== 'all' ||
                  shareStatusFilter !== 'all' ||
                  sharePublicGuestFilter ||
                  shareSearchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setShareOwnershipFilter('all');
                      setShareScopeFilter('all');
                      setShareRoleFilter('all');
                      setSharePeriodFilter('all');
                      setShareStatusFilter('all');
                      setSharePublicGuestFilter(false);
                      setShareSearchQuery('');
                    }}
                    className="px-2 py-1 text-[11px] text-sky-400 hover:underline cursor-pointer"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>

            {/* 필터링된 공유 문서 목록 렌더링 */}
            {(() => {
              const currentList = shareLinksList
                .filter((item) => {
                  if (shareOwnershipFilter === 'all') return true;
                  return shareOwnershipFilter === 'provided' ? item.myRole === 'owner' : item.myRole === 'invited';
                })
                .filter((item) => (shareScopeFilter === 'all' ? true : item.targetKind === shareScopeFilter))
                .filter((item) => (shareRoleFilter === 'all' ? true : item.permission === shareRoleFilter))
                .filter((item) => (sharePublicGuestFilter ? item.isPublicRead : true))
                .filter((item) => {
                  if (sharePeriodFilter === 'all') return true;
                  if (sharePeriodFilter === 'unlimited') return item.periodKind === 'unlimited';
                  if (sharePeriodFilter === 'expired') return item.isExpired;
                  if (sharePeriodFilter === 'valid') return !item.isExpired && !item.isRevoked;
                  if (sharePeriodFilter === 'expiring') return item.expireDateText.includes('D-');
                  return true;
                })
                .filter((item) => {
                  if (shareStatusFilter === 'all') return true;
                  if (shareStatusFilter === 'revoked') return item.isRevoked;
                  if (shareStatusFilter === 'unused') return item.activeCollaboratorCount === 0;
                  if (shareStatusFilter === 'active') return !item.isRevoked && !item.isExpired;
                  return true;
                })
                .filter((item) => {
                  if (!shareSearchQuery.trim()) return true;
                  const q = shareSearchQuery.toLowerCase();
                  return (
                    item.targetName.toLowerCase().includes(q) ||
                    item.ownerName.toLowerCase().includes(q) ||
                    item.docId.toLowerCase().includes(q)
                  );
                });

              if (currentList.length === 0) {
                return (
                  <div className="p-8 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
                    <span className="text-3xl block">📭</span>
                    <p className="text-slate-300 font-bold text-sm">조건과 일치하는 공유 문서가 없습니다.</p>
                    <p className="text-slate-500 text-xs">검색 조건을 변경하거나 새 공유 링크를 등록해보세요.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {currentList.map((item) => {
                    const isOwner = item.myRole === 'owner';

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 bg-slate-950 border rounded-xl transition-all ${
                          item.isRevoked
                            ? 'border-rose-900/40 bg-rose-950/10 opacity-75'
                            : item.isExpired
                            ? 'border-amber-900/40 bg-amber-950/10'
                            : 'border-slate-800/80 hover:border-slate-700 bg-slate-950'
                        }`}
                      >
                        {/* [요청 4] 모바일 모드 전환 시 정보/버튼 줄바꿈 분리 처리 */}
                        <div className={`flex ${isMobileMode ? 'flex-col gap-2.5' : 'flex-wrap md:flex-nowrap items-start md:items-center justify-between gap-3'}`}>
                          {/* 상단/좌측: 문서 및 대상 정보 */}
                          <div className="space-y-1.5 flex-1 min-w-[240px]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* 대상 구분 뱃지 */}
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  item.targetKind === 'category'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : item.targetKind === 'version'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                }`}
                              >
                                {item.targetKind === 'category'
                                  ? '📁 카테고리'
                                  : item.targetKind === 'version'
                                  ? '🏷️ 특정버전'
                                  : '📄 단일문서'}
                              </span>

                              {/* 문서 제목 및 버전 */}
                              <h4 className="font-bold text-white text-sm hover:text-sky-300 transition-colors">
                                {item.targetName}
                              </h4>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({item.docVersion}, {item.totalPages}쪽)
                              </span>

                              {/* 보안 암호 설정 뱃지 */}
                              {item.hasPassword && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                                  🔒 암호보호
                                </span>
                              )}

                              {/* 공개 읽기 허용 뱃지 */}
                              {item.isPublicRead && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
                                  🌐 게스트열람 허용
                                </span>
                              )}
                            </div>

                            {/* 부가 메타 행: 소유자, 권한, 유효기간, 최근활동 */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                              <span>
                                <strong className="text-slate-500">소유자:</strong>{' '}
                                <span className="text-slate-300">{item.ownerName}</span>
                              </span>

                              {/* 부여된 권한 */}
                              <span>
                                <strong className="text-slate-500">권한:</strong>{' '}
                                <span
                                  className={`font-semibold ${
                                    item.permission === 'editor'
                                      ? 'text-purple-400'
                                      : item.permission === 'reviewer'
                                      ? 'text-sky-400'
                                      : 'text-slate-300'
                                  }`}
                                >
                                  {item.permission === 'editor'
                                    ? '공동 편집자'
                                    : item.permission === 'reviewer'
                                    ? '검토자(주석달기)'
                                    : '읽기 전용'}
                                </span>
                              </span>

                              {/* 유효기간 */}
                              <span>
                                <strong className="text-slate-500">유효기간:</strong>{' '}
                                <span
                                  className={`font-mono font-medium ${
                                    item.isRevoked
                                      ? 'text-rose-400'
                                      : item.isExpired
                                      ? 'text-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                >
                                  {item.expireDateText}
                                </span>
                              </span>

                              {/* [요청 4.4] 실시간 협업 인원 및 최종 사용시간 (예: 4분 전) */}
                              {item.activeCollaboratorCount > 0 ? (
                                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  동시 열람 {item.activeCollaboratorCount}명{' '}
                                  <span className="text-[10px] text-emerald-300/80 font-normal">
                                    (최종{' '}
                                    {item.recentActivityText.includes('취소선')
                                      ? '4분 전'
                                      : item.recentActivityText.includes('형광펜')
                                      ? '방금 전'
                                      : '10분 전'}
                                    )
                                  </span>
                                </span>
                              ) : (
                                <span className="text-slate-500 font-normal">
                                  동시 열람 0명 <span className="text-[10px] text-slate-600">(최종 2일 전)</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 하단/우측: 액션 버튼 그룹 (모바일은 줄바꿈 및 전체 너비 정렬) */}
                          <div className={`flex flex-wrap items-center gap-1.5 shrink-0 ${isMobileMode ? 'w-full pt-2 border-t border-slate-800/80 justify-end' : 'self-end md:self-center'}`}>
                            {/* [👥 협업현황 팝업 열기] */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCollabDocId(item.id);
                                setIsCollabStatusModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="실시간 작업자 및 시간대별 활동피드 팝업 열기"
                            >
                              <span>👥</span>
                              <span>협업현황</span>
                              {item.activeCollaboratorCount > 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5 animate-pulse" />
                              )}
                            </button>

                            {/* 제공자(소유자) 관점 액션 */}
                            {isOwner && (
                              <>
                                {/* 링크 복사 */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.shareUrl);
                                    showToast(`🔗 [${item.targetName}] 공유 링크가 복사되었습니다.`, 'success');
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                                  title="공유 링크 복사"
                                >
                                  링크복사
                                </button>

                                {/* 수정 팝업 */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingShareLink(item);
                                    setShareFormTargetKind(item.targetKind);
                                    setShareFormTargetDocTitle(item.targetName);
                                    setShareFormPermission(item.permission);
                                    setShareFormPeriodKind(item.periodKind);
                                    setShareFormIsPublicRead(item.isPublicRead);
                                    setIsShareCreateModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                                  title="공유 설정 수정"
                                >
                                  수정
                                </button>

                                {/* 공유 회수 (Revoke) */}
                                {!item.isRevoked ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShareLinksList((prev) =>
                                        prev.map((l) =>
                                          l.id === item.id
                                            ? {
                                                ...l,
                                                isRevoked: true,
                                                expireDateText: '권한 회수됨 (소유자)',
                                                activeCollaboratorCount: 0,
                                              }
                                            : l
                                        )
                                      );
                                      showToast(`🚫 [${item.targetName}] 공유 권한이 즉시 회수되었습니다.`, 'warn');
                                    }}
                                    className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium cursor-pointer"
                                    title="공유 링크 회수 (참여자 접근 즉시 차단)"
                                  >
                                    회수
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShareLinksList((prev) =>
                                        prev.map((l) =>
                                          l.id === item.id
                                            ? {
                                                ...l,
                                                isRevoked: false,
                                                expireDateText: '2026-10-15 (D-12)',
                                              }
                                            : l
                                        )
                                      );
                                      showToast(`✓ [${item.targetName}] 공유가 다시 활성화되었습니다.`, 'success');
                                    }}
                                    className="px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-medium cursor-pointer"
                                    title="공유 재활성화"
                                  >
                                    재발급
                                  </button>
                                )}
                              </>
                            )}

                            {/* 참여자 관점 액션 */}
                            {!isOwner && (
                              <>
                                {!item.isExpired && !item.isRevoked ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOpenDocInViewer(item.docId, item.targetName, item.totalPages, item.ownerName, 1);
                                      showToast(`📖 [${item.targetName}] 문서 뷰어로 전환되었습니다.`, 'info');
                                    }}
                                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                                  >
                                    뷰어 열기
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      showToast(
                                        `📩 소유자(${item.ownerName})에게 공유 기간 연장 요청이 발송되었습니다.`,
                                        'info'
                                      );
                                    }}
                                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    공유 재요청
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* [모달 1] 신규 공유링크 등록 / 수정 레이어 팝업 (서재, 뷰어, 공유관리 공통 호출) */}
        {/* ========================================================================= */}
            {isShareCreateModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🔗</span>
                      <h4 className="font-bold text-white text-sm">
                        {editingShareLink ? '문서 공유 링크 속성 수정' : '신규 문서 공유 링크 생성'}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsShareCreateModalOpen(false)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
                    {/* 1. 공유 대상 유형 선택 (특정 버전 버튼 삭제, 단일문서/카테고리 2분할) */}
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1 font-medium">공유 대상 단위</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'file', label: '📄 단일 문서', desc: '해당 문서 전체 버전' },
                          { id: 'category', label: '📁 카테고리', desc: '하위 문서 일괄 공유' },
                        ].map((kind) => (
                          <button
                            key={kind.id}
                            type="button"
                            onClick={() => {
                              setShareFormTargetKind(kind.id as any);
                              setShareFormTargetDocTitle(
                                kind.id === 'file' ? CANDIDATE_DOCS[0] : CANDIDATE_CATEGORIES[0]
                              );
                              setIsDocSearchDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              shareFormTargetKind === kind.id
                                ? 'bg-sky-600/20 border-sky-500 text-sky-200 ring-1 ring-sky-500/50'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="font-bold text-xs">{kind.label}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{kind.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* [요청 4.2] 대상 선택 (like 검색 & 돋보기 찾기 버튼 & 서치목록 드롭다운) */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-400 block text-[11px] font-medium">대상 선택</label>
                        <span className="text-[10px] text-sky-400 font-mono">
                          {shareFormTargetKind === 'file' ? '보유 문서 검색' : '카테고리 검색'}
                        </span>
                      </div>

                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={shareFormTargetDocTitle}
                          onChange={(e) => {
                            setShareFormTargetDocTitle(e.target.value);
                            setIsDocSearchDropdownOpen(true);
                          }}
                          onFocus={() => setIsDocSearchDropdownOpen(true)}
                          placeholder={
                            shareFormTargetKind === 'file'
                              ? '공유할 문서명을 검색하세요...'
                              : '공유할 카테고리명을 검색하세요...'
                          }
                          className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-sky-500 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setIsDocSearchDropdownOpen(!isDocSearchDropdownOpen)}
                          className="absolute right-1.5 p-1 rounded-md bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="대상 검색 목록 열기"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* 서치목록 (Like 검색 결과 드롭다운) */}
                      {isDocSearchDropdownOpen && (
                        <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto text-xs animate-in fade-in zoom-in-95 duration-100">
                          <div className="p-2 border-b border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between bg-slate-950/80">
                            <span>
                              {shareFormTargetKind === 'file' ? '📄 보유 문서 목록' : '📁 카테고리 목록'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsDocSearchDropdownOpen(false)}
                              className="text-slate-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                          {(() => {
                            const candidates =
                              shareFormTargetKind === 'file' ? CANDIDATE_DOCS : CANDIDATE_CATEGORIES;
                            const filtered = candidates.filter((item) =>
                              item.toLowerCase().includes(shareFormTargetDocTitle.toLowerCase())
                            );

                            if (filtered.length === 0) {
                              return (
                                <div className="p-3 text-center text-slate-500 text-[11px]">
                                  일치하는 대상이 없습니다.
                                </div>
                              );
                            }

                            return filtered.map((item) => (
                              <div
                                key={item}
                                onClick={() => {
                                  setShareFormTargetDocTitle(item);
                                  setIsDocSearchDropdownOpen(false);
                                }}
                                className="p-2.5 hover:bg-sky-600/20 text-slate-200 hover:text-sky-300 border-b border-slate-800/40 last:border-b-0 cursor-pointer transition-colors flex items-center gap-2"
                              >
                                <span className="text-slate-500">
                                  {shareFormTargetKind === 'file' ? '📄' : '📁'}
                                </span>
                                <span className="truncate flex-1 font-medium">{item}</span>
                                {shareFormTargetDocTitle === item && (
                                  <span className="text-sky-400 font-bold text-xs">✓</span>
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>

                    {/* 2. 공유 권한 프리셋 선택 */}
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1 font-medium">
                        부여 권한 (Permission Level)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'viewer', label: '열람자 (Viewer)', desc: '읽기 전용 (주석 불가)' },
                          { id: 'reviewer', label: '검토자 (Reviewer)', desc: '댓글 + 자기 주석 편집' },
                          { id: 'editor', label: '편집자 (Editor)', desc: '전체 주석/버전 편집' },
                        ].map((perm) => (
                          <button
                            key={perm.id}
                            type="button"
                            onClick={() => setShareFormPermission(perm.id as any)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              shareFormPermission === perm.id
                                ? 'bg-sky-600/20 border-sky-500 text-sky-200 ring-1 ring-sky-500/50'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="font-bold text-xs">{perm.label}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{perm.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. 공유 기간 설정 */}
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1 font-medium">공유 유효 기간</label>
                      <select
                        value={shareFormPeriodKind}
                        onChange={(e) => setShareFormPeriodKind(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs cursor-pointer"
                      >
                        <option value="1d">24시간 (1일 후 자동 만료)</option>
                        <option value="7d">7일간 유효 (기본 권장)</option>
                        <option value="30d">30일간 유효 (장기 프로젝트)</option>
                        <option value="unlimited">무제한 (상시 유지)</option>
                      </select>
                    </div>

                    {/* 4. 게스트 공개읽기 & 비밀번호 설정 */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-slate-200 font-bold block text-xs">🌐 비로그인 게스트 열람 허용</span>
                          <span className="text-[10px] text-slate-400">
                            로그인 없이도 공개 링크로 문서를 열람할 수 있습니다.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={shareFormIsPublicRead}
                          onChange={(e) => setShareFormIsPublicRead(e.target.checked)}
                          className="w-4 h-4 accent-sky-500 cursor-pointer"
                        />
                      </div>

                      {/* [요청 2.1] 보안 비밀번호 설정: 타이틀/입력필드 여백 확보 및 비밀번호 확인필드 추가 */}
                      <div className="pt-3 border-t border-slate-800 space-y-2.5">
                        <label className="text-slate-300 block text-[11px] font-semibold">
                          🔒 보안 비밀번호 설정 (선택사항)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-1">비밀번호</span>
                            <input
                              type="password"
                              value={shareFormPassword}
                              onChange={(e) => setShareFormPassword(e.target.value)}
                              placeholder="미설정 시 링크만으로 접근 가능"
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono focus:outline-hidden focus:border-sky-500"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-1">비밀번호 확인</span>
                            <input
                              type="password"
                              value={shareFormPasswordConfirm}
                              onChange={(e) => setShareFormPasswordConfirm(e.target.value)}
                              placeholder="비밀번호 확인 입력"
                              className={`w-full px-3 py-1.5 bg-slate-900 border rounded-lg text-slate-200 text-xs font-mono focus:outline-hidden ${
                                shareFormPassword && shareFormPasswordConfirm && shareFormPassword !== shareFormPasswordConfirm
                                  ? 'border-rose-500 focus:border-rose-500'
                                  : 'border-slate-700 focus:border-sky-500'
                              }`}
                            />
                          </div>
                        </div>
                        {shareFormPassword && shareFormPasswordConfirm && shareFormPassword !== shareFormPasswordConfirm && (
                          <p className="text-[10px] text-rose-400 font-medium">
                            ⚠️ 비밀번호와 비밀번호 확인이 일치하지 않습니다.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsShareCreateModalOpen(false);
                        setShareFormPasswordConfirm('');
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (shareFormPassword && shareFormPassword !== shareFormPasswordConfirm) {
                          showToast('⚠️ 비밀번호와 비밀번호 확인이 일치하지 않습니다.', 'warn');
                          return;
                        }
                        if (editingShareLink) {
                          setShareLinksList((prev) =>
                            prev.map((l) =>
                              l.id === editingShareLink.id
                                ? {
                                    ...l,
                                    targetKind: shareFormTargetKind,
                                    targetName: shareFormTargetDocTitle,
                                    permission: shareFormPermission,
                                    periodKind: shareFormPeriodKind,
                                    isPublicRead: shareFormIsPublicRead,
                                    hasPassword: !!shareFormPassword,
                                    updatedAt: '방금 전',
                                  }
                                : l
                            )
                          );
                          showToast('✓ 공유 링크 설정이 성공적으로 갱신되었습니다.', 'success');
                        } else {
                          const newLink = {
                            id: `link-${Date.now()}`,
                            myRole: 'owner',
                            targetKind: shareFormTargetKind,
                            targetName: shareFormTargetDocTitle,
                            docId: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
                            docVersion: 'v1.0',
                            totalPages: 120,
                            ownerName: '홍길동 (나)',
                            permission: shareFormPermission,
                            periodKind: shareFormPeriodKind,
                            expireDateText:
                              shareFormPeriodKind === 'unlimited'
                                ? '무제한 (상시 유지)'
                                : shareFormPeriodKind === '1d'
                                ? '24시간 후 만료'
                                : '7일 후 만료',
                            isExpired: false,
                            isRevoked: false,
                            isPublicRead: shareFormIsPublicRead,
                            hasPassword: !!shareFormPassword,
                            shareUrl: `https://purepdfrend.io/share/DOC-${Date.now().toString(36).toUpperCase()}`,
                            createdAt: '방금 전',
                            updatedAt: '방금 전',
                            activeCollaboratorCount: 0,
                            recentActivityText: '공유 링크가 신규 발급되었습니다.',
                          };
                          setShareLinksList([newLink, ...shareLinksList]);
                          showToast('🎉 신규 문서 공유 링크가 성공적으로 생성되었습니다!', 'success');
                        }
                        setIsShareCreateModalOpen(false);
                      }}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-sky-600/30"
                    >
                      {editingShareLink ? '수정 완료' : '공유링크 발급'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* [모달 2] 문서작업현황 팝업 (Collaboration Studio Modal - 상세 작업자 & 활동피드) */}
            {/* ========================================================================= */}
            {isCollabStatusModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-5 sm:p-6 pb-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]">
                  {/* 상단 헤더: 대상 문서 메타 정보 */}
                  {(() => {
                    const doc = shareLinksList.find((l) => l.id === selectedCollabDocId) || shareLinksList[0];

                    return (
                      <>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base">👥</span>
                              <h3 className="font-bold text-white text-sm sm:text-base">{doc.targetName}</h3>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                                {doc.docVersion}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              소유자: <strong className="text-slate-200">{doc.ownerName}</strong> | 총 {doc.totalPages}쪽 | 권한: {doc.permission} | 유효기간: {doc.expireDateText}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsCollabStatusModalOpen(false)}
                            className="text-slate-400 hover:text-white cursor-pointer text-sm p-1"
                          >
                            ✕
                          </button>
                        </div>

                        {/* 공유 링크 복사 바 */}
                        <div className="flex gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                          <input
                            type="text"
                            readOnly
                            value={doc.shareUrl}
                            className="flex-1 bg-transparent px-2 text-sky-400 font-mono select-all focus:outline-hidden text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(doc.shareUrl);
                              showToast('공유 링크가 클립보드에 복사되었습니다.', 'success');
                            }}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg cursor-pointer shrink-0 transition-colors"
                          >
                            링크 복사
                          </button>
                        </div>

                        {/* 본문 2단 구성: [좌측: 실시간 작업자 목록] vs [우측: 4단계 시간 그루핑 활동피드] */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-[300px]">
                          {/* 1. 작업자 목록 (작업자 선택 시 우측 피드 필터 연동) */}
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 flex flex-col">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-white cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={
                                      collaboratorsList.length > 0 &&
                                      selectedRevokeUserIds.length === collaboratorsList.length
                                    }
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedRevokeUserIds(collaboratorsList.map((u) => u.userId));
                                      } else {
                                        setSelectedRevokeUserIds([]);
                                      }
                                    }}
                                    className="w-3.5 h-3.5 accent-rose-500 cursor-pointer"
                                    title="전체 작업자 선택"
                                  />
                                  <span>참여 작업자 ({collaboratorsList.length}명)</span>
                                </label>
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              </div>
                              {selectedCollaboratorUserId && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedCollaboratorUserId(null)}
                                  className="text-[10px] text-sky-400 hover:underline"
                                >
                                  전체 피드 보기
                                </button>
                              )}
                            </div>

                            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                              {collaboratorsList.map((user) => {
                                const isSelected = selectedCollaboratorUserId === user.userId;

                                return (
                                  <div
                                    key={user.userId}
                                    onClick={() => setSelectedCollaboratorUserId(isSelected ? null : user.userId)}
                                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                      isSelected
                                        ? 'bg-sky-600/20 border-sky-400 shadow-md ring-1 ring-sky-400/50'
                                        : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      {/* [요청 4.1] 참여작업자 카드 이미지 앞 체크박스 */}
                                      <input
                                        type="checkbox"
                                        checked={selectedRevokeUserIds.includes(user.userId)}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          setSelectedRevokeUserIds((prev) =>
                                            prev.includes(user.userId)
                                              ? prev.filter((id) => id !== user.userId)
                                              : [...prev, user.userId]
                                          );
                                        }}
                                        className="w-3.5 h-3.5 accent-rose-500 cursor-pointer shrink-0"
                                        title={`${user.name} 공유 권한 회수 선택`}
                                      />
                                      <div
                                        className={`w-7 h-7 rounded-full bg-slate-800 border-2 ${user.colorBorder} flex items-center justify-center font-bold text-white text-[11px] relative shrink-0`}
                                      >
                                        <span>{user.avatarLetter}</span>
                                        {/* 실시간 상태 점 */}
                                        <span
                                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                                            user.status === 'active'
                                              ? 'bg-emerald-400 animate-pulse'
                                              : user.status === 'idle'
                                              ? 'bg-amber-400'
                                              : 'bg-slate-500'
                                          }`}
                                        />
                                      </div>

                                      <div>
                                        <div className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                                          <span>{user.name}</span>
                                          <span className="text-[10px] text-slate-500 font-normal">
                                            ({user.roleTitle})
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                          {user.currentActionText}
                                        </div>
                                      </div>
                                    </div>

                                    {/* 현재 페이지 즉시 점프 버튼 */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewerCurrentPage(user.currentPage);
                                        setActiveViewingDoc({
                                          id: doc.docId,
                                          title: doc.targetName,
                                          author: doc.ownerName,
                                          publisher: '엔터프라이즈 아카이빙 출판부',
                                          categoryId: 'cat-shared',
                                          categoryPath: '공유 문서함 > 협업 문서',
                                          lastCategory: '협업 문서',
                                          totalPages: doc.totalPages,
                                          readPages: user.currentPage,
                                          progressPercent: Math.round(((user.currentPage || 1) / (doc.totalPages || 1)) * 100),
                                          lastReadAt: '방금 전',
                                          rawDate: doc.createdAt,
                                          status: 'OCR완료',
                                          security: '대외비',
                                          docType: doc.myRole === 'owner' ? '내가 공유한 문서' : '공유받은 문서',
                                          version: 'v2.1',
                                          fileSize: '18.4 MB',
                                          round: '1회독',
                                          coverBg: 'from-sky-600 to-indigo-900',
                                          accentColor: 'sky',
                                        });
                                        setIsCollabStatusModalOpen(false);
                                        setSelectedProg('PG-USR-06');
                                        showToast(
                                          `🚀 [${user.name}]님이 열람 중인 ${user.currentPage}페이지로 점프했습니다!`,
                                          'success'
                                        );
                                      }}
                                      className="px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold rounded-lg text-[10px] font-mono cursor-pointer transition-colors shrink-0"
                                      title="이 작업자가 보고 있는 페이지로 즉시 이동"
                                    >
                                      p.{user.currentPage} ➔
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. 4단계 시간 그루핑 활동 피드 */}
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 flex flex-col">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                              <span className="font-bold text-white text-xs">
                                ⚡ 활동 타임라인{' '}
                                {selectedCollaboratorUserId && (
                                  <span className="text-sky-400 font-normal">
                                    (
                                    {
                                      collaboratorsList.find((c) => c.userId === selectedCollaboratorUserId)?.name
                                    }{' '}
                                    필터중)
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">4단계 시간 그루핑</span>
                            </div>

                            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                              {[
                                { key: 'just_now', title: '── 방금 전 ──', badgeBg: 'bg-emerald-500/20 text-emerald-300' },
                                { key: '10m_ago', title: '── 10분 전 ──', badgeBg: 'bg-sky-500/20 text-sky-300' },
                                { key: '7d_ago', title: '── 7일 전 ──', badgeBg: 'bg-indigo-500/20 text-indigo-300' },
                                { key: 'long_ago', title: '── 오래 전 ──', badgeBg: 'bg-slate-800 text-slate-400' },
                              ].map((grp) => {
                                const logs = activityLogsList
                                  .filter((l) => l.timeCategory === grp.key)
                                  .filter((l) =>
                                    selectedCollaboratorUserId
                                      ? l.authorName.includes(
                                          collaboratorsList.find((c) => c.userId === selectedCollaboratorUserId)?.name.slice(0, 2) || ''
                                        )
                                      : true
                                  );

                                if (logs.length === 0) return null;

                                return (
                                  <div key={grp.key} className="space-y-1.5">
                                    <div className="text-[10px] font-bold text-slate-500 font-mono text-center">
                                      {grp.title}
                                    </div>
                                    {logs.map((log) => (
                                      <div
                                        key={log.id}
                                        onClick={() => {
                                          if (log.targetPage) {
                                            setViewerCurrentPage(log.targetPage);
                                            if (log.annotationId) {
                                              setPulseAnnotationId(log.annotationId);
                                              setTimeout(() => setPulseAnnotationId(null), 2000);
                                            }
                                            setActiveViewingDoc({
                                              id: doc.docId,
                                              title: doc.targetName,
                                              author: doc.ownerName,
                                              publisher: '엔터프라이즈 아카이빙 출판부',
                                              categoryId: 'cat-shared',
                                              categoryPath: '공유 문서함 > 협업 문서',
                                              lastCategory: '협업 문서',
                                              totalPages: doc.totalPages,
                                              readPages: log.targetPage || 1,
                                              progressPercent: Math.round(((log.targetPage || 1) / (doc.totalPages || 1)) * 100),
                                              lastReadAt: '방금 전',
                                              rawDate: doc.createdAt,
                                              status: 'OCR완료',
                                              security: '대외비',
                                              docType: doc.myRole === 'owner' ? '내가 공유한 문서' : '공유받은 문서',
                                              version: 'v2.1',
                                              fileSize: '18.4 MB',
                                              round: '1회독',
                                              coverBg: 'from-sky-600 to-indigo-900',
                                              accentColor: 'sky',
                                            });
                                            setIsCollabStatusModalOpen(false);
                                            setSelectedProg('PG-USR-06');
                                            showToast(
                                              `🔍 ${log.targetPage}페이지 해당 작업 주석으로 이동했습니다.`,
                                              'info'
                                            );
                                          }
                                        }}
                                        className={`p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-start gap-2 transition-all ${
                                          log.targetPage ? 'hover:border-sky-500/50 cursor-pointer' : ''
                                        }`}
                                      >
                                        <span className="text-[10px] text-slate-500 font-mono shrink-0 mt-0.5">
                                          {log.timeText}
                                        </span>
                                        <div className="flex-1 text-[11px] text-slate-300">
                                          <strong className="text-white font-medium">{log.authorName}:</strong>{' '}
                                          {log.actionText}
                                        </div>
                                        {log.targetPage && (
                                          <span className="text-[9px] px-1 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono shrink-0">
                                            p.{log.targetPage}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* 하단 제어 액션 (여백 확보 및 뷰어 내 팝업 시 열기 버튼 조건부 숨김) */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-3.5 pb-1 border-t border-slate-800/80">
                          {selectedProg !== 'PG-USR-06' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveViewingDoc({
                                  id: doc.docId,
                                  title: doc.targetName,
                                  author: doc.ownerName,
                                  publisher: '엔터프라이즈 아카이빙 출판부',
                                  categoryId: 'cat-shared',
                                  categoryPath: '공유 문서함 > 협업 문서',
                                  lastCategory: '협업 문서',
                                  totalPages: doc.totalPages,
                                  readPages: 1,
                                  progressPercent: Math.round((1 / (doc.totalPages || 1)) * 100),
                                  lastReadAt: '방금 전',
                                  rawDate: doc.createdAt,
                                  status: 'OCR완료',
                                  security: '대외비',
                                  docType: doc.myRole === 'owner' ? '내가 공유한 문서' : '공유받은 문서',
                                  version: 'v2.1',
                                  fileSize: '18.4 MB',
                                  round: '1회독',
                                  coverBg: 'from-sky-600 to-indigo-900',
                                  accentColor: 'sky',
                                });
                                setIsCollabStatusModalOpen(false);
                                setSelectedProg('PG-USR-06');
                                showToast(`📖 [${doc.targetName}] 문서 뷰어로 전환되었습니다.`, 'info');
                              }}
                              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-sky-600/30 transition-all flex items-center gap-1.5"
                            >
                              <span>📖</span>
                              <span>이 문서 뷰어(PG-USR-06)에서 열기</span>
                            </button>
                          ) : (
                            <div className="text-[11px] text-slate-500 font-mono">
                              💡 현재 뷰어에서 열려있는 문서의 실시간 협업 세션입니다.
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {doc.myRole === 'owner' && !doc.isRevoked && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedRevokeUserIds.length > 0) {
                                    setCollaboratorsList((prev) =>
                                      prev.filter((u) => !selectedRevokeUserIds.includes(u.userId))
                                    );
                                    showToast(
                                      `🚫 선택한 ${selectedRevokeUserIds.length}명의 작업자 공유 권한이 회수되었습니다.`,
                                      'warn'
                                    );
                                    setSelectedRevokeUserIds([]);
                                  } else {
                                    setShareLinksList((prev) =>
                                      prev.map((l) =>
                                        l.id === doc.id
                                          ? { ...l, isRevoked: true, expireDateText: '권한 회수됨' }
                                          : l
                                      )
                                    );
                                    setIsCollabStatusModalOpen(false);
                                    showToast('🚫 문서 공유가 즉시 전체 회수되었습니다.', 'warn');
                                  }
                                }}
                                className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                              >
                                {selectedRevokeUserIds.length > 0
                                  ? `🚫 선택 ${selectedRevokeUserIds.length}명 권한 회수`
                                  : '🚫 공유 즉시 회수'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setIsCollabStatusModalOpen(false)}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                            >
                              닫기
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

        {/* [공통 모달 1] 더 많은 프리셋 선택 모달 (PG-USR-02 및 PG-USR-04 공통 지원) */}
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

        {/* [공통 모달 2] 프로필 사진 업로드 & 자르기(Canvas Crop) 팝업 (PG-USR-02 및 PG-USR-04 공통 지원) */}
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
                  className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="w-2/3 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/30 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>자르기 및 영역 저장</span>
                  <span>✓</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* [공통 모달 3] 2FA 비상 복구코드 10개 조회 및 관리 모달 */}
        {isBackupCodeModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔐</span>
                  <h5 className="font-bold text-white text-sm">2단계 인증 비상 복구 코드 (10개)</h5>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBackupCodeModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                휴대폰을 분실하거나 소셜/이메일 인증을 수신할 수 없을 때 계정을 안전하게 복구할 수 있는 <strong>일회용 8자리 보안 복구 코드</strong>입니다. 각 코드는 단 1회만 유효하므로 안전한 오프라인 장소나 비밀번호 관리자에 보관하세요.
              </p>

              {/* 10개 코드 2열 그리드 */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                {backupCodes.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-900/90 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-mono">{idx + 1}.</span>
                    <strong className="text-sky-300 font-mono tracking-wider">{c}</strong>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400">미사용</span>
                  </div>
                ))}
              </div>

              {/* 액션 버튼들 */}
              <div className="flex gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join('\n'));
                    alert('📋 10개의 비상 복구 코드가 클립보드에 복사되었습니다.');
                  }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium cursor-pointer transition-colors"
                >
                  📋 코드 전체 복사
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                    const gen = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                    const newCodes = Array.from({ length: 10 }, () => `${gen()}-${gen()}`);
                    setBackupCodes(newCodes);
                    alert('🔄 10개의 새로운 비상 복구 코드가 안전하게 재발급되었습니다.');
                  }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl font-medium cursor-pointer transition-colors"
                >
                  🔄 새 코드 재발급
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsBackupCodeModalOpen(false)}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-sky-600/30 transition-all"
              >
                확인 및 닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
