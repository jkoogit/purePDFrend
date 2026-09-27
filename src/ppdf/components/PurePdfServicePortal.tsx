import { useState, useRef } from 'react';
import {
  FileText,
  Shield,
  Layers,
  Users,
  Bell,
  Type,
  FolderOpen,
  Eye,
  Edit3,
  PenTool,
  Share2,
  Wifi,
  WifiOff,
  Search,
  AlertTriangle,
  Lock,
  Key,
  Globe,
  Sliders,
  BookOpen,
  Camera,
  Image as ImageIcon,
  ScanText,
  FileCode,
  FileArchive,
  Download,
  Upload,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Plus,
  Sparkles,
  List,
  CheckSquare,
  LifeBuoy,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Highlighter,
  Underline,
  Strikethrough,
  Code,
  Smile,
  Stamp,
  PhoneCall,
} from 'lucide-react';

export type UserRole =
  | 'ROLE_GUEST'
  | 'ROLE_USER_ONLINE'
  | 'ROLE_USER_OFFLINE'
  | 'ROLE_ADMIN'
  | 'ROLE_SUPER_ADMIN';

export type ServiceTier = 'user' | 'admin' | 'agent';

export type UserViewId =
  | 'landing'
  | 'home'
  | 'library'
  | 'viewer'
  | 'mypage'
  | 'settings';

export type AdminDomainId =
  | 'security'
  | 'programs'
  | 'users'
  | 'policies'
  | 'roles'
  | 'menus'
  | 'logs'
  | 'notifications'
  | 'apis'
  | 'external_apis'
  | 'user_configs'
  | 'boards'
  | 'customers'
  | 'fonts';

export type ViewerToolMode =
  | 'view'
  | 'annotate'
  | 'draw'
  | 'sign'
  | 'convert'
  | 'forms'
  | 'insert'
  | 'favorites';

interface PurePdfServicePortalProps {
  onNavigateToAgent?: () => void;
  systemAdminEmail?: string;
}

