/**
 * @file EmergencyRecoveryPanel.tsx
 * @description 비-LLM 긴급 소스 Push, 세션 재해복구(DR), 스냅샷 파일화 및 행(Hang) 관제실
 */

import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Save,
  AlertOctagon,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Copy,
  Check,
  FileText,
  FileCode,
  X,
  AlertTriangle,
  Layers,
} from 'lucide-react';

interface UnfinalizedItem {
  task_id?: string;
  task_name?: string;
  loop_id?: string;
  loop_name?: string;
  status_cd: string;
}

interface SnapshotItem {
  snapshot_id: string;
  session_id?: string;
  session_num: string;
  session_title: string;
  last_task_id: string;
  current_task_name: string;
  latest_commit_sha: string;
  branch: string;
  status: string;
  total_context_tokens?: number;
  hang_reason?: string;
  json_file_path?: string;
  md_file_path?: string;
  unfinalized_tasks?: UnfinalizedItem[];
  unfinalized_loops?: UnfinalizedItem[];
  created_at: string;
}

interface HangAssessment {
  status: string;
  badgeLabel: string;
  badgeColor: 'green' | 'yellow' | 'red' | 'orange' | 'gray';
  message: string;
  recommendedAction: string;
  triggerCondition?: string;
  recoveryCondition?: string;
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
  const [backupMsg, setBackupMsg] = useState<{
    success: boolean;
    message: string;
    jsonFilePath?: string;
    mdFilePath?: string;
  } | null>(null);

  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotItem | null>(null);
  const [snapshotDetailModal, setSnapshotDetailModal] = useState(false);

  const [hangAssessment, setHangAssessment] = useState<HangAssessment>({
    status: 'NORMAL',
    badgeLabel: '정상 작동',
    badgeColor: 'green',
    message: '세션 텔레메트리가 정상적으로 동기화되고 있습니다.',
    recommendedAction: '계획된 태스크를 계속 진행하세요.',
    triggerCondition: '정상 상태 (오류 없음)',
    recoveryCondition: '조치 불필요',
  });

