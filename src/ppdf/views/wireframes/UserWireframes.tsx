import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  FileText,
  Minimize2,
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
  ShieldCheck,
  Search,
} from 'lucide-react';
import { ViewerConfigRegistry, ViewerConfigState } from '../../domain/ViewerConfigRegistry';
import { HorizontalSlideContainer } from '../../components/HorizontalSlideContainer';
import { WireframeTopLayer } from '../../components/WireframeTopLayer';
import { DocumentLibraryViewer, DocumentItem } from '../../components/DocumentLibraryViewer';
import { ToolStylePopover, ToolStyleState } from '../../components/ToolStylePopover';
import { AnnotationActionPopover, AnnotationKind } from '../../components/AnnotationActionPopover';
import { Undo2, Redo2, Sliders, List } from 'lucide-react';

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

  // PG-USR-06 Viewer Toolbar state
  const [isToolbarModalOpen, setIsToolbarModalOpen] = useState(false);
  const [activeViewerTab, setActiveViewerTab] = useState<'bookmarks' | 'toc' | 'annots'>('toc');
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

  const [tabLayoutPosition, setTabLayoutPosition] = useState<'left' | 'top'>('left');
  const [isTabDrawerCollapsed, setIsTabDrawerCollapsed] = useState(false);

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
    annId: 'mock-annot-1',
    text: '코드를 바로 실행해볼 수도 있습니다.',
    type: 'underline',
    color: '#38bdf8',
  });

  const [toolStyleState, setToolStyleState] = useState<ToolStyleState>({
    color: '#38bdf8',
    strokeWidth: 1.5,
    opacity: 80,
    presets: [
      { id: 'p1', name: '스카이블루', color: '#38bdf8', strokeWidth: 1.5, opacity: 80 },
      { id: 'p2', name: '에메랄드', color: '#4ade80', strokeWidth: 1.5, opacity: 80 },
      { id: 'p3', name: '노랑', color: '#facc15', strokeWidth: 2.0, opacity: 90 },
      { id: 'p4', name: '빨강', color: '#f87171', strokeWidth: 1.0, opacity: 100 },
    ],
  });

  // PG-USR-06 Viewer Navigation & Reading Controls
  const [viewerScale, setViewerScale] = useState(1.0);
  const [viewerRotation] = useState(0); // 0, 90, 180, 270
  const [viewerCurrentPage, setViewerCurrentPage] = useState(42);
  const [viewerJumpInput, setViewerJumpInput] = useState('42');
  const [viewerSearchQuery, setViewerSearchQuery] = useState('');
  const [viewerBookmarks, setViewerBookmarks] = useState<number[]>([1, 14, 42, 120]);
  const [viewerAnnotations, setViewerAnnotations] = useState<Array<{
    id: string;
    page: number;
    type: string;
    author: string;
    text: string;
    color: string;
    date: string;
  }>>([
    { id: 'ann-1', page: 14, type: '형광펜', author: 'jkok2j2m', text: '하이브리드 아키텍처 설계 원칙: 60fps 가상 렌더링', color: '#fef08a', date: '오늘 09:30' },
    { id: 'ann-2', page: 42, type: '메모', author: 'jkok2j2m', text: 'ISO 32000-2 툼스톤 주석 동기화 규격 검토 완료', color: '#38bdf8', date: '오늘 10:15' },
    { id: 'ann-3', page: 85, type: '밑줄', author: '운영자', text: '대용량 800쪽 LRU 페이지 메모리가드 적용 범위', color: '#34d399', date: '어제 16:40' },
  ]);

  const [viewerTocItems] = useState([
    { id: 'toc-1', title: '제1편 엔터프라이즈 PDF 제작 총괄', page: 1, level: 1 },
    { id: 'toc-2', title: '1.1 아키텍처 원칙 및 60fps 가상화', page: 4, level: 2 },
    { id: 'toc-3', title: '1.2 무결성 락 체계 및 동시성 제어', page: 12, level: 2 },
    { id: 'toc-4', title: '1.3 800쪽 대용량 LRU 메모리가드', page: 28, level: 2 },
    { id: 'toc-5', title: '제2편 PDF 주석 표준 사양 및 툼스톤', page: 42, level: 1 },
    { id: 'toc-6', title: '2.1 하이라이트/스티키노트 XFDF 파싱', page: 65, level: 2 },
    { id: 'toc-7', title: '2.2 투명 텍스트 레이어 Searchable PDF', page: 120, level: 2 },
    { id: 'toc-8', title: '제3편 보안 암호화 및 DRM 전략', page: 240, level: 1 },
    { id: 'toc-9', title: '제4편 다국어 OCR 앙상블 파이프라인', page: 480, level: 1 },
    { id: 'toc-10', title: '부록: 표준 식별자 및 거버넌스 규약', page: 750, level: 1 },
  ]);

  // PG-USR-08 Offline state
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(true);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

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
              {/* Top 1단: 뒤로가기(서재) + 모드 스위처 드롭다운 + 도서명 + 우측 글로벌 액션 */}
              <div className="h-11 px-3 border-b border-slate-800/80 flex items-center justify-between gap-2">
                {/* 좌측: [←] 뒤로가기 & [모드 ∨] 드롭다운 스위처 */}
                <div className="flex items-center gap-2 min-w-0">
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
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="서재 목록(PG-USR-05)으로 복귀"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {/* 모드 스위처 드롭다운 버튼 (Xodo [주석 달기 ∨] 형태) */}
                  <div className="relative">
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

                    {/* 모드 드롭다운 메뉴 */}
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

                  {/* 문서명 */}
                  <div className="hidden sm:flex items-center gap-1.5 min-w-0 max-w-[240px] md:max-w-[340px]">
                    <span className="text-slate-600">|</span>
                    <span className="text-xs font-bold text-slate-300 truncate" title={activeViewingDoc?.title || 'ISO 32000-2 표준 가이드북'}>
                      {activeViewingDoc?.title || 'ISO 32000-2 표준 가이드북'}
                    </span>
                  </div>
                </div>

                {/* 우측: 글로벌 퀵 액션 (검색, 3탭 목차/북마크 열기, 3탭 배치전환, 설정) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* 검색창 인라인 토글 */}
                  <div className="relative hidden md:block">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="본문 검색..."
                      value={viewerSearchQuery}
                      onChange={(e) => setViewerSearchQuery(e.target.value)}
                      className="w-32 lg:w-44 pl-7 pr-6 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                    {viewerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setViewerSearchQuery('')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* 3탭(목차/북마크/주석) 사이드패널 토글 */}
                  <button
                    type="button"
                    onClick={() => setIsTabDrawerCollapsed(!isTabDrawerCollapsed)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      !isTabDrawerCollapsed
                        ? 'bg-sky-600/30 text-sky-300 border-sky-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                    }`}
                    title={isTabDrawerCollapsed ? '목차/북마크/주석 패널 펼치기' : '목차/북마크/주석 패널 접기'}
                  >
                    <List className="w-4 h-4" />
                  </button>

                  {/* 3탭 상단/좌측 배치 토글 */}
                  <button
                    type="button"
                    onClick={() => setTabLayoutPosition(tabLayoutPosition === 'left' ? 'top' : 'left')}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 text-[11px] font-bold cursor-pointer"
                    title={`현재 ${tabLayoutPosition === 'left' ? '좌측' : '상단'} 배치 (클릭 시 전환)`}
                  >
                    {tabLayoutPosition === 'left' ? '◫' : '⬒'}
                  </button>

                  {/* 순서설정 */}
                  <button
                    type="button"
                    onClick={() => setIsToolbarModalOpen(true)}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                    title="도구 순서 및 사용자 설정"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Top 2단: 선택된 그룹의 도구 아이콘 슬라이더 + [스타일 🎛️ 팔레트 버튼] + [↶/↷ Undo/Redo] + 배율 */}
              <div className="h-11 px-3 flex items-center justify-between gap-2 overflow-visible relative">
                {/* 좌측: 활성 도구 아이콘 슬라이더 */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <HorizontalSlideContainer scrollStep={180} className="w-full">
                    {activeTools.map((item, idx) => (
                      <button
                        key={`${item.id}-${idx}`}
                        onClick={() => {
                          setCurrentTool(item.id);
                          // 도구 선택 시 팝오버를 열거나 속성 연계
                        }}
                        title={`${item.name} (${viewerConfig.shortcuts[item.id] || item.defaultKey})`}
                        className={`shrink-0 h-8 w-8 min-w-[32px] rounded-lg flex items-center justify-center text-sm transition-all relative cursor-pointer ${
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

                {/* 중앙/우측 분기: [스타일 팝오버 트리거 버튼 🎛️] + [Undo/Redo] + 배율 */}
                <div className="flex items-center gap-1.5 shrink-0 relative">
                  {/* [핵심 벤치마킹] Xodo 스타일(도구 상세속성) 팝오버 트리거 버튼 */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStylePopoverOpen(!isStylePopoverOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isStylePopoverOpen
                          ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-500/50'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                      }`}
                      title="도구 상세속성(스타일, 획, 불투명도, 프리셋) 팔레트 열기"
                    >
                      {/* 현재 선택 색상 미니 원형 칩 */}
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-xs"
                        style={{ backgroundColor: toolStyleState.color }}
                      />
                      <span className="hidden sm:inline text-[11px]">스타일</span>
                    </button>

                    {/* Xodo 스타일 팝오버 틀 컴포넌트 마운트 */}
                    <ToolStylePopover
                      isOpen={isStylePopoverOpen}
                      onClose={() => setIsStylePopoverOpen(false)}
                      toolName={registry.getAllTools().find((t) => t.id === currentTool)?.name || currentTool}
                      styleState={toolStyleState}
                      onChangeStyle={(updated) => setToolStyleState((prev) => ({ ...prev, ...updated }))}
                    />
                  </div>

                  <div className="w-px h-4 bg-slate-800 mx-0.5" />

                  {/* 실행취소 (Undo) */}
                  <button
                    type="button"
                    onClick={() => alert('이전 작업이 취소되었습니다 (Undo).')}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="실행취소 (Ctrl + Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>

                  {/* 다시실행 (Redo) */}
                  <button
                    type="button"
                    onClick={() => alert('작업이 다시 실행되었습니다 (Redo).')}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="다시실행 (Ctrl + Y)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-slate-800 mx-0.5" />

                  {/* 배율 조절 드롭다운 (100% ∨) */}
                  <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setViewerScale((s) => Math.max(0.5, parseFloat((s - 0.1).toFixed(1))))}
                      className="px-1.5 py-0.5 text-slate-400 hover:text-white cursor-pointer"
                      title="축소"
                    >
                      -
                    </button>
                    <span className="px-1 font-bold text-sky-400">{Math.round(viewerScale * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setViewerScale((s) => Math.min(3.0, parseFloat((s + 0.1).toFixed(1))))}
                      className="px-1.5 py-0.5 text-slate-400 hover:text-white cursor-pointer"
                      title="확대"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. [피드백 반영] 상단배치 모드(top)일 때 3탭 드로어 렌더링 */}
            {tabLayoutPosition === 'top' && !isTabDrawerCollapsed && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveViewerTab('bookmarks')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeViewerTab === 'bookmarks'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      🔖 북마크 ({viewerBookmarks.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveViewerTab('toc')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeViewerTab === 'toc'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      📖 목차(TOC) ({viewerTocItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveViewerTab('annots')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeViewerTab === 'annots'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      ✏️ 주석 ({viewerAnnotations.length})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeViewerTab === 'bookmarks' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!viewerBookmarks.includes(viewerCurrentPage)) {
                            setViewerBookmarks([...viewerBookmarks, viewerCurrentPage].sort((a, b) => a - b));
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer"
                      >
                        + 현재 {viewerCurrentPage}쪽 북마크
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsTabDrawerCollapsed(true)}
                      className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-900"
                      title="상단 드로어 접기"
                    >
                      ▲ 접기
                    </button>
                  </div>
                </div>

                {/* 상단 배치 시 가로 스크롤 카드 행 렌더링 */}
                <div className="max-h-36 overflow-y-auto pr-1">
                  {activeViewerTab === 'toc' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {viewerTocItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setViewerCurrentPage(item.page);
                            setViewerJumpInput(String(item.page));
                          }}
                          className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            viewerCurrentPage === item.page
                              ? 'bg-sky-950/70 border-sky-500 text-white font-bold'
                              : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="truncate">{item.title}</span>
                          <span className="text-[10px] font-mono text-sky-400 shrink-0 ml-1.5">
                            p.{item.page}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeViewerTab === 'bookmarks' && (
                    <div className="flex flex-wrap gap-2">
                      {viewerBookmarks.map((page) => (
                        <div
                          key={page}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setViewerCurrentPage(page);
                              setViewerJumpInput(String(page));
                            }}
                            className="font-mono text-sky-300 font-bold hover:underline cursor-pointer"
                          >
                            🔖 {page} 쪽
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewerBookmarks(viewerBookmarks.filter((b) => b !== page))}
                            className="text-slate-500 hover:text-rose-400 text-xs ml-1"
                            title="북마크 해제"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeViewerTab === 'annots' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {viewerAnnotations.map((ann) => (
                        <div
                          key={ann.id}
                          onClick={() => {
                            setViewerCurrentPage(ann.page);
                            setViewerJumpInput(String(ann.page));
                          }}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-xs cursor-pointer space-y-1 transition-colors"
                        >
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                            <span className="text-sky-400 font-bold">{ann.page}쪽 | {ann.type}</span>
                            <span>{ann.author}</span>
                          </div>
                          <div className="text-slate-200 truncate" style={{ color: ann.color }}>
                            "{ann.text}"
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 상단배치 모드에서 접혔을 때 펼치기 배너 */}
            {tabLayoutPosition === 'top' && isTabDrawerCollapsed && (
              <div className="flex items-center justify-between p-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
                <span className="font-medium text-slate-300">
                  📖 목차(TOC) 및 북마크 드로어가 접혀 있습니다.
                </span>
                <button
                  type="button"
                  onClick={() => setIsTabDrawerCollapsed(false)}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 font-bold text-[11px] cursor-pointer"
                >
                  ▼ 펼치기
                </button>
              </div>
            )}

            {/* 6. 메인 워크스페이스: [좌측배치 모드일 때 좌측 패널] + [고성능 대용량 가상 캔버스 뷰포트] */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 min-h-[480px]">
              {/* [피드백 반영] 좌측배치 모드(left)일 때 좌측 세로 패널 */}
              {tabLayoutPosition === 'left' && !isTabDrawerCollapsed && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col text-xs shadow-sm">
                  {/* 패널 상단: 3탭 전환 바 + 접기 버튼 */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveViewerTab('bookmarks')}
                        className={`pb-1 transition-all cursor-pointer ${
                          activeViewerTab === 'bookmarks'
                            ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        북마크({viewerBookmarks.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveViewerTab('toc')}
                        className={`pb-1 transition-all cursor-pointer ${
                          activeViewerTab === 'toc'
                            ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        목차(TOC)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveViewerTab('annots')}
                        className={`pb-1 transition-all cursor-pointer ${
                          activeViewerTab === 'annots'
                            ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        주석({viewerAnnotations.length})
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsTabDrawerCollapsed(true)}
                      className="text-slate-500 hover:text-slate-300 text-xs"
                      title="좌측 패널 접기"
                    >
                      ◀
                    </button>
                  </div>

                  {/* 좌측 패널 본문 목록 */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 text-slate-300 font-mono text-[11px] pr-1">
                    {activeViewerTab === 'toc' && (
                      <div className="space-y-1">
                        {viewerTocItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setViewerCurrentPage(item.page);
                              setViewerJumpInput(String(item.page));
                            }}
                            className={`p-1.5 rounded cursor-pointer transition-colors flex items-center justify-between ${
                              viewerCurrentPage === item.page
                                ? 'bg-sky-950/70 border border-sky-500/50 text-sky-300 font-bold'
                                : 'hover:bg-slate-900 text-slate-300'
                            } ${item.level === 2 ? 'pl-4 text-[10px]' : ''}`}
                          >
                            <span className="truncate">{item.title}</span>
                            <span className="text-[10px] text-slate-500 shrink-0 ml-1">p.{item.page}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeViewerTab === 'bookmarks' && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!viewerBookmarks.includes(viewerCurrentPage)) {
                              setViewerBookmarks([...viewerBookmarks, viewerCurrentPage].sort((a, b) => a - b));
                            }
                          }}
                          className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          + 현재 {viewerCurrentPage}쪽 북마크 추가
                        </button>
                        <div className="space-y-1">
                          {viewerBookmarks.map((page) => (
                            <div
                              key={page}
                              className="p-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setViewerCurrentPage(page);
                                  setViewerJumpInput(String(page));
                                }}
                                className="font-mono text-sky-300 font-bold hover:underline cursor-pointer"
                              >
                                🔖 {page} 쪽
                              </button>
                              <button
                                type="button"
                                onClick={() => setViewerBookmarks(viewerBookmarks.filter((b) => b !== page))}
                                className="text-slate-500 hover:text-rose-400 text-xs"
                                title="북마크 삭제"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeViewerTab === 'annots' && (
                      <div className="space-y-1.5">
                        {viewerAnnotations.map((ann) => (
                          <div
                            key={ann.id}
                            onClick={() => {
                              setViewerCurrentPage(ann.page);
                              setViewerJumpInput(String(ann.page));
                            }}
                            className="p-2 rounded bg-slate-900 border border-slate-800 hover:border-sky-500/40 cursor-pointer space-y-1 transition-colors"
                          >
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                              <span className="text-sky-400 font-bold">{ann.page}쪽 | {ann.type}</span>
                              <span>{ann.author}</span>
                            </div>
                            <div className="text-slate-200 text-xs" style={{ color: ann.color }}>
                              "{ann.text}"
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 좌측 패널 접혔을 때 펼치기 사이드 바 */}
              {tabLayoutPosition === 'left' && isTabDrawerCollapsed && (
                <div
                  onClick={() => setIsTabDrawerCollapsed(false)}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-900 transition-colors w-10 text-slate-400 hover:text-white"
                  title="목차 및 북마크 패널 펼치기"
                >
                  <span className="text-xs font-bold">▶</span>
                  <span className="text-[10px] [writing-mode:vertical-rl] mt-3 font-medium">목차 · 북마크</span>
                </div>
              )}

              {/* 중앙 대용량 가상 뷰포트 캔버스 영역 (60fps 가상 스크롤러 & LRU 메모리가드 연동) */}
              <div
                className={`${
                  tabLayoutPosition === 'left' && !isTabDrawerCollapsed
                    ? 'md:col-span-3'
                    : tabLayoutPosition === 'left' && isTabDrawerCollapsed
                    ? 'col-span-1 md:col-span-4'
                    : 'col-span-1 md:col-span-4'
                } bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden shadow-inner`}
              >
                {/* 캔버스 상단 가상화 뷰어 상태 배너 & OCR 선택 툴팁 */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-lg text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      60fps 가상 렌더러
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      | LRU 캐시: {viewerCurrentPage}/{activeViewingDoc?.totalPages || 800}P (메모리 2.1MB 절약)
                    </span>
                  </div>

                  {/* OCR 텍스트 퀵 액션 */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400 text-[10px] hidden sm:inline">텍스트 선택:</span>
                    <button
                      type="button"
                      onClick={() => alert(`제 ${viewerCurrentPage}쪽 본문 텍스트가 클립보드에 복사되었습니다.`)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                    >
                      전체복사
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newAnn = {
                          id: `ann-${Date.now()}`,
                          page: viewerCurrentPage,
                          type: '형광펜',
                          author: 'jkok2j2m',
                          text: `제 ${viewerCurrentPage}쪽 핵심 문구 강조`,
                          color: toolStyleState.color,
                          date: '방금 전',
                        };
                        setViewerAnnotations([newAnn, ...viewerAnnotations]);
                        alert(`제 ${viewerCurrentPage}쪽에 형광펜 주석이 등록되었습니다.`);
                      }}
                      className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 text-[10px] font-bold cursor-pointer"
                    >
                      형광펜
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newAnn = {
                          id: `ann-${Date.now()}`,
                          page: viewerCurrentPage,
                          type: '메모',
                          author: 'jkok2j2m',
                          text: `제 ${viewerCurrentPage}쪽 독서 메모`,
                          color: '#38bdf8',
                          date: '방금 전',
                        };
                        setViewerAnnotations([newAnn, ...viewerAnnotations]);
                        alert(`제 ${viewerCurrentPage}쪽에 새 메모가 등록되었습니다.`);
                      }}
                      className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-[10px] font-bold cursor-pointer"
                    >
                      메모
                    </button>
                  </div>
                </div>

                {/* 실제 도서 본문 렌더링 캔버스 (확대/회전/Searchable PDF 하이라이트 반영) */}
                <div className="flex-1 bg-slate-900/60 rounded-xl p-4 overflow-auto flex items-center justify-center min-h-[380px] relative">
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
                    style={{
                      transform: `scale(${viewerScale}) rotate(${viewerRotation}deg)`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease-out',
                    }}
                    className="w-full max-w-xl bg-white text-slate-900 rounded-lg p-6 sm:p-8 shadow-2xl space-y-4 select-text relative border border-slate-300"
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
                      {/* [Xodo 캡처 핵심 벤치마킹] 밑줄/주석 클릭 시 상황별 팝오버 및 3번째 형태전환 */}
                      {/* ========================================================================= */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-700 relative">
                        <span>ChatGPT나 클로드에선 </span>
                        {/* 클릭 가능한 밑줄 주석 텍스트 스팬 */}
                        <span className="relative inline-block mx-1">
                          <span
                            onClick={() =>
                              setActiveAnnotationPopover({
                                isOpen: true,
                                annId: 'ann-demo-1',
                                text: '코드를 바로 실행해볼 수도 있습니다.',
                                type: activeAnnotationPopover.type || 'underline',
                                color: activeAnnotationPopover.color || '#38bdf8',
                              })
                            }
                            className={`cursor-pointer px-1 py-0.5 rounded transition-all font-medium ${
                              activeAnnotationPopover.type === 'highlight'
                                ? 'bg-yellow-300/80 text-black font-semibold'
                                : activeAnnotationPopover.type === 'strike'
                                ? 'line-through text-rose-500 font-semibold'
                                : activeAnnotationPopover.type === 'squiggly'
                                ? 'underline decoration-wavy decoration-sky-500 font-semibold'
                                : 'underline decoration-2 decoration-sky-500 font-semibold'
                            }`}
                            style={{
                              borderColor: activeAnnotationPopover.color,
                            }}
                            title="클릭하여 밑줄 주석 관리 팝오버 열기"
                          >
                            코드를 바로 실행해볼 수도 있습니다.
                          </span>

                          {/* 터치 핸들러 시각적 점프 표시기 (블루 핸들러 ● --- ●) */}
                          {activeAnnotationPopover.isOpen && (
                            <>
                              <span className="absolute -left-1 -bottom-1 w-2.5 h-2.5 rounded-full bg-sky-500 border border-white shadow-xs pointer-events-none" />
                              <span className="absolute -right-1 -bottom-1 w-2.5 h-2.5 rounded-full bg-sky-500 border border-white shadow-xs pointer-events-none" />
                            </>
                          )}

                          {/* [핵심] AnnotationActionPopover 마운트 */}
                          <AnnotationActionPopover
                            isOpen={activeAnnotationPopover.isOpen}
                            onClose={() => setActiveAnnotationPopover({ ...activeAnnotationPopover, isOpen: false })}
                            selectedText={activeAnnotationPopover.text}
                            currentType={activeAnnotationPopover.type}
                            currentColor={activeAnnotationPopover.color}
                            onUpdateType={(newType) => {
                              setActiveAnnotationPopover((prev) => ({ ...prev, type: newType }));
                            }}
                            onUpdateColor={(col) => {
                              setActiveAnnotationPopover((prev) => ({ ...prev, color: col }));
                            }}
                            onAddComment={(comment) => {
                              alert(`주석에 메모가 추가되었습니다: "${comment}"`);
                            }}
                            onDelete={() => {
                              alert('밑줄 주석이 성공적으로 삭제되었습니다.');
                              setActiveAnnotationPopover({ ...activeAnnotationPopover, isOpen: false });
                            }}
                            onCopy={() => {
                              alert(`"${activeAnnotationPopover.text}" 클립보드에 복사 완료!`);
                            }}
                          />
                        </span>
                        <span> ChatGPT는 코드 인터프리터, 클로드는 아티팩트, 구글 제미나이는 캔버스를 지원합니다.</span>
                      </div>

                      <p className="text-slate-600 text-xs">
                        {viewerCurrentPage}쪽에 포함된 OCR 바운딩 박스는 실시간 양방향 포커스를 지원하며, 선택 도구인 <strong>[{registry.getAllTools().find((t) => t.id === currentTool)?.name || currentTool}]</strong>을 통해 화면 위에서 즉시 주석을 작성하고 저장할 수 있다.
                      </p>

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

                {/* 캔버스 하단 플로팅 컨트롤 (빠른 페이지 넘김) */}
                <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap justify-between items-center text-xs text-slate-400 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-300">
                      열람 쪽수: <strong className="text-sky-400">{viewerCurrentPage}</strong> / {activeViewingDoc?.totalPages || 800} 쪽
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400 text-[11px]">배율: {Math.round(viewerScale * 100)}%</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(1, viewerCurrentPage - 1);
                        setViewerCurrentPage(next);
                        setViewerJumpInput(String(next));
                      }}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium cursor-pointer"
                    >
                      ◀ 이전 쪽
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const total = activeViewingDoc?.totalPages || 800;
                        const next = Math.min(total, viewerCurrentPage + 1);
                        setViewerCurrentPage(next);
                        setViewerJumpInput(String(next));
                      }}
                      className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                    >
                      다음 쪽 ▶
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 툴바 순서 설정 팝업 (모달) */}
            {isToolbarModalOpen && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>⚙ 뷰어 툴바 순서 및 사용자 설정</span>
                      <span className="text-xs px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded font-mono">User Custom</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsToolbarModalOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    툴바 아이콘의 공식 명칭과 단축키를 확인하고, 그룹 내 순서를 변경하거나 자주 쓰지 않는 도구를 숨길 수 있습니다.
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto text-xs pr-1">
                    {activeTools.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-slate-500 font-mono text-[11px] w-4">{idx + 1}</span>
                          <span className="text-base">{item.icon}</span>
                          <div className="truncate">
                            <div className="text-slate-200 font-medium truncate">{item.name}</div>
                            <div className="text-[10px] text-amber-300/80 font-mono">
                              단축키: {viewerConfig.shortcuts[item.id] || item.defaultKey}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveTool(activeGroup, idx, idx - 1)}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                              title="위로 이동"
                            >
                              ▲
                            </button>
                          )}
                          {idx < activeTools.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveTool(activeGroup, idx, idx + 1)}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                              title="아래로 이동"
                            >
                              ▼
                            </button>
                          )}
                          <button
                            type="button"
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
                      type="button"
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
                      <button
                        type="button"
                        onClick={handleResetConfig}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                      >
                        초기화 (Reset)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsToolbarModalOpen(false)}
                        className="px-4 py-1.5 bg-sky-600 text-white rounded font-medium text-[11px]"
                      >
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
