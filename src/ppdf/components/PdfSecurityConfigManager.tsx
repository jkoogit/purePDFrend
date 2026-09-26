import { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Sliders,
  Eye,
  EyeOff,
  Check,
  Copy,
  Layers,
  FileCheck,
} from 'lucide-react';
import {
  PdfSecurityProfileType,
  PdfCryptoAlgorithm,
} from '../domain/security/models/PdfSecurityPolicy';
import { PdfSecurityFacade, IPdfSecureBundle } from '../domain/security/facade/PdfSecurityFacade';
import { PdfSecurityStrategyFactory } from '../domain/security/factory/PdfSecurityStrategyFactory';
import { PdfSecurityPolicyBuilder } from '../domain/security/builder/PdfSecurityPolicyBuilder';
import { IPdfPermissionFlags } from '../domain/security/models/PdfPermissions';

export default function PdfSecurityConfigManager() {
  const [selectedProfile, setSelectedProfile] = useState<PdfSecurityProfileType>('ENTERPRISE_CONFIDENTIAL');
  const [algorithm, setAlgorithm] = useState<PdfCryptoAlgorithm>('AES_256');
  const [userPassword, setUserPassword] = useState('user1234');
  const [ownerPassword, setOwnerPassword] = useState('adminMaster2026!');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [encryptMetadata, setEncryptMetadata] = useState(true);

  // Granular permissions
  const [permissions, setPermissions] = useState<IPdfPermissionFlags>({
    canPrint: true,
    canModify: false,
    canCopy: false,
    canAnnotate: false,
    canFillForms: false,
    canAccessText: false,
    canAssemble: false,
    canPrintHighQuality: true,
  });

  // Test simulation state
  const [testPasswordInput, setTestPasswordInput] = useState('');
  const [authResult, setAuthResult] = useState<'IDLE' | 'OWNER' | 'USER' | 'INVALID'>('IDLE');
  const [copiedDict, setCopiedDict] = useState(false);

  // Available strategy list from Factory
  const availableStrategies = useMemo(() => {
    return PdfSecurityStrategyFactory.listAvailableStrategies();
  }, []);

  // Handle Strategy Selection
  const handleSelectProfile = (type: string) => {
    const profile = type as PdfSecurityProfileType;
    setSelectedProfile(profile);

    const strategy = PdfSecurityStrategyFactory.getStrategy(profile);
    const policy = strategy.buildPolicy({
      userPassword,
      ownerPassword,
    });

    setAlgorithm(policy.algorithm);
    setEncryptMetadata(policy.encryptMetadata);
    setPermissions({
      canPrint: policy.permissions.canPrint,
      canModify: policy.permissions.canModify,
      canCopy: policy.permissions.canCopy,
      canAnnotate: policy.permissions.canAnnotate,
      canFillForms: policy.permissions.canFillForms,
      canAccessText: policy.permissions.canAccessText,
      canAssemble: policy.permissions.canAssemble,
      canPrintHighQuality: policy.permissions.canPrintHighQuality,
    });
    setAuthResult('IDLE');
  };

  // Build Security Bundle via Facade & Builder
  const secureBundle: IPdfSecureBundle | null = useMemo(() => {
    try {
      const builder = new PdfSecurityPolicyBuilder()
        .withProfileType(selectedProfile)
        .withAlgorithm(algorithm)
        .withUserPassword(userPassword)
        .withOwnerPassword(ownerPassword)
        .withPermissions(permissions)
        .withEncryptMetadata(encryptMetadata);

      const policy = builder.build();
      return PdfSecurityFacade.generateSecurityBundle(policy);
    } catch (e) {
      console.error('Failed to construct security bundle:', e);
      return null;
    }
  }, [selectedProfile, algorithm, userPassword, ownerPassword, permissions, encryptMetadata]);

  // Authenticate password simulation
  const handleTestAuth = () => {
    if (!secureBundle) {
      setAuthResult('USER');
      return;
    }
    const result = PdfSecurityFacade.authenticatePassword(secureBundle, testPasswordInput);
    setAuthResult(result);
  };

  // Copy Dictionary
  const handleCopyDictionary = () => {
    if (!secureBundle) return;
    navigator.clipboard.writeText(secureBundle.encryptDict.rawDictionaryString);
    setCopiedDict(true);
    setTimeout(() => setCopiedDict(false), 2000);
  };

  return (
    <div className="flex flex-col space-y-5 text-slate-200">
      {/* Top Banner: Strategy & Design Patterns Indicator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                PDF 보안 권한 및 상황별 암호화 정책 관리자
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ISO 32000-1 표준
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                문서 배포 시나리오별 보안 프로필 설정, 8대 권한 비트마스크 연산 및 ISO 암호화 딕셔너리 실시간 생성
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60 font-mono">
              디자인 패턴: 전략 · 팩토리 · 빌더 · 파사드
            </span>
          </div>
        </div>

        {/* Situational Profile Cards (Strategy Pattern) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-3.5">
          {availableStrategies.map((s) => {
            const isSelected = selectedProfile === s.type;
            return (
              <button
                key={s.type}
                onClick={() => handleSelectProfile(s.type)}
                className={`flex flex-col text-left p-3 rounded-lg border transition-all relative ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                    {s.type}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-xs font-semibold text-slate-200 line-clamp-1">{s.name}</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                  {s.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Config Panel & Right Live /Encrypt Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Configuration Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Algorithm & Credentials Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                암호화 알고리즘 및 비밀번호 설정
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Key Length: {secureBundle?.policy.keyLengthBits ?? 0} bits
              </span>
            </div>

            {/* Algorithm Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">암호화 알고리즘 규격</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['AES_256', 'AES_128', 'RC4_128', 'NONE'] as PdfCryptoAlgorithm[]).map((alg) => (
                  <button
                    key={alg}
                    onClick={() => {
                      setAlgorithm(alg);
                      setSelectedProfile('CUSTOM');
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      algorithm === alg
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {alg === 'AES_256' && 'AES-256 (금융급)'}
                    {alg === 'AES_128' && 'AES-128 (표준)'}
                    {alg === 'RC4_128' && 'RC4-128 (호환)'}
                    {alg === 'NONE' && '암호화 안함'}
                  </button>
                ))}
              </div>
            </div>

            {/* Passwords Input */}
            {algorithm !== 'NONE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* User Password */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 flex items-center justify-between">
                    <span>열람용 비밀번호 (User)</span>
                    <span className="text-[10px] text-slate-500">열람 시 필수</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showUserPassword ? 'text' : 'password'}
                      value={userPassword}
                      onChange={(e) => {
                        setUserPassword(e.target.value);
                        setSelectedProfile('CUSTOM');
                      }}
                      placeholder="공개 열람 시 비워둠"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUserPassword(!showUserPassword)}
                      className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
                    >
                      {showUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Owner Password */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 flex items-center justify-between">
                    <span>관리자 비밀번호 (Owner)</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">권한 제어용</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showOwnerPassword ? 'text' : 'password'}
                      value={ownerPassword}
                      onChange={(e) => {
                        setOwnerPassword(e.target.value);
                        setSelectedProfile('CUSTOM');
                      }}
                      placeholder="마스터 관리자 암호"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                      className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
                    >
                      {showOwnerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Encrypt Metadata Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  PDF 메타데이터 스트림 암호화 (/EncryptMetadata)
                </div>
                <div className="text-[11px] text-slate-400">
                  TASK-0014-01의 도서 서지·학습 활동 메타데이터까지 암호화하여 외부 노출을 원천 방어합니다.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEncryptMetadata(!encryptMetadata);
                  setSelectedProfile('CUSTOM');
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  encryptMetadata ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </div>

          {/* 2. Granular 8-bit Permissions Matrix */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                ISO 32000-1 8대 세부 권한 비트마스크 설정 (/P)
              </h3>
              <span className="text-[11px] font-mono text-emerald-400">
                P-Mask: {secureBundle?.encryptDict.p ?? 0}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { key: 'canPrint', label: '문서 인쇄 허용 (Bit 3)', desc: '저해상도 또는 일반 인쇄' },
                { key: 'canPrintHighQuality', label: '고해상도 인쇄 허용 (Bit 12)', desc: '원본 품질 고해상도 인쇄' },
                { key: 'canModify', label: '문서 내용 수정 허용 (Bit 4)', desc: '본문 텍스트 및 그래픽 변경' },
                { key: 'canCopy', label: '텍스트·그래픽 복사 허용 (Bit 5)', desc: '클립보드 추출 및 스크랩' },
                { key: 'canAnnotate', label: '주석 및 양식 필드 추가 (Bit 6)', desc: '하이라이트, 스티키 노트 작성' },
                { key: 'canFillForms', label: '대화형 양식 채우기 (Bit 9)', desc: '입력 폼 필드 작성 및 서명' },
                { key: 'canAccessText', label: '접근성 스크린리더 허용 (Bit 10)', desc: '시각장애인 보조기기 텍스트 추출' },
                { key: 'canAssemble', label: '문서 페이지 조합 허용 (Bit 11)', desc: '페이지 회전, 삽입, 분할, 삭제' },
              ].map(({ key, label, desc }) => {
                const isChecked = Boolean(permissions[key as keyof IPdfPermissionFlags]);
                return (
                  <label
                    key={key}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-slate-950 border-indigo-900/60 text-slate-200'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        setPermissions((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }));
                        setSelectedProfile('CUSTOM');
                      }}
                      className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[11px]">{label}</div>
                      <div className="text-[10px] text-slate-500">{desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Real-time Live /Encrypt Dictionary & Auth Simulator (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Dictionary Preview */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-400" />
                PDF /Encrypt 딕셔너리 실시간 생성기
              </h3>
              <button
                onClick={handleCopyDictionary}
                disabled={!secureBundle}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                {copiedDict ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedDict ? '복사됨' : '복사'}
              </button>
            </div>

            {secureBundle ? (
              <div className="space-y-2">
                <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed">
                  {secureBundle.encryptDict.rawDictionaryString}
                </pre>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500">Revision:</span> R{secureBundle.encryptDict.r} (ISO 32000-1)
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500">P-Value:</span> {secureBundle.encryptDict.p} (32-bit int)
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-lg border border-slate-800">
                보안 없음 (NONE) 정책이 선택되어 암호화 딕셔너리가 생성되지 않습니다.
              </div>
            )}
          </div>

          {/* Authentication & Verification Simulator */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                보안 검증 및 인증 시뮬레이터
              </h3>
              <span className="text-[10px] text-slate-400">ISO Alg. 3 & 4 검증</span>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testPasswordInput}
                  onChange={(e) => setTestPasswordInput(e.target.value)}
                  placeholder="테스트할 암호 입력 (User 또는 Owner)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  onClick={handleTestAuth}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shrink-0 shadow-sm"
                >
                  권한 검증
                </button>
              </div>

              {authResult !== 'IDLE' && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
                    authResult === 'OWNER'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : authResult === 'USER'
                      ? 'bg-sky-950/40 border-sky-500/60 text-sky-300'
                      : 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {authResult === 'OWNER' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                    {authResult === 'USER' && <Unlock className="w-4 h-4 text-sky-400" />}
                    {authResult === 'INVALID' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                    <span className="font-semibold">
                      {authResult === 'OWNER' && '소유자(Owner) 마스터 권한 승인: 모든 제한 해제'}
                      {authResult === 'USER' && '열람자(User) 권한 승인: 설정된 비트마스크 권한 준수'}
                      {authResult === 'INVALID' && '인증 실패: 암호가 일치하지 않거나 접근이 차단됨'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
