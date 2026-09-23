/**
 * @file MetaGovernanceBackoffice.tsx
 * @description 관리자 백오피스 메타 거버넌스 및 쿼터 원장 제어 대시보드
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Cpu,
  Users,
  CreditCard,
  History,
  Lock,
  Unlock,
  PlusCircle,
  RefreshCw,
  CheckCircle,
  AlertOctagon,
} from 'lucide-react';

interface BillingPlan {
  plan_id: string;
  plan_name: string;
  description: string;
  monthly_price_usd: number;
  priority_tier: number;
  base_quota_tokens: number;
  max_burst_multiplier: number;
  overage_policy: 'BLOCK' | 'THROTTLE' | 'PAY_AS_YOU_GO';
}

interface ModelCatalogItem {
  model_id: string;
  display_name: string;
  provider: string;
  tier: string;
  context_window_tokens: number;
  prompt_cost_per_1k_usd: number;
  completion_cost_per_1k_usd: number;
  is_active: boolean;
}

interface UserAccount {
  user_id: string;
  user_name: string;
  email: string;
  org_id: string;
  plan_id: string;
  status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED';
  total_granted_quota?: number;
  remaining_quota?: number;
  is_frozen?: boolean;
}

interface QuotaTransactionLog {
  tx_id: string;
  ledger_id: string;
  user_id: string;
  tx_type: 'GRANT' | 'DEDUCT' | 'REFUND' | 'FREEZE' | 'UNFREEZE';
  token_delta: number;
  balance_after: number;
  reason_desc: string;
  created_at: string;
}

export const MetaGovernanceBackoffice: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'plans' | 'models' | 'logs'>('users');
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [models, setModels] = useState<ModelCatalogItem[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('USER-DEV-001');
  const [auditLogs, setAuditLogs] = useState<QuotaTransactionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Grant Modal state
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [grantTargetUser, setGrantTargetUser] = useState<string>('USER-DEV-001');
  const [grantAmount, setGrantAmount] = useState<number>(1000000);
  const [grantReason, setGrantReason] = useState<string>('관리자 긴급 쿼터 충전');
  const [isGranting, setIsGranting] = useState(false);

  // Fetch all meta data
  const fetchAllMeta = async () => {
    setIsLoading(true);
    try {
      const [plansRes, modelsRes, usersRes, ledgerRes] = await Promise.all([
        fetch('/api/agent/meta/plans'),
        fetch('/api/agent/meta/models'),
        fetch('/api/agent/meta/users'),
        fetch(`/api/agent/meta/ledger/${selectedUserId}`),
      ]);

      if (plansRes.ok) {
        const p = await plansRes.json();
        if (p.success) setPlans(p.plans || []);
      }
      if (modelsRes.ok) {
        const m = await modelsRes.json();
        if (m.success) setModels(m.models || []);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        if (u.success) setUsers(u.users || []);
      }
      if (ledgerRes.ok) {
        const l = await ledgerRes.json();
        if (l.success) setAuditLogs(l.recentLogs || []);
      }
    } catch (e: any) {
      console.warn('메타 거버넌스 데이터 조회 실패:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMeta();
  }, [selectedUserId]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 1. 원장 동결 / 해제 토글
  const handleToggleFreeze = async (userId: string, currentFrozen: boolean) => {
    try {
      const res = await fetch('/api/agent/meta/ledger/toggle-freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          freeze: !currentFrozen,
          reason: currentFrozen ? '관리자 수동 동결 해제' : '관리자 수동 긴급 동결',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        await fetchAllMeta();
      } else {
        showToast(data.error || '상태 변경 실패', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 2. 플랜 변경
  const handleChangePlan = async (user: UserAccount, newPlanId: string) => {
    try {
      const res = await fetch('/api/agent/meta/user/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.user_id,
          userName: user.user_name,
          email: user.email,
          orgId: user.org_id,
          planId: newPlanId,
          status: user.status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${user.user_name}님의 플랜이 ${newPlanId}(으)로 변경되었습니다.`);
        await fetchAllMeta();
      } else {
        showToast(data.error || '플랜 변경 실패', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 3. 쿼터 긴급 부여 (GRANT)
  const handleGrantQuota = async () => {
    if (grantAmount <= 0) {
      showToast('충전할 토큰 수는 0보다 커야 합니다.', 'error');
      return;
    }
    setIsGranting(true);
    try {
      const res = await fetch('/api/agent/meta/ledger/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: grantTargetUser,
          tokens: Number(grantAmount),
          reason: grantReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setIsGrantModalOpen(false);
        await fetchAllMeta();
      } else {
        showToast(data.error || '쿼터 충전 실패', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">관리자 메타 거버넌스 & 쿼터 제어 백오피스</h3>
            <p className="text-[11px] text-slate-400">PostgreSQL aiagent 5대 메타 원장 및 다차원 쿼터 정책 관리</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllMeta}
            disabled={isLoading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">동기화</span>
          </button>
          <button
            onClick={() => setIsGrantModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-[0.98]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>쿼터 긴급 충전</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeSubTab === 'users'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>사용자 계정 & 원장 ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('plans')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeSubTab === 'plans'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>요금제 정책 ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('models')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeSubTab === 'models'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>멀티 모델 카탈로그 ({models.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeSubTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>감사 추적 로그 (QTX)</span>
        </button>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Tab 1: 사용자 계정 & 실시간 원장 */}
      {activeSubTab === 'users' && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">사용자 ID / 성명</th>
                  <th className="py-2.5 px-3">요금제</th>
                  <th className="py-2.5 px-3">잔여 / 부여 쿼터</th>
                  <th className="py-2.5 px-3">원장 상태</th>
                  <th className="py-2.5 px-3 text-right">거버넌스 제어</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {users.map((u) => {
                  const total = u.total_granted_quota || 1000000;
                  const remaining = u.remaining_quota || 0;
                  const pct = Math.max(0, Math.min(100, Math.round((remaining / total) * 100)));
                  const isFrozen = u.is_frozen || u.status === 'FROZEN';

                  return (
                    <tr
                      key={u.user_id}
                      onClick={() => setSelectedUserId(u.user_id)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition ${
                        selectedUserId === u.user_id ? 'bg-indigo-950/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{u.user_name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{u.user_id}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={u.plan_id}
                          onChange={(e) => handleChangePlan(u, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="PLAN-FREE">PLAN-FREE (1M)</option>
                          <option value="PLAN-STARTER">PLAN-STARTER (5M)</option>
                          <option value="PLAN-PRO">PLAN-PRO (20M)</option>
                          <option value="PLAN-ENTERPRISE">PLAN-ENTERPRISE (50M)</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 min-w-[160px]">
                        <div className="flex justify-between text-[11px] font-mono mb-1">
                          <span className={remaining < 100000 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                            {remaining.toLocaleString()} T
                          </span>
                          <span className="text-slate-500">/ {total.toLocaleString()} T</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isFrozen
                                ? 'bg-rose-500'
                                : pct > 30
                                ? 'bg-emerald-500'
                                : pct > 10
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border inline-flex items-center gap-1 ${
                            isFrozen
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {isFrozen ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          {isFrozen ? '동결됨 (FROZEN)' : '정상 (ACTIVE)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFreeze(u.user_id, isFrozen);
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
                            isFrozen
                              ? 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border-emerald-700/60'
                              : 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border-rose-700/60'
                          }`}
                        >
                          {isFrozen ? '동결 해제' : '원장 동결'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-400 text-xs flex justify-between items-center">
            <span>선택된 계정: <b className="text-indigo-400 font-mono">{selectedUserId}</b></span>
            <span className="text-[11px]">사용자 행을 클릭하면 하단 감사 추적 로그가 해당 사용자 기준으로 전환됩니다.</span>
          </div>
        </div>
      )}

      {/* Tab 2: 요금제 (Billing Plans) 정책 4종 */}
      {activeSubTab === 'plans' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {plans.map((p) => {
            const isEnterprise = p.plan_id === 'PLAN-ENTERPRISE';
            const isPro = p.plan_id === 'PLAN-PRO';
            return (
              <div
                key={p.plan_id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                  isEnterprise
                    ? 'bg-indigo-950/30 border-indigo-500/50 shadow-lg shadow-indigo-950/30'
                    : isPro
                    ? 'bg-cyan-950/20 border-cyan-500/40'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                      Tier {p.priority_tier}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      ${p.monthly_price_usd}/월
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm mt-2">{p.plan_name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">기본 쿼터:</span>
                    <span className="text-white font-bold">{p.base_quota_tokens.toLocaleString()} T</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">버스트 배수:</span>
                    <span className="text-cyan-400">{p.max_burst_multiplier}x</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">초과 정책:</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        p.overage_policy === 'BLOCK'
                          ? 'bg-rose-500/20 text-rose-300'
                          : p.overage_policy === 'THROTTLE'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {p.overage_policy}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: 멀티 모델 카탈로그 (Multi-Model Catalog) */}
      {activeSubTab === 'models' && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">모델 식별자</th>
                <th className="py-2.5 px-3">티어 / 제공자</th>
                <th className="py-2.5 px-3">컨텍스트 윈도우</th>
                <th className="py-2.5 px-3">1K 입력 단가 (USD)</th>
                <th className="py-2.5 px-3">1K 출력 단가 (USD)</th>
                <th className="py-2.5 px-3 text-right">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
              {models.map((m) => {
                const isPro = m.model_id.includes('pro');
                const isFlash = m.model_id.includes('flash') && !m.model_id.includes('8b');

                return (
                  <tr key={m.model_id} className="hover:bg-slate-800/50 transition font-sans">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white font-mono text-xs">{m.model_id}</div>
                      <div className="text-[11px] text-slate-400">{m.display_name}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isPro
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                            : isFlash
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {m.tier}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1.5">{m.provider}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {m.context_window_tokens.toLocaleString()} T
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">${m.prompt_cost_per_1k_usd}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">${m.completion_cost_per_1k_usd}</td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        가용
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: 감사 추적 로그 (QTX) 실시간 타임라인 */}
      {activeSubTab === 'logs' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>
              계정 <b className="text-indigo-400 font-mono">{selectedUserId}</b>의 최근 쿼터 변동 내역 (최대 20건)
            </span>
            <span className="text-[11px]">불변 감사 원장 (`agent_quota_transaction_log`)</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
              기록된 쿼터 변동 감사 로그가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => {
                const isGrant = log.tx_type === 'GRANT';
                const isDeduct = log.tx_type === 'DEDUCT';
                const isFreeze = log.tx_type === 'FREEZE';

                return (
                  <div
                    key={log.tx_id}
                    className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                          isGrant
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isDeduct
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : isFreeze
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        {isGrant ? '+' : isDeduct ? '-' : '!'}
                      </span>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{log.tx_type}</span>
                          <span className="font-mono text-[11px] text-slate-400 font-normal">({log.tx_id})</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{log.reason_desc}</div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div
                        className={`font-bold ${
                          isGrant ? 'text-emerald-400' : isDeduct ? 'text-cyan-400' : 'text-slate-300'
                        }`}
                      >
                        {isGrant ? `+${log.token_delta.toLocaleString()}` : `-${log.token_delta.toLocaleString()}`} T
                      </div>
                      <div className="text-[11px] text-slate-400">
                        잔여: {log.balance_after.toLocaleString()} T | {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Grant Modal */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                긴급 쿼터 부여 (GRANT)
              </h4>
              <button
                onClick={() => setIsGrantModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">대상 사용자</label>
                <select
                  value={grantTargetUser}
                  onChange={(e) => setGrantTargetUser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                >
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.user_name} ({u.user_id}) - 잔여: {(u.remaining_quota || 0).toLocaleString()}T
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">충전 토큰 수량</label>
                <input
                  type="number"
                  step="100000"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  placeholder="예: 1000000"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {[500000, 1000000, 5000000, 10000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setGrantAmount(amt)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-mono text-slate-300"
                    >
                      +{(amt / 1000000).toFixed(1)}M
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">충전 사유 (감사 기록용)</label>
                <input
                  type="text"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  placeholder="예: 관리자 긴급 쿼터 충전"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsGrantModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                취소
              </button>
              <button
                onClick={handleGrantQuota}
                disabled={isGranting}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white rounded-lg text-xs font-semibold"
              >
                {isGranting ? '충전 중...' : '충전 승인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
