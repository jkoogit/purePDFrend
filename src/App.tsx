import { useState, useEffect, useRef } from 'react';
import { Navbar, ErrorBoundary, ScrollToTopFab } from './shared';
import { OcrEngineManager, WireframeStudio, PurePdfServicePortal } from './ppdf';
import {
  WorkGraphViewer,
  TaskInfoManager,
  AgentUsageViewer,
  IntegrityAuditManager,
  DocsGovernanceManager,
  SystemConfigManager,
} from './aiagent';
import {
  SystemSettings,
  GraphNode,
  GraphEdge,
  ActiveViewId,
  DomainGroupId,
  SystemDomainId,
  UserSystemRole,
} from './types';
import { ThemeMode, resolveThemeMode, applyThemeToDocument } from './styles/tokens';

export default function App() {
  // 1. 3대 시스템 도메인 상태 (기본값: 'service' - 엔드유저 PDF 서비스 첫화면 기본 표시)
  const [activeSystem, setActiveSystem] = useState<SystemDomainId>(() => {
    try {
      const saved = localStorage.getItem('purepdfrend_active_system');
      if (saved && ['service', 'settings', 'harness'].includes(saved)) {
        return saved as SystemDomainId;
      }
    } catch {}
    return 'service';
  });

  // 2. 사용자 권한 체계 (기본값: 'ROLE_ADMIN' - 시뮬레이터로 일반사용자/운영자/관리자 전환 가능)
  const [userRole, setUserRole] = useState<UserSystemRole>(() => {
    try {
      const saved = localStorage.getItem('purepdfrend_user_role');
      if (saved && ['ROLE_USER', 'ROLE_OPERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(saved)) {
        return saved as UserSystemRole;
      }
    } catch {}
    return 'ROLE_ADMIN';
  });

  const handleSelectRole = (newRole: UserSystemRole) => {
    setUserRole(newRole);
    try {
      localStorage.setItem('purepdfrend_user_role', newRole);
    } catch {}
    // If downgraded to ROLE_USER and currently in harness or settings, redirect to service
    if (newRole === 'ROLE_USER' && activeSystem !== 'service') {
      setActiveSystem('service');
    } else if (newRole === 'ROLE_OPERATOR' && activeSystem === 'harness') {
      setActiveSystem('settings');
    }
  };

  const handleSelectSystem = (newSystem: SystemDomainId) => {
    setActiveSystem(newSystem);
    try {
      localStorage.setItem('purepdfrend_active_system', newSystem);
    } catch {}
  };

  // 3. 4모드 통합 테마 상태 (light / dark / dawn / system)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
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

  const handleSelectThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    applyThemeToDocument(mode);
    try {
      localStorage.setItem('purepdfrend_theme_mode', mode);
      localStorage.setItem('purepdfrend_theme', resolveThemeMode(mode));
    } catch {}
  };

  useEffect(() => {
    applyThemeToDocument(themeMode);
  }, [themeMode]);

  // 4. 하네스 거버넌스 도메인 및 뷰 상태
  const [activeDomain, setActiveDomain] = useState<DomainGroupId>('harness');
  const [activeView, setActiveView] = useState<ActiveViewId>('graph');
  const [traceFilter, setTraceFilter] = useState<string>('');

  const [dbStatus, setDbStatus] = useState<string>('CHECKING');
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Graph state
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);

  // 1. Fetch DB Status & Settings
  const checkStatusAndSettings = async () => {
    try {
      const [dbRes, settingsRes] = await Promise.all([
        fetch('/api/db/status'),
        fetch('/api/settings'),
      ]);
      const dbData = await dbRes.json();
      const settingsData = await settingsRes.json();

      if (dbData.success) {
        setDbStatus(dbData.status);
      } else {
        setDbStatus('ERROR');
      }

      if (settingsData.success) {
        setSettings(settingsData.settings);
      }
    } catch (e) {
      console.error('Failed to fetch initial status:', e);
      setDbStatus('ERROR');
    }
  };

  // 2. Fetch Graph Nodes & Edges
  const fetchGraph = async () => {
    setIsLoadingGraph(true);
    try {
      const res = await fetch('/api/agent/graph');
      const data = await res.json();
      if (data.success) {
        setGraphNodes(data.nodes);
        setGraphEdges(data.edges);
      }
    } catch (e) {
      console.error('Failed to load graph:', e);
    } finally {
      setIsLoadingGraph(false);
    }
  };

  useEffect(() => {
    checkStatusAndSettings();
    fetchGraph();
  }, []);

  // 전역 와이어프레임 퀵 점프 네비게이션 리스너 (사용자/관리자 25개 와이어프레임 직접 이동)
  useEffect(() => {
    const handleWireframeJump = () => {
      setActiveSystem('settings');
    };
    window.addEventListener('purepdfrend-navigate-wireframe', handleWireframeJump);
    return () => window.removeEventListener('purepdfrend-navigate-wireframe', handleWireframeJump);
  }, []);

  // Update Settings Handler
  const handleUpdateSettings = async (newSettings: SystemSettings) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    const data = await res.json();
    if (data.success) {
      setSettings(data.settings);
    } else {
      throw new Error(data.error || '설정 저장 실패');
    }
  };

  const handleNavigateToTrace = (keyword: string) => {
    setTraceFilter(keyword);
    setActiveSystem('harness');
    setActiveDomain('harness');
    setActiveView('usage');
  };

  // Header Pinning State (Default: true, persists in localStorage)
  const [isHeaderPinned, setIsHeaderPinned] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('purepdfrend_header_pinned');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const mainScrollRef = useRef<HTMLElement | null>(null);

  const togglePinHeader = () => {
    setIsHeaderPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('purepdfrend_header_pinned', String(next));
      } catch {}
      return next;
    });
  };

  const resolvedTheme = resolveThemeMode(themeMode);

  return (
    <div
      className={`${
        isHeaderPinned ? 'h-screen overflow-hidden' : 'min-h-screen overflow-x-hidden'
      } flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200 ${
        resolvedTheme === 'light'
          ? 'bg-slate-50 text-slate-900'
          : resolvedTheme === 'dawn'
          ? 'bg-[#070e22] text-slate-100'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Global Navigation with System & Role Switcher (사용자서비스 시스템에서는 에이전트 top 메뉴 제거) */}
      {activeSystem !== 'service' && (
        <div className={isHeaderPinned ? 'shrink-0 z-40' : 'relative z-40'}>
          <Navbar
            activeView={activeView}
            onSelectView={setActiveView}
            activeDomain={activeDomain}
            onSelectDomain={setActiveDomain}
            dbStatus={dbStatus}
            isHeaderPinned={isHeaderPinned}
            onTogglePinHeader={togglePinHeader}
            activeSystem={activeSystem}
            onSelectSystem={handleSelectSystem}
            userRole={userRole}
            onSelectRole={handleSelectRole}
            themeMode={themeMode}
            onChangeThemeMode={handleSelectThemeMode}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main
        ref={mainScrollRef}
        className={`flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden min-w-0 ${
          isHeaderPinned ? 'overflow-y-auto no-scrollbar scroll-smooth' : ''
        }`}
      >
        <ErrorBoundary fallbackTitle="화면 로딩 중 오류가 발생했습니다.">
          {/* [1. 엔드유저 'PDF 서비스 포털' - 첫 화면 기본 표시] */}
          {activeSystem === 'service' && (
            <div className="w-full">
              <PurePdfServicePortal
                onNavigateToAgent={() => handleSelectSystem('harness')}
                onNavigateToSettings={() => handleSelectSystem('settings')}
                userRole={userRole}
                onSelectRole={handleSelectRole}
                systemAdminEmail="jkoogit@gmail.com"
                themeMode={themeMode}
                onChangeThemeMode={handleSelectThemeMode}
              />
            </div>
          )}

          {/* [2. '서비스설정' - 25개 와이어프레임 & 시스템 설정 스튜디오] */}
          {activeSystem === 'settings' && (
            <div className="w-full space-y-4">
              <WireframeStudio />
            </div>
          )}

          {/* [3. '에이전트관리' - 마스터 하네스 거버넌스 3대 도메인 8대 뷰] */}
          {activeSystem === 'harness' && (
            <div className="w-full space-y-4">
              {/* [3-1. 하네스 거버넌스 도메인 4대 뷰] */}
              {activeView === 'graph' && (
                <WorkGraphViewer
                  nodes={graphNodes}
                  edges={graphEdges}
                  onRefresh={fetchGraph}
                  isLoading={isLoadingGraph}
                  dbStatus={dbStatus}
                />
              )}

              {activeView === 'task' && (
                <TaskInfoManager
                  onNavigateToTrace={handleNavigateToTrace}
                  dbStatus={dbStatus}
                />
              )}

              {activeView === 'usage' && (
                <AgentUsageViewer
                  initialFilter={traceFilter}
                  dbStatus={dbStatus}
                />
              )}

              {activeView === 'audit' && (
                <IntegrityAuditManager dbStatus={dbStatus} />
              )}

              {/* [3-2. 추적 및 지식창고 도메인 2대 뷰] */}
              {activeView === 'docs' && (
                <DocsGovernanceManager dbStatus={dbStatus} />
              )}

              {activeView === 'settings' && (
                <SystemConfigManager
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  dbStatus={dbStatus}
                />
              )}

              {/* [3-3. PDF 스튜디오 도메인 2대 뷰] */}
              {activeView === 'ocr' && (
                <OcrEngineManager
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  dbStatus={dbStatus}
                />
              )}

              {activeView === 'wireframes' && (
                <WireframeStudio />
              )}
            </div>
          )}
        </ErrorBoundary>
      </main>

      {/* 우하단 접이식 상단 점프 버튼 (Collapsible Jump to Top FAB) */}
      <ScrollToTopFab
        scrollContainerRef={isHeaderPinned ? mainScrollRef : undefined}
        threshold={260}
      />
    </div>
  );
}
