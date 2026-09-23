/**
 * @file HandoffDossierModal.tsx
 * @description 무손실 세션 인계 도시에(Handover Dossier) 모달
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  GitBranch,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { HandoffDossier } from '../domain/token-quota/types';

interface HandoffDossierModalProps {
  sessionId?: string;
  onClose: () => void;
  onSessionExtended?: (newSession: any) => void;
  onSuccess?: () => void;
}

export const HandoffDossierModal: React.FC<HandoffDossierModalProps> = ({
  sessionId,
  onClose,
  onSessionExtended,
  onSuccess,
}) => {
  const [dossier, setDossier] = useState<HandoffDossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [extending, setExtending] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [extendedResult, setExtendedResult] = useState<any>(null);

  const fetchDossier = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/session/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          reason: 'SUSPENDED_QUOTA',
        }),
      });
      const data = await res.json();
      if (data.success && data.dossier) {
        setDossier(data.dossier);
      }
    } catch (e) {
      console.error('Failed to load dossier:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [sessionId]);

  const handleCopyPrompt = () => {
    if (!dossier) return;
    navigator.clipboard.writeText(dossier.resume_prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyToken = () => {
    if (!dossier) return;
    navigator.clipboard.writeText(dossier.handoff_token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleExtendSession = async () => {
    if (!dossier) return;
    setExtending(true);
    try {
      const newSessionId = `SESSION-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      const newSessionName = `[연장] ${dossier.last_task_name || '후속 작업 연계'}`;

      const res = await fetch('/api/agent/session/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentSessionId: dossier.parent_session_id,
          handoffToken: dossier.handoff_token,
          newSessionId,
          newSessionName,
          accountId: 'jkoogit@gmail.com',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExtendedResult(data.session);
        if (onSessionExtended) onSessionExtended(data.session);
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      console.error('Failed to extend session:', e);
    } finally {
      setExtending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 text-amber-300 border border-amber-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">무손실 세션 인계 도시에 (Handoff Dossier)</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 text-[10px] font-mono font-bold">
                  Zero-Context-Loss
                </span>
              </div>
              <p className="text-xs text-slate-400">
                토큰 소진 전 Git 3대 기준점, 미완료 백로그, 적응형 보정치(α)를 영속화하여 신규 세션에 인계합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span>세션 인계 도시에를 생성하고 있습니다...</span>
            </div>
          ) : !dossier ? (
            <div className="text-center py-12 text-slate-400">
              인계 도시에를 생성하지 못했습니다.
            </div>
          ) : (
            <>
              {/* Token & Parent Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">부모 세션 ID</div>
                  <div className="text-xs font-mono font-bold text-indigo-300 mt-1 truncate" title={dossier.parent_session_id}>
                    {dossier.parent_session_id}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">인계 토큰 (Handoff Token)</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs font-mono font-bold text-amber-300 truncate" title={dossier.handoff_token}>
                      {dossier.handoff_token.slice(0, 18)}...
                    </div>
                    <button
                      onClick={handleCopyToken}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="토큰 복사"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">적응형 보정치 (α)</div>
                  <div className="text-xs font-mono font-bold text-emerald-300 mt-1">
                    {(dossier.calibration_alpha ?? 1.05).toFixed(3)} (상속 예정)
                  </div>
                </div>
              </div>

              {/* Git 3 Baseline Refs Panel */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  <span>Git 3대 기준점 (전략 4 기준 불변성 보장)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">1. 세션 원점 (Base Ref)</div>
                    <div className="text-slate-200 truncate mt-0.5" title={dossier.baseline_refs.base_ref}>
                      {dossier.baseline_refs.base_ref.slice(0, 12)}...
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">2. 태스크 체크포인트 (Checkpoint Ref)</div>
                    <div className="text-slate-200 truncate mt-0.5" title={dossier.baseline_refs.task_checkpoint_ref}>
                      {dossier.baseline_refs.task_checkpoint_ref.slice(0, 12)}...
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">3. 작업 브랜치 (Branch)</div>
                    <div className="text-emerald-300 truncate mt-0.5" title={dossier.baseline_refs.current_branch}>
                      {dossier.baseline_refs.current_branch}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Backlogs List */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>계승 대상 미완료 백로그 ({dossier.pending_backlogs.length}건)</span>
                </div>
                {dossier.pending_backlogs.length === 0 ? (
                  <div className="text-slate-500 text-[11px]">미완료 백로그가 없습니다. 모든 작업이 순조롭게 정리되었습니다.</div>
                ) : (
                  <div className="space-y-1.5">
                    {dossier.pending_backlogs.map((b, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800/80 text-[11px]">
                        <span className="font-semibold text-slate-200">{b.title}</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-mono text-[10px]">
                          {b.target_layer}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* One-click Markdown Prompt Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>신규 세션 즉시 착수용 복사 프롬프트</span>
                  </div>
                  <button
                    onClick={handleCopyPrompt}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {copiedPrompt ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPrompt ? '복사 완료!' : '프롬프트 복사'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded-lg text-slate-300 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-800 max-h-48">
                  {dossier.resume_prompt}
                </pre>
              </div>

              {/* Extended Session Result Alert */}
              {extendedResult && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>연장 세션이 성공적으로 등록되었습니다!</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-300 mt-0.5">
                      새 세션 ID: {extendedResult.session_id} ({extendedResult.session_name})
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-900 border border-emerald-700 text-white">
                    활성 완료
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">
            인계 토큰은 24시간 동안 유효하며, 새 세션 시작 시 자동으로 부모 기록을 계승합니다.
          </span>
          <div className="flex items-center gap-2">
            {!extendedResult && dossier && (
              <button
                onClick={handleExtendSession}
                disabled={extending}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all shadow-md"
              >
                {extending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>새 세션 즉시 연장 실행</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