export default function PurePdfServicePortal({
  onNavigateToAgent,
  systemAdminEmail = 'jkoogit@gmail.com',
}: PurePdfServicePortalProps) {
  // Service Tier State
  const [activeTier, setActiveTier] = useState<ServiceTier>('user');
  const [userRole, setUserRole] = useState<UserRole>('ROLE_SUPER_ADMIN');

  // User Service Screen State
  const [activeUserView, setActiveUserView] = useState<UserViewId>('home');
  const [activeAdminDomain, setActiveAdminDomain] =
    useState<AdminDomainId>('security');

  // Online / Offline State
  const [isOnline, setIsOnline] = useState(true);
  const [offlineEventsCount, setOfflineEventsCount] = useState(3);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMobileBottomSheet, setShowMobileBottomSheet] = useState(false);

  // Status Bar Preview State (Hover & Long-Press)
  const [statusBarText, setStatusBarText] = useState<string>(
    '준비 완료. 원하는 도구를 선택하거나 길게 누르면 안내가 표시됩니다.'
  );
  const [activeShortcut, setActiveShortcut] = useState<string>('');
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Viewer State
  const [viewerMode, setViewerMode] = useState<ViewerToolMode>('annotate');
  const [activeDocTab, setActiveDocTab] = useState<'doc1' | 'doc2'>('doc1');
  const [sidebarTab, setSidebarTab] = useState<'toc' | 'bookmarks' | 'annotations'>('toc');
  const [currentPage, setCurrentPage] = useState(14);
  const totalPages = 340;
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedOcrText, setSelectedOcrText] = useState<string | null>(null);
  const [activeAnnotationColor, setActiveAnnotationColor] = useState('#facc15'); // Yellow

  // 14 Admin Domain States
  const [ipBlockEnabled, setIpBlockEnabled] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState<'all' | 'admin' | 'optional'>('admin');
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [offlineTtl, setOfflineTtl] = useState('48');

  // Long-press and Hover Handlers for Status Bar
  const handleToolHover = (label: string, desc: string, shortcut = '') => {
    setStatusBarText(`[${label}] ${desc}`);
    setActiveShortcut(shortcut);
  };

  const handleToolLeave = () => {
    setStatusBarText('준비 완료. 원하는 도구를 선택하거나 길게 누르면 안내가 표시됩니다.');
    setActiveShortcut('');
  };

  const handleTouchStart = (label: string, desc: string, shortcut = '') => {
    longPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(25);
        } catch {}
      }
      setStatusBarText(`[${label}] ${desc}`);
      setActiveShortcut(shortcut);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Switch to Agent Service handler
  const handleSwitchToAgent = () => {
    if (userRole !== 'ROLE_SUPER_ADMIN') {
      alert('에이전트 서비스는 .env에 등록된 시스템관리자 계정만 접근 가능합니다.');
      return;
    }
    if (onNavigateToAgent) {
      onNavigateToAgent();
    } else {
      setActiveTier('agent');
    }
  };

  // Toggle Online/Offline
  const handleToggleOnline = () => {
    setIsOnline((prev) => {
      const next = !prev;
      if (next) {
        // Just went online from offline
        if (offlineEventsCount > 0) {
          setShowConflictModal(true);
        }
      }
      return next;
    });
  };

  return (
    <div className="w-full flex flex-col space-y-4 pb-20 select-none">
      {/* 1. Global Simulation & Tier Switching Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 3 Service Tiers Switcher */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTier('user')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTier === 'user'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>사용자서비스 (User)</span>
            </button>

            {/* Admin Service Button (Disabled for Guests) */}
            <button
              onClick={() => {
                if (userRole === 'ROLE_GUEST' || userRole === 'ROLE_USER_ONLINE' || userRole === 'ROLE_USER_OFFLINE') {
                  alert('관리자 권한(ROLE_ADMIN 이상)이 필요합니다.');
                  return;
                }
                setActiveTier('admin');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTier === 'admin'
                  ? 'bg-amber-600 text-white shadow-md'
                  : userRole === 'ROLE_ADMIN' || userRole === 'ROLE_SUPER_ADMIN'
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 opacity-50 cursor-not-allowed'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>관리자서비스 (Admin)</span>
              {userRole !== 'ROLE_ADMIN' && userRole !== 'ROLE_SUPER_ADMIN' && (
                <Lock className="w-2.5 h-2.5 ml-1 text-slate-500" />
              )}
            </button>

            {/* Agent Service Button (Only for Super Admin) */}
            <button
              onClick={handleSwitchToAgent}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTier === 'agent'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : userRole === 'ROLE_SUPER_ADMIN'
                  ? 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/40 border border-emerald-900/40'
                  : 'text-slate-600 opacity-50 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>에이전트관제 (System)</span>
              {userRole !== 'ROLE_SUPER_ADMIN' && (
                <Lock className="w-2.5 h-2.5 ml-1 text-slate-500" />
              )}
            </button>
          </div>

          {/* Role Simulator & Online/Offline Toggle */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              <span className="text-slate-500">권한 시뮬레이션:</span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="bg-transparent text-indigo-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ROLE_SUPER_ADMIN">시스템관리자 (.env 전권)</option>
                <option value="ROLE_ADMIN">일반관리자 (Admin 권한)</option>
                <option value="ROLE_USER_OFFLINE">정회원 (오프라인 사용가능)</option>
                <option value="ROLE_USER_ONLINE">일반회원 (온라인 전용)</option>
                <option value="ROLE_GUEST">비회원 (게스트)</option>
              </select>
            </div>

            {/* Online / Offline Network Toggle */}
            <button
              onClick={handleToggleOnline}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 font-semibold transition-colors ${
                isOnline
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-700 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>온라인</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>오프라인 ({offlineEventsCount}건 대기)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Offline Warning Banner */}
        {!isOnline && (
          <div className="mt-2 p-2 bg-amber-950/70 border border-amber-700/80 rounded-lg flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>[오프라인 모드 가동 중]</strong> 네트워크가 단절되었지만 문서 열람 및 주석 편집은 100% 정상 작동합니다. 변경 사항은 로컬 IndexedDB에 안전하게 큐잉됩니다.
              </span>
            </div>
            <button
              onClick={() => setShowConflictModal(true)}
              className="px-2 py-0.5 bg-amber-800 hover:bg-amber-700 text-white rounded font-medium text-[11px] shrink-0 ml-2"
            >
              3-Way 머지 미리보기
            </button>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 2. USER SERVICE TIER (SCR-USR-*) */}
      {/* =================================================================== */}
      {activeTier === 'user' && (
        <div className="space-y-4">
          {/* User Service Navigation Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between overflow-x-auto no-scrollbar">
            <div className="flex items-center space-x-2 min-w-max">
              <div className="flex items-center space-x-1.5 px-2 py-1 bg-indigo-950/60 border border-indigo-800/40 rounded-lg text-indigo-400 font-bold text-sm">
                <FileText className="w-4 h-4" />
                <span>purePDFrend</span>
              </div>

              {/* Screen Navigation Buttons */}
              <button
                onClick={() => setActiveUserView('landing')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeUserView === 'landing'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                5.1 첫화면 (랜딩)
              </button>

              <button
                onClick={() => setActiveUserView('home')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeUserView === 'home'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                5.3 홈화면 (대시보드)
              </button>

              <button
                onClick={() => setActiveUserView('library')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeUserView === 'library'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                5.5 문서관리 (보관함)
              </button>

              <button
                onClick={() => setActiveUserView('viewer')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
                  activeUserView === 'viewer'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>5.6 문서뷰어 (코어)</span>
              </button>

              <button
                onClick={() => setActiveUserView('mypage')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeUserView === 'mypage'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                5.4 마이페이지
              </button>

              <button
                onClick={() => setActiveUserView('settings')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeUserView === 'settings'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                5.9 환경설정
              </button>
            </div>

            {/* Quick Actions & Auth */}
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-800 min-w-max">
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium"
              >
                5.2 로그인/가입
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 5.1 FIRST SCREEN / LANDING & QUICK VIEWER (SCR-USR-LND-01)     */}
          {/* ------------------------------------------------------------- */}
          {activeUserView === 'landing' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-xl shadow-lg">
                    P
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">purePDFrend</h2>
                    <p className="text-xs text-slate-400">온/오프라인 무중단 지능형 PDF 지식 관리 솔루션</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveUserView('viewer')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>읽기모드 퀵뷰어</span>
                  </button>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md"
                  >
                    로그인 / 회원가입
                  </button>
                </div>
              </div>

              {/* Rolling Banner */}
              <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-800/40 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">
                    NEW FEATURE
                  </span>
                  <h3 className="text-base font-bold text-white">
                    오프라인 3-Way 무손실 주석 병합 & Tesseract·Gemini 듀얼 OCR 엔진 업데이트
                  </h3>
                  <p className="text-xs text-slate-400">
                    인터넷 연결이 끊겨도 안심하세요. 로컬 IndexedDB와 비표준 메타데이터 주석으로 100% 무손실 동기화를 지원합니다.
                  </p>
                </div>
                <button
                  onClick={() => setActiveUserView('viewer')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shrink-0 flex items-center space-x-1"
                >
                  <span>지금 체험하기</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Document Viewer Lookup */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                    <Search className="w-3.5 h-3.5 text-indigo-400" />
                    <span>문서 바로 조회 (문서ID 또는 공유 링크)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">로그인 없이도 공개 문서 즉시 열람 가능</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    defaultValue="DOC-2026-MICROECONOMICS-V3"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="문서 고유 ID 또는 공유 URL을 입력하세요..."
                  />
                  <button
                    onClick={() => setActiveUserView('viewer')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shrink-0"
                  >
                    열람하기
                  </button>
                </div>

                {/* Quick Thumbnails */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div
                    onClick={() => setActiveUserView('viewer')}
                    className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500 rounded-lg p-3 cursor-pointer transition-all group"
                  >
                    <div className="h-20 bg-slate-950 rounded flex items-center justify-center text-slate-600 text-xs mb-2 group-hover:text-indigo-400">
                      [PDF 썸네일 미리보기]
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate">2026 고시 미시경제학 개론</p>
                    <p className="text-[11px] text-slate-500">저자: 율곡경제연구회 | 340쪽</p>
                  </div>
                  <div
                    onClick={() => setActiveUserView('viewer')}
                    className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500 rounded-lg p-3 cursor-pointer transition-all group"
                  >
                    <div className="h-20 bg-slate-950 rounded flex items-center justify-center text-slate-600 text-xs mb-2 group-hover:text-indigo-400">
                      [PDF 썸네일 미리보기]
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate">기업 표준 기밀유지계약서 (NDA)</p>
                    <p className="text-[11px] text-slate-500">보안: AES-256 암호화 적용 | 12쪽</p>
                  </div>
                  <div
                    onClick={() => setActiveUserView('viewer')}
                    className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500 rounded-lg p-3 cursor-pointer transition-all group"
                  >
                    <div className="h-20 bg-slate-950 rounded flex items-center justify-center text-slate-600 text-xs mb-2 group-hover:text-indigo-400">
                      [PDF 썸네일 미리보기]
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate">클라우드 인프라 아키텍처 백서</p>
                    <p className="text-[11px] text-slate-500">기술보고서 | 84쪽</p>
                  </div>
                </div>
              </div>

              {/* 3 Tabs: Notices, Reviews, Guides */}
              <div className="space-y-3">
                <div className="flex border-b border-slate-800 text-xs font-semibold">
                  <button className="px-4 py-2 border-b-2 border-indigo-500 text-indigo-400">
                    공지사항
                  </button>
                  <button className="px-4 py-2 text-slate-400 hover:text-slate-200">
                    사용자 리뷰
                  </button>
                  <button className="px-4 py-2 text-slate-400 hover:text-slate-200">
                    이용 가이드
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-950/40 rounded-lg flex items-center justify-between text-slate-300">
                    <span>[공지] purePDFrend v2.0 정식 오픈 및 오프라인 주석 동기화 지원 안내</span>
                    <span className="text-[11px] text-slate-500">2026-09-26</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/40 rounded-lg flex items-center justify-between text-slate-300">
                    <span>[안내] 해외 IP 차단 및 2단계 소셜/이메일 OTP 인증 보안 강화 정책</span>
                    <span className="text-[11px] text-slate-500">2026-09-24</span>
                  </div>
                </div>
              </div>

              {/* Customer Center Operating Hours Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <div className="flex items-center space-x-2">
                  <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                  <span>고객센터 운영시간: 평일 09:00 ~ 18:00 (점심시간 12:00 ~ 13:00 / 주말·공휴일 휴무)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <a href="#" className="hover:text-slate-300">이용약관</a>
                  <a href="#" className="hover:text-slate-300">개인정보처리방침</a>
                  <a href="#" className="hover:text-slate-300">고객지원정책</a>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 5.3 HOME SCREEN / DASHBOARD (SCR-USR-HOM-01)                  */}
          {/* ------------------------------------------------------------- */}
          {activeUserView === 'home' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
              {/* User Greeting & Badges */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 font-bold text-lg">
                    연구
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">김연구 (researcher_kim) 님</h3>
                      <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 text-[10px] font-bold rounded border border-indigo-800/60">
                        {userRole}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">연구도서관 드라이브 (12.4 GB / 50 GB 사용중)</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {(userRole === 'ROLE_ADMIN' || userRole === 'ROLE_SUPER_ADMIN') && (
                    <button
                      onClick={() => setActiveTier('admin')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 shadow"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>관리자시스템 이동</span>
                    </button>
                  )}
                  {userRole === 'ROLE_SUPER_ADMIN' && (
                    <button
                      onClick={handleSwitchToAgent}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 shadow"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      <span>에이전트관제 이동</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 7 Core PDF Tools Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  🛠️ PDF 핵심 작업 도구 (7대 프로세서)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {/* Tool 1 */}
                  <div
                    onClick={() => setActiveUserView('viewer')}
                    className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500 rounded-xl flex flex-col items-center text-center cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">카메라 스캔</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">스캔문서 추가</span>
                  </div>

                  {/* Tool 2 */}
                  <div
                    onClick={() => setActiveUserView('viewer')}
                    className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500 rounded-xl flex flex-col items-center text-center cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-950/80 border border-blue-800/50 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">이미지 &gt; PDF</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">단일/개별 변환</span>
                  </div>

                  {/* Tool 3 */}
                  <div
                    onClick={() => setActiveUserView('viewer')}
                    className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500 rounded-xl flex flex-col items-center text-center cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                      <ScanText className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">PDF OCR</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">텍스트 레이어</span>
                  </div>

                  {/* Tool 4 */}
                  <div
                    onClick={() => setActiveUserView('viewer')}
                    className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500 rounded-xl flex flex-col items-center text-center cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-800/50 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">OCR &gt; TEXT</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">텍스트 추출</span>
                  </div>

                  {/* Tool 5 */}
                  <div
                    onClick={() => setActiveUserView('library')}
                    className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500 rounded-xl flex flex-col items-center text-center cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">PDF 관리</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">병합/분할/삭제</span>
                  </div>

                  {/* Tool 6 */}
                  <div
                    onClick={() => setActiveUserView('viewer')}
                    className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500 rounded-xl flex flex-col items-center text-center cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
                      <FileArchive className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">PDF 압축</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">용량 다이어트</span>
                  </div>

                  {/* Tool 7 */}
                  <div
                    onClick={() => setActiveUserView('viewer')}
                    className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500 rounded-xl flex flex-col items-center text-center cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-800/50 flex items-center justify-center text-rose-400 mb-2 group-hover:scale-110 transition-transform">
                      <Lock className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">PDF 보안</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">비밀번호/권한</span>
                  </div>
                </div>
              </div>

              {/* Reading Progress Tracker (회독 관리 현황) */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>최근 독서 회독 현황 (Reading Progress)</span>
                  </h4>
                  <button
                    onClick={() => setActiveUserView('library')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    전체 보기 &gt;
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-200">2026 고시 미시경제학 개론.pdf</span>
                        <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 text-[10px] rounded font-semibold border border-emerald-800/50">
                          4회독 진행중
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">진도율: 265 / 340쪽 (78%) | 최종 주석: 10분 전</p>
                    </div>
                    <button
                      onClick={() => setActiveUserView('viewer')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                    >
                      이어서 읽기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 5.5 DOCUMENT LIBRARY / MANAGEMENT (SCR-USR-DOC-01)            */}
          {/* ------------------------------------------------------------- */}
          {activeUserView === 'library' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">5.5 통합 문서관리 (보관함)</h3>
                  <p className="text-xs text-slate-400">PDF 등록, 다차원 메타데이터 검색, 독서 회독 및 주석 분리 관리</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow">
                    <Plus className="w-3.5 h-3.5" />
                    <span>새 PDF 등록</span>
                  </button>
                  <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1">
                    <Download className="w-3.5 h-3.5" />
                    <span>주석 내보내기</span>
                  </button>
                  <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>주석 불러오기</span>
                  </button>
                </div>
              </div>

              {/* Multi-Dimensional Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <select className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300">
                  <option>문서구분: 전체</option>
                  <option>내가 등록한 문서</option>
                  <option>내가 공유한 문서</option>
                  <option>공유받은 문서</option>
                </select>
                <input
                  type="text"
                  placeholder="문서명, 저자, 출판사, ISBN 검색..."
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 sm:col-span-2 focus:outline-none focus:border-indigo-500"
                />
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-3 py-1.5 flex items-center justify-center space-x-1">
                  <Search className="w-3.5 h-3.5" />
                  <span>필터 검색</span>
                </button>
              </div>

              {/* Document Data Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">문서명</th>
                      <th className="p-2.5">등록자 / 저자</th>
                      <th className="p-2.5">출판사 / 발행일</th>
                      <th className="p-2.5">회독 현황</th>
                      <th className="p-2.5">버전</th>
                      <th className="p-2.5 text-right">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2.5 font-bold text-white flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">2026 고시 미시경제학 개론.pdf</span>
                      </td>
                      <td className="p-2.5">김연구 / 율곡경제팀</td>
                      <td className="p-2.5">율곡출판 / 2026-03</td>
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 font-semibold rounded border border-emerald-800/60">
                          4회독 (78%)
                        </span>
                      </td>
                      <td className="p-2.5 text-indigo-300 font-mono">v2.1</td>
                      <td className="p-2.5 text-right space-x-1.5">
                        <button
                          onClick={() => setActiveUserView('viewer')}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px]"
                        >
                          뷰어 열기
                        </button>
                        <button
                          onClick={() => setShowShareModal(true)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                        >
                          공유
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2.5 font-bold text-white flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">글로벌 서비스 비밀유지 계약서 (NDA).pdf</span>
                      </td>
                      <td className="p-2.5">이법무 / 사내법무팀</td>
                      <td className="p-2.5">한국기업연합 / 2026-09</td>
                      <td className="p-2.5 text-slate-500">-</td>
                      <td className="p-2.5 text-indigo-300 font-mono">v1.0</td>
                      <td className="p-2.5 text-right space-x-1.5">
                        <button
                          onClick={() => setActiveUserView('viewer')}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px]"
                        >
                          뷰어 열기
                        </button>
                        <button
                          onClick={() => setShowShareModal(true)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                        >
                          공유
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 5.6 INTERACTIVE PDF VIEWER CORE (SCR-USR-VIE-01)              */}
          {/* ------------------------------------------------------------- */}
          {activeUserView === 'viewer' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col space-y-0 shadow-2xl">
              {/* Document Multi-Tab Bar */}
              <div className="bg-slate-950 px-2 pt-2 border-b border-slate-800 flex items-center justify-between text-xs overflow-x-auto no-scrollbar">
                <div className="flex items-center space-x-1">
                  <div
                    onClick={() => setActiveDocTab('doc1')}
                    className={`px-3 py-1.5 rounded-t-lg font-semibold flex items-center space-x-2 cursor-pointer transition-colors ${
                      activeDocTab === 'doc1'
                        ? 'bg-slate-900 text-indigo-300 border-t-2 border-indigo-500'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>2026 미시경제학_3판.pdf</span>
                    <button className="text-slate-500 hover:text-slate-300 ml-1">×</button>
                  </div>
                  <div
                    onClick={() => setActiveDocTab('doc2')}
                    className={`px-3 py-1.5 rounded-t-lg font-semibold flex items-center space-x-2 cursor-pointer transition-colors ${
                      activeDocTab === 'doc2'
                        ? 'bg-slate-900 text-indigo-300 border-t-2 border-indigo-500'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cloud_Architecture_v2.pdf</span>
                    <button className="text-slate-500 hover:text-slate-300 ml-1">×</button>
                  </div>
                  <button className="p-1 hover:bg-slate-800 text-slate-400 rounded">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center space-x-2 pb-1.5 text-xs">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 rounded flex items-center space-x-1"
                  >
                    <Share2 className="w-3 h-3" />
                    <span className="hidden sm:inline">문서 공유</span>
                  </button>
                  <button
                    onClick={() => setShowMobileBottomSheet(!showMobileBottomSheet)}
                    className="sm:hidden px-2.5 py-1 bg-slate-800 text-slate-200 rounded flex items-center space-x-1"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>도구함</span>
                  </button>
                </div>
              </div>

              {/* Viewer 8 Tool Modes Bar (Single Line Defense) */}
              <div className="bg-slate-900/95 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs overflow-x-auto no-scrollbar gap-2">
                {/* 8 Modes Dropdown / Pills */}
                <div className="flex items-center space-x-1 min-w-max">
                  {(
                    [
                      { id: 'view', label: '보기', icon: Eye },
                      { id: 'annotate', label: '주석달기', icon: Edit3 },
                      { id: 'draw', label: '그리기', icon: PenTool },
                      { id: 'sign', label: '서명', icon: Stamp },
                      { id: 'convert', label: '변환', icon: RefreshCw },
                      { id: 'forms', label: '양식', icon: CheckSquare },
                      { id: 'insert', label: '삽입', icon: Plus },
                      { id: 'favorites', label: '즐겨찾기', icon: Sparkles },
                    ] as const
                  ).map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setViewerMode(m.id)}
                        onMouseEnter={() =>
                          handleToolHover(m.label, `${m.label} 모드 활성화`)
                        }
                        onMouseLeave={handleToolLeave}
                        onTouchStart={() =>
                          handleTouchStart(m.label, `${m.label} 모드 활성화`)
                        }
                        onTouchEnd={handleTouchEnd}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                          viewerMode === m.id
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Page Navigation & Zoom */}
                <div className="flex items-center space-x-2 min-w-max text-slate-300">
                  <div className="flex items-center space-x-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1 hover:text-indigo-400"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-bold text-indigo-300">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1 hover:text-indigo-400"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                      className="text-xs px-1 hover:text-indigo-400"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs text-slate-300">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                      className="text-xs px-1 hover:text-indigo-400"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-Tools Bar: Dedicated Icons for Active Mode */}
              <div className="bg-slate-950/90 px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-xs overflow-x-auto no-scrollbar gap-2">
                <div className="flex items-center space-x-1 min-w-max">
                  {viewerMode === 'annotate' && (
                    <>
                      <button
                        onMouseEnter={() =>
                          handleToolHover('형광펜', '텍스트를 강조하는 반투명 하이라이터', 'H')
                        }
                        onMouseLeave={handleToolLeave}
                        onTouchStart={() =>
                          handleTouchStart('형광펜', '텍스트를 강조하는 반투명 하이라이터', 'H')
                        }
                        onTouchEnd={handleTouchEnd}
                        className="p-1.5 hover:bg-slate-800 text-yellow-400 rounded"
                        title="형광펜 (H)"
                      >
                        <Highlighter className="w-4 h-4" />
                      </button>
                      <button
                        onMouseEnter={() =>
                          handleToolHover('밑줄', '텍스트 하단에 직선 밑줄을 긋습니다', 'U')
                        }
                        onMouseLeave={handleToolLeave}
                        onTouchStart={() =>
                          handleTouchStart('밑줄', '텍스트 하단에 직선 밑줄을 긋습니다', 'U')
                        }
                        onTouchEnd={handleTouchEnd}
                        className="p-1.5 hover:bg-slate-800 text-indigo-400 rounded"
                        title="밑줄 (U)"
                      >
                        <Underline className="w-4 h-4" />
                      </button>
                      <button
                        onMouseEnter={() =>
                          handleToolHover('취소선', '선택한 텍스트에 취소선을 긋습니다', 'S')
                        }
                        onMouseLeave={handleToolLeave}
                        className="p-1.5 hover:bg-slate-800 text-rose-400 rounded"
                        title="취소선 (S)"
                      >
                        <Strikethrough className="w-4 h-4" />
                      </button>
                      <button
                        onMouseEnter={() =>
                          handleToolHover('자유형 펜', '자유로운 필기 및 스케치 펜', 'P')
                        }
                        onMouseLeave={handleToolLeave}
                        className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                      >
                        <PenTool className="w-4 h-4" />
                      </button>
                      <button
                        onMouseEnter={() =>
                          handleToolHover('텍스트 상자', '새로운 텍스트 타이핑 주석 추가', 'T')
                        }
                        onMouseLeave={handleToolLeave}
                        className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                      >
                        <Type className="w-4 h-4" />
                      </button>
                      <button
                        onMouseEnter={() =>
                          handleToolHover('댓글 메모', '포스트잇 형태의 협업 메모 주석', 'C')
                        }
                        onMouseLeave={handleToolLeave}
                        className="p-1.5 hover:bg-slate-800 text-cyan-400 rounded"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {viewerMode === 'draw' && (
                    <>
                      <button
                        onMouseEnter={() =>
                          handleToolHover('직사각형', '사각형 테두리 또는 채우기 박스', 'R')
                        }
                        onMouseLeave={handleToolLeave}
                        className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <button
                        onMouseEnter={() =>
                          handleToolHover('원형/타원', '타원형 강조 도형', 'O')
                        }
                        onMouseLeave={handleToolLeave}
                        className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                      <button
                        onMouseEnter={() =>
                          handleToolHover('화살표', '지시 화살표 선 그리기', 'A')
                        }
                        onMouseLeave={handleToolLeave}
                        className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Color Palette Indicator */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] text-slate-500">주석 색상:</span>
                  {['#facc15', '#f87171', '#60a5fa', '#4ade80', '#c084fc'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setActiveAnnotationColor(c)}
                      className={`w-4 h-4 rounded-full border ${
                        activeAnnotationColor === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Main Viewer Body: Sidebar + Canvas */}
              <div className="flex flex-1 min-h-[440px] relative">
                {/* Left Sidebar (TOC, Bookmarks, Annotations) */}
                <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 hidden md:flex">
                  <div className="flex border-b border-slate-800 text-xs font-semibold">
                    <button
                      onClick={() => setSidebarTab('toc')}
                      className={`flex-1 py-2 text-center transition-colors ${
                        sidebarTab === 'toc'
                          ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900/60'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      목차
                    </button>
                    <button
                      onClick={() => setSidebarTab('bookmarks')}
                      className={`flex-1 py-2 text-center transition-colors ${
                        sidebarTab === 'bookmarks'
                          ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900/60'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      북마크
                    </button>
                    <button
                      onClick={() => setSidebarTab('annotations')}
                      className={`flex-1 py-2 text-center transition-colors ${
                        sidebarTab === 'annotations'
                          ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900/60'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      주석 목록
                    </button>
                  </div>

                  <div className="p-3 overflow-y-auto space-y-2 text-xs flex-1">
                    {sidebarTab === 'toc' && (
                      <div className="space-y-1.5 text-slate-300">
                        <div className="font-bold text-white flex items-center space-x-1">
                          <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                          <span>제1편 미시경제학의 기초</span>
                        </div>
                        <div className="pl-4 space-y-1 text-slate-400">
                          <p className="hover:text-indigo-300 cursor-pointer">1.1 시장의 개념과 가격 기능</p>
                          <p className="hover:text-indigo-300 cursor-pointer text-indigo-400 font-semibold">
                            1.2 수요곡선과 공급곡선의 도출 (P.14)
                          </p>
                          <p className="hover:text-indigo-300 cursor-pointer">1.3 균형가격의 결정과 탄력성</p>
                        </div>
                        <div className="font-bold text-white flex items-center space-x-1 pt-2">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          <span>제2편 소비자 이론</span>
                        </div>
                      </div>
                    )}
                    {sidebarTab === 'annotations' && (
                      <div className="space-y-2 text-xs">
                        <div className="p-2 bg-slate-900 rounded border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-yellow-400">[형광펜] P.14</span>
                            <span className="text-[10px] text-slate-500">김연구</span>
                          </div>
                          <p className="text-slate-300 text-[11px]">
                            "수요의 가격탄력성이 1보다 큰 경우 가격 인하는 총수입을 증가시킨다..."
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Canvas Rendering Area */}
                <div className="flex-1 bg-slate-950/80 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Simulated PDF Paper Canvas */}
                  <div
                    className="w-full max-w-2xl bg-white text-slate-900 rounded shadow-2xl p-8 min-h-[500px] flex flex-col justify-between relative"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                  >
                    <div className="space-y-4 font-serif text-sm leading-relaxed">
                      <div className="border-b pb-2 flex justify-between text-xs text-slate-500 font-sans">
                        <span>제1편 미시경제학의 기초</span>
                        <span>Page {currentPage}</span>
                      </div>

                      <h2 className="text-lg font-bold font-sans text-slate-900">
                        1.2 수요곡선과 공급곡선의 도출 및 탄력성
                      </h2>

                      <p>
                        시장에서 개별 소비자가 특정 재화를 구매하고자 하는 의사와 지불 능력이 결합된 것을
                        수요(Demand)라고 정의한다.
                      </p>

                      {/* Highlighted text block */}
                      <div
                        onClick={() =>
                          setSelectedOcrText(
                            '수요의 가격탄력성(Price Elasticity of Demand)은 가격의 미세한 변화율에 대한 수요량의 변화율의 비로 정의된다.'
                          )
                        }
                        className="bg-yellow-200/80 p-1.5 rounded cursor-pointer border border-yellow-300 hover:bg-yellow-300 transition-colors"
                      >
                        <p className="font-semibold text-slate-900">
                          수요의 가격탄력성(Price Elasticity of Demand)은 가격의 미세한 변화율에 대한 수요량의 변화율의 비로 정의된다.
                        </p>
                      </div>

                      <p>
                        만일 대체재가 풍부하게 존재하는 사치품의 경우 탄력성은 매우 높은 값을 가지며, 필수재나
                        중독성 소비재의 경우 비탄력적인 성향을 띠게 된다.
                      </p>

                      {/* Simulated Interactive OCR Pop-up Menu */}
                      {selectedOcrText && (
                        <div className="absolute top-28 left-12 right-12 bg-slate-900 text-white rounded-xl p-2.5 shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-2 z-30 font-sans text-xs animate-in fade-in duration-200">
                          <div className="flex items-center space-x-1">
                            <button className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-bold">
                              &lt;강조&gt;
                            </button>
                            <button className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded">
                              &lt;밑줄&gt;
                            </button>
                            <button className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded">
                              &lt;취소선&gt;
                            </button>
                            <button className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded">
                              복사
                            </button>
                            <button className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded">
                              번역
                            </button>
                            <button className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded">
                              사전
                            </button>
                          </div>
                          <button
                            onClick={() => setSelectedOcrText(null)}
                            className="text-slate-400 hover:text-white text-xs px-1"
                          >
                            닫기 ×
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t text-[11px] text-slate-400 text-center font-sans">
                      purePDFrend Protected Document | Offline-First Engine Active
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Sliding Bottom Sheet (Hidden by default on Desktop) */}
              {showMobileBottomSheet && (
                <div className="bg-slate-950 border-t border-slate-800 p-4 space-y-3 sm:hidden animate-in slide-in-from-bottom duration-250">
                  <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">📱 모바일 슬라이딩 도구함</span>
                    <button
                      onClick={() => setShowMobileBottomSheet(false)}
                      className="text-xs text-slate-400"
                    >
                      접기
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <button className="p-2 bg-slate-900 rounded border border-slate-800 flex flex-col items-center">
                      <Highlighter className="w-4 h-4 text-yellow-400 mb-1" />
                      <span>형광펜</span>
                    </button>
                    <button className="p-2 bg-slate-900 rounded border border-slate-800 flex flex-col items-center">
                      <Underline className="w-4 h-4 text-indigo-400 mb-1" />
                      <span>밑줄</span>
                    </button>
                    <button className="p-2 bg-slate-900 rounded border border-slate-800 flex flex-col items-center">
                      <Strikethrough className="w-4 h-4 text-rose-400 mb-1" />
                      <span>취소선</span>
                    </button>
                    <button className="p-2 bg-slate-900 rounded border border-slate-800 flex flex-col items-center">
                      <Stamp className="w-4 h-4 text-emerald-400 mb-1" />
                      <span>전자서명</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Persistent Bottom Status Bar with Hover & Long-Press Preview */}
              <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-slate-300 font-medium truncate">{statusBarText}</span>
                  {activeShortcut && (
                    <span className="px-1.5 py-0.2 bg-slate-800 text-indigo-300 font-mono text-[10px] rounded border border-slate-700">
                      단축키: {activeShortcut}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 shrink-0 hidden sm:inline">
                  터치 0.5초 롱프레스 시 진동 및 설명 자동 출력
                </span>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 5.9 USER ENVIRONMENT SETTINGS (SCR-USR-SET-01)                 */}
          {/* ------------------------------------------------------------- */}
          {activeUserView === 'settings' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">5.9 사용자 환경설정 (Settings)</h3>
                <p className="text-xs text-slate-400">테마, 뷰어 페이지 방향, 스크롤 자석, 주석 폰트 및 협업 옵션 설정</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Setting Card 1 */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>뷰어 및 디스플레이 설정</span>
                  </h4>
                  <div className="space-y-2 text-slate-400">
                    <label className="flex items-center justify-between">
                      <span>문서 페이지 방향</span>
                      <select className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200">
                        <option>세로 보기 (기본)</option>
                        <option>가로 보기</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between">
                      <span>단일/더블 페이지 모드</span>
                      <select className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200">
                        <option>단일 페이지 (Single)</option>
                        <option>2쪽 맞쪽 보기 (Spread)</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between">
                      <span>세로 스크롤 페이지 자석 효과</span>
                      <input type="checkbox" defaultChecked className="rounded accent-indigo-600" />
                    </label>
                  </div>
                </div>

                {/* Setting Card 2 */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                    <span>주석 및 글꼴 설정</span>
                  </h4>
                  <div className="space-y-2 text-slate-400">
                    <label className="flex items-center justify-between">
                      <span>주석 작성자 기본 별명</span>
                      <input
                        type="text"
                        defaultValue="김연구"
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 w-32"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>텍스트 주석 기본 글꼴</span>
                      <select className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200">
                        <option>Pretendard (시스템 기본)</option>
                        <option>Noto Sans KR</option>
                        <option>나눔명조</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between">
                      <span>연속 주석 편집 유지 (도구 초기화 방지)</span>
                      <input type="checkbox" defaultChecked className="rounded accent-indigo-600" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. ADMIN SERVICE BACKOFFICE TIER (SCR-ADM-*)                       */}
      {/* =================================================================== */}
      {activeTier === 'admin' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">4. purePDFrend 관리자 거버넌스 백오피스</h3>
                <p className="text-xs text-slate-400">보안, 동적프로그램, 사용자, 권한, 약관 등 14개 핵심 운영 도메인 통제 (책임자: {systemAdminEmail})</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTier('user')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
            >
              사용자 화면으로 복귀
            </button>
          </div>

          {/* 14 Domain Tabs (Scrollable) */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar pb-2 border-b border-slate-800/80 text-xs">
            {(
              [
                { id: 'security', label: '4.1 보안관리', icon: Lock },
                { id: 'programs', label: '4.2 프로그램관리', icon: Layers },
                { id: 'users', label: '4.3 사용자관리', icon: Users },
                { id: 'policies', label: '4.4 약관·동의·정책', icon: FileText },
                { id: 'roles', label: '4.5 권한그룹관리', icon: Key },
                { id: 'menus', label: '4.6 메뉴관리', icon: List },
                { id: 'logs', label: '4.7 로그관리', icon: Clock },
                { id: 'notifications', label: '4.8 알림관리', icon: Bell },
                { id: 'apis', label: '4.9 서비스API', icon: Code },
                { id: 'external_apis', label: '4.10 외부API', icon: Globe },
                { id: 'user_configs', label: '4.11 사용자설정항목', icon: Sliders },
                { id: 'boards', label: '4.12 게시판·베너', icon: MessageSquare },
                { id: 'customers', label: '4.13 고객관리', icon: LifeBuoy },
                { id: 'fonts', label: '4.14 글꼴관리', icon: Type },
              ] as const
            ).map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  onClick={() => setActiveAdminDomain(d.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 shrink-0 transition-all ${
                    activeAdminDomain === d.id
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{d.label}</span>
                </button>
              );
            })}
          </div>

          {/* Domain Content: 4.1 Security Management */}
          {activeAdminDomain === 'security' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>아이피(IP) 접근 제어 관리</span>
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-slate-300">해외 IP 일괄 차단 여부</span>
                      <input
                        type="checkbox"
                        checked={ipBlockEnabled}
                        onChange={(e) => setIpBlockEnabled(e.target.checked)}
                        className="rounded accent-amber-600"
                      />
                    </label>
                    <textarea
                      rows={3}
                      defaultValue="124.50.0.0/16 # 사내 인트라넷 대역&#10;211.200.*.* # 본사 고정 IP"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>접근제어 및 2단계 인증 (2FA)</span>
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="2fa"
                        checked={twoFactorAuth === 'admin'}
                        onChange={() => setTwoFactorAuth('admin')}
                        className="accent-amber-600"
                      />
                      <span className="text-slate-300">관리자 계정만 2단계 인증 강제</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="2fa"
                        checked={twoFactorAuth === 'all'}
                        onChange={() => setTwoFactorAuth('all')}
                        className="accent-amber-600"
                      />
                      <span className="text-slate-300">전체 사용자 2단계 인증 의무화</span>
                    </label>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">세션 유지 타임아웃</span>
                      <select
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                      >
                        <option value="15">15분</option>
                        <option value="30">30분 (표준)</option>
                        <option value="60">60분</option>
                      </select>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">오프라인 보안 유효시간 (TTL)</span>
                      <select
                        value={offlineTtl}
                        onChange={(e) => setOfflineTtl(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                      >
                        <option value="24">24시간</option>
                        <option value="48">48시간 (권장)</option>
                        <option value="168">7일</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Domain Content: 4.2 Program Hierarchy */}
          {activeAdminDomain === 'programs' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>동적 프로그램 트리 및 버전별 핫스왑 관리</span>
                  </h4>
                  <button className="px-2.5 py-1 bg-amber-600 text-white rounded text-[11px] font-semibold">
                    + 하위 프로그램 등록
                  </button>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
                    <span>PROG-USR-06 [문서뷰어 코어] (부모: PROG-USR)</span>
                    <span className="text-emerald-400">v2.1 활성 (핫스왑 대기)</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded border border-slate-800/60 flex items-center justify-between pl-6 text-slate-400">
                    <span>└── PROG-USR-06-TAB1 [주석 도구함 서브뷰]</span>
                    <span>v1.0 활성</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. MODALS (Conflict Resolution, Share, Login)                       */}
      {/* =================================================================== */}
      {/* 3-Way Diff Conflict Resolution Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  문서 주석 충돌 해결 (3-Way Conflict Resolution)
                </h3>
              </div>
              <button
                onClick={() => setShowConflictModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              오프라인 동안 원격 서버의 문서가 다른 협업자에 의해 수정되었습니다. 로컬 작업본과 서버 원본의 주석 차이를 확인하고 최종 유지할 버전을 선택하세요.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-indigo-500/50 space-y-2">
                <span className="font-bold text-indigo-400">💻 내 로컬 오프라인 작업본 (3건)</span>
                <div className="space-y-1 text-slate-300 text-[11px]">
                  <p>• P.14 형광펜 (노란색) 추가</p>
                  <p>• P.42 댓글: "탄력성 공식 재검토"</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-400">☁️ 원격 서버 최신본 (협업자)</span>
                <div className="space-y-1 text-slate-300 text-[11px]">
                  <p>• P.14 밑줄 (빨간색) 추가</p>
                  <p>• P.42 댓글: "수식 오타 보정 완료"</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-slate-200">병합 방식 선택:</span>
              <label className="flex items-center space-x-2">
                <input type="radio" name="merge" defaultChecked className="accent-indigo-600" />
                <span className="text-slate-300">로컬 오프라인 변경사항을 우선 적용 (권장)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="merge" className="accent-indigo-600" />
                <span className="text-slate-300">원격 서버 최신본을 유지하고 로컬 변경 폐기</span>
              </label>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowConflictModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  setOfflineEventsCount(0);
                  setShowConflictModal(false);
                  alert('성공적으로 동기화되었습니다.');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg"
              >
                최종 충돌 해결 및 동기화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Share2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">5.7 문서 공유 링크 생성</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="space-y-1 block">
                <span className="text-slate-400">공유 권한 설정</span>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200">
                  <option>열람자 쓰기 (본인 주석만 수정/삭제 가능)</option>
                  <option>단순 읽기 (주석 열람만 가능)</option>
                  <option>공동 관리자 (모든 주석 제어 가능)</option>
                </select>
              </label>

              <label className="space-y-1 block">
                <span className="text-slate-400">공유 유효 기간</span>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200">
                  <option>7일간 유효</option>
                  <option>30일간 유효</option>
                  <option>무기한 공유</option>
                </select>
              </label>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                <span className="text-[11px] text-slate-500">생성된 암호화 공유 링크</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value="https://purepdfrend.com/share/SHR-2026-X9481A"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded p-1.5 text-[11px] text-slate-300 font-mono"
                  />
                  <button
                    onClick={() => alert('링크가 클립보드에 복사되었습니다.')}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold"
                  >
                    복사
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login & 2FA Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">5.2 로그인 및 2차인증</h3>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <input
                type="text"
                defaultValue="researcher_kim"
                placeholder="아이디 입력..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
              <input
                type="password"
                defaultValue="••••••••"
                placeholder="비밀번호 입력..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>2차 인증: 카카오톡 또는 이메일 OTP 연동</p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button className="p-2 bg-yellow-500/20 text-yellow-300 rounded border border-yellow-500/40 font-bold">
                    카카오 인증
                  </button>
                  <button className="p-2 bg-slate-800 text-slate-300 rounded border border-slate-700 font-bold">
                    이메일 OTP
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  alert('로그인되었습니다.');
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg mt-2"
              >
                로그인 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
