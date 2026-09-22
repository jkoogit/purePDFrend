/**
 * @file TokenBurnoutGauge.tsx
 * @description 토큰 소진 방지 연료 게이지 (Burnout Fuel Gauge) 및 4계층 텔레메트리 현황 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Activity,
  Gauge,
  Share2,
  GitBranch,
  Award,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  AccountQuotaProfile,
  GitBaselineRefs,
} from '../domain/token-quota/types';

interface TokenBurnoutGaugeProps {
  sessionId?: string;
  totalTokensUsed: number;
  onOpenHandoffModal: () => void;
  onOpenScorecardModal: () => void;
}

export const TokenBurnoutGauge: React.FC<TokenBurnoutGaugeProps> = ({
  sessionId,
  totalTokensUsed,
  onOpenHandoffModal,
  onOpenScorecardModal,
}) => {
  const [accountProfile, setAccountProfile] = useState<AccountQuotaProfile | null>(null);
  const [gitRefs, setGitRefs] = useState<GitBaselineRefs | null>(null);
  const [loading, setLoading] = useState(false);

  // Constants
  const SESSION_TOKEN_CEILING = 200000;
  const CAUTION_THRESHOLD = 140000; // 70%
  const CRITICAL_THRESHOLD = 170000; // 85%

  const fuelPercentage = Math.min(100, Math.round((totalTokensUsed / SESSION_TOKEN_CEILING) * 100));
  const remainingTokens = Math.max(0, SESSION_TOKEN_CEILING - totalTokensUsed);

  let riskLevel: 'SAFE' | 'CAUTION' | 'CRITICAL' = 'SAFE';
  if (totalTokensUsed >= CRITICAL_THRESHOLD) riskLevel = 'CRITICAL';
  else if (totalTokensUsed >= CAUTION_THRESHOLD) riskLevel = 'CAUTION';

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [accRes, gitRes] = await Promise.all([
        fetch('/api/agent/usage/account?email=jkoogit@gmail.com'),
        fetch('/api/agent/git/baseline'),
      ]);
      const accData = await accRes.json();
      const gitData = await gitRes.json();
      if (accData.success) setAccountProfile(accData.profile);
      if (gitData.success) setGitRefs(gitData.baseline);
    } catch (e) {
      console.error('Failed to fetch gauge status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [sessionId, totalTokensUsed]);

  // Estimated remaining loops: assuming ~8,500 tokens per full loop
  const estimatedLoopsRemaining = Math.max(0, Math.floor(remainingTokens / 8500));

  return (
    <div className="p-3.5 sm:p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg mb-3">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${
            riskLevel === 'CRITICAL'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
              : riskLevel === 'CAUTION'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white">
                토큰 소진 방지 연료 게이지 (Burnout Fuel Gauge)
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                riskLevel === 'CRITICAL'
                  ? 'bg-red-950 text-red-300 border border-red-800/80'
                  : riskLevel === 'CAUTION'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
              }`}>
                {riskLevel === 'CRITICAL' ? '위험 (CRITICAL) - 세션 인계 권고' : riskLevel === 'CAUTION' ? '주의 (CAUTION)' : '안전 (SAFE)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              세션 하드 캡(200,000 토큰) 기준 실시간 소진율 및 안전 잔여 루프 마진 추정
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenScorecardModal}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="자가 적응형 스코어카드 산출"
          >
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">스코어카드 평가</span>
          </button>
          <button
            onClick={onOpenHandoffModal}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
            title="세션 인계 도시에(Handoff Dossier) 생성"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-200" />
            <span>무손실 세션 인계</span>
          </button>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Visual Fuel Bar */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-400">
            사용량: <strong className="text-white">{totalTokensUsed.toLocaleString()}</strong> / {SESSION_TOKEN_CEILING.toLocaleString()} 토큰
          </span>
          <span className={`font-bold ${
            fuelPercentage >= 85 ? 'text-red-400' : fuelPercentage >= 70 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {fuelPercentage}% 소진
          </span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              fuelPercentage >= 85
                ? 'bg-gradient-to-r from-amber-500 to-red-500'
                : fuelPercentage >= 70
                ? 'bg-gradient-to-r from-indigo-500 to-amber-500'
                : 'bg-gradient-to-r from-emerald-500 to-indigo-500'
            }`}
            style={{ width: `${Math.max(3, fuelPercentage)}%` }}
          />
          {/* Threshold markers */}
          <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-amber-400/40" title="70% 주의선" />
          <div className="absolute top-0 bottom-0 left-[85%] w-0.5 bg-red-400/60" title="85% 위험선" />
        </div>
      </div>

      {/* 4 Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
            <Activity className="w-3 h-3 text-indigo-400" />
            <span>안전 잔여 토큰</span>
          </div>
          <div className="text-sm font-bold font-mono text-white mt-0.5">
            {remainingTokens.toLocaleString()}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>예상 잔여 루프 (LSM)</span>
          </div>
          <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
            ~{estimatedLoopsRemaining} Loops
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
            <GitBranch className="w-3 h-3 text-emerald-400" />
            <span>Git 활성 브랜치</span>
          </div>
          <div className="text-xs font-mono font-semibold text-emerald-300 truncate mt-0.5" title={gitRefs?.current_branch || 'dev'}>
            {gitRefs?.current_branch || 'dev'}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3 text-indigo-400" />
            <span>사용자(계정) 의존성</span>
          </div>
          <div className="text-xs font-mono font-semibold text-slate-200 truncate mt-0.5" title={accountProfile?.user_email || 'jkoogit@gmail.com'}>
            {accountProfile?.user_email || 'jkoogit@gmail.com'}
          </div>
        </div>
      </div>

      {/* Critical Warning Banner if Fuel >= 85% */}
      {riskLevel === 'CRITICAL' && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-950/60 border border-red-800/80 flex items-start gap-2.5 text-xs text-red-200">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-white">세션 토큰 소진 임계점 도달 경고:</strong> 대화가 강제 중단되기 전에 상단의 <strong className="text-amber-300">"무손실 세션 인계"</strong> 버튼을 클릭하여 인계 프롬프트를 발급받으세요. Git 3대 기준점과 미완료 백로그가 신규 세션으로 안전하게 계승됩니다.
          </div>
        </div>
      )}
    </div>
  );
};
