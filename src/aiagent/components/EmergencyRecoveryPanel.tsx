/**
 * @file EmergencyRecoveryPanel.tsx
 * @description 비-LLM 긴급 소스 Push, 세션 재해복구(DR) 및 행(Hang) 상태 관제 패널
 */

import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Save,
  RotateCcw,
  AlertOctagon,
  CheckCircle,
  ExternalLink,
  Clock,
  ShieldAlert,
  Loader2,
  Copy,
} from 'lucide-react';

interface SnapshotItem {
  snapshot_id: string;
  session_num: string;
  session_title: string;
  last_task_id: string;
  current_task_name: string;
  latest_commit_sha: string;
  branch: string;
  status: string;
  created_at: string;
}

interface HangAssessment {
  status: string;
  badgeLabel: string;
  badgeColor: 'green' | 'yellow' | 'red' | 'orange' | 'gray';
  message: string;
  recommendedAction: string;
}

interface QuotaLedgerInfo {
  remainingTokens: number;
  proRequestsLimit: number;
  proRequestsUsed: number;
  proRequestsRemaining: number;
  flashRequestsLimit: number;
  flashRequestsUsed: number;
  flashRequestsRemaining: number;
  fallbackRecommended: boolean;
  fallbackModelId: string;
  resetAtKst: string;
}

