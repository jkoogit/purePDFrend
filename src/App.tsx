import { useState, useEffect, useRef } from 'react';
import { Navbar, ErrorBoundary, ScrollToTopFab } from './shared';
import { ScenarioDesignView, OcrEngineManager } from './ppdf';
import {
  WorkGraphViewer,
  TaskInfoManager,
  AgentUsageViewer,
  IntegrityAuditManager,
  DocsGovernanceManager,
  SystemConfigManager,
  EmergencyRecoveryPanel,
} from './aiagent';
import {
  SystemSettings,
  GraphNode,
  GraphEdge,
  ActiveViewId,
  DomainGroupId,
} from './types';

export default function App() {
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

  return (
    <div
      className={`${
        isHeaderPinned ? 'h-screen overflow-hidden' : 'min-h-screen overflow-x-hidden'
      } bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white`}
    >
      {/* Top 3-Domain Global & Mobile Navigation */}
      <div className={isHeaderPinned ? 'shrink-0 z-40' : 'relative z-40'}>
        <Navbar
          activeView={activeView}
          onSelectView={setActiveView}
          activeDomain={activeDomain}
          onSelectDomain={setActiveDomain}
          dbStatus={dbStatus}
          isHeaderPinned={isHeaderPinned}
          onTogglePinHeader={togglePinHeader}
        />
      </div>

      {/* Main Content Area with Strict Overflow Defense & Mobile Responsiveness */}
      <main
        ref={mainScrollRef}
        className={`flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden min-w-0 ${
          isHeaderPinned ? 'overflow-y-auto no-scrollbar scroll-smooth' : ''
        }`}
      >
        <ErrorBoundary fallbackTitle="에이전트 화면 로딩 중 오류가 발생했습니다.">
          {/* 비-LLM 긴급 Push 및 세션 DR 관제실 */}
          {activeDomain === 'harness' && (
            <div className="mb-4">
              <EmergencyRecoveryPanel />
            </div>
          )}

          {/* [1. 하네스 거버넌스 도메인 4대 뷰] */}
          {activeView === 'graph' && (
            <div className="w-full space-y-4">
              <WorkGraphViewer
                nodes={graphNodes}
                edges={graphEdges}
                onRefresh={fetchGraph}
                isLoading={isLoadingGraph}
                dbStatus={dbStatus}
              />
            </div>
          )}

          {activeView === 'task' && (
            <div className="w-full space-y-4">
              <TaskInfoManager
                onNavigateToTrace={handleNavigateToTrace}
                dbStatus={dbStatus}
              />
            </div>
          )}

          {activeView === 'usage' && (
            <div className="w-full space-y-4">
              <AgentUsageViewer
                initialFilter={traceFilter}
                dbStatus={dbStatus}
              />
            </div>
          )}

          {activeView === 'audit' && (
            <div className="w-full space-y-4">
              <IntegrityAuditManager dbStatus={dbStatus} />
            </div>
          )}

          {/* [2. 추적 및 지식창고 도메인 2대 뷰] */}
          {activeView === 'docs' && (
            <div className="w-full space-y-4">
              <DocsGovernanceManager dbStatus={dbStatus} />
            </div>
          )}

          {activeView === 'settings' && (
            <div className="w-full space-y-4">
              <SystemConfigManager
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                dbStatus={dbStatus}
              />
            </div>
          )}

          {/* [3. PDF 스튜디오 도메인 2대 뷰] */}
          {activeView === 'ocr' && (
            <div className="w-full space-y-4">
              <OcrEngineManager
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                dbStatus={dbStatus}
              />
            </div>
          )}

          {activeView === 'scenarios' && (
            <div className="w-full space-y-4">
              <ScenarioDesignView />
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
