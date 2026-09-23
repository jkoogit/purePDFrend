import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';

interface ModelPolicyGovernanceViewProps {
  dbStatus?: string;
}

export default function ModelPolicyGovernanceView({ dbStatus = 'CONNECTED' }: ModelPolicyGovernanceViewProps) {
  const [activeTab, setActiveTab] = useState<'vendor' | 'user' | 'accounts'>('vendor');
  const [vendors, setVendors] = useState<any[]>([]);
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [sessionSnapshot, setSessionSnapshot] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // 1. Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [vRes, aRes, sRes] = await Promise.all([
        fetch('/api/agent/system/vendor-attributes').then(r => r.json()),
        fetch('/api/agent/user/ai-accounts').then(r => r.json()),
        fetch('/api/agent/session/resync-quota', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'USER-DEV-001' })
        }).then(r => r.json())
      ]);

      if (vRes.success) setVendors(vRes.vendors);
      if (aRes.success) setUserAccounts(aRes.accounts);
      if (sRes.success) {
        setSessionSnapshot(sRes.snapshot);
      }
    } catch (err) {
      console.error('Failed to load governance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. On-demand Re-sync handler
  const handleResync = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/session/resync-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'USER-DEV-001' })
      });
      const data = await res.json();
      if (data.success) {
        setSessionSnapshot(data.snapshot);
        setSyncMessage(`자원 현황이 현행화되었습니다 (${data.syncSource}, 잔여: ${data.snapshot.resourceBaseline.currentTokenBalance.toLocaleString()} 토큰)`);
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } catch (err: any) {
      setSyncMessage(`현행화 실패: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Switch default AI account
  const handleSetDefaultAccount = async (accountId: string) => {
    setIsLoading(true);
    try {
      const target = userAccounts.find(a => a.accountId === accountId);
      if (!target) return;
      await fetch('/api/agent/user/ai-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...target,
          isDefault: true
        })
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const baseline = sessionSnapshot?.resourceBaseline;
  const tierPolicy = sessionSnapshot?.tierPolicy;

  return (
    <div className="flex flex-col h-full gap-4 text-slate-200">
      {/* Top Banner: Active Session Snapshot & On-Demand Re-sync Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">세션 자원 현황 및 티어 정책</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {dbStatus === 'CONNECTED' ? '원장 실시간 연동' : '로컬 모드'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            활성 계정: <span className="text-indigo-300 font-mono">{sessionSnapshot?.accountEmail || 'jkoogit@gmail.com'}</span> | 플랜: <span className="text-slate-300 font-semibold">{sessionSnapshot?.planName || 'Google AI Pro'}</span>
          </p>
        </div>

        {/* Snapshot Summary Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400">잔여 토큰 예산</div>
              <div className="text-xs font-bold text-amber-300 font-mono">
                {baseline?.currentTokenBalance?.toLocaleString() || '5,000,000'} <span className="text-[10px] text-slate-400">Tokens</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400">Tier 1 Pro 잔여 횟수</div>
              <div className="text-xs font-bold text-sky-300 font-mono">
                {Math.max(0, (tierPolicy?.tier1?.rpdLimit || 250) - (baseline?.dailyRpdConsumed || 0))} / {tierPolicy?.tier1?.rpdLimit || 250} <span className="text-[10px] text-slate-400">회</span>
              </div>
            </div>
          </div>

          {/* On-Demand Re-sync Button */}
          <button
            onClick={handleResync}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>자원 현황 현행화</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-2 rounded-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* 3대 설정 영역 탭 네비게이션 */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('vendor')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'vendor'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span>1. 벤더별 속성 관리 (AI수집/시스템등록)</span>
        </button>

        <button
          onClick={() => setActiveTab('user')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'user'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>2. 사용자 관리 (글로벌 티어 적용모델)</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'accounts'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>3. 사용자 계정별 모델·에이전트 관리 (복수 Gemini)</span>
        </button>
      </div>

      {/* 탭 1: 벤더별 속성 관리 */}
      {activeTab === 'vendor' && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <div key={v.vendorId} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{v.vendorName}</span>
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                      {v.vendorId}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    v.originType === 'AI_COLLECTED' 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  }`}>
                    {v.originType === 'AI_COLLECTED' ? 'AI 자동수집' : '시스템 승인등록'}
                  </span>
                </div>

                {/* 구독 유형 및 요금제 */}
                <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-2">
                  <span className="text-[11px] font-semibold text-slate-400">1.1 구독 유형 & 쿼터 기준정보:</span>
                  {(v.subscriptionPlans || []).map((p: any) => (
                    <div key={p.planId} className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/40 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-indigo-200">{p.planName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.billingType}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-300 mt-1">
                        <div>Max TPM: <span className="font-mono text-slate-200">{p.quotaLimits?.maxTpm?.toLocaleString()}</span></div>
                        <div>Max RPM: <span className="font-mono text-slate-200">{p.quotaLimits?.maxRpm}회</span></div>
                        <div>Max RPD: <span className="font-mono text-amber-300 font-semibold">{p.quotaLimits?.maxRpd}회</span></div>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        리셋 기준: KST {p.quotaLimits?.resetHourKst}:00 (PST 00:00)
                      </div>
                    </div>
                  ))}
                </div>

                {/* 에이전트 엔진 관리 */}
                <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-2">
                  <span className="text-[11px] font-semibold text-slate-400">1.2 에이전트 엔진 & 티어 매핑:</span>
                  <div className="flex flex-col gap-1">
                    {(v.agentEngines || []).map((eng: any) => (
                      <div key={eng.agentId} className="flex items-center justify-between text-xs bg-slate-800/40 px-2 py-1.5 rounded">
                        <span className="text-slate-300">{eng.agentName}</span>
                        <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded">
                          {eng.defaultModel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 탭 2: 사용자 관리 */}
      {activeTab === 'user' && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-2">개발자 계정 및 글로벌 티어 선호모델</h3>
            <p className="text-xs text-slate-400 mb-4">
              사용자에게 할당된 기본 티어별 모델을 설정합니다. 개별 AI 계정에서 오버라이드하지 않는 한 본 설정이 세션에 자동 상속됩니다.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">사용자 ID</th>
                    <th className="py-2.5 px-3">이름/이메일</th>
                    <th className="py-2.5 px-3">Tier 1 (기획/설계)</th>
                    <th className="py-2.5 px-3">Tier 2 (구현/TDD)</th>
                    <th className="py-2.5 px-3">Tier 3 (정리/배포)</th>
                    <th className="py-2.5 px-3">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-white">USR-DEV-001</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">Koogit Developer</div>
                      <div className="text-[10px] text-slate-400">jkoogit@gmail.com</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                        models/gemini-1.5-pro
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        models/gemini-1.5-flash
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        models/gemini-1.5-flash-8b
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                        정상 활성
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 탭 3: 사용자 계정별 모델 및 에이전트 관리 (복수 Gemini 계정) */}
      {activeTab === 'accounts' && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              사용자가 보유한 여러 개의 Gemini AI 계정을 등록하고, 세션 착수 시 사용할 기본(Default) 계정을 선택할 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userAccounts.map((acc) => (
              <div 
                key={acc.accountId} 
                className={`bg-slate-900 border rounded-xl p-4 flex flex-col gap-3 relative transition-all ${
                  acc.isDefault ? 'border-indigo-500 shadow-md shadow-indigo-500/10' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{acc.accountLabel}</span>
                    {acc.isDefault && (
                      <span className="text-[10px] bg-indigo-600 text-white font-semibold px-2 py-0.5 rounded-full">
                        현재 기본 계정
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-400">{acc.vendorId}</span>
                </div>

                <div className="text-xs text-slate-300 font-mono bg-slate-800/60 p-2 rounded border border-slate-700/50">
                  {acc.accountEmail}
                </div>

                {/* 계정별 티어 오버라이드 설정 현황 */}
                <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-2 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400">계정별 티어 모델 오버라이드:</span>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="bg-slate-800/80 p-1.5 rounded">
                      <div className="text-slate-400">Tier 1</div>
                      <div className="font-mono text-indigo-300 truncate">{acc.tierOverride?.tier1Model || '글로벌 상속'}</div>
                    </div>
                    <div className="bg-slate-800/80 p-1.5 rounded">
                      <div className="text-slate-400">Tier 2</div>
                      <div className="font-mono text-emerald-300 truncate">{acc.tierOverride?.tier2Model || '글로벌 상속'}</div>
                    </div>
                    <div className="bg-slate-800/80 p-1.5 rounded">
                      <div className="text-slate-400">Tier 3</div>
                      <div className="font-mono text-slate-300 truncate">{acc.tierOverride?.tier3Model || '글로벌 상속'}</div>
                    </div>
                  </div>
                </div>

                {/* 하단 기본 계정 지정 버튼 */}
                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
                  {!acc.isDefault ? (
                    <button
                      onClick={() => handleSetDefaultAccount(acc.accountId)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 rounded-lg border border-slate-700 transition-all cursor-pointer"
                    >
                      기본 활성 계정으로 지정
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>세션 시작 시 자동 적용 중</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
