import { useState, useEffect } from 'react';
import { HarnessSession, HarnessTask, HarnessLoop } from '../types';
import { Search, RefreshCw, Layers, GitBranch, Terminal, Code, CheckCircle2, PlayCircle, Clock } from 'lucide-react';

export default function TaskInfoManager() {
  const [activeTab, setActiveTab] = useState<'session' | 'task' | 'loop'>('task');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const [sessions, setSessions] = useState<HarnessSession[]>([]);
  const [tasks, setTasks] = useState<HarnessTask[]>([]);
  const [loops, setLoops] = useState<HarnessLoop[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (keyword) queryParams.append('keyword', keyword);
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);

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
  }, [activeTab, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '처리':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <PlayCircle className="w-3 h-3 animate-pulse" /> 처리중
          </span>
        );
      case '정리':
      case '승급':
      case '완료':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Clock className="w-3 h-3" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header & Sub-Navigation */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
        {/* Tab switchers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('session')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'session'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            세션 정보 검색
          </button>
          <button
            onClick={() => setActiveTab('task')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'task'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            태스크 정보 검색
          </button>
          <button
            onClick={() => setActiveTab('loop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'loop'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            루프 정보 검색
          </button>
        </div>

        {/* Search & Filters */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`${activeTab === 'session' ? '세션명 또는 ID' : activeTab === 'task' ? '태스크명, 브랜치, ID' : '루프명 또는 ID'} 검색...`}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 py-1.5 px-3 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">전체 상태</option>
            <option value="시작">시작</option>
            <option value="처리">처리</option>
            <option value="정리">정리</option>
            <option value="승급">승급</option>
            <option value="종료">종료</option>
          </select>

          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            검색
          </button>
          <button
            type="button"
            onClick={fetchData}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'session' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400">
                <th className="p-3">세션 ID</th>
                <th className="p-3">세션명</th>
                <th className="p-3">작업그룹</th>
                <th className="p-3">상태</th>
                <th className="p-3">담당 에이전트 / 모델</th>
                <th className="p-3">시작일시</th>
                <th className="p-3 text-right">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sessions.map((s) => (
                <tr key={s.session_id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-mono text-indigo-400">{s.session_id}</td>
                  <td className="p-3 font-medium text-white">{s.session_name}</td>
                  <td className="p-3 text-slate-300">{s.work_group}</td>
                  <td className="p-3">{getStatusBadge(s.status_cd)}</td>
                  <td className="p-3 text-slate-400">
                    <span className="text-slate-200">{s.ai_agent}</span> ({s.ai_model})
                  </td>
                  <td className="p-3 text-slate-400">{new Date(s.started_at).toLocaleString('ko-KR')}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedItem({ type: 'Session', data: s })}
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                    >
                      JSONB 보기
                    </button>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    검색 조건과 일치하는 세션 정보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'task' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400">
                <th className="p-3">태스크 ID</th>
                <th className="p-3">태스크명</th>
                <th className="p-3">연결 세션</th>
                <th className="p-3">작업 브랜치</th>
                <th className="p-3">상태</th>
                <th className="p-3">시작일시</th>
                <th className="p-3 text-right">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tasks.map((t) => (
                <tr key={t.task_id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-mono text-amber-400">{t.task_id}</td>
                  <td className="p-3 font-medium text-white">{t.task_name}</td>
                  <td className="p-3 font-mono text-slate-400 text-[11px]">{t.session_id}</td>
                  <td className="p-3 font-mono text-amber-300 text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-amber-500" />
                      {t.git_branch}
                    </span>
                  </td>
                  <td className="p-3">{getStatusBadge(t.status_cd)}</td>
                  <td className="p-3 text-slate-400">{new Date(t.started_at).toLocaleString('ko-KR')}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedItem({ type: 'Task', data: t })}
                      className="text-xs text-amber-400 hover:text-amber-300 underline"
                    >
                      JSONB 보기
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    검색 조건과 일치하는 태스크 정보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'loop' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400">
                <th className="p-3">루프 ID</th>
                <th className="p-3">루프명</th>
                <th className="p-3">연결 태스크</th>
                <th className="p-3">상태</th>
                <th className="p-3">시작일시</th>
                <th className="p-3 text-right">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loops.map((l) => (
                <tr key={l.loop_id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-mono text-emerald-400">{l.loop_id}</td>
                  <td className="p-3 font-medium text-white">{l.loop_name}</td>
                  <td className="p-3 font-mono text-slate-400 text-[11px]">{l.task_id}</td>
                  <td className="p-3">{getStatusBadge(l.status_cd)}</td>
                  <td className="p-3 text-slate-400">{new Date(l.started_at).toLocaleString('ko-KR')}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedItem({ type: 'Loop', data: l })}
                      className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                    >
                      JSONB 보기
                    </button>
                  </td>
                </tr>
              ))}
              {loops.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    검색 조건과 일치하는 루프 정보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail JSONB Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">
                  {selectedItem.type} 메타데이터 & 감사 정보
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-xs"
              >
                닫기
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 font-mono text-xs text-emerald-400 bg-slate-950">
              <pre>{JSON.stringify(selectedItem.data, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