export const EmergencyRecoveryPanel: React.FC = () => {
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    success: boolean;
    commitSha?: string;
    commitUrl?: string;
    filesSyncedCount?: number;
    branch?: string;
    error?: string;
  } | null>(null);

  const [backingUp, setBackingUp] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoredInfo, setRestoredInfo] = useState<any | null>(null);

  const [hangAssessment, setHangAssessment] = useState<HangAssessment>({
    status: 'NORMAL',
    badgeLabel: '정상 작동',
    badgeColor: 'green',
    message: '세션 텔레메트리가 정상적으로 동기화되고 있습니다.',
    recommendedAction: '계획된 태스크를 계속 진행하세요.',
  });

  const [quotaLedger, setQuotaLedger] = useState<QuotaLedgerInfo>({
    remainingTokens: 1000000,
    proRequestsLimit: 250,
    proRequestsUsed: 0,
    proRequestsRemaining: 250,
    flashRequestsLimit: 2500,
    flashRequestsUsed: 0,
    flashRequestsRemaining: 2500,
    fallbackRecommended: false,
    fallbackModelId: 'gemini-1.5-flash',
    resetAtKst: '16:00 KST',
  });

  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Fetch snapshots, hang assessment and quota ledger
  const fetchStatus = async () => {
    try {
      const [snapRes, hangRes, ledgerRes] = await Promise.all([
        fetch('/api/agent/session/snapshots'),
        fetch('/api/agent/session/hang-status?contextTokens=106510'),
        fetch('/api/agent/quota/ledger?userId=USER-DEV-001'),
      ]);
      const snapData = await snapRes.json();
      const hangData = await hangRes.json();
      const ledgerData = await ledgerRes.json();

      if (snapData.success) {
        setSnapshots(snapData.snapshots || []);
      }
      if (hangData.success && hangData.assessment) {
        setHangAssessment(hangData.assessment);
      }
      if (ledgerData.success && ledgerData.ledger) {
        setQuotaLedger(ledgerData.ledger);
      }
    } catch (e) {
      // offline fallback
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // 1. 비-LLM 긴급 Push 실행
  const handleEmergencyPush = async () => {
    if (!confirm('현재 작업 중인 모든 소스(코드/문서)를 GitHub 원격 dev 브랜치에 긴급 Push하시겠습니까?')) return;
    setPushing(true);
    setPushResult(null);
    try {
      const res = await fetch('/api/agent/emergency/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetBranch: 'dev',
          commitMessage: `[EMERGENCY-PUSH] non-llm backup checkpoint (${new Date().toLocaleTimeString('ko-KR')})`,
        }),
      });
      const data = await res.json();
      setPushResult(data);
      if (data.success) {
        fetchStatus();
      }
    } catch (err: any) {
      setPushResult({ success: false, error: err.message });
    } finally {
      setPushing(false);
    }
  };

  // 2. 세션 긴급 백업(스냅샷) 생성
  const handleBackupSnapshot = async () => {
    setBackingUp(true);
    setBackupMsg(null);
    try {
      const res = await fetch('/api/agent/session/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextTokens: 106510 }),
      });
      const data = await res.json();
      if (data.success) {
        setBackupMsg(`✅ 세션 스냅샷(${data.snapshot.snapshot_id})이 보존되었습니다!`);
        fetchStatus();
      } else {
        setBackupMsg(`❌ 백업 실패: ${data.error}`);
      }
    } catch (err: any) {
      setBackupMsg(`❌ 백업 실패: ${err.message}`);
    } finally {
      setBackingUp(false);
    }
  };

  // 3. 세션 복구 실행
  const handleRestore = async (targetId?: string) => {
    setRestoring(true);
    try {
      const res = await fetch('/api/agent/session/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });
      const data = await res.json();
      setRestoredInfo(data);
      fetchStatus();
    } catch (err: any) {
      alert('세션 복구 요청 실패: ' + err.message);
    } finally {
      setRestoring(false);
    }
  };

  const getBadgeStyle = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'yellow':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'orange':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'green':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const pendingSnapshots = snapshots.filter((s) => s.status === 'PENDING_RECOVERY');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Header with Title and Hang Assessment Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">비-LLM 세션 재해복구(DR) 관제실</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">행(Hang) 진단:</span>
          <span
            className={`px-2.5 py-0.5 text-xs font-medium rounded-full border flex items-center gap-1.5 ${getBadgeStyle(
              hangAssessment.badgeColor
            )}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {hangAssessment.badgeLabel}
          </span>
        </div>
      </div>

      {/* 3-Tier Model Routing & Quota Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3 pt-1">
        {/* Tier 1: Gemini 1.5 Pro */}
        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-cyan-300">Tier 1: Gemini 1.5 Pro (Heavy)</span>
            <span className="font-mono text-cyan-400 font-bold">
              {quotaLedger.proRequestsRemaining}/{quotaLedger.proRequestsLimit}회
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.round((quotaLedger.proRequestsRemaining / (quotaLedger.proRequestsLimit || 250)) * 100))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>#태스크시작 기획/DDD</span>
            <span>리셋: {quotaLedger.resetAtKst}</span>
          </div>
        </div>

        {/* Tier 2: Gemini 1.5 Flash */}
        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-emerald-300">Tier 2: Gemini 1.5 Flash (Standard)</span>
            <span className="font-mono text-emerald-400 font-bold">
              {quotaLedger.flashRequestsRemaining}/{quotaLedger.flashRequestsLimit}회
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.round((quotaLedger.flashRequestsRemaining / (quotaLedger.flashRequestsLimit || 2500)) * 100))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>#태스크처리 TDD/구현 (10x)</span>
            <span className="text-emerald-400">고속 생성</span>
          </div>
        </div>

        {/* Graceful Degradation & Quota Balance */}
        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1 sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-indigo-300">듀얼 쿼터 & 폴백 상태</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                quotaLedger.fallbackRecommended
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {quotaLedger.fallbackRecommended ? 'Flash 폴백 가동' : 'Pro 정상 가용'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-300 flex justify-between">
            <span className="text-slate-400">잔여 토큰:</span>
            <span className="text-indigo-400 font-bold">{quotaLedger.remainingTokens.toLocaleString()} T</span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            {quotaLedger.fallbackRecommended
              ? 'Pro 250회 소진으로 Flash 무중단 폴백 작동'
              : 'Tier 1 Pro 및 Tier 2 Flash 정상 라우팅'}
          </p>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        {/* 1. 비-LLM 긴급 Push 버튼 */}
        <button
          onClick={handleEmergencyPush}
          disabled={pushing}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-md shadow-rose-950/40 transition active:scale-[0.98]"
        >
          {pushing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Git Push 전송 중...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              <span>🚨 긴급 소스 GitHub Push</span>
            </>
          )}
        </button>

        {/* 2. 세션 백업(스냅샷) 버튼 */}
        <button
          onClick={handleBackupSnapshot}
          disabled={backingUp}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition active:scale-[0.98]"
        >
          {backingUp ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>스냅샷 보존 중...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-indigo-400" />
              <span>💾 세션 스냅샷 백업</span>
            </>
          )}
        </button>

        {/* 3. 세션 복구 다이얼로그 열기 */}
        <button
          onClick={() => setShowRestoreModal(true)}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-950/40 transition active:scale-[0.98]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>🔄 #세션복구 ({pendingSnapshots.length}건 대기)</span>
        </button>
      </div>

      {/* Push Result Toast Alert */}
      {pushResult && (
        <div
          className={`p-3 rounded-lg text-xs mb-3 flex items-start justify-between border ${
            pushResult.success
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-start gap-2">
            {pushResult.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-rose-400 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{pushResult.success ? '긴급 Git Push 성공' : '긴급 Git Push 실패'}</p>
              <p className="mt-0.5 opacity-90">{pushResult.success ? `${pushResult.filesSyncedCount}개 파일이 원격 '${pushResult.branch}' 브랜치에 안전하게 반영되었습니다.` : pushResult.error}</p>
              {pushResult.commitSha && (
                <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                  <span>SHA: {pushResult.commitSha.slice(0, 10)}</span>
                  {pushResult.commitUrl && (
                    <a
                      href={pushResult.commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 underline hover:text-emerald-300"
                    >
                      GitHub에서 보기 <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setPushResult(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Backup Notification */}
      {backupMsg && (
        <div className="p-2.5 mb-3 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-300 flex items-center justify-between">
          <span>{backupMsg}</span>
          <button onClick={() => setBackupMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Hang Status Explanation Card */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{hangAssessment.message}</span>
        </div>
        <span className="text-indigo-400 font-medium">{hangAssessment.recommendedAction}</span>
      </div>

      {/* Restore Modal Dialog */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-400" />
                <h4 className="text-base font-bold text-white">#세션복구 관리자</h4>
              </div>
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoredInfo(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {restoredInfo ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-300">
                  <p className="font-bold text-emerald-400">{restoredInfo.message}</p>
                  <p className="mt-1">중단되었던 세션의 최신 커밋 SHA와 태스크가 성공적으로 연결되었습니다.</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">새 세션 입력용 추천 프롬프트:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(restoredInfo.recommendedPrompt);
                        setCopiedPrompt(true);
                        setTimeout(() => setCopiedPrompt(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedPrompt ? '복사됨!' : '프롬프트 복사'}
                    </button>
                  </div>
                  <pre className="p-2 bg-slate-900 rounded font-mono text-[11px] text-amber-300 overflow-x-auto whitespace-pre-wrap">
                    {restoredInfo.recommendedPrompt}
                  </pre>
                </div>

                <button
                  onClick={() => {
                    setShowRestoreModal(false);
                    setRestoredInfo(null);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  완료 및 닫기
                </button>
              </div>
            ) : pendingSnapshots.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                <p>복구 대기 중인 세션 스냅샷이 없습니다.</p>
                <p className="text-[11px] text-slate-500">모든 작업 세션이 정상이거나 이미 복구되었습니다.</p>
              </div>
            ) : pendingSnapshots.length === 1 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  복구 대기 스냅샷 1건이 확인되었습니다. 아래 버튼을 누르면 직결 복구됩니다.
                </p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-white">
                    <span>세션 [{pendingSnapshots[0].session_num}]</span>
                    <span className="text-indigo-400">{pendingSnapshots[0].snapshot_id}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{pendingSnapshots[0].session_title}</p>
                  <p className="text-slate-500 text-[11px]">태스크: {pendingSnapshots[0].current_task_name}</p>
                </div>
                <button
                  onClick={() => handleRestore(pendingSnapshots[0].snapshot_id)}
                  disabled={restoring}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  {restoring && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>원터치 직결 복구 실행</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-300">복구 대기 세션이 여러 건 존재합니다. 복구할 세션을 선택하세요:</p>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {pendingSnapshots.map((item) => (
                    <div
                      key={item.snapshot_id}
                      className="p-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-lg text-xs flex items-center justify-between transition cursor-pointer"
                      onClick={() => handleRestore(item.snapshot_id)}
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>[{item.session_num}]</span>
                          <span className="text-[11px] text-slate-400">{item.snapshot_id}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{item.session_title}</p>
                        <p className="text-slate-500 text-[10px]">{new Date(item.created_at).toLocaleString('ko-KR')}</p>
                      </div>
                      <button className="px-2.5 py-1 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded text-xs font-medium hover:bg-indigo-600 hover:text-white transition">
                        선택 복구
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
