/**
 * @file ScorecardModal.tsx
 * @description 세션정리 시점 자가 적응형 스코어카드(Token Evaluation Scorecard) 모달
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  TrendingUp,
  Percent,
  CheckCircle2,
  RefreshCw,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TokenEvaluationScorecard } from '../domain/token-quota/types';

interface ScorecardModalProps {
  sessionId?: string;
  onClose: () => void;
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({ sessionId, onClose }) => {
  const [scorecard, setScorecard] = useState<TokenEvaluationScorecard | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchScorecard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/telemetry/scorecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.success && data.scorecard) {
        setScorecard(data.scorecard);
      }
    } catch (e) {
      console.error('Failed to load scorecard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecard();
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">자가 적응형 토큰 평가 스코어카드</h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-[10px] font-mono font-bold">
                  EMA Calibration Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                세션정리 시점에 대화턴/루프별 토큰 소비를 자동 평가하고, 다음 세션의 보정 가중치(α)를 갱신합니다.
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
              <span>세션 토큰 소비 스코어카드를 정밀 산출하고 있습니다...</span>
            </div>
          ) : !scorecard ? (
            <div className="text-center py-12 text-slate-400">
              스코어카드를 조회하지 못했습니다.
            </div>
          ) : (
            <>
              {/* Primary Metric 4-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
                    <Layers className="w-3 h-3 text-indigo-400" />
                    <span>세션 총 소비 토큰</span>
                  </div>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {scorecard.total_tokens.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {scorecard.total_turns}턴 / {scorecard.total_loops}루프
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
                    <Activity className="w-3 h-3 text-amber-400" />
                    <span>루프당 평균 비용</span>
                  </div>
                  <div className="text-base font-bold font-mono text-amber-300 mt-1">
                    {(scorecard.total_loops > 0
                      ? Math.round(scorecard.total_tokens / scorecard.total_loops)
                      : Math.round(scorecard.avg_tokens_per_turn)
                    ).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    tokens / loop
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
                    <Percent className="w-3 h-3 text-emerald-400" />
                    <span>추정 오차율 (MAPE)</span>
                  </div>
                  <div className="text-base font-bold font-mono text-emerald-300 mt-1">
                    {scorecard.mape_percent}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {scorecard.mape_percent < 20 ? '고신뢰 구간 (<20%)' : '보정 필요 구간'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
                    <TrendingUp className="w-3 h-3 text-indigo-400" />
                    <span>갱신 가중치 (α)</span>
                  </div>
                  <div className="text-base font-bold font-mono text-indigo-300 mt-1">
                    {scorecard.calibration_weight_alpha.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    차기 세션에 자동 반영
                  </div>
                </div>
              </div>

              {/* Dynamic Recommendation Panel */}
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-900/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>적응형 분석 피드백 및 제안</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {scorecard.recommendation || scorecard.api_candidate_proposals?.[0]?.rationale || '추정 오차가 신뢰할 수 있는 구간(20% 미만)에 머물고 있습니다.'}
                </p>
              </div>

              {/* Adaptive Formula Explanation */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[11px] text-slate-400 leading-relaxed">
                <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>가시적 측정 및 객관적 평가 기준</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-white">1. 자가 적응형 가중치 공식:</strong>
                    <div className="font-mono text-indigo-300 mt-1">
                      α_next = α_curr × (1 + λ × (MAPE_ratio - 1))
                    </div>
                    <div className="text-slate-500 mt-1">
                      오차가 발생할 때마다 맹신하지 않고 점진적으로 임계점 계산을 보정하여 예측 정확도를 극대화합니다.
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-white">2. 무손실 행(Hang) 방지 원칙:</strong>
                    <div className="font-mono text-emerald-300 mt-1">
                      BRI = (U / C_hard) × 100 ≥ 85% 시 인계 권고
                    </div>
                    <div className="text-slate-500 mt-1">
                      대화가 강제로 끊기는 상황을 사전 차단하고, 85% 도달 시 안전하게 세션 인계 도시에를 발급합니다.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            평가 일시: {scorecard && scorecard.evaluated_at ? new Date(scorecard.evaluated_at).toLocaleString('ko-KR') : '-'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
