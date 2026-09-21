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
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 max-w-7xl mx-auto w-full gap-4">
      {/* Top Main Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-2 px-4 shadow-lg backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-bold text-white tracking-wide">시스템 관리</span>
          <span className="text-xs text-slate-500 font-mono">| purepdfrend_dev</span>
        </div>

        {/* Group Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMainTab('ai-agent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mainTab === 'ai-agent'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            AI 에이전트 관리 그룹
          </button>

          <button
            onClick={() => setMainTab('ocr-engine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mainTab === 'ocr-engine'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            OCR 엔진 관리 (사용여부)
          </button>

          <button
            onClick={() => setMainTab('docs-sync')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mainTab === 'docs-sync'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            문서 체계 & DB 동기화
          </button>
        </div>
      </div>

      {/* Sub-navigation if inside AI Agent Management */}
      {mainTab === 'ai-agent' && (
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-lg p-1.5 px-3 shrink-0">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            에이전트 관리 메뉴:
          </span>

          <button
            onClick={() => setAgentSubTab('graph')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              agentSubTab === 'graph'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            작업그래프 조회 (뷰모드/간격)
          </button>

          <button
            onClick={() => setAgentSubTab('task-search')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              agentSubTab === 'task-search'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            작업정보관리 (세션/태스크/루프 검색)
          </button>

          <button
            onClick={() => setAgentSubTab('usage')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              agentSubTab === 'usage'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            에이전트 사용정보 조회
          </button>

          <button
            onClick={() => setAgentSubTab('audit')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              agentSubTab === 'audit'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            3계층 무결성 감사
          </button>
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
