import { useState, useEffect } from 'react';
import { Navbar, AppTab, ErrorBoundary } from './shared';
import { ScenarioDesignView } from './ppdf';
import { SystemSettingsView } from './aiagent';
import { SystemSettings, GraphNode, GraphEdge } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('agent');
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        dbStatus={dbStatus}
      />

      {/* Main Content Area Protected by ErrorBoundary */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <ErrorBoundary fallbackTitle="에이전트 화면 로딩 중 오류가 발생했습니다.">
          {currentTab === 'scenarios' && (
            <ScenarioDesignView />
          )}

          {currentTab === 'agent' && (
            <SystemSettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              graphNodes={graphNodes}
              graphEdges={graphEdges}
              onRefreshGraph={fetchGraph}
              isLoadingGraph={isLoadingGraph}
              initialMainTab="ai-agent"
              dbStatus={dbStatus}
            />
          )}

          {currentTab === 'system' && (
            <SystemSettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              graphNodes={graphNodes}
              graphEdges={graphEdges}
              onRefreshGraph={fetchGraph}
              isLoadingGraph={isLoadingGraph}
              initialMainTab="ocr-engine"
              dbStatus={dbStatus}
            />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}
