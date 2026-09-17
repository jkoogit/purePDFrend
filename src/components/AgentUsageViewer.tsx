import { useState, useEffect } from 'react';
import { ConversationTrace } from '../types';
import { Bot, Sparkles, RefreshCw, MessageSquare, Zap } from 'lucide-react';

export default function AgentUsageViewer() {
  const [traces, setTraces] = useState<ConversationTrace[]>([]);
  const [activeModel, setActiveModel] = useState('models/gemini-3.8-flash');
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsage = async () => {
    setIsLoading(true);
    try {
      const [traceRes, usageRes] = await Promise.all([
        fetch('/api/agent/chat/traces'),
        fetch('/api/agent/usage'),
      ]);
      const traceData = await traceRes.json();
      const usageData = await usageRes.json();

      if (traceData.success) setTraces(traceData.traces);
      if (usageData.success) {
        if (usageData.activeModel) setActiveModel(usageData.activeModel);
      }
    } catch (err) {
      console.error('Failed to load agent usage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Top Metric Cards */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">활성 AI 모델</div>
            <div className="text-xs font-mono font-bold text-white truncate max-w-[160px]">{activeModel}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">총 대화 턴 수</div>
            <div className="text-lg font-bold text-white">{traces.length} <span className="text-xs text-slate-500">Turns</span></div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">하네스 거버넌스 규격</div>
            <div className="text-xs font-bold text-emerald-400">AGENTS.md 준수</div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">연동 데이터베이스</div>
            <div className="text-xs font-mono font-bold text-indigo-300">purepdfrend_dev</div>
          </div>
          <button
            onClick={fetchUsage}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Conversation Traces Timeline */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            세션 대화 턴 & 감사 추적 타임라인 (Trace History)
          </h3>
          <span className="text-xs text-slate-500">기록된 추적: {traces.length}건</span>
        </div>

        {traces.map((trace) => (
          <div
            key={trace.trace_id}
            className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono text-xs font-semibold">
                  Step #{trace.step_index}
                </span>
                <span className="font-mono text-xs text-slate-400">{trace.trace_id}</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {new Date(trace.created_at).toLocaleString('ko-KR')}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
                <span className="text-indigo-400 font-semibold mr-2">[사용자 요청]</span>
                {trace.user_prompt}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-400">
                <span className="text-emerald-400 font-semibold mr-2">[에이전트 응답 요약]</span>
                {trace.agent_response}
              </div>
            </div>
          </div>
        ))}

        {traces.length === 0 && !isLoading && (
          <div className="text-center p-12 text-slate-500 text-xs">
            기록된 대화 추적 내역이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
