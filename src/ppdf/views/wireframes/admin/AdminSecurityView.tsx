import { useState } from 'react';

// PG-ADM-01: 보안관리 (화이트리스트 + 블랙리스트 + 2FA + 세션/오프라인토큰)
export function AdminSecurityView() {
  const [twoFactorEnforced, setTwoFactorEnforced] = useState(true);
  const [geoBlockEnabled, setGeoBlockEnabled] = useState(false);
  const [offlineTokenDays, setOfflineTokenDays] = useState(30);
  const [idleTimeout, setIdleTimeout] = useState('60분');

  const [whitelistIps, setWhitelistIps] = useState<string[]>([
    '192.168.1.0/24 (사내 본사망)',
    '211.234.120.0/24 (IDC 보안 VPN)',
  ]);
  const [blacklistIps, setBlacklistIps] = useState<string[]>([
    '45.33.32.156 (무차별 대입 공격 12회 차단)',
    '185.220.101.5 (Tor Exit Node 실시간 차단)',
  ]);
  const [newWhiteIp, setNewWhiteIp] = useState('');
  const [newBlackIp, setNewBlackIp] = useState('');
  const [blackReason, setBlackReason] = useState('비정상 트래픽 탐지');

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 화이트리스트 관리 */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="font-semibold text-emerald-400">✅ 접근 허용 화이트리스트 (CIDR)</span>
            <span className="text-[11px] text-slate-500">{whitelistIps.length}개 등록</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {whitelistIps.map((ip, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[11px]">
                <span className="text-emerald-300">{ip}</span>
                <button
                  onClick={() => setWhitelistIps(whitelistIps.filter((_, i) => i !== idx))}
                  className="text-slate-500 hover:text-rose-400 px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="192.168.0.0/16"
              value={newWhiteIp}
              onChange={(e) => setNewWhiteIp(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono"
            />
            <button
              onClick={() => {
                if (newWhiteIp.trim()) {
                  setWhitelistIps([...whitelistIps, `${newWhiteIp.trim()} (수동등록)`]);
                  setNewWhiteIp('');
                }
              }}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
            >
              + 추가
            </button>
          </div>
        </div>

        {/* 블랙리스트 관리 (요청 1 반영) */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="font-semibold text-rose-400">🚫 긴급 차단 블랙리스트</span>
            <span className="text-[11px] text-slate-500">{blacklistIps.length}개 차단 중</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {blacklistIps.map((ip, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-rose-950/20 rounded border border-rose-900/40 font-mono text-[11px]">
                <span className="text-rose-300">{ip}</span>
                <button
                  onClick={() => setBlacklistIps(blacklistIps.filter((_, i) => i !== idx))}
                  className="text-rose-400 hover:text-rose-200 px-1 font-sans"
                >
                  차단해제
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-1 border-t border-slate-900">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="차단할 IP (예: 203.0.113.19)"
                value={newBlackIp}
                onChange={(e) => setNewBlackIp(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono"
              />
              <input
                type="text"
                placeholder="차단 사유"
                value={blackReason}
                onChange={(e) => setBlackReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
              />
            </div>
            <button
              onClick={() => {
                if (newBlackIp.trim()) {
                  setBlacklistIps([...blacklistIps, `${newBlackIp.trim()} (${blackReason})`]);
                  setNewBlackIp('');
                }
              }}
              className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium text-xs shadow-md transition-colors"
            >
              🚫 신규 IP 긴급 즉시차단 등록
            </button>
          </div>
        </div>
      </div>

      {/* 2FA 및 세션/토큰 수명 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <h4 className="font-semibold text-slate-200">🔐 2단계 인증(2FA) & 해외 IP 차단</h4>
          <label className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
            <span>2단계 인증(소셜/이메일 OTP) 전사 강제화</span>
            <input type="checkbox" checked={twoFactorEnforced} onChange={(e) => setTwoFactorEnforced(e.target.checked)} className="accent-indigo-500" />
          </label>
          <label className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
            <span>해외 IP 접근 차단 (Geo-Blocking)</span>
            <input type="checkbox" checked={geoBlockEnabled} onChange={(e) => setGeoBlockEnabled(e.target.checked)} className="accent-indigo-500" />
          </label>
        </div>
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <h4 className="font-semibold text-slate-200">⏱ 세션 타임아웃 & 오프라인 토큰 수명주기</h4>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Offline Refresh Token 유효기간</span>
            <span className="font-bold text-indigo-400 font-mono">{offlineTokenDays}일</span>
          </div>
          <input type="range" min="1" max="180" value={offlineTokenDays} onChange={(e) => setOfflineTokenDays(Number(e.target.value))} className="w-full accent-indigo-500" />
          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-400">온라인 유휴 세션 만료</span>
            <select value={idleTimeout} onChange={(e) => setIdleTimeout(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200">
              <option>15분</option>
              <option>30분</option>
              <option>60분</option>
              <option>120분</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
