import { useState, useMemo, useEffect } from 'react';
import { GraphNode, GraphEdge } from '../types';
import { Layers, GitBranch, Terminal, RefreshCw, ZoomIn, ZoomOut, CheckCircle2, Clock, PlayCircle, Save } from 'lucide-react';

interface WorkGraphViewerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onRefresh: () => void;
  isLoading: boolean;
}

export type SpacingPreset = 'compact' | 'normal' | 'wide' | 'custom';

export default function WorkGraphViewer({ nodes, edges: _edges, onRefresh, isLoading }: WorkGraphViewerProps) {
  // 1. Hierarchy view filters (Session, Task, Loop)
  const [viewModes, setViewModes] = useState({
    session: true,
    task: true,
    loop: true,
  });

  // 2. Status filters (Completed, In-progress, Pending/Waiting) - all can be toggled
  const [statusFilters, setStatusFilters] = useState({
    all: true,
    completed: true,   // 완료, 승급, 정리
    inProgress: true,  // 처리, IN_PROGRESS
    pending: true,     // START, PENDING, 대기
  });

  // 3. Card spacing setting
  const [spacingPreset, setSpacingPreset] = useState<SpacingPreset>('normal');
  const [customSpacing, setCustomSpacing] = useState<number>(48);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isSavingViewState, setIsSavingViewState] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load saved view state from DB on mount
  useEffect(() => {
    const loadSavedViewState = async () => {
      try {
        const res = await fetch('/api/agent/graph/view-state');
        const data = await res.json();
        if (data.success && data.viewState) {
          const vs = data.viewState;
          if (vs.spacingPreset) setSpacingPreset(vs.spacingPreset);
          if (vs.customSpacing) setCustomSpacing(vs.customSpacing);
          if (vs.viewModes) setViewModes(vs.viewModes);
          if (vs.statusFilters) setStatusFilters(vs.statusFilters);
        }
      } catch (err) {
        console.error('Failed to load graph view state:', err);
      }
    };
    loadSavedViewState();
  }, []);

  // Save current view state to DB
  const handleSaveViewState = async () => {
    setIsSavingViewState(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/agent/graph/view-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'SESSION-20260917-001',
          viewState: {
            spacingPreset,
            customSpacing,
            viewModes,
            statusFilters,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage('DB 저장 완료');
        setTimeout(() => setSaveMessage(null), 2500);
      }
    } catch (err: any) {
      alert('뷰 설정 저장 실패: ' + err.message);
    } finally {
      setIsSavingViewState(false);
    }
  };

  // Computed pixel gap between card columns/rows
  const activeSpacing = useMemo(() => {
    switch (spacingPreset) {
      case 'compact':
        return 24;
      case 'normal':
        return 48;
      case 'wide':
        return 72;
      case 'custom':
        return customSpacing;
    }
  }, [spacingPreset, customSpacing]);

  // Helper to categorize node status
  const getNodeCategory = (status: string): 'completed' | 'inProgress' | 'pending' => {
    const s = String(status || '').toUpperCase();
    if (['DONE', '완료', '승급', '정리', 'COMPLETED', 'PROMOTE', 'CLEANUP'].includes(s)) {
      return 'completed';
    }
    if (['처리', 'IN_PROGRESS', 'RUNNING', 'ACTIVE'].includes(s)) {
      return 'inProgress';
    }
    return 'pending';
  };

  // Filter visible nodes based on viewModes and statusFilters
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      // Hierarchy check
      if (node.level === 'session' && !viewModes.session) return false;
      if (node.level === 'task' && !viewModes.task) return false;
      if (node.level === 'loop' && !viewModes.loop) return false;

      // Status check
      if (statusFilters.all) return true;
      const category = getNodeCategory(node.status);
      if (category === 'completed' && !statusFilters.completed) return false;
      if (category === 'inProgress' && !statusFilters.inProgress) return false;
      if (category === 'pending' && !statusFilters.pending) return false;

      return true;
    });
  }, [nodes, viewModes, statusFilters]);

  // Counts for status
  const statusCounts = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    nodes.forEach((n) => {
      const cat = getNodeCategory(n.status);
      if (cat === 'completed') completed++;
      else if (cat === 'inProgress') inProgress++;
      else pending++;
    });
    return { completed, inProgress, pending, total: nodes.length };
  }, [nodes]);

  // Group nodes by level for column rendering
  const sessionNodes = useMemo(() => filteredNodes.filter((n) => n.level === 'session'), [filteredNodes]);
  const taskNodes = useMemo(() => filteredNodes.filter((n) => n.level === 'task'), [filteredNodes]);
  const loopNodes = useMemo(() => filteredNodes.filter((n) => n.level === 'loop'), [filteredNodes]);

  const getStatusBadge = (status: string) => {
    const cat = getNodeCategory(status);
    switch (cat) {
      case 'inProgress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <PlayCircle className="w-3 h-3 animate-pulse" /> {status}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Clock className="w-3 h-3" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Top Multi-Filter & Control Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
        {/* 1. Hierarchy & Status Filters */}
        <div className="flex flex-wrap items-center gap-5">
          {/* Hierarchy Filter */}
          <div className="flex items-center gap-3 pr-4 border-r border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">계층 필터:</span>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={viewModes.session}
                onChange={(e) => setViewModes((prev) => ({ ...prev, session: e.target.checked }))}
                className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                세션 ({sessionNodes.length})
              </span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={viewModes.task}
                onChange={(e) => setViewModes((prev) => ({ ...prev, task: e.target.checked }))}
                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                태스크 ({taskNodes.length})
              </span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={viewModes.loop}
                onChange={(e) => setViewModes((prev) => ({ ...prev, loop: e.target.checked }))}
                className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                루프 ({loopNodes.length})
              </span>
            </label>
          </div>

          {/* Status Filter (Completed, In-progress, Pending) */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">상태 필터:</span>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters.all}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setStatusFilters({
                    all: checked,
                    completed: checked,
                    inProgress: checked,
                    pending: checked,
                  });
                }}
                className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-semibold border border-slate-700">
                전체표시 ({statusCounts.total})
              </span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters.completed}
                onChange={(e) =>
                  setStatusFilters((prev) => {
                    const next = { ...prev, completed: e.target.checked };
                    next.all = next.completed && next.inProgress && next.pending;
                    return next;
                  })
                }
                className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 완료작업 ({statusCounts.completed})
              </span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters.inProgress}
                onChange={(e) =>
                  setStatusFilters((prev) => {
                    const next = { ...prev, inProgress: e.target.checked };
                    next.all = next.completed && next.inProgress && next.pending;
                    return next;
                  })
                }
                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 flex items-center gap-1">
                <PlayCircle className="w-3 h-3 text-amber-400" /> 진행작업 ({statusCounts.inProgress})
              </span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters.pending}
                onChange={(e) =>
                  setStatusFilters((prev) => {
                    const next = { ...prev, pending: e.target.checked };
                    next.all = next.completed && next.inProgress && next.pending;
                    return next;
                  })
                }
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-400" /> 대기작업 ({statusCounts.pending})
              </span>
            </label>
          </div>
        </div>

        {/* 2. Spacing, Zoom & DB Save Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">간격:</span>
            <div className="inline-flex rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60">
              <button
                onClick={() => setSpacingPreset('compact')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  spacingPreset === 'compact' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                24px
              </button>
              <button
                onClick={() => setSpacingPreset('normal')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  spacingPreset === 'normal' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                48px
              </button>
              <button
                onClick={() => setSpacingPreset('wide')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  spacingPreset === 'wide' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                72px
              </button>
              <button
                onClick={() => setSpacingPreset('custom')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  spacingPreset === 'custom' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                사용자
              </button>
            </div>

            {spacingPreset === 'custom' && (
              <div className="flex items-center gap-1.5 ml-1 bg-slate-800/60 px-2 py-1 rounded border border-slate-700">
                <input
                  type="range"
                  min="16"
                  max="120"
                  value={customSpacing}
                  onChange={(e) => setCustomSpacing(Number(e.target.value))}
                  className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-xs font-mono text-slate-300 w-8 text-right">{customSpacing}</span>
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="축소"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="확대"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Persist View State to DB */}
          <button
            onClick={handleSaveViewState}
            disabled={isSavingViewState}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-600 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1"
            title="현재 뷰 설정(간격/상태필터)을 개발DB에 저장"
          >
            <Save className="w-3.5 h-3.5" />
            {isSavingViewState ? '저장중...' : saveMessage || '뷰설정 DB저장'}
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-auto p-8 relative bg-radial from-slate-900/40 to-slate-950">
        {filteredNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-16">
            <Layers className="w-12 h-12 mb-3 text-slate-700" />
            <p className="text-sm font-semibold text-slate-400">선택된 조건에 일치하는 작업 노드가 없습니다.</p>
            <p className="text-xs text-slate-500 mt-1">상단의 계층 필터 또는 완료/진행/대기 상태 필터를 활성화해 주세요.</p>
          </div>
        ) : (
          <div
            className="flex transition-all duration-300 items-start justify-center min-w-max pb-12"
            style={{
              gap: `${activeSpacing}px`,
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Level 1: Session Column */}
            {viewModes.session && (
              <div className="flex flex-col gap-4 w-80">
                <div className="flex items-center gap-2 pb-2 border-b border-indigo-900/50">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    세션 계층 (Session Level)
                  </h3>
                  <span className="ml-auto text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded">
                    {sessionNodes.length}건
                  </span>
                </div>

                {sessionNodes.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedNode(s)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer shadow-lg hover:translate-y-[-2px] ${
                      selectedNode?.id === s.id
                        ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                        {s.code}
                      </span>
                      {getStatusBadge(s.status)}
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1.5 leading-snug">{s.title}</h4>
                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                        <span>에이전트: <strong className="text-slate-200">{s.agent || 'gemini'}</strong></span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        시작: {new Date(s.time).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Level 2: Task Column */}
            {viewModes.task && (
              <div className="flex flex-col gap-4 w-88">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-900/50">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    태스크 계층 (Task Level)
                  </h3>
                  <span className="ml-auto text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded">
                    {taskNodes.length}건
                  </span>
                </div>

                {taskNodes.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedNode(t)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer shadow-lg hover:translate-y-[-2px] ${
                      selectedNode?.id === t.id
                        ? 'border-amber-500 bg-amber-950/40 ring-2 ring-amber-500/20'
                        : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                        {t.code}
                      </span>
                      {getStatusBadge(t.status)}
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-2 leading-snug">{t.title}</h4>
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-amber-300/90 flex items-center gap-2 mb-2">
                      <GitBranch className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{t.branch}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      시작: {new Date(t.time).toLocaleString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Level 3: Loop Column */}
            {viewModes.loop && (
              <div className="flex flex-col gap-4 w-80">
                <div className="flex items-center gap-2 pb-2 border-b border-emerald-900/50">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    루프 계층 (Loop Level)
                  </h3>
                  <span className="ml-auto text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded">
                    {loopNodes.length}건
                  </span>
                </div>

                {loopNodes.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => setSelectedNode(l)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer shadow-lg hover:translate-y-[-2px] ${
                      selectedNode?.id === l.id
                        ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/20'
                        : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                        {l.code}
                      </span>
                      {getStatusBadge(l.status)}
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1.5 leading-snug">{l.title}</h4>
                    {l.payload?.items && Array.isArray(l.payload.items) && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">작업 항목</span>
                        <ul className="text-xs text-slate-300 space-y-0.5">
                          {l.payload.items.map((item: string, i: number) => (
                            <li key={i} className="flex items-center gap-1.5 text-[11px]">
                              <span className="w-1 h-1 rounded-full bg-emerald-400" />
                              <span className="truncate">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Node Drawer / Inspector */}
      {selectedNode && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-indigo-400 uppercase">[{selectedNode.level}] {selectedNode.code}</span>
            <span className="text-slate-200">{selectedNode.title}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 font-mono">시작: {new Date(selectedNode.time).toLocaleString('ko-KR')}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
