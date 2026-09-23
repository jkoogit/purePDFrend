import { useState, useEffect, useMemo, useRef } from 'react';
import { HarnessSession, HarnessTask, HarnessLoop, ConversationTrace } from '../../types';
import {
  Search,
  RefreshCw,
  Layers,
  GitBranch,
  Terminal,
  Code,
  CheckCircle2,
  Database,
  PlayCircle,
  Clock,
  MessageSquare,
  X,
  Send,
  Bot,
  Copy,
  Check,
  Maximize2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  List,
  ChevronLeft,
  FileText
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TaskInfoManagerProps {
  onNavigateToTrace?: (keyword: string) => void;
  dbStatus?: string;
}

type SortOrder = 'asc' | 'desc' | 'init';

export default function TaskInfoManager({ onNavigateToTrace, dbStatus = 'CONNECTED' }: TaskInfoManagerProps) {
  const [activeTab, setActiveTab] = useState<'session' | 'task' | 'loop'>('task');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sessionFilter, setSessionFilter] = useState('ALL');
  const [sessionSearchText, setSessionSearchText] = useState('');
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const sessionDropdownRef = useRef<HTMLDivElement>(null);

  const [availableSessions, setAvailableSessions] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Inline Card Expansion & Trace Step Fetching States
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
  const [expandedTraces, setExpandedTraces] = useState<Record<string, ConversationTrace[]>>({});
  const [loadingTraces, setLoadingTraces] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sessionDropdownRef.current && !sessionDropdownRef.current.contains(event.target as Node)) {
        setIsSessionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAvailableSessions = useMemo(() => {
    if (!sessionSearchText.trim()) return availableSessions;
    const q = sessionSearchText.toLowerCase();
    return availableSessions.filter(
      (s) => s.id.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q))
    );
  }, [availableSessions, sessionSearchText]);

  const toggleCardExpand = async (type: 'session' | 'task' | 'loop', id: string) => {
    const next = !expandedCardIds[id];
    setExpandedCardIds((prev) => ({ ...prev, [id]: next }));

    if (next && !expandedTraces[id]) {
      setLoadingTraces((prev) => ({ ...prev, [id]: true }));
      try {
        const params = new URLSearchParams();
        if (type === 'session') params.append('sessionId', id);
        if (type === 'task') params.append('taskId', id);
        if (type === 'loop') params.append('loopId', id);

        const res = await fetch(`/api/agent/chat/traces?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.traces)) {
          setExpandedTraces((prev) => ({ ...prev, [id]: data.traces }));
        } else {
          setExpandedTraces((prev) => ({ ...prev, [id]: [] }));
        }
      } catch {
        setExpandedTraces((prev) => ({ ...prev, [id]: [] }));
      } finally {
        setLoadingTraces((prev) => ({ ...prev, [id]: false }));
      }
    }
  };

  const [sessions, setSessions] = useState<HarnessSession[]>([]);
  const [tasks, setTasks] = useState<HarnessTask[]>([]);
  const [loops, setLoops] = useState<HarnessLoop[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // 3-state cyclic sort for tables: 'init' -> 'asc' -> 'desc' -> 'init'
  const [sessionSortField, setSessionSortField] = useState<string>('started_at');
  const [sessionSortOrder, setSessionSortOrder] = useState<SortOrder>('desc');

  const [taskSortField, setTaskSortField] = useState<string>('started_at');
  const [taskSortOrder, setTaskSortOrder] = useState<SortOrder>('desc');

  const [loopSortField, setLoopSortField] = useState<string>('started_at');
  const [loopSortOrder, setLoopSortOrder] = useState<SortOrder>('desc');

  const handleSessionSort = (field: string) => {
    if (sessionSortField !== field) {
      setSessionSortField(field);
      setSessionSortOrder('asc');
    } else {
      setSessionSortOrder(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? 'init' : 'asc');
    }
  };

  const handleTaskSort = (field: string) => {
    if (taskSortField !== field) {
      setTaskSortField(field);
      setTaskSortOrder('asc');
    } else {
      setTaskSortOrder(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? 'init' : 'asc');
    }
  };

  const handleLoopSort = (field: string) => {
    if (loopSortField !== field) {
      setLoopSortField(field);
      setLoopSortOrder('asc');
    } else {
      setLoopSortOrder(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? 'init' : 'asc');
    }
  };

  const renderSortIndicator = (currentField: string, targetField: string, currentOrder: SortOrder) => {
    if (currentField !== targetField || currentOrder === 'init') {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 inline ml-1 group-hover/th:opacity-100 transition-opacity" />;
    }
    if (currentOrder === 'asc') {
      return <ArrowUp className="w-3 h-3 text-indigo-400 inline ml-1 font-bold" />;
    }
    return <ArrowDown className="w-3 h-3 text-indigo-400 inline ml-1 font-bold" />;
  };

  // Dedicated Conversation Trace Modal Viewer States
  const [traceModalTarget, setTraceModalTarget] = useState<{
    type: '세션' | '태스크' | '루프';
    id: string;
    title: string;
    sessionId?: string;
    taskId?: string;
    loopId?: string;
  } | null>(null);
  const [modalTraces, setModalTraces] = useState<ConversationTrace[]>([]);
  const [isModalTracesLoading, setIsModalTracesLoading] = useState(false);
  const [selectedModalTrace, setSelectedModalTrace] = useState<ConversationTrace | null>(null);
  const [modalSearchKeyword, setModalSearchKeyword] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [mobileModalView, setMobileModalView] = useState<'list' | 'detail'>('list');

  const filteredModalTraces = useMemo(() => {
    if (!modalSearchKeyword.trim()) return modalTraces;
    const q = modalSearchKeyword.toLowerCase().trim();
    return modalTraces.filter(
      (t) =>
        t.user_prompt?.toLowerCase().includes(q) ||
        t.agent_response?.toLowerCase().includes(q) ||
        t.response_summary?.toLowerCase().includes(q) ||
        t.trace_id?.toLowerCase().includes(q) ||
        t.loop_id?.toLowerCase().includes(q)
    );
  }, [modalTraces, modalSearchKeyword]);

  const sortedSessions = useMemo(() => {
    if (sessionSortOrder === 'init') return sessions;
    return [...sessions].sort((a: any, b: any) => {
      let valA = a[sessionSortField] ?? '';
      let valB = b[sessionSortField] ?? '';
      if (sessionSortField === 'started_at') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sessionSortOrder === 'asc' ? valA - valB : valB - valA;
      }
      const sA = String(valA).toLowerCase();
      const sB = String(valB).toLowerCase();
      if (sA < sB) return sessionSortOrder === 'asc' ? -1 : 1;
      if (sA > sB) return sessionSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sessions, sessionSortField, sessionSortOrder]);

  const sortedTasks = useMemo(() => {
    if (taskSortOrder === 'init') return tasks;
    return [...tasks].sort((a: any, b: any) => {
      let valA = a[taskSortField] ?? '';
      let valB = b[taskSortField] ?? '';
      if (taskSortField === 'started_at') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return taskSortOrder === 'asc' ? valA - valB : valB - valA;
      }
      const sA = String(valA).toLowerCase();
      const sB = String(valB).toLowerCase();
      if (sA < sB) return taskSortOrder === 'asc' ? -1 : 1;
      if (sA > sB) return taskSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, taskSortField, taskSortOrder]);

  const sortedLoops = useMemo(() => {
    if (loopSortOrder === 'init') return loops;
    return [...loops].sort((a: any, b: any) => {
      let valA = a[loopSortField] ?? '';
      let valB = b[loopSortField] ?? '';
      if (loopSortField === 'started_at') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return loopSortOrder === 'asc' ? valA - valB : valB - valA;
      }
      const sA = String(valA).toLowerCase();
      const sB = String(valB).toLowerCase();
      if (sA < sB) return loopSortOrder === 'asc' ? -1 : 1;
      if (sA > sB) return loopSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [loops, loopSortField, loopSortOrder]);

  // Load available sessions on mount
  useEffect(() => {
    fetch('/api/agent/sessions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.sessions) {
          setAvailableSessions(
            data.sessions.map((s: any) => ({
              id: s.session_id,
              name: s.session_name,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (keyword) queryParams.append('keyword', keyword);
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
      if (sessionFilter !== 'ALL' && activeTab !== 'session') {
        queryParams.append('sessionId', sessionFilter);
      }

      if (activeTab === 'session') {
        const res = await fetch(`/api/agent/sessions?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) setSessions(data.sessions);
      } else if (activeTab === 'task') {
        const res = await fetch(`/api/agent/tasks?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) setTasks(data.tasks);
      } else {
        const res = await fetch(`/api/agent/loops?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) setLoops(data.loops);
      }
    } catch (err) {
      console.error('Failed to load task info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter, sessionFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Open Trace Modal and Fetch Traces for specific Session/Task/Loop
  const openTraceModal = async (target: {
    type: '세션' | '태스크' | '루프';
    id: string;
    title: string;
    sessionId?: string;
    taskId?: string;
    loopId?: string;
  }) => {
    setTraceModalTarget(target);
    setIsModalTracesLoading(true);
    setSelectedModalTrace(null);
    setModalSearchKeyword('');
    setMobileModalView('list');

    try {
      const params = new URLSearchParams();
      if (target.sessionId) params.append('sessionId', target.sessionId);
      if (target.taskId) params.append('taskId', target.taskId);
      if (target.loopId) params.append('loopId', target.loopId);

      const res = await fetch(`/api/agent/chat/traces?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.traces)) {
        setModalTraces(data.traces);
        if (data.traces.length > 0) {
          setSelectedModalTrace(data.traces[0]);
        }
      } else {
        setModalTraces([]);
      }
    } catch (err) {
      console.error('Failed to fetch modal traces:', err);
      setModalTraces([]);
    } finally {
      setIsModalTracesLoading(false);
    }
  };

  const handleCopy = (text: string, isPrompt: boolean) => {
    navigator.clipboard.writeText(text);
    if (isPrompt) {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = String(status || '').trim();
    const isProgress = ['처리', '진행', '진행중', '처리중', 'IN_PROGRESS', 'RUNNING'].includes(s);
    const isDone = ['완료', '정리', '승급', 'DONE', 'COMPLETED'].includes(s);

    // 공통 상태 버튼 스타일: '진행중'(3글자+아이콘) 기준 고정 너비(w-[76px])와 중앙 정렬 적용
    const baseBadgeClass = "w-[76px] shrink-0 inline-flex items-center justify-center gap-1 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap select-none";

    if (isProgress) {
      const label = (s === '처리' || s === '처리중') ? '진행중' : s;
      return (
        <span className={`${baseBadgeClass} bg-indigo-500/15 text-indigo-300 border border-indigo-500/30`}>
          <PlayCircle className="w-3 h-3 animate-pulse text-indigo-400 shrink-0" />
          <span>{label}</span>
        </span>
      );
    }

    if (isDone) {
      return (
        <span className={`${baseBadgeClass} bg-emerald-500/15 text-emerald-400 border border-emerald-500/30`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>{s}</span>
        </span>
      );
    }

    return (
      <span className={`${baseBadgeClass} bg-slate-800 text-slate-300 border border-slate-700`}>
        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
        <span>{s || '대기'}</span>
      </span>
    );
  };

  const renderInlineTraceList = (type: '세션' | '태스크' | '루프', id: string, title: string) => {
    const isExpanded = !!expandedCardIds[id];
    if (!isExpanded) return null;

    const isTraceLoading = !!loadingTraces[id];
    const traces = expandedTraces[id] || [];

    return (
      <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 bg-slate-950/70 -mx-3.5 -mb-3.5 p-3 rounded-b-xl space-y-2 animate-in fade-in duration-150">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            대화턴 실행 내역 ({traces.length}건)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">ID: {id}</span>
        </div>

        {isTraceLoading ? (
          <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>대화턴 정보를 조회하는 중...</span>
          </div>
        ) : traces.length === 0 ? (
          <div className="py-2.5 text-center text-[11px] text-slate-500 bg-slate-900/50 rounded-lg">
            기록된 대화턴이 없습니다.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar pr-1">
            {traces.map((tr, idx) => (
              <div
                key={tr.trace_id || idx}
                onClick={() => {
                  openTraceModal({
                    type,
                    id,
                    title,
                    ...(type === '세션' ? { sessionId: id } : type === '태스크' ? { taskId: id } : { loopId: id })
                  });
                  setSelectedModalTrace(tr);
                }}
                className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/90 hover:border-indigo-600/60 transition-all cursor-pointer text-left space-y-1 group"
                title="클릭하여 해당 턴의 요청/응답 전문 열람"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono font-bold text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/40">
                    Step #{idx + 1}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {tr.created_at ? new Date(tr.created_at).toLocaleTimeString('ko-KR') : ''}
                    {tr.total_tokens ? ` (${tr.total_tokens.toLocaleString()} tok)` : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-200 line-clamp-1 group-hover:text-indigo-200 transition-colors">
                  {tr.user_prompt || '프롬프트 없음'}
                </p>
                {tr.response_summary && (
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    ↳ {tr.response_summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header & Sub-Navigation */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tab switchers (모바일 가로스크롤 없는 3분할 그리드) */}
        <div className="grid grid-cols-3 gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('session')}
            className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'session'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>세션 <span className="hidden sm:inline">정보 </span>검색</span>
          </button>
          <button
            onClick={() => setActiveTab('task')}
            className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'task'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 shrink-0" />
            <span>태스크 <span className="hidden sm:inline">정보 </span>검색</span>
          </button>
          <button
            onClick={() => setActiveTab('loop')}
            className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'loop'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 shrink-0" />
            <span>루프 <span className="hidden sm:inline">정보 </span>검색</span>
          </button>
        </div>

        {/* Search & Filters (Fully Responsive Stack / Row, Optimized Width on PC) */}
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 w-full md:w-auto flex-1 md:max-w-2xl lg:justify-end">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`${activeTab === 'session' ? '세션명 또는 ID' : activeTab === 'task' ? '태스크명, 브랜치, ID' : '루프명 또는 ID'} 검색...`}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Searchable Session Combobox Filter */}
          {activeTab !== 'session' && (
            <div className="relative flex-1 sm:flex-none shrink-0" ref={sessionDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                className="w-full sm:w-auto min-w-[130px] flex items-center justify-between gap-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-indigo-300 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 font-mono hover:bg-slate-850 transition-colors whitespace-nowrap"
                title="텍스트 검색이 가능한 세션 필터"
              >
                <span className="truncate max-w-[120px]">
                  {sessionFilter === 'ALL' ? '전체 세션' : sessionFilter}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSessionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown with Text Input Search Filter */}
              {isSessionDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-slate-800 bg-slate-950">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="세션 ID 또는 이름 검색..."
                        value={sessionSearchText}
                        onChange={(e) => setSessionSearchText(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSessionFilter('ALL');
                        setIsSessionDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                        sessionFilter === 'ALL'
                          ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>전체 세션 (ALL)</span>
                      {sessionFilter === 'ALL' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                    {filteredAvailableSessions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSessionFilter(s.id);
                          setIsSessionDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                          sessionFilter === s.id
                            ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-mono font-medium text-slate-200 truncate">{s.id}</div>
                          {s.name && <div className="text-[10px] text-slate-400 truncate">{s.name}</div>}
                        </div>
                        {sessionFilter === s.id && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </button>
                    ))}
                    {filteredAvailableSessions.length === 0 && (
                      <div className="p-3 text-center text-slate-500 text-[11px]">
                        일치하는 세션이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 shrink-0"
          >
            <option value="ALL">전체 상태</option>
            <option value="시작">시작</option>
            <option value="처리">처리</option>
            <option value="정리">정리</option>
            <option value="승급">승급</option>
            <option value="완료">완료</option>
            <option value="종료">종료</option>
          </select>

          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0 whitespace-nowrap break-keep"
          >
            검색
          </button>
          <button
            type="button"
            onClick={fetchData}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors shrink-0"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* Main Content: Desktop Table (< md: hidden) + Mobile Card List (>= md: hidden) */}
      <div className="flex-1 overflow-auto relative">
        {activeTab === 'session' && (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-20 bg-slate-900 shadow-md">
                  <tr className="border-b border-slate-800 text-slate-400 select-none">
                    <th
                      onClick={() => handleSessionSort('session_id')}
                      className="p-3 w-44 font-mono cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        세션 ID{renderSortIndicator(sessionSortField, 'session_id', sessionSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleSessionSort('session_name')}
                      className="p-3 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        세션명{renderSortIndicator(sessionSortField, 'session_name', sessionSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleSessionSort('work_group')}
                      className="p-3 w-36 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        작업그룹{renderSortIndicator(sessionSortField, 'work_group', sessionSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleSessionSort('status_cd')}
                      className="p-3 w-28 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        상태{renderSortIndicator(sessionSortField, 'status_cd', sessionSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleSessionSort('ai_agent')}
                      className="p-3 w-48 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        담당 에이전트 / 모델{renderSortIndicator(sessionSortField, 'ai_agent', sessionSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleSessionSort('started_at')}
                      className="p-3 w-40 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        시작일시{renderSortIndicator(sessionSortField, 'started_at', sessionSortOrder)}
                      </span>
                    </th>
                    <th className="p-3 text-right w-44">대화턴 및 상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedSessions.map((s) => (
                    <tr key={s.session_id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 font-mono text-indigo-400 font-semibold">{s.session_id}</td>
                      <td className="p-3 font-medium text-white">{s.session_name}</td>
                      <td className="p-3 text-slate-300">{s.work_group}</td>
                      <td className="p-3">{getStatusBadge(s.status_cd)}</td>
                      <td className="p-3 text-slate-400">
                        <span className="text-slate-200">{s.ai_agent}</span> ({s.ai_model})
                      </td>
                      <td className="p-3 text-slate-400">{new Date(s.started_at).toLocaleString('ko-KR')}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              openTraceModal({
                                type: '세션',
                                id: s.session_id,
                                title: s.session_name,
                                sessionId: s.session_id,
                              })
                            }
                            className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                            title="해당 세션의 대화턴 목록 및 전문 열람"
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span>뷰어</span>
                          </button>
                          <button
                            onClick={() => setSelectedItem({ type: 'Session', data: s })}
                            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/60"
                          >
                            JSONB
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Zero Horizontal Scroll) */}
            <div className="block md:hidden p-3 space-y-3">
              {sortedSessions.map((s) => (
                <div key={s.session_id} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm space-y-2">
                  <div
                    onClick={() => toggleCardExpand('session', s.session_id)}
                    className="cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                        {s.session_id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(s.status_cd)}
                        {expandedCardIds[s.session_id] ? (
                          <ChevronUp className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white leading-snug hover:text-indigo-300 transition-colors">
                      {s.session_name}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>그룹: <strong className="text-slate-300">{s.work_group}</strong></span>
                    <span>에이전트: <strong className="text-slate-300">{s.ai_agent}</strong> ({s.ai_model})</span>
                    <span>일시: {new Date(s.started_at).toLocaleString('ko-KR')}</span>
                  </div>

                  {/* Responsive Wrap Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() =>
                        openTraceModal({
                          type: '세션',
                          id: s.session_id,
                          title: s.session_name,
                          sessionId: s.session_id,
                        })
                      }
                      className="flex-1 min-w-[80px] min-h-[36px] py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>뷰어</span>
                    </button>
                    {onNavigateToTrace && (
                      <button
                        onClick={() => onNavigateToTrace(s.session_id)}
                        className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                        title="감사 화면으로 이동"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>감사</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedItem({ type: 'Session', data: s })}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono"
                    >
                      JSONB
                    </button>
                    <button
                      onClick={() => toggleCardExpand('session', s.session_id)}
                      className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                        expandedCardIds[s.session_id]
                          ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title="대화턴 내역 접기/펼치기"
                    >
                      <span>턴 상세</span>
                      {expandedCardIds[s.session_id] ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Inline Collapsible Trace List */}
                  {renderInlineTraceList('세션', s.session_id, s.session_name)}
                </div>
              ))}
            </div>

            {sortedSessions.length === 0 && !isLoading && (
              <div className="p-8 text-center text-slate-400 text-xs">
                {dbStatus !== 'CONNECTED' ? (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Database className="w-5 h-5 text-amber-500/80 animate-pulse" />
                    <span className="font-medium text-amber-300">조회된 결과가 없습니다.</span>
                    <span className="text-[11px] text-slate-500">DB 연결 상태 확인 필요 (영속화 상태 점검필요)</span>
                  </div>
                ) : (
                  <span>{keyword ? '조회된 결과가 없습니다. (검색 조건 불일치)' : '조회된 결과가 없습니다.'}</span>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'task' && (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-20 bg-slate-900 shadow-md">
                  <tr className="border-b border-slate-800 text-slate-400 select-none">
                    <th
                      onClick={() => handleTaskSort('task_id')}
                      className="p-3 w-40 font-mono cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        태스크 ID{renderSortIndicator(taskSortField, 'task_id', taskSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleTaskSort('task_name')}
                      className="p-3 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        태스크명{renderSortIndicator(taskSortField, 'task_name', taskSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleTaskSort('session_id')}
                      className="p-3 w-40 font-mono cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        연결 세션{renderSortIndicator(taskSortField, 'session_id', taskSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleTaskSort('git_branch')}
                      className="p-3 w-40 font-mono cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        작업 브랜치{renderSortIndicator(taskSortField, 'git_branch', taskSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleTaskSort('status_cd')}
                      className="p-3 w-28 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        상태{renderSortIndicator(taskSortField, 'status_cd', taskSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleTaskSort('started_at')}
                      className="p-3 w-40 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        시작일시{renderSortIndicator(taskSortField, 'started_at', taskSortOrder)}
                      </span>
                    </th>
                    <th className="p-3 text-right w-44">대화턴 및 상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedTasks.map((t) => (
                    <tr key={t.task_id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 font-mono text-indigo-300 font-semibold">{t.task_id}</td>
                      <td className="p-3 font-medium text-white">{t.task_name}</td>
                      <td className="p-3 font-mono text-slate-400 text-[11px]">{t.session_id}</td>
                      <td className="p-3 font-mono text-slate-300 text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <GitBranch className="w-3 h-3 text-indigo-400" />
                          {t.git_branch}
                        </span>
                      </td>
                      <td className="p-3">{getStatusBadge(t.status_cd)}</td>
                      <td className="p-3 text-slate-400">{new Date(t.started_at).toLocaleString('ko-KR')}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              openTraceModal({
                                type: '태스크',
                                id: t.task_id,
                                title: t.task_name,
                                taskId: t.task_id,
                              })
                            }
                            className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                            title="해당 태스크의 대화턴 목록 및 전문 열람"
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span>뷰어</span>
                          </button>
                          <button
                            onClick={() => setSelectedItem({ type: 'Task', data: t })}
                            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/60"
                          >
                            JSONB
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden p-3 space-y-3">
              {sortedTasks.map((t) => (
                <div key={t.task_id} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm space-y-2">
                  <div
                    onClick={() => toggleCardExpand('task', t.task_id)}
                    className="cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                        {t.task_id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(t.status_cd)}
                        {expandedCardIds[t.task_id] ? (
                          <ChevronUp className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white leading-snug hover:text-indigo-300 transition-colors">
                      {t.task_name}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>세션: <strong className="font-mono text-slate-300">{t.session_id}</strong></span>
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-indigo-400" />
                      <strong className="font-mono text-slate-300">{t.git_branch}</strong>
                    </span>
                    <span>시작: {new Date(t.started_at).toLocaleString('ko-KR')}</span>
                  </div>

                  {/* Responsive Wrap Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() =>
                        openTraceModal({
                          type: '태스크',
                          id: t.task_id,
                          title: t.task_name,
                          taskId: t.task_id,
                        })
                      }
                      className="flex-1 min-w-[80px] min-h-[36px] py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>뷰어</span>
                    </button>
                    {onNavigateToTrace && (
                      <button
                        onClick={() => onNavigateToTrace(t.task_id)}
                        className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                        title="감사 화면으로 이동"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>감사</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedItem({ type: 'Task', data: t })}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono"
                    >
                      JSONB
                    </button>
                    <button
                      onClick={() => toggleCardExpand('task', t.task_id)}
                      className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                        expandedCardIds[t.task_id]
                          ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title="대화턴 내역 접기/펼치기"
                    >
                      <span>턴 상세</span>
                      {expandedCardIds[t.task_id] ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Inline Collapsible Trace List */}
                  {renderInlineTraceList('태스크', t.task_id, t.task_name)}
                </div>
              ))}
            </div>

            {sortedTasks.length === 0 && !isLoading && (
              <div className="p-8 text-center text-slate-400 text-xs">
                {dbStatus !== 'CONNECTED' ? (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Database className="w-5 h-5 text-amber-500/80 animate-pulse" />
                    <span className="font-medium text-amber-300">조회된 결과가 없습니다.</span>
                    <span className="text-[11px] text-slate-500">DB 연결 상태 확인 필요 (영속화 상태 점검필요)</span>
                  </div>
                ) : (
                  <span>{keyword ? '조회된 결과가 없습니다. (검색 조건 불일치)' : '조회된 결과가 없습니다.'}</span>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'loop' && (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-20 bg-slate-900 shadow-md">
                  <tr className="border-b border-slate-800 text-slate-400 select-none">
                    <th
                      onClick={() => handleLoopSort('loop_id')}
                      className="p-3 w-40 font-mono cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        루프 ID{renderSortIndicator(loopSortField, 'loop_id', loopSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleLoopSort('loop_name')}
                      className="p-3 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        루프명{renderSortIndicator(loopSortField, 'loop_name', loopSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleLoopSort('task_id')}
                      className="p-3 w-40 font-mono cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        연결 태스크{renderSortIndicator(loopSortField, 'task_id', loopSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleLoopSort('status_cd')}
                      className="p-3 w-28 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        상태{renderSortIndicator(loopSortField, 'status_cd', loopSortOrder)}
                      </span>
                    </th>
                    <th
                      onClick={() => handleLoopSort('started_at')}
                      className="p-3 w-40 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                    >
                      <span className="inline-flex items-center">
                        시작일시{renderSortIndicator(loopSortField, 'started_at', loopSortOrder)}
                      </span>
                    </th>
                    <th className="p-3 text-right w-44">대화턴 및 상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedLoops.map((l) => (
                    <tr key={l.loop_id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 font-mono text-indigo-300 font-semibold">{l.loop_id}</td>
                      <td className="p-3 font-medium text-white">{l.loop_name}</td>
                      <td className="p-3 font-mono text-slate-400 text-[11px]">{l.task_id}</td>
                      <td className="p-3">{getStatusBadge(l.status_cd)}</td>
                      <td className="p-3 text-slate-400">{new Date(l.started_at).toLocaleString('ko-KR')}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              openTraceModal({
                                type: '루프',
                                id: l.loop_id,
                                title: l.loop_name,
                                loopId: l.loop_id,
                              })
                            }
                            className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                            title="해당 루프의 대화턴 목록 및 전문 열람"
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span>뷰어</span>
                          </button>
                          <button
                            onClick={() => setSelectedItem({ type: 'Loop', data: l })}
                            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/60"
                          >
                            JSONB
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden p-3 space-y-3">
              {sortedLoops.map((l) => (
                <div key={l.loop_id} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm space-y-2">
                  <div
                    onClick={() => toggleCardExpand('loop', l.loop_id)}
                    className="cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                        {l.loop_id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(l.status_cd)}
                        {expandedCardIds[l.loop_id] ? (
                          <ChevronUp className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white leading-snug hover:text-indigo-300 transition-colors">
                      {l.loop_name}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>태스크: <strong className="font-mono text-slate-300">{l.task_id}</strong></span>
                    <span>시작: {new Date(l.started_at).toLocaleString('ko-KR')}</span>
                  </div>

                  {/* Responsive Wrap Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() =>
                        openTraceModal({
                          type: '루프',
                          id: l.loop_id,
                          title: l.loop_name,
                          loopId: l.loop_id,
                        })
                      }
                      className="flex-1 min-w-[80px] min-h-[36px] py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>뷰어</span>
                    </button>
                    {onNavigateToTrace && (
                      <button
                        onClick={() => onNavigateToTrace(l.loop_id)}
                        className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                        title="감사 화면으로 이동"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>감사</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedItem({ type: 'Loop', data: l })}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono"
                    >
                      JSONB
                    </button>
                    <button
                      onClick={() => toggleCardExpand('loop', l.loop_id)}
                      className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                        expandedCardIds[l.loop_id]
                          ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title="대화턴 내역 접기/펼치기"
                    >
                      <span>턴 상세</span>
                      {expandedCardIds[l.loop_id] ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Inline Collapsible Trace List */}
                  {renderInlineTraceList('루프', l.loop_id, l.loop_name)}
                </div>
              ))}
            </div>

            {sortedLoops.length === 0 && !isLoading && (
              <div className="p-8 text-center text-slate-400 text-xs">
                {dbStatus !== 'CONNECTED' ? (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Database className="w-5 h-5 text-amber-500/80 animate-pulse" />
                    <span className="font-medium text-amber-300">조회된 결과가 없습니다.</span>
                    <span className="text-[11px] text-slate-500">DB 연결 상태 확인 필요 (영속화 상태 점검필요)</span>
                  </div>
                ) : (
                  <span>{keyword ? '조회된 결과가 없습니다. (검색 조건 불일치)' : '조회된 결과가 없습니다.'}</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* JSONB Inspector Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-3.5 sm:p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <Code className="w-4 h-4 text-indigo-400 shrink-0" />
                <h3 className="text-sm font-semibold text-white truncate">
                  {selectedItem.type} 메타데이터 & 감사 정보
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 text-xs shrink-0"
              >
                닫기
              </button>
            </div>
            <div className="p-3.5 sm:p-4 overflow-auto flex-1 font-mono text-xs text-emerald-400 bg-slate-950">
              <pre className="whitespace-pre-wrap break-all">{JSON.stringify(selectedItem.data, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Conversation Trace Modal Viewer with Split-Pane & Markdown Renderer */}
      {traceModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 md:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[92vh] sm:h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-sm font-bold text-white truncate">
                      대화턴 목록 및 요청/응답 전문 뷰어
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono shrink-0">
                      {traceModalTarget.type}: {traceModalTarget.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {traceModalTarget.title} ({modalTraces.length}개의 대화 턴 매핑됨)
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
                {onNavigateToTrace && (
                  <button
                    onClick={() => {
                      const id = traceModalTarget.id;
                      setTraceModalTarget(null);
                      onNavigateToTrace(id);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    title="전체 감사 화면으로 이동"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>감사 화면으로 이동</span>
                  </button>
                )}
                <button
                  onClick={() => setTraceModalTarget(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Tab Switcher (Visible only on < md screens) */}
            <div className="flex md:hidden items-center p-2 border-b border-slate-800 bg-slate-950/90 gap-2 shrink-0">
              <button
                onClick={() => setMobileModalView('list')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mobileModalView === 'list'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>턴 목록 ({filteredModalTraces.length})</span>
              </button>
              <button
                onClick={() => setMobileModalView('detail')}
                disabled={!selectedModalTrace}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mobileModalView === 'detail'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 disabled:opacity-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>전문 뷰어 {selectedModalTrace ? `#${selectedModalTrace.step_index}` : ''}</span>
              </button>
            </div>

            {/* Modal Body: Split-pane (Left: Trace List, Right: Request/Response Full Markdown Viewer) */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Pane: Turn List (Hidden on mobile if detail view is active) */}
              <div className={`${
                mobileModalView === 'detail' ? 'hidden md:flex' : 'flex'
              } w-full md:w-80 lg:w-96 md:border-r border-slate-800 flex-col bg-slate-950/60 overflow-hidden`}>
                <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400 font-semibold shrink-0">
                  <span>대화 턴 목록 ({filteredModalTraces.length}/{modalTraces.length}건)</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    step_index 순차
                  </span>
                </div>

                {/* Turn Search Filter Box */}
                <div className="p-2 border-b border-slate-800/60 bg-slate-900/40 shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={modalSearchKeyword}
                      onChange={(e) => setModalSearchKeyword(e.target.value)}
                      placeholder="요청/응답 전문 검색..."
                      className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {modalSearchKeyword && (
                      <button
                        onClick={() => setModalSearchKeyword('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2 space-y-1">
                  {isModalTracesLoading && (
                    <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      대화턴 로딩중...
                    </div>
                  )}

                  {!isModalTracesLoading && filteredModalTraces.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-500">
                      {modalSearchKeyword
                        ? `'${modalSearchKeyword}' 검색어와 일치하는 대화 턴이 없습니다.`
                        : `해당 ${traceModalTarget.type}에 매속된 대화 턴이 없습니다.`}
                    </div>
                  )}

                  {filteredModalTraces.map((trace) => {
                    const isSelected = selectedModalTrace?.trace_id === trace.trace_id;
                    return (
                      <div
                        key={trace.trace_id}
                        onClick={() => {
                          setSelectedModalTrace(trace);
                          setMobileModalView('detail');
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                            : 'hover:bg-slate-800/40 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-mono text-[11px] font-bold">
                              Step #{trace.step_index}
                            </span>
                            {trace.loop_id && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 font-mono text-[10px]">
                                {trace.loop_id}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                            {new Date(trace.created_at).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="text-xs font-medium text-slate-200 line-clamp-1 mb-1">
                          {trace.user_prompt || '(요청 없음)'}
                        </div>

                        <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {trace.response_summary || trace.agent_response || '(응답 없음)'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Pane: Request & Response Full Text / Markdown Viewer (Hidden on mobile if list view is active) */}
              <div className={`${
                mobileModalView === 'list' ? 'hidden md:flex' : 'flex'
              } flex-1 flex-col bg-slate-900/40 overflow-hidden`}>
                {selectedModalTrace ? (
                  <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Mobile Back-to-List Quick Navigation */}
                    <div className="flex md:hidden items-center justify-between pb-1">
                      <button
                        onClick={() => setMobileModalView('list')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/40"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>턴 목록으로 돌아가기</span>
                      </button>
                      <span className="text-xs font-mono text-slate-400">
                        Step #{selectedModalTrace.step_index}
                      </span>
                    </div>

                    {/* Turn Metadata Header */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="px-2.5 py-1 rounded-md bg-indigo-600 text-white font-mono font-bold text-xs shrink-0">
                          Step #{selectedModalTrace.step_index}
                        </span>
                        <div className="font-mono text-xs text-slate-300">
                          <span className="text-slate-500">Trace:</span> {selectedModalTrace.trace_id}
                        </div>
                        {selectedModalTrace.loop_id && (
                          <div className="font-mono text-xs text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 shrink-0">
                            루프: {selectedModalTrace.loop_id}
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-400 shrink-0">
                        {selectedModalTrace.model_name} (@{selectedModalTrace.agent_name})
                      </div>
                    </div>

                    {/* 1. User Prompt Section */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-sm">
                      <div className="p-3 border-b border-slate-800/80 bg-slate-900/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                          <Send className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>사용자 요청 전문 (User Prompt)</span>
                        </div>
                        <button
                          onClick={() => handleCopy(selectedModalTrace.user_prompt, true)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 transition-colors shrink-0"
                        >
                          {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPrompt ? '복사됨' : '프롬프트 복사'}</span>
                        </button>
                      </div>
                      <div className="p-3.5 sm:p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto break-words">
                        {selectedModalTrace.user_prompt || '(요청 없음)'}
                      </div>
                    </div>

                    {/* 2. Response Summary Section */}
                    {selectedModalTrace.response_summary && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-wrap sm:flex-nowrap items-start gap-2 sm:gap-2.5">
                        <span className="font-bold text-amber-400 whitespace-nowrap shrink-0">응답 본문 요약:</span>
                        <span className="leading-relaxed">{selectedModalTrace.response_summary}</span>
                      </div>
                    )}

                    {/* 3. Agent Response Full Markdown Section */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-sm">
                      <div className="p-3 border-b border-slate-800/80 bg-slate-900/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                          <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>에이전트 응답 전문 (Full Markdown Viewer)</span>
                        </div>
                        <button
                          onClick={() => handleCopy(selectedModalTrace.agent_response, false)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 transition-colors shrink-0"
                        >
                          {copiedResponse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedResponse ? '복사됨' : '응답 전문 복사'}</span>
                        </button>
                      </div>
                      <div className="p-3.5 sm:p-5 text-xs text-slate-200 leading-relaxed overflow-x-auto">
                        <div className="prose prose-invert prose-xs max-w-none break-words prose-headings:text-slate-100 prose-headings:font-bold prose-h1:text-base prose-h2:text-sm prose-h3:text-xs prose-p:leading-relaxed prose-table:border-collapse prose-table:w-full prose-th:bg-slate-900 prose-th:p-2 prose-th:border prose-th:border-slate-800 prose-td:p-2 prose-td:border prose-td:border-slate-800/80 prose-code:bg-slate-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-amber-300 prose-code:before:content-none prose-code:after:content-none">
                          <Markdown remarkPlugins={[remarkGfm]}>
                            {selectedModalTrace.agent_response || '(응답 전문 없음)'}
                          </Markdown>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-6 text-slate-500 text-xs text-center">
                    좌측 목록에서 대화 턴을 선택하면 요청 및 응답 전문 마크다운이 표시됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

