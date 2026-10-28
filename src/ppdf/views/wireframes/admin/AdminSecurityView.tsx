import React, { useState, useEffect } from 'react';
import { Button, Input, Badge, Card, CardHeader, CardTitle, CardContent } from '@shared/components/ui';

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
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // 1. Fetch real security configuration from backend
  const loadSecurityIps = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/security/ips');
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.whitelist)) setWhitelistIps(data.whitelist);
        if (Array.isArray(data.blacklist)) setBlacklistIps(data.blacklist);
        if (data.twoFactorEnforced !== undefined) setTwoFactorEnforced(data.twoFactorEnforced);
        if (data.geoBlockEnabled !== undefined) setGeoBlockEnabled(data.geoBlockEnabled);
        if (data.offlineTokenDays !== undefined) setOfflineTokenDays(data.offlineTokenDays);
        if (data.idleTimeout !== undefined) setIdleTimeout(data.idleTimeout);
      }
    } catch (e: any) {
      console.warn('보안 설정 로드 예외 (로컬 기본값 유지):', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityIps();
  }, []);

  const handleAddIp = async (type: 'white' | 'black') => {
    const ip = type === 'white' ? newWhiteIp.trim() : newBlackIp.trim();
    const reason = type === 'white' ? '수동 등록' : blackReason.trim();
    if (!ip) return;

    try {
      const res = await fetch('/api/admin/security/ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ip, reason }),
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'white') {
          setWhitelistIps(data.whitelist);
          setNewWhiteIp('');
        } else {
          setBlacklistIps(data.blacklist);
          setNewBlackIp('');
        }
        setNotice(`${type === 'white' ? '화이트리스트' : '블랙리스트'}에 성공적으로 등록되었습니다.`);
        setTimeout(() => setNotice(null), 3000);
      }
    } catch {
      // Fallback
      if (type === 'white') {
        setWhitelistIps([...whitelistIps, `${ip} (${reason})`]);
        setNewWhiteIp('');
      } else {
        setBlacklistIps([...blacklistIps, `${ip} (${reason})`]);
        setNewBlackIp('');
      }
    }
  };

  const handleDeleteIp = async (type: 'white' | 'black', ip: string) => {
    try {
      const res = await fetch('/api/admin/security/ips', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ip }),
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'white') setWhitelistIps(data.whitelist);
        else setBlacklistIps(data.blacklist);
        setNotice('삭제되었습니다.');
        setTimeout(() => setNotice(null), 2500);
      }
    } catch {
      if (type === 'white') setWhitelistIps(whitelistIps.filter((i) => i !== ip));
      else setBlacklistIps(blacklistIps.filter((i) => i !== ip));
    }
  };

  const handleUpdateConfig = async (partial: Record<string, any>) => {
    try {
      await fetch('/api/admin/security/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
    } catch (e: any) {
      console.warn('보안 정책 동기화 예외:', e.message);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {notice && (
        <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-300 flex items-center justify-between animate-in fade-in duration-200">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 화이트리스트 관리 */}
        <Card variant="subtle">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-emerald-400 flex items-center gap-1.5">
              <span>✅</span> 접근 허용 화이트리스트 (CIDR)
            </CardTitle>
            <Badge variant="success" size="sm">
              {loading ? '동기화 중...' : `${whitelistIps.length}개 등록`}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {whitelistIps.map((ip, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px]">
                  <span className="text-emerald-300 break-all">{ip}</span>
                  <button
                    onClick={() => handleDeleteIp('white', ip)}
                    className="text-slate-500 hover:text-rose-400 px-1.5 py-0.5 rounded cursor-pointer transition-colors shrink-0"
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="192.168.0.0/16"
                  value={newWhiteIp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWhiteIp(e.target.value)}
                  className="font-mono"
                  touchTarget={false}
                />
              </div>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleAddIp('white')}
              >
                + 추가
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 블랙리스트 관리 */}
        <Card variant="subtle">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-rose-400 flex items-center gap-1.5">
              <span>🚫</span> 긴급 차단 블랙리스트
            </CardTitle>
            <Badge variant="danger" size="sm">
              {blacklistIps.length}개 차단 중
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {blacklistIps.map((ip, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-rose-950/20 rounded-lg border border-rose-900/40 font-mono text-[11px]">
                  <span className="text-rose-300 break-all">{ip}</span>
                  <button
                    onClick={() => handleDeleteIp('black', ip)}
                    className="text-rose-400 hover:text-rose-200 px-2 py-0.5 rounded cursor-pointer font-sans transition-colors shrink-0"
                  >
                    차단해제
                  </button>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-1 border-t border-slate-900">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  type="text"
                  placeholder="차단할 IP (예: 203.0.113.19)"
                  value={newBlackIp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBlackIp(e.target.value)}
                  className="font-mono"
                  touchTarget={false}
                />
                <Input
                  type="text"
                  placeholder="차단 사유"
                  value={blackReason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlackReason(e.target.value)}
                  touchTarget={false}
                />
              </div>
              <Button
                variant="danger"
                size="sm"
                className="w-full"
                onClick={() => handleAddIp('black')}
              >
                🚫 신규 IP 긴급 즉시차단 등록
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2FA 및 세션/토큰 수명 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="subtle">
          <CardHeader>
            <CardTitle>🔐 2단계 인증(2FA) & 해외 IP 차단</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <label className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <span className="text-slate-200">2단계 인증(소셜/이메일 OTP) 전사 강제화</span>
              <input
                type="checkbox"
                checked={twoFactorEnforced}
                onChange={(e) => {
                  setTwoFactorEnforced(e.target.checked);
                  handleUpdateConfig({ twoFactorEnforced: e.target.checked });
                }}
                className="accent-blue-500 w-4 h-4 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <span className="text-slate-200">해외 IP 접근 차단 (Geo-Blocking)</span>
              <input
                type="checkbox"
                checked={geoBlockEnabled}
                onChange={(e) => {
                  setGeoBlockEnabled(e.target.checked);
                  handleUpdateConfig({ geoBlockEnabled: e.target.checked });
                }}
                className="accent-blue-500 w-4 h-4 cursor-pointer"
              />
            </label>
          </CardContent>
        </Card>

        <Card variant="subtle">
          <CardHeader>
            <CardTitle>⏱ 세션 타임아웃 & 오프라인 토큰 수명주기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Offline Refresh Token 유효기간</span>
              <Badge variant="primary" size="sm" className="font-bold">
                {offlineTokenDays}일
              </Badge>
            </div>
            <input
              type="range"
              min="1"
              max="180"
              value={offlineTokenDays}
              onChange={(e) => {
                const val = Number(e.target.value);
                setOfflineTokenDays(val);
                handleUpdateConfig({ offlineTokenDays: val });
              }}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between items-center pt-1 border-t border-slate-850">
              <span className="text-slate-400">온라인 유휴 세션 만료</span>
              <select
                value={idleTimeout}
                onChange={(e) => {
                  setIdleTimeout(e.target.value);
                  handleUpdateConfig({ idleTimeout: e.target.value });
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option>15분</option>
                <option>30분</option>
                <option>60분</option>
                <option>120분</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


