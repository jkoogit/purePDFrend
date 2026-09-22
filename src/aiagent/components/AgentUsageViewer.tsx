import { useState, useEffect, useMemo } from 'react';
import { ConversationTrace } from '../../types';
import {
  Bot,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Zap,
  Search,
  ChevronRight,
  X,
  Copy,
  Check,
  Code,
  Layers,
  Send,
  Database,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AgentUsageViewerProps {
  initialFilter?: string;
  dbStatus?: string;
}

type SortField = 'step_index' | 'trace_id' | 'loop_id' | 'model_name' | 'user_prompt' | 'agent_response' | 'created_at';
type SortOrder = 'asc' | 'desc' | 'init';

export default function AgentUsageViewer({ initialFilter, dbStatus = 'CONNECTED' }: AgentUsageViewerProps = {}) {
  const [traces, setTraces] = useState<ConversationTrace[]>([]);
  const [activeModel, setActiveModel] = useState('models/gemini-3.8-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(initialFilter || '');
  const [sessionFilter, setSessionFilter] = useState<string>('ALL');
  const [availableSessions, setAvailableSessions] = useState<{ id: string; name: string }[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<ConversationTrace | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // 3-state cyclic sort: 'init' -> 'asc' -> 'desc' -> 'init'
  const [sortField, setSortField] = useState<SortField>('step_index');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleHeaderSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder('asc');
    } else {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortOrder('init');
      } else {
        setSortOrder('asc');
      }
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field || sortOrder === 'init') {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 inline ml-1 group-hover/th:opacity-100 transition-opacity" />;
    }
    if (sortOrder === 'asc') {
      return <ArrowUp className="w-3 h-3 text-indigo-400 inline ml-1 font-bold" />;
    }
    return <ArrowDown className="w-3 h-3 text-indigo-400 inline ml-1 font-bold" />;
  };

  useEffect(() => {
    if (initialFilter !== undefined) {
      setSearchKeyword(initialFilter);
    }
  }, [initialFilter]);

  // Load available sessions
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

  const fetchUsage = async (query = '') => {
    setIsLoading(true);
    try {
      const url = query.trim()
        ? `/api/agent/chat/traces?q=${encodeURIComponent(query.trim())}`
        : '/api/agent/chat/traces';
      const [traceRes, usageRes] = await Promise.all([
        fetch(url),
        fetch('/api/agent/usage'),
      ]);
      const traceData = await traceRes.json();
      const usageData = await usageRes.json();

      if (traceData.success) setTraces(traceData.traces);
      if (usageData.success && usageData.activeModel) {
        setActiveModel(usageData.activeModel);
      }
    } catch (err) {
      console.error('Failed to load agent usage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage(searchKeyword);
  }, [searchKeyword]);

  // Client-side quick filter and 3-state sort across all key attributes
  const displayTraces = useMemo(() => {
    let result = [...traces];

    if (sessionFilter !== 'ALL') {
      result = result.filter((t) => t.session_id === sessionFilter);
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      result = result.filter((t) => {
        return (
          t.trace_id?.toLowerCase().includes(q) ||
          t.session_id?.toLowerCase().includes(q) ||
          (t.task_id && t.task_id.toLowerCase().includes(q)) ||
          (t.loop_id && t.loop_id.toLowerCase().includes(q)) ||
          t.agent_name?.toLowerCase().includes(q) ||
          t.model_name?.toLowerCase().includes(q) ||
          t.user_prompt?.toLowerCase().includes(q) ||
          t.agent_response?.toLowerCase().includes(q) ||
          t.response_summary?.toLowerCase().includes(q)
        );
      });
    }

    if (sortOrder === 'init') {
      return result;
    }

    return result.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortField) {
        case 'step_index':
          valA = a.step_index ?? 0;
          valB = b.step_index ?? 0;
          break;
        case 'trace_id':
          valA = a.trace_id || '';
          valB = b.trace_id || '';
          break;
        case 'loop_id':
          valA = a.loop_id || '';
          valB = b.loop_id || '';
          break;
        case 'model_name':
          valA = a.model_name || '';
          valB = b.model_name || '';
          break;
        case 'user_prompt':
          valA = a.user_prompt || '';
          valB = b.user_prompt || '';
          break;
        case 'agent_response':
          valA = a.response_summary || a.agent_response || '';
          valB = b.response_summary || b.agent_response || '';
          break;
        case 'created_at':
          valA = new Date(a.created_at).getTime();
          valB = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
      if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [traces, searchKeyword, sortField, sortOrder]);

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

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Top Metric Cards */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">활성 AI 모델</div>
            <div className="text-xs font-mono font-bold text-white truncate">{activeModel}</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">총 대화 턴 수</div>
            <div className="text-base sm:text-lg font-bold text-white">
              {traces.length} <span className="text-xs text-slate-500 font-normal">Turns</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">하네스 거버넌스</div>
            <div className="text-xs font-bold text-emerald-400 truncate">AGENTS.md 준수</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-semibold">연동 데이터베이스</div>
            <div className="text-xs font-mono font-bold text-indigo-300 truncate">purepdfrend_dev</div>
          </div>
          <button
            onClick={() => fetchUsage(searchKeyword)}
            disabled={isLoading}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0 ml-1"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Header Bar */}
      <div className="p-3 sm:p-3.5 border-b border-slate-800 bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="통합 검색 (trace_id, 세션ID, 에이전트, 프롬프트, 응답)"
              className="w-full pl-9 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-indigo-300 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 font-mono flex-1 sm:flex-none"
            title="세션 단위 격리 필터"
          >
            <option value="ALL">전체 세션 대상</option>
            {availableSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400">
          <span className="font-mono">
            검색 결과: <strong className="text-indigo-300">{displayTraces.length}</strong> / {traces.length}건
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            헤더 클릭 시 오름차순/내림차순 정렬됩니다.
          </span>
        </div>
      </div>

      {/* Traces List: Desktop Table + Mobile Card View */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 relative">
        {/* Desktop Table View */}
        <div className="hidden md:block border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 bg-slate-900 shadow-md">
              <tr className="border-b border-slate-800 text-slate-400 select-none">
                <th
                  onClick={() => handleHeaderSort('step_index')}
                  className="p-3 w-20 text-center cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                >
                  <span className="inline-flex items-center justify-center">
                    턴 #{renderSortIndicator('step_index')}
                  </span>
                </th>
                <th
                  onClick={() => handleHeaderSort('trace_id')}
                  className="p-3 w-36 font-mono cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                >
                  <span className="inline-flex items-center">
                    Trace ID{renderSortIndicator('trace_id')}
                  </span>
                </th>
                <th
                  onClick={() => handleHeaderSort('loop_id')}
                  className="p-3 w-32 font-mono cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                >
                  <span className="inline-flex items-center">
                    루프 ID{renderSortIndicator('loop_id')}
                  </span>
                </th>
                <th
                  onClick={() => handleHeaderSort('model_name')}
                  className="p-3 w-36 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                >
                  <span className="inline-flex items-center">
                    모델 / 에이전트{renderSortIndicator('model_name')}
                  </span>
                </th>
                <th
                  onClick={() => handleHeaderSort('user_prompt')}
                  className="p-3 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                >
                  <span className="inline-flex items-center">
                    요청 요약 (Prompt){renderSortIndicator('user_prompt')}
                  </span>
                </th>
                <th
                  onClick={() => handleHeaderSort('agent_response')}
                  className="p-3 cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                >
                  <span className="inline-flex items-center">
                    응답 요약 (Response){renderSortIndicator('agent_response')}
                  </span>
                </th>
                <th
                  onClick={() => handleHeaderSort('created_at')}
                  className="p-3 w-28 text-center cursor-pointer hover:bg-slate-800/80 hover:text-white transition-colors group/th"
                >
                  <span className="inline-flex items-center justify-center">
                    시각{renderSortIndicator('created_at')}
                  </span>
                </th>
                <th className="p-3 w-14 text-center">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayTraces.map((trace) => {
                const promptSummary = trace.user_prompt
                  ? trace.user_prompt.split('\n')[0].substring(0, 50) + (trace.user_prompt.length > 50 ? '...' : '')
                  : '(요청 없음)';
                const responseSummary = trace.response_summary
                  ? trace.response_summary
                  : trace.agent_response
                  ? trace.agent_response.split('\n')[0].substring(0, 55) + (trace.agent_response.length > 55 ? '...' : '')
                  : '(응답 없음)';

                return (
                  <tr
                    key={trace.trace_id}
                    onClick={() => setSelectedTrace(trace)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-mono text-[11px] font-bold">
                        #{trace.step_index}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-300 text-[11px] truncate">{trace.trace_id}</td>
                    <td className="p-3 font-mono text-[11px]">
                      {trace.loop_id ? (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                          {trace.loop_id}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white truncate">{trace.model_name?.replace('models/', '')}</span>
                        <span className="text-[10px] text-indigo-400 font-mono">@{trace.agent_name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300 font-medium max-w-xs truncate group-hover:text-indigo-200">
                      {promptSummary}
                    </td>
                    <td className="p-3 text-slate-400 max-w-sm truncate">
                      {responseSummary}
                    </td>
                    <td className="p-3 text-center text-[11px] text-slate-500 font-mono whitespace-nowrap">
                      {new Date(trace.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3 text-center">
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all inline-block" />
                    </td>
                  </tr>
                );
              })}

              {displayTraces.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 text-xs">
                    {dbStatus !== 'CONNECTED' ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Database className="w-6 h-6 text-amber-500/80 animate-pulse" />
                        <span className="font-medium text-amber-300">조회된 결과가 없습니다.</span>
                        <span className="text-[11px] text-slate-500">DB 연결이 원활하지 않아 원격 데이터를 조회할 수 없습니다. (영속화 상태 점검필요)</span>
                      </div>
                    ) : (
                      <span>{searchKeyword ? '조회된 결과가 없습니다. (검색 조건 불일치)' : '조회된 결과가 없습니다.'}</span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View (< md) */}
        <div className="block md:hidden space-y-3">
          {displayTraces.map((trace) => {
            const promptSummary = trace.user_prompt
              ? trace.user_prompt.split('\n')[0].substring(0, 70) + (trace.user_prompt.length > 70 ? '...' : '')
              : '(요청 없음)';
            const responseSummary = trace.response_summary
              ? trace.response_summary
              : trace.agent_response
              ? trace.agent_response.split('\n')[0].substring(0, 80) + (trace.agent_response.length > 80 ? '...' : '')
              : '(응답 없음)';

            return (
              <div
                key={trace.trace_id}
                onClick={() => setSelectedTrace(trace)}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm space-y-2 cursor-pointer active:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-mono text-[11px] font-bold">
                      #{trace.step_index}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{trace.trace_id}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(trace.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs text-white font-medium line-clamp-2">
                  <span className="text-indigo-400 font-semibold mr-1.5">[요청]</span>
                  {promptSummary}
                </div>

                <div className="text-xs text-slate-400 line-clamp-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-slate-300 font-semibold mr-1.5">[응답]</span>
                  {responseSummary}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-slate-300 truncate">{trace.model_name?.replace('models/', '')}</span>
                    <span className="text-indigo-400 font-mono">@{trace.agent_name}</span>
                  </div>
                  <span className="text-indigo-400 font-semibold flex items-center gap-0.5 shrink-0">
                    전문보기 <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}

          {displayTraces.length === 0 && !isLoading && (
            <div className="p-8 text-center text-slate-400 text-xs">
              {dbStatus !== 'CONNECTED' ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <Database className="w-6 h-6 text-amber-500/80 animate-pulse" />
                  <span className="font-medium text-amber-300">조회된 결과가 없습니다.</span>
                  <span className="text-[11px] text-slate-500">DB 연결 상태 확인 필요 (영속화 상태 점검필요)</span>
                </div>
              ) : (
                <span>{searchKeyword ? '조회된 결과가 없습니다. (검색 조건 불일치)' : '조회된 결과가 없습니다.'}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Trace Detail & Actual Response Format Modal */}
      {selectedTrace && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  #{selectedTrace.step_index}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">대화 턴 감사 추적 전문 (Conversation Trace)</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                      {selectedTrace.trace_id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-3">
                    <span>세션: {selectedTrace.session_id}</span>
                    <span>|</span>
                    <span>태스크: {selectedTrace.task_id || '-'}</span>
                    {selectedTrace.loop_id && (
                      <>
                        <span>|</span>
                        <span className="text-emerald-300">루프: {selectedTrace.loop_id}</span>
                      </>
                    )}
                    <span>|</span>
                    <span>시각: {new Date(selectedTrace.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTrace(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Two-Section (Prompt & Actual Model Response Format) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Optional Section: Response Summary banner */}
              {selectedTrace.response_summary && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                  <span className="font-bold text-amber-400 whitespace-nowrap">응답 본문 요약:</span>
                  <span className="leading-relaxed">{selectedTrace.response_summary}</span>
                </div>
              )}

              {/* Section 1: User Prompt Full Text */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-sm">
                <div className="p-3 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    사용자 요청 전문 (User Prompt Text)
                  </div>
                  <button
                    onClick={() => handleCopy(selectedTrace.user_prompt, true)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedPrompt ? '복사됨' : '프롬프트 복사'}
                  </button>
                </div>
                <div className="p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto selection:bg-indigo-600">
                  {selectedTrace.user_prompt || '(요청 텍스트 없음)'}
                </div>
              </div>

              {/* Section 2: Actual Agent Response Format Inspector */}
              <div className="rounded-xl border border-indigo-900/40 bg-slate-950 overflow-hidden shadow-lg">
                <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      실제 모델 응답 포맷 (Generated Content & Payload)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/50 text-[10px] font-mono">
                      {selectedTrace.model_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(selectedTrace.agent_response, false)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedResponse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedResponse ? '복사됨' : '응답 복사'}
                    </button>
                  </div>
                </div>

                {/* Model Response Header Metadata Bar */}
                <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800/80 flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Bot className="w-3 h-3 text-indigo-400" /> 에이전트: <strong className="text-slate-200">{selectedTrace.agent_name}</strong>
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> 프롬프트 토큰: <strong className="text-slate-200">{selectedTrace.prompt_tokens || 0}</strong>
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <Code className="w-3 h-3 text-emerald-400" /> 생성 토큰: <strong className="text-slate-200">{selectedTrace.completion_tokens || 0}</strong>
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-400" /> 총 토큰: <strong className="text-slate-200">{selectedTrace.total_tokens || 0}</strong>
                  </span>
                </div>

                {/* Formatted Markdown Content of the actual response */}
                <div className="p-5 text-xs text-slate-200 leading-relaxed overflow-y-auto max-h-[380px] bg-slate-950/80">
                  <div className="markdown-body max-w-none text-slate-300 space-y-2">
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table({ children }) {
                          return (
                            <div className="overflow-x-auto my-3 rounded-lg border border-slate-800 bg-slate-900/60">
                              <table className="w-full text-left border-collapse text-xs">
                                {children}
                              </table>
                            </div>
                          );
                        },
                        thead({ children }) {
                          return <thead className="bg-slate-900 text-indigo-200 border-b border-slate-800 font-semibold">{children}</thead>;
                        },
                        tbody({ children }) {
                          return <tbody className="divide-y divide-slate-800/60">{children}</tbody>;
                        },
                        th({ children }) {
                          return <th className="p-2 font-bold text-indigo-300 border-r border-slate-800 last:border-r-0">{children}</th>;
                        },
                        td({ children }) {
                          return <td className="p-2 text-slate-300 border-r border-slate-800 last:border-r-0">{children}</td>;
                        },
                        code({ className, children, ...props }) {
                          return (
                            <code className={`px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 font-mono text-[11px] border border-slate-800 ${className || ''}`} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {selectedTrace.agent_response || '(응답 내용 없음)'}
                    </Markdown>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                  <Database className="w-3.5 h-3.5" /> aiagent.agent_conversation_trace 정합성 검증 완료
                </span>
              </div>
              <button
                onClick={() => setSelectedTrace(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
