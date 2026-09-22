import { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { GraphNode, GraphEdge } from '../../types';
import {
  Layers,
  GitBranch,
  Terminal,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Clock,
  PlayCircle,
  Save,
  Columns,
  Network,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Maximize2,
  Minimize2,
  Focus,
  X
} from 'lucide-react';

interface WorkGraphViewerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onRefresh: () => void;
  isLoading: boolean;
  dbStatus?: string;
}

export type SpacingPreset = 'compact' | 'normal' | 'wide' | 'custom';

interface ConnectorLine {
  id: string;
  sourceId: string;
  targetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isFocused: boolean;
}

export default function WorkGraphViewer({ nodes, edges: _edges, onRefresh, isLoading, dbStatus = 'CONNECTED' }: WorkGraphViewerProps) {
  // 1. Hierarchy view filters (Session, Task, Loop)
  const [viewModes, setViewModes] = useState({
    session: true,
    task: true,
    loop: true,
  });

  // 2. Status filters (Completed, In-progress, Pending/Waiting)
  const [statusFilters, setStatusFilters] = useState({
    all: true,
    completed: true,   // 완료, 승급, 정리
    inProgress: true,  // 처리, IN_PROGRESS
    pending: true,     // START, PENDING, 대기
  });

  // 3. View layout mode: Columns (컬럼 뷰) vs Grouped (계층 그룹 뷰)
  const [layoutMode, setLayoutMode] = useState<'columns' | 'grouped'>('columns');

  // 4. Downstream focus mode: when a card is checked, only itself and downstream children are activated
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);

  // 5. Collapsed state for groups (performance optimization for large node trees)
  const [collapsedSessions, setCollapsedSessions] = useState<Record<string, boolean>>({});
  const [collapsedTasks, setCollapsedTasks] = useState<Record<string, boolean>>({});

  // 6. Card spacing & zoom settings
  const [spacingPreset, setSpacingPreset] = useState<SpacingPreset>('normal');
  const [customSpacing, setCustomSpacing] = useState<number>(48);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isSavingViewState, setIsSavingViewState] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Canvas refs for dynamic SVG connection lines
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [connectorLines, setConnectorLines] = useState<ConnectorLine[]>([]);

  // Load saved view state from localStorage and DB on mount
  useEffect(() => {
    // 1. Instant local restore
    const local = localStorage.getItem('purepdf_workgraph_view_state');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed.zoomLevel) setZoomLevel(parsed.zoomLevel);
        if (parsed.spacingPreset) setSpacingPreset(parsed.spacingPreset);
        if (parsed.customSpacing) setCustomSpacing(parsed.customSpacing);
        if (parsed.viewModes) setViewModes(parsed.viewModes);
        if (parsed.statusFilters) setStatusFilters(parsed.statusFilters);
        if (parsed.layoutMode) setLayoutMode(parsed.layoutMode);
      } catch (e) {
        // ignore
      }
    }

    // 2. Persistent DB load
    const loadSavedViewState = async () => {
      try {
        const res = await fetch('/api/agent/graph/view-state');
        const data = await res.json();
        if (data.success && data.viewState) {
          const vs = data.viewState;
          if (vs.spacingPreset) setSpacingPreset(vs.spacingPreset);
          if (vs.customSpacing) setCustomSpacing(vs.customSpacing);
          if (vs.zoomLevel) setZoomLevel(vs.zoomLevel);
          if (vs.viewModes) setViewModes(vs.viewModes);
          if (vs.statusFilters) setStatusFilters(vs.statusFilters);
          if (vs.layoutMode) setLayoutMode(vs.layoutMode);
        }
      } catch (err) {
        console.error('Failed to load graph view state:', err);
      }
    };
    loadSavedViewState();
  }, []);

  // Save current view state to DB and localStorage
  const handleSaveViewState = async () => {
    // 🛑 Policy 2.3: DB연결이 안된 상태면 수정기능 이벤트 발생시 안내메시지 표시 "영속화 상태 점검필요"
    if (dbStatus !== 'CONNECTED') {
      alert('영속화 상태 점검필요 (DB 연결이 원활하지 않아 원격 저장을 수행할 수 없습니다)');
      return;
    }

    setIsSavingViewState(true);
    setSaveMessage(null);
    const viewState = {
      spacingPreset,
      customSpacing,
      zoomLevel,
      viewModes,
      statusFilters,
      layoutMode,
    };

    // Save to local cache
    localStorage.setItem('purepdf_workgraph_view_state', JSON.stringify(viewState));

    // Dynamically resolve active session ID
    const targetSessionId = nodes.find((n) => n.level === 'session')?.id || 'SESSION-20260920-002';

    try {
      const res = await fetch('/api/agent/graph/view-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: targetSessionId,
          viewState,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage('뷰설정(비율/간격) DB저장 완료');
        setTimeout(() => setSaveMessage(null), 2500);
      } else {
        alert('영속화 상태 점검필요: ' + (data.error || '저장 실패'));
      }
    } catch (err: any) {
      alert('영속화 상태 점검필요: ' + err.message);
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
      // Hierarchy check (only relevant in Columns mode)
      if (layoutMode === 'columns') {
        if (node.level === 'session' && !viewModes.session) return false;
        if (node.level === 'task' && !viewModes.task) return false;
        if (node.level === 'loop' && !viewModes.loop) return false;
      }

      // Status check
      if (statusFilters.all) return true;
      const category = getNodeCategory(node.status);
      if (category === 'completed' && !statusFilters.completed) return false;
      if (category === 'inProgress' && !statusFilters.inProgress) return false;
      if (category === 'pending' && !statusFilters.pending) return false;

      return true;
    });
  }, [nodes, viewModes, statusFilters, layoutMode]);

  // Downstream focus set calculation
  const activeDownstreamIds = useMemo(() => {
    if (!focusedCardId) return null;
    const set = new Set<string>();
    set.add(focusedCardId);

    const target = nodes.find((n) => n.id === focusedCardId);
    if (!target) return set;

    if (target.level === 'session') {
      const childTasks = nodes.filter((n) => n.level === 'task' && n.parentId === target.id);
      childTasks.forEach((t) => {
        set.add(t.id);
        const childLoops = nodes.filter((l) => l.level === 'loop' && l.parentId === t.id);
        childLoops.forEach((l) => set.add(l.id));
      });
    } else if (target.level === 'task') {
      const childLoops = nodes.filter((l) => l.level === 'loop' && l.parentId === target.id);
      childLoops.forEach((l) => set.add(l.id));
    }
    return set;
  }, [focusedCardId, nodes]);

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

  // Group nodes by level
  const sessionNodes = useMemo(() => filteredNodes.filter((n) => n.level === 'session'), [filteredNodes]);
  const taskNodes = useMemo(() => filteredNodes.filter((n) => n.level === 'task'), [filteredNodes]);
  const loopNodes = useMemo(() => filteredNodes.filter((n) => n.level === 'loop'), [filteredNodes]);

  // Calculate dynamic SVG connecting lines & arrows for Columns mode
  const recalculateConnectors = () => {
    if (layoutMode !== 'columns' || !contentRef.current) {
      setConnectorLines([]);
      return;
    }

    const contentRect = contentRef.current.getBoundingClientRect();
    const lines: ConnectorLine[] = [];

    // 1. Session -> Task connections
    if (viewModes.session && viewModes.task) {
      taskNodes.forEach((t) => {
        if (!t.parentId) return;
        const sEl = document.getElementById(`wg-card-${t.parentId}`);
        const tEl = document.getElementById(`wg-card-${t.id}`);
        if (sEl && tEl) {
          const sRect = sEl.getBoundingClientRect();
          const tRect = tEl.getBoundingClientRect();

          const x1 = (sRect.right - contentRect.left) / zoomLevel;
          const y1 = (sRect.top + sRect.height / 2 - contentRect.top) / zoomLevel;
          const x2 = (tRect.left - contentRect.left) / zoomLevel;
          const y2 = (tRect.top + tRect.height / 2 - contentRect.top) / zoomLevel;

          const isFocused = Boolean(
            activeDownstreamIds &&
            activeDownstreamIds.has(t.parentId) &&
            activeDownstreamIds.has(t.id)
          );

          lines.push({
            id: `conn-${t.parentId}-${t.id}`,
            sourceId: t.parentId,
            targetId: t.id,
            x1,
            y1,
            x2,
            y2,
            isFocused,
          });
        }
      });
    }

    // 2. Task -> Loop connections
    if (viewModes.task && viewModes.loop) {
      loopNodes.forEach((l) => {
        if (!l.parentId) return;
        const tEl = document.getElementById(`wg-card-${l.parentId}`);
        const lEl = document.getElementById(`wg-card-${l.id}`);
        if (tEl && lEl) {
          const tRect = tEl.getBoundingClientRect();
          const lRect = lEl.getBoundingClientRect();

          const x1 = (tRect.right - contentRect.left) / zoomLevel;
          const y1 = (tRect.top + tRect.height / 2 - contentRect.top) / zoomLevel;
          const x2 = (lRect.left - contentRect.left) / zoomLevel;
          const y2 = (lRect.top + lRect.height / 2 - contentRect.top) / zoomLevel;

          const isFocused = Boolean(
            activeDownstreamIds &&
            activeDownstreamIds.has(l.parentId) &&
            activeDownstreamIds.has(l.id)
          );

          lines.push({
            id: `conn-${l.parentId}-${l.id}`,
            sourceId: l.parentId,
            targetId: l.id,
            x1,
            y1,
            x2,
            y2,
            isFocused,
          });
        }
      });
    }

    setConnectorLines(lines);
  };

  useLayoutEffect(() => {
    const timer = setTimeout(recalculateConnectors, 50);
    return () => clearTimeout(timer);
  }, [
    filteredNodes,
    activeSpacing,
    zoomLevel,
    viewModes,
    layoutMode,
    focusedCardId,
    activeDownstreamIds,
  ]);

  // Re-calculate on window resize
  useEffect(() => {
    window.addEventListener('resize', recalculateConnectors);
    return () => window.removeEventListener('resize', recalculateConnectors);
  }, [layoutMode, zoomLevel, activeSpacing]);

  const getStatusBadge = (status: string) => {
    const cat = getNodeCategory(status);
    switch (cat) {
      case 'inProgress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="w-3 h-3 text-slate-400" /> {status}
          </span>
        );
    }
  };

  // Toggle downstream focus for a card
  const toggleFocusCard = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFocusedCardId((prev) => (prev === nodeId ? null : nodeId));
  };

  // Group view collapse helpers
  const toggleSessionCollapse = (sessionId: string) => {
    setCollapsedSessions((prev) => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  const toggleTaskCollapse = (taskId: string) => {
    setCollapsedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const expandAllGroups = () => {
    setCollapsedSessions({});
    setCollapsedTasks({});
  };

  const collapseAllGroups = () => {
    const sMap: Record<string, boolean> = {};
    const tMap: Record<string, boolean> = {};
    nodes.filter((n) => n.level === 'session').forEach((s) => { sMap[s.id] = true; });
    nodes.filter((n) => n.level === 'task').forEach((t) => { tMap[t.id] = true; });
    setCollapsedSessions(sMap);
    setCollapsedTasks(tMap);
  };

  const focusedNodeMeta = useMemo(() => {
    if (!focusedCardId) return null;
    return nodes.find((n) => n.id === focusedCardId) || null;
  }, [focusedCardId, nodes]);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Top Multi-Filter & Control Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: View Mode Toggle & Hierarchy/Status Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Layout Mode Switcher */}
          <div className="inline-flex rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 shadow-xs">
            <button
              onClick={() => setLayoutMode('columns')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                layoutMode === 'columns'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              컬럼 뷰 (기본)
            </button>
            <button
              onClick={() => setLayoutMode('grouped')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                layoutMode === 'grouped'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              계층 그룹 뷰
            </button>
          </div>

          {/* Columns mode only: Hierarchy Filters */}
          {layoutMode === 'columns' && (
            <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">계층:</span>
              <label className="flex items-center gap-1 text-xs font-medium text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={viewModes.session}
                  onChange={(e) => setViewModes((prev) => ({ ...prev, session: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 text-[11px]">
                  세션 ({sessionNodes.length})
                </span>
              </label>

              <label className="flex items-center gap-1 text-xs font-medium text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={viewModes.task}
                  onChange={(e) => setViewModes((prev) => ({ ...prev, task: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 text-[11px]">
                  태스크 ({taskNodes.length})
                </span>
              </label>

              <label className="flex items-center gap-1 text-xs font-medium text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={viewModes.loop}
                  onChange={(e) => setViewModes((prev) => ({ ...prev, loop: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-[11px]">
                  루프 ({loopNodes.length})
                </span>
              </label>
            </div>
          )}

          {/* Grouped mode: Collapse/Expand all buttons for Performance Management */}
          {layoutMode === 'grouped' && (
            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-800">
              <button
                onClick={expandAllGroups}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1"
                title="모든 세션/태스크 그룹 펼치기"
              >
                <Maximize2 className="w-3 h-3 text-indigo-400" />
                전체 펼치기
              </button>
              <button
                onClick={collapseAllGroups}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1"
                title="대량 노드 성능 대응을 위해 세션 그룹 단위로 전체 접기"
              >
                <Minimize2 className="w-3 h-3 text-amber-400" />
                전체 접기 (성능대응)
              </button>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">상태:</span>
            <label className="flex items-center gap-1 text-xs font-medium text-slate-200 cursor-pointer select-none">
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
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-semibold border border-slate-700 text-[11px]">
                전체 ({statusCounts.total})
              </span>
            </label>

            <label className="flex items-center gap-1 text-xs font-medium text-slate-200 cursor-pointer select-none">
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
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 완료 ({statusCounts.completed})
              </span>
            </label>

            <label className="flex items-center gap-1 text-xs font-medium text-slate-200 cursor-pointer select-none">
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
                className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 flex items-center gap-1 text-[11px]">
                <PlayCircle className="w-3 h-3 text-indigo-400" /> 진행 ({statusCounts.inProgress})
              </span>
            </label>

            <label className="flex items-center gap-1 text-xs font-medium text-slate-200 cursor-pointer select-none">
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
                className="rounded border-slate-700 bg-slate-800 text-slate-400 focus:ring-0 focus:ring-offset-0"
              />
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700/60 flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3 text-slate-400" /> 대기 ({statusCounts.pending})
              </span>
            </label>
          </div>
        </div>

        {/* Right: Spacing, Zoom & Persistence Controls */}
        <div className="flex items-center gap-3">
          {/* Spacing Controls (Active in Columns Mode) */}
          {layoutMode === 'columns' && (
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
                    max="140"
                    value={customSpacing}
                    onChange={(e) => setCustomSpacing(Number(e.target.value))}
                    className="w-18 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-xs font-mono text-slate-300 w-7 text-right">{customSpacing}</span>
                </div>
              )}
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="축소"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-300 w-10 text-center font-semibold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="확대"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
              title="100% 비율 복원"
            >
              100%
            </button>
          </div>

          {/* Persist View State (including zoomLevel) to DB */}
          <button
            onClick={handleSaveViewState}
            disabled={isSavingViewState}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-600 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1"
            title="현재 뷰 설정(줌 비율/간격/상태필터/모드)을 개발DB에 영속화"
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

      {/* Downstream Focus Mode Active Banner */}
      {focusedCardId && focusedNodeMeta && (
        <div className="bg-indigo-950/80 border-b border-indigo-800/60 px-4 py-2 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Focus className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>
              <strong>[하위 활성화 집중 모드]</strong> 선택 카드: <code className="bg-indigo-900/60 px-1.5 py-0.5 rounded text-indigo-300 font-mono font-bold">{focusedNodeMeta.code}</code> ({focusedNodeMeta.title}) 기준으로 하위 노드만 활성화되어 있습니다.
            </span>
          </div>
          <button
            onClick={() => setFocusedCardId(null)}
            className="px-2 py-0.5 rounded bg-indigo-900 hover:bg-indigo-800 text-indigo-200 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            집중 모드 해제
          </button>
        </div>
      )}

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-8 relative bg-radial from-slate-900/40 to-slate-950"
      >
        {filteredNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-16">
            <Layers className="w-12 h-12 mb-3 text-slate-700" />
            <p className="text-sm font-semibold text-slate-300">
              {dbStatus !== 'CONNECTED' ? '조회된 결과가 없습니다. (DB 연결 점검 필요)' : '조회된 결과가 없습니다.'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {dbStatus !== 'CONNECTED'
                ? 'DB 접속이 원활하지 않아 작업 노드 목록을 조회할 수 없습니다.'
                : '상단의 계층 필터 또는 완료/진행/대기 상태 필터를 활성화해 주세요.'}
            </p>
          </div>
        ) : (
          <div
            ref={contentRef}
            className="relative transition-all duration-300 min-w-max pb-12"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
            }}
          >
            {/* SVG Connecting Curves & Arrowheads Layer (Columns Mode) */}
            {layoutMode === 'columns' && (
              <svg
                className="absolute inset-0 pointer-events-none z-0 overflow-visible w-full h-full"
                style={{ width: '100%', height: '100%' }}
              >
                <defs>
                  {/* Standard Slate Arrow */}
                  <marker
                    id="arrow-normal"
                    viewBox="0 0 10 10"
                    refX="7"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <polygon points="0 1, 9 5, 0 9" fill="#64748b" />
                  </marker>
                  {/* Active / Focused Vibrant Indigo Arrow */}
                  <marker
                    id="arrow-focused"
                    viewBox="0 0 10 10"
                    refX="7"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <polygon points="0 1, 9 5, 0 9" fill="#818cf8" />
                  </marker>
                </defs>

                {connectorLines.map((line) => {
                  const dx = line.x2 - line.x1;
                  const c1x = line.x1 + dx * 0.45;
                  const c1y = line.y1;
                  const c2x = line.x1 + dx * 0.55;
                  const c2y = line.y2;
                  const pathData = `M ${line.x1} ${line.y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${line.x2} ${line.y2}`;

                  const isDimmed = focusedCardId && !line.isFocused;

                  return (
                    <path
                      key={line.id}
                      d={pathData}
                      fill="none"
                      stroke={line.isFocused ? '#818cf8' : isDimmed ? '#1e293b' : '#475569'}
                      strokeWidth={line.isFocused ? 2.5 : isDimmed ? 1 : 1.5}
                      strokeDasharray={line.isFocused ? 'none' : '4 3'}
                      markerEnd={line.isFocused ? 'url(#arrow-focused)' : isDimmed ? undefined : 'url(#arrow-normal)'}
                      opacity={isDimmed ? 0.2 : 0.85}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
            )}

            {/* ================= MODE 1: COLUMNS VIEW (with Arrows) ================= */}
            {layoutMode === 'columns' && (
              <div
                className="flex items-start justify-center relative z-10"
                style={{ gap: `${activeSpacing}px` }}
              >
                {/* Level 1: Session Column */}
                {viewModes.session && (
                  <div className="flex flex-col gap-4 w-80 shrink-0">
                    <div className="flex items-center gap-2 pb-2 border-b border-indigo-900/50">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        세션 계층 (Session Level)
                      </h3>
                      <span className="ml-auto text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded">
                        {sessionNodes.length}건
                      </span>
                    </div>

                    {sessionNodes.map((s) => {
                      const isFocused = focusedCardId === s.id;
                      const isDimmed = Boolean(activeDownstreamIds && !activeDownstreamIds.has(s.id));

                      return (
                        <div
                          key={s.id}
                          id={`wg-card-${s.id}`}
                          onClick={() => setSelectedNode(s)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-lg hover:translate-y-[-2px] relative ${
                            isFocused
                              ? 'border-indigo-400 bg-indigo-950/60 ring-2 ring-indigo-500/40 shadow-indigo-500/20'
                              : isDimmed
                              ? 'border-slate-850 bg-slate-900/40 opacity-25 grayscale hover:opacity-70'
                              : selectedNode?.id === s.id
                              ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/20'
                              : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              {/* Downstream Focus Checkbox */}
                              <button
                                onClick={(e) => toggleFocusCard(s.id, e)}
                                className={`p-1 rounded text-xs transition-colors ${
                                  isFocused
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                                }`}
                                title={isFocused ? '하위 집중 해제' : '체크: 해당 세션 및 하위 태스크/루프만 활성화'}
                              >
                                {isFocused ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                              </button>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                                {s.code}
                              </span>
                            </div>
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
                      );
                    })}
                  </div>
                )}

                {/* Level 2: Task Column */}
                {viewModes.task && (
                  <div className="flex flex-col gap-4 w-88 shrink-0">
                    <div className="flex items-center gap-2 pb-2 border-b border-amber-900/50">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        태스크 계층 (Task Level)
                      </h3>
                      <span className="ml-auto text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded">
                        {taskNodes.length}건
                      </span>
                    </div>

                    {taskNodes.map((t) => {
                      const isFocused = focusedCardId === t.id;
                      const isDimmed = Boolean(activeDownstreamIds && !activeDownstreamIds.has(t.id));

                      return (
                        <div
                          key={t.id}
                          id={`wg-card-${t.id}`}
                          onClick={() => setSelectedNode(t)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-lg hover:translate-y-[-2px] relative ${
                            isFocused
                              ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/40 shadow-amber-500/20'
                              : isDimmed
                              ? 'border-slate-850 bg-slate-900/40 opacity-25 grayscale hover:opacity-70'
                              : selectedNode?.id === t.id
                              ? 'border-amber-500 bg-amber-950/40 ring-2 ring-amber-500/20'
                              : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              {/* Downstream Focus Checkbox */}
                              <button
                                onClick={(e) => toggleFocusCard(t.id, e)}
                                className={`p-1 rounded text-xs transition-colors ${
                                  isFocused
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                                }`}
                                title={isFocused ? '하위 집중 해제' : '체크: 해당 태스크 및 하위 루프만 활성화'}
                              >
                                {isFocused ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                              </button>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                                {t.code}
                              </span>
                            </div>
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
                      );
                    })}
                  </div>
                )}

                {/* Level 3: Loop Column */}
                {viewModes.loop && (
                  <div className="flex flex-col gap-4 w-80 shrink-0">
                    <div className="flex items-center gap-2 pb-2 border-b border-emerald-900/50">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        루프 계층 (Loop Level)
                      </h3>
                      <span className="ml-auto text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded">
                        {loopNodes.length}건
                      </span>
                    </div>

                    {loopNodes.map((l) => {
                      const isFocused = focusedCardId === l.id;
                      const isDimmed = Boolean(activeDownstreamIds && !activeDownstreamIds.has(l.id));

                      return (
                        <div
                          key={l.id}
                          id={`wg-card-${l.id}`}
                          onClick={() => setSelectedNode(l)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-lg hover:translate-y-[-2px] relative ${
                            isFocused
                              ? 'border-emerald-400 bg-emerald-950/60 ring-2 ring-emerald-500/40 shadow-emerald-500/20'
                              : isDimmed
                              ? 'border-slate-850 bg-slate-900/40 opacity-25 grayscale hover:opacity-70'
                              : selectedNode?.id === l.id
                              ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/20'
                              : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              {/* Focus Checkbox */}
                              <button
                                onClick={(e) => toggleFocusCard(l.id, e)}
                                className={`p-1 rounded text-xs transition-colors ${
                                  isFocused
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                                }`}
                                title={isFocused ? '집중 해제' : '체크: 해당 루프만 집중 활성화'}
                              >
                                {isFocused ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                              </button>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                                {l.code}
                              </span>
                            </div>
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
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= MODE 2: HIERARCHICAL GROUP VIEW (세션 > 태스크 > 루프) ================= */}
            {layoutMode === 'grouped' && (
              <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
                {nodes
                  .filter((n) => n.level === 'session')
                  .map((session) => {
                    const isSessionCollapsed = Boolean(collapsedSessions[session.id]);
                    const childTasks = nodes.filter((n) => n.level === 'task' && n.parentId === session.id);
                    const allChildLoops = nodes.filter(
                      (l) => l.level === 'loop' && childTasks.some((t) => t.id === l.parentId)
                    );

                    const isFocused = focusedCardId === session.id;
                    const isDimmed = Boolean(activeDownstreamIds && !activeDownstreamIds.has(session.id));

                    return (
                      <div
                        key={session.id}
                        className={`rounded-2xl border transition-all shadow-xl overflow-hidden ${
                          isFocused
                            ? 'border-indigo-400 bg-slate-900/90 ring-2 ring-indigo-500/40'
                            : isDimmed
                            ? 'border-slate-800 bg-slate-900/40 opacity-25 grayscale'
                            : 'border-indigo-900/60 bg-slate-900/70'
                        }`}
                      >
                        {/* Session Group Header */}
                        <div className="p-4 bg-slate-900/95 border-b border-indigo-900/40 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleSessionCollapse(session.id)}
                              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors"
                              title={isSessionCollapsed ? '세션 펼치기' : '세션 접기 (성능최적화)'}
                            >
                              {isSessionCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {/* Downstream Focus Checkbox */}
                            <button
                              onClick={(e) => toggleFocusCard(session.id, e)}
                              className={`p-1 rounded text-xs transition-colors ${
                                isFocused
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                              }`}
                              title="해당 세션 그룹 및 하위 태스크/루프만 활성화"
                            >
                              {isFocused ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                                  {session.code}
                                </span>
                                <h3 className="text-sm font-bold text-white">{session.title}</h3>
                                {getStatusBadge(session.status)}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1">
                                <span>에이전트: <strong className="text-slate-200">{session.agent || 'gemini'}</strong></span>
                                <span>|</span>
                                <span>태스크: <strong className="text-amber-300">{childTasks.length}건</strong></span>
                                <span>|</span>
                                <span>하위 루프: <strong className="text-emerald-300">{allChildLoops.length}건</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedNode(session)}
                              className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300"
                            >
                              세션 메타 상세
                            </button>
                          </div>
                        </div>

                        {/* Collapsed Performance Summary State */}
                        {isSessionCollapsed ? (
                          <div className="p-3 bg-slate-950/60 text-xs text-slate-400 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-400" />
                              세션 그룹이 접혀 있습니다. (하위 태스크 {childTasks.length}개, 루프 {allChildLoops.length}개)
                            </span>
                            <button
                              onClick={() => toggleSessionCollapse(session.id)}
                              className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                            >
                              펼쳐서 하위 그룹 보기
                            </button>
                          </div>
                        ) : (
                          /* Expanded: Nested Task Groups */
                          <div className="p-4 space-y-4 bg-slate-950/40">
                            {childTasks.map((task) => {
                              const isTaskCollapsed = Boolean(collapsedTasks[task.id]);
                              const taskLoops = nodes.filter((l) => l.level === 'loop' && l.parentId === task.id);
                              const isTaskFocused = focusedCardId === task.id;
                              const isTaskDimmed = Boolean(activeDownstreamIds && !activeDownstreamIds.has(task.id));

                              return (
                                <div
                                  key={task.id}
                                  className={`rounded-xl border transition-all ${
                                    isTaskFocused
                                      ? 'border-amber-400 bg-amber-950/30 ring-2 ring-amber-500/30'
                                      : isTaskDimmed
                                      ? 'border-slate-800 bg-slate-900/30 opacity-25 grayscale'
                                      : 'border-amber-900/40 bg-slate-900/60'
                                  }`}
                                >
                                  {/* Task Group Header */}
                                  <div className="p-3 bg-slate-900/80 border-b border-amber-900/30 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                      <button
                                        onClick={() => toggleTaskCollapse(task.id)}
                                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                                        title={isTaskCollapsed ? '태스크 펼치기' : '태스크 접기'}
                                      >
                                        {isTaskCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                      </button>

                                      {/* Task Downstream Focus Checkbox */}
                                      <button
                                        onClick={(e) => toggleFocusCard(task.id, e)}
                                        className={`p-1 rounded text-xs transition-colors ${
                                          isTaskFocused
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                                        }`}
                                        title="해당 태스크 및 하위 루프만 활성화"
                                      >
                                        {isTaskFocused ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                      </button>

                                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                                        {task.code}
                                      </span>
                                      <h4 className="text-xs font-semibold text-white">{task.title}</h4>
                                      <div className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                                        <GitBranch className="w-3 h-3" />
                                        {task.branch}
                                      </div>
                                      {getStatusBadge(task.status)}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-mono text-slate-400">
                                        루프 <strong className="text-emerald-300">{taskLoops.length}</strong>개
                                      </span>
                                      <button
                                        onClick={() => setSelectedNode(task)}
                                        className="text-xs px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
                                      >
                                        태스크 메타
                                      </button>
                                    </div>
                                  </div>

                                  {/* Task Body: Child Loop Cards */}
                                  {!isTaskCollapsed && (
                                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/50">
                                      {taskLoops.map((loop) => {
                                        const isLoopFocused = focusedCardId === loop.id;
                                        const isLoopDimmed = Boolean(activeDownstreamIds && !activeDownstreamIds.has(loop.id));

                                        return (
                                          <div
                                            key={loop.id}
                                            onClick={() => setSelectedNode(loop)}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer shadow-md hover:translate-y-[-2px] ${
                                              isLoopFocused
                                                ? 'border-emerald-400 bg-emerald-950/50 ring-2 ring-emerald-500/40'
                                                : isLoopDimmed
                                                ? 'border-slate-800 bg-slate-900/30 opacity-25 grayscale'
                                                : selectedNode?.id === loop.id
                                                ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-500/20'
                                                : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between gap-1 mb-1.5">
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={(e) => toggleFocusCard(loop.id, e)}
                                                  className={`p-0.5 rounded text-[10px] transition-colors ${
                                                    isLoopFocused
                                                      ? 'bg-emerald-600 text-white'
                                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                                                  }`}
                                                  title="루프 집중 활성화"
                                                >
                                                  {isLoopFocused ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                                                </button>
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                                                  {loop.code}
                                                </span>
                                              </div>
                                              {getStatusBadge(loop.status)}
                                            </div>

                                            <h5 className="text-xs font-semibold text-white mb-1 leading-snug line-clamp-2">
                                              {loop.title}
                                            </h5>

                                            {loop.payload?.items && Array.isArray(loop.payload.items) && (
                                              <div className="mt-1.5 pt-1.5 border-t border-slate-800 space-y-0.5">
                                                {loop.payload.items.slice(0, 3).map((item: string, idx: number) => (
                                                  <div key={idx} className="flex items-center gap-1 text-[10px] text-slate-300 truncate">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                                    <span className="truncate">{item}</span>
                                                  </div>
                                                ))}
                                                {loop.payload.items.length > 3 && (
                                                  <span className="text-[9px] text-slate-500 font-mono">
                                                    외 {loop.payload.items.length - 3}개 항목
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}

                                      {taskLoops.length === 0 && (
                                        <div className="col-span-full py-4 text-center text-slate-500 text-xs">
                                          등록된 하위 루프가 없습니다.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {childTasks.length === 0 && (
                              <div className="py-6 text-center text-slate-500 text-xs">
                                세션에 등록된 태스크가 없습니다.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Node Drawer / Inspector */}
      {selectedNode && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-indigo-400 uppercase">[{selectedNode.level}] {selectedNode.code}</span>
            <span className="text-slate-200 font-medium">{selectedNode.title}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 font-mono">시작: {new Date(selectedNode.time).toLocaleString('ko-KR')}</span>
            {selectedNode.branch && (
              <>
                <span className="text-slate-500">|</span>
                <span className="text-amber-400 font-mono">브랜치: {selectedNode.branch}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