  const [quotaLedger, setQuotaLedger] = useState<QuotaLedgerInfo>({
    remainingTokens: 50000000,
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

  const [copiedSnapshotId, setCopiedSnapshotId] = useState<string | null>(null);
  const [copiedQuickPrompt, setCopiedQuickPrompt] = useState(false);

  // Fetch snapshots, hang assessment and quota ledger
  const fetchStatus = async () => {
    try {
      const [snapRes, hangRes, ledgerRes] = await Promise.all([
        fetch('/api/agent/session/snapshots'),
        fetch('/api/agent/session/hang-status?contextTokens=106510'),
        fetch('/api/agent/quota/ledger?userId=USER-DEV-001'),
      ]);

      if (snapRes.ok) {
        const snapData = await snapRes.json();
        if (snapData.success) {
          setSnapshots(snapData.snapshots || []);
        }
      }

      if (hangRes.ok) {
        const hangData = await hangRes.json();
        if (hangData.success && hangData.assessment) {
          const a = hangData.assessment;
          let trigger = '정상 상태';
          let recovery = '조치 불필요';

          if (a.status === 'HANG_OVERLOAD') {
            trigger = '순간 트래픽 급증 / 503 Service Unavailable';
            recovery = '1~3분 쿨다운 대기 후 재시도 권장';
          } else if (a.status === 'HANG_QUOTA_EXHAUSTED') {
            trigger = '429 Quota Exceeded / 일일 RPD 한도 도달';
            recovery = '한국시간 매일 16:00 (PST 00:00) 리셋 대기 또는 타 계정 전환';
          } else if (a.status === 'HANG_CONTEXT_BLOAT') {
            trigger = '누적 15만 토큰 초과 컨텍스트 비대화 (Bloat)';
            recovery = '긴급 Push 및 스냅샷 백업 후 신규 세션(B) 분기';
          } else if (a.status === 'HANG_INDETERMINATE') {
            trigger = '10분 이상 원인 불명 무응답 상태';
            recovery = '10분 경과 시 긴급 Push 후 새 세션에서 #세션복구 실행';
          }

          setHangAssessment({
            ...a,
            triggerCondition: trigger,
            recoveryCondition: recovery,
          });
        }
      }

      if (ledgerRes.ok) {
        const ledgerData = await ledgerRes.json();
        if (ledgerData.success && ledgerData.ledger) {
          setQuotaLedger(ledgerData.ledger);
        }
      }
    } catch (e) {
      console.warn('재해복구 관제실 상태 조회 실패 (로컬 스토어 유지):', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // 1. 비-LLM 긴급 Push 실행
  const handleEmergencyPush = async () => {
    setPushing(true);
    setPushResult(null);
    try {
      const res = await fetch('/api/agent/emergency/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetBranch: 'dev',
          commitMessage: `[EMERGENCY-PUSH] 비-LLM 긴급 소스 백업 (${new Date().toISOString()})`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPushResult({
          success: true,
          commitSha: data.commitSha,
          commitUrl: data.commitUrl,
          filesSyncedCount: data.filesSyncedCount,
          branch: data.branch,
        });
        await fetchStatus();
      } else {
        setPushResult({
          success: false,
          error: data.error || '긴급 Git Push 실패',
        });
      }
    } catch (err: any) {
      setPushResult({
        success: false,
        error: err.message || '네트워크 요청 오류',
      });
    } finally {
      setPushing(false);
    }
  };

  // 2. 세션 스냅샷 파일(JSON/MD) 및 DB 백업
  const handleBackupSnapshot = async () => {
    setBackingUp(true);
    setBackupMsg(null);
    try {
      const res = await fetch('/api/agent/session/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextTokens: 106510,
          hangReason: hangAssessment.status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBackupMsg({
          success: true,
          message: `스냅샷 파일(JSON/MD) 백업 완료: ${data.snapshot?.snapshot_id}`,
          jsonFilePath: data.jsonFilePath,
          mdFilePath: data.mdFilePath,
        });
        await fetchStatus();
      } else {
        setBackupMsg({
          success: false,
          message: data.error || '스냅샷 백업 실패',
        });
      }
    } catch (err: any) {
      setBackupMsg({
        success: false,
        message: err.message || '요청 실패',
      });
    } finally {
      setBackingUp(false);
    }
  };

  // 3. 복구 명령어 클립보드 복사
  const handleCopyPrompt = (snapshotId: string) => {
    const prompt = `#세션복구:${snapshotId}`;
    navigator.clipboard.writeText(prompt);
    setCopiedSnapshotId(snapshotId);
    setTimeout(() => setCopiedSnapshotId(null), 2500);
  };

  const handleCopyQuickPrompt = () => {
    const target = snapshots[0]?.snapshot_id || '최신';
    const prompt = snapshots.length > 0 ? `#세션복구:${target}` : '#세션복구';
    navigator.clipboard.writeText(prompt);
    setCopiedQuickPrompt(true);
    setTimeout(() => setCopiedQuickPrompt(false), 2500);
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

  const latestSnapshot = snapshots[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Header with Title and Hang Assessment Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">비-LLM 세션 재해복구(DR) 관제실</h3>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
            Zero Context Bloat
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">행(Hang) 실시간 진단:</span>
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

      {/* Hang Diagnosis Detail Card */}
      <div className="mt-3 p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg text-xs space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">⚠️ 예상 발생 조건</span>
            <span className="text-slate-200 mt-0.5 block">{hangAssessment.triggerCondition}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">⏱️ 예상 복구 조건 및 시간</span>
            <span className="text-indigo-300 font-mono mt-0.5 block">{hangAssessment.recoveryCondition}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>{hangAssessment.message}</span>
          <span className="text-emerald-400 font-semibold">{hangAssessment.recommendedAction}</span>
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
                width: `${Math.min(
                  100,
                  Math.round((quotaLedger.proRequestsRemaining / (quotaLedger.proRequestsLimit || 250)) * 100)
                )}%`,
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
                width: `${Math.min(
                  100,
                  Math.round((quotaLedger.flashRequestsRemaining / (quotaLedger.flashRequestsLimit || 2500)) * 100)
                )}%`,
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
            <span className="text-slate-400">잔여 원장:</span>
            <span className="text-indigo-400 font-bold">{quotaLedger.remainingTokens.toLocaleString()} T</span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            {quotaLedger.fallbackRecommended
              ? 'Pro 250회 소진으로 Flash 무중단 폴백 작동'
              : 'Tier 1 Pro 및 Tier 2 Flash 정상 라우팅'}
          </p>
        </div>
      </div>

      {/* Action Buttons Row (Refined for Eyes & Workflow) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        {/* 1. 비-LLM 긴급 Push 버튼 (눈이 편안한 다크 슬레이트 & 엠버 펄스) */}
        <button
          onClick={handleEmergencyPush}
          disabled={pushing}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 disabled:bg-slate-900/60 text-slate-100 border border-slate-600/70 rounded-lg text-xs font-semibold shadow-md transition active:scale-[0.98]"
        >
          {pushing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Git Push 전송 중...</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <UploadCloud className="w-4 h-4 text-slate-300" />
              <span>긴급 소스 GitHub Push</span>
            </>
          )}
        </button>

        {/* 2. 세션 백업(스냅샷 파일화) 버튼 */}
        <button
          onClick={handleBackupSnapshot}
          disabled={backingUp}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition active:scale-[0.98]"
        >
          {backingUp ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>스냅샷 파일화 중...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-indigo-400" />
              <span>💾 세션 스냅샷 파일 백업</span>
            </>
          )}
        </button>

        {/* 3. #세션복구 프롬프트 복사 & 스냅샷 상세 열람 버튼 */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyQuickPrompt}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 border border-indigo-700/60 rounded-lg text-xs font-semibold shadow-sm transition active:scale-[0.98]"
            title="새 AI 세션 채팅창에 붙여넣을 복구 명령어를 복사합니다."
          >
            {copiedQuickPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">명령 복사완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-300" />
                <span>#세션복구 명령 복사</span>
              </>
            )}
          </button>
          <button
            onClick={() => setSnapshotDetailModal(true)}
            className="px-2.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold"
            title="스냅샷 목록 및 미완료 작업 상세 열람"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
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
              <p className="mt-0.5 opacity-90">
                {pushResult.success
                  ? `${pushResult.filesSyncedCount}개 파일이 원격 '${pushResult.branch}' 브랜치에 안전하게 반영되었습니다.`
                  : pushResult.error}
              </p>
              {pushResult.commitSha && (
                <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                  <span>SHA: {pushResult.commitSha.slice(0, 10)}</span>
                  {pushResult.commitUrl && (
                    <a
                      href={pushResult.commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 underline text-emerald-300 hover:text-white"
                    >
                      <ExternalLink className="w-3 h-3" /> GitHub 커밋 보기
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setPushResult(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Backup Result Toast */}
      {backupMsg && (
        <div
          className={`p-3 rounded-lg text-xs mb-3 flex items-start justify-between border ${
            backupMsg.success
              ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-indigo-400 mt-0.5" />
            <div>
              <p className="font-semibold">{backupMsg.message}</p>
              {backupMsg.jsonFilePath && (
                <p className="mt-0.5 text-[11px] font-mono text-slate-300">
                  📄 {backupMsg.jsonFilePath} | {backupMsg.mdFilePath}
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setBackupMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Latest Snapshot Summary Bar */}
      {latestSnapshot && (
        <div className="mt-2 p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span className="font-mono font-bold text-slate-200">{latestSnapshot.snapshot_id}</span>
            <span className="text-slate-400 truncate max-w-[200px]">({latestSnapshot.session_title})</span>
            {latestSnapshot.unfinalized_tasks && latestSnapshot.unfinalized_tasks.length > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-semibold">
                미완료 태스크 {latestSnapshot.unfinalized_tasks.length}건
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyPrompt(latestSnapshot.snapshot_id)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-mono flex items-center gap-1 border border-slate-700"
            >
              {copiedSnapshotId === latestSnapshot.snapshot_id ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>#세션복구:{latestSnapshot.snapshot_id}</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedSnapshot(latestSnapshot);
                setSnapshotDetailModal(true);
              }}
              className="px-2 py-1 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 rounded text-[11px] font-semibold border border-indigo-800/60"
            >
              상세보기
            </button>
          </div>
        </div>
      )}

      {/* Snapshot Detail & Residual Task Viewer Modal */}
      {snapshotDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">세션 스냅샷 파일 및 미완료 작업 상세</h3>
              </div>
              <button
                onClick={() => setSnapshotDetailModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {snapshots.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>보존된 세션 스냅샷이 없습니다.</p>
                  <p className="mt-1 text-[11px]">상단의 [💾 세션 스냅샷 파일 백업] 버튼을 눌러 생성하세요.</p>
                </div>
              ) : (
                snapshots.map((s) => {
                  const isSelected = selectedSnapshot?.snapshot_id === s.snapshot_id;
                  return (
                    <div
                      key={s.snapshot_id}
                      className={`p-3.5 bg-slate-950 border rounded-xl space-y-2.5 transition ${
                        isSelected ? 'border-indigo-500 shadow-md shadow-indigo-950/40' : 'border-slate-800/80'
                      }`}
                    >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-300 text-sm">{s.snapshot_id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {s.session_title}
                        </span>
                        <span className="text-[10px] text-slate-500">{new Date(s.created_at).toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => handleCopyPrompt(s.snapshot_id)}
                        className="px-2.5 py-1 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 rounded-lg text-[11px] font-mono flex items-center gap-1 border border-indigo-700/60"
                      >
                        {copiedSnapshotId === s.snapshot_id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300 font-sans">복사됨!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-indigo-300" />
                            <span>#세션복구:{s.snapshot_id}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Residual Tasks Section */}
                    <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
                      <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        정리 못한 잔여 태스크 (Unfinalized Tasks)
                      </span>
                      {s.unfinalized_tasks && s.unfinalized_tasks.length > 0 ? (
                        <div className="space-y-1 mt-1">
                          {s.unfinalized_tasks.map((t, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-[11px] py-0.5 px-2 bg-slate-950/70 rounded border border-slate-800"
                            >
                              <span className="font-mono text-slate-300">
                                [{t.task_id}] {t.task_name}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {t.status_cd}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">정리 못한 잔여 태스크 없음 (완결 상태)</p>
                      )}
                    </div>

                    {/* File Path & Meta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                      <div>
                        <span>📄 JSON 파일: </span>
                        <code className="text-indigo-400 font-mono">{s.json_file_path || `data/snapshots/${s.snapshot_id}.json`}</code>
                      </div>
                      <div>
                        <span>📝 MD 보고서: </span>
                        <code className="text-indigo-400 font-mono">{s.md_file_path || `data/snapshots/${s.snapshot_id}.md`}</code>
                      </div>
                    </div>
                  </div>
                );
              })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
              <span className="text-slate-400">
                복구 명령어를 복사한 후 신규 세션 채팅창에서 입력하세요.
              </span>
              <button
                onClick={() => setSnapshotDetailModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
