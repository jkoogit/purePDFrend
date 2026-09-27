import { useState, useEffect } from 'react';
import { SystemSettings, GraphNode, GraphEdge } from '../../types';
import WorkGraphViewer from './WorkGraphViewer';
import TaskInfoManager from './TaskInfoManager';
import AgentUsageViewer from './AgentUsageViewer';
import IntegrityAuditManager from './IntegrityAuditManager';
import OcrEngineManager from '../../ppdf/components/OcrEngineManager';
import DocsGovernanceManager from './DocsGovernanceManager';
import { Bot, Network, Search, BarChart3, Cpu, ShieldCheck, Settings } from 'lucide-react';

interface SystemSettingsViewProps {
  settings: SystemSettings | null;
  onUpdateSettings: (newSettings: SystemSettings) => Promise<void>;
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  onRefreshGraph: () => void;
  isLoadingGraph: boolean;
  initialMainTab?: 'ai-agent' | 'ocr-engine' | 'docs-sync';
  dbStatus?: string;
}

export default function SystemSettingsView({
  settings,
  onUpdateSettings,
  graphNodes,
  graphEdges,
  onRefreshGraph,
  isLoadingGraph,
  initialMainTab = 'ai-agent',
  dbStatus = 'CONNECTED',
}: SystemSettingsViewProps) {
  // Main Tab: 'ai-agent' | 'ocr-engine' | 'docs-sync'
  const [mainTab, setMainTab] = useState<'ai-agent' | 'ocr-engine' | 'docs-sync'>(initialMainTab);

  // Sync when initialMainTab changes from parent
  useEffect(() => {
    if (initialMainTab) {
      setMainTab(initialMainTab);
    }
  }, [initialMainTab]);

  // Sub Tab inside 'ai-agent': 'graph' | 'task-search' | 'usage' | 'audit'
  const [agentSubTab, setAgentSubTab] = useState<'graph' | 'task-search' | 'usage' | 'audit'>('graph');
  const [traceFilter, setTraceFilter] = useState<string>('');

  const handleNavigateToTrace = (keyword: string) => {
    setTraceFilter(keyword);
    setAgentSubTab('usage');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-3 sm:p-4 max-w-7xl mx-auto w-full gap-3 sm:gap-4 overflow-y-auto">
      {/* Top Main Navigation Bar: 표시영역 초과 시 줄바꿈 처리 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:px-4 shadow-lg backdrop-blur-xs shrink-0 gap-3">
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Settings className="w-5 h-5 text-indigo-400 shrink-0" />
          <span className="text-sm font-bold text-white tracking-wide break-keep">시스템 관리</span>
          <span className="text-xs text-slate-500 font-mono break-keep">| purepdfrend_dev</span>
        </div>

        {/* Group Tabs (1단 메뉴: 표시영역 초과 시 자동 줄바꿈 flex-wrap) */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setMainTab('ai-agent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 break-keep select-none ${
              mainTab === 'ai-agent'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Bot className="w-4 h-4 shrink-0" />
            <span>AI 에이전트 관리 그룹</span>
          </button>

          <button
            onClick={() => setMainTab('ocr-engine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 break-keep select-none ${
              mainTab === 'ocr-engine'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4 shrink-0" />
            <span>OCR 엔진 관리 (사용여부)</span>
          </button>

          <button
            onClick={() => setMainTab('docs-sync')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 break-keep select-none ${
              mainTab === 'docs-sync'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>문서 체계 & DB 동기화</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation if inside AI Agent Management (2단 메뉴: 표시영역 초과 시 자동 줄바꿈 flex-wrap) */}
      {mainTab === 'ai-agent' && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-lg p-2 sm:px-3 shrink-0">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1 shrink-0 select-none break-keep">
            <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>에이전트 관리:</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            <button
              onClick={() => setAgentSubTab('graph')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 select-none break-keep ${
                agentSubTab === 'graph'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Network className="w-3.5 h-3.5 shrink-0" />
              <span>작업그래프 조회</span>
            </button>

            <button
              onClick={() => setAgentSubTab('task-search')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 select-none break-keep ${
                agentSubTab === 'task-search'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span>작업정보관리 (세션/태스크)</span>
            </button>

            <button
              onClick={() => setAgentSubTab('usage')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 select-none break-keep ${
                agentSubTab === 'usage'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>에이전트 사용정보</span>
            </button>

            <button
              onClick={() => setAgentSubTab('audit')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 select-none break-keep ${
                agentSubTab === 'audit'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>3계층 무결성 감사</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content View Switcher */}
      <div className="flex-1 min-h-0">
        {mainTab === 'ai-agent' && agentSubTab === 'graph' && (
          <WorkGraphViewer
            nodes={graphNodes}
            edges={graphEdges}
            onRefresh={onRefreshGraph}
            isLoading={isLoadingGraph}
            dbStatus={dbStatus}
          />
        )}

        {mainTab === 'ai-agent' && agentSubTab === 'task-search' && (
          <TaskInfoManager onNavigateToTrace={handleNavigateToTrace} dbStatus={dbStatus} />
        )}

        {mainTab === 'ai-agent' && agentSubTab === 'usage' && (
          <AgentUsageViewer initialFilter={traceFilter} dbStatus={dbStatus} />
        )}

        {mainTab === 'ai-agent' && agentSubTab === 'audit' && (
          <IntegrityAuditManager dbStatus={dbStatus} />
        )}

        {mainTab === 'ocr-engine' && (
          <OcrEngineManager
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            dbStatus={dbStatus}
          />
        )}

        {mainTab === 'docs-sync' && (
          <DocsGovernanceManager dbStatus={dbStatus} />
        )}
      </div>
    </div>
  );
}
