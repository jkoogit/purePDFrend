import { useState, useEffect } from 'react';
import { Button, Input, Badge, Card } from '@shared/components/ui';
import { ThemeMode, resolveThemeMode, getThemeAdaptiveClasses } from '../../../../styles/tokens';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  eventType: 'ROLE_UPDATE' | 'IP_BLOCKED' | 'PDF_VIEW' | 'OCR_EXEC' | 'SETTINGS_CHANGE' | 'MENU_UPDATE';
  targetResource: string;
  clientIp: string;
  result: 'SUCCESS' | 'BLOCKED' | 'WARN';
}

export interface SystemErrorItem {
  id: string;
  timestamp: string;
  severity: 'FATAL' | 'ERROR' | 'WARN';
  title: string;
  message: string;
  stack: string;
  sourceFile: string;
  resolved: boolean;
}

export interface AdminLogsViewProps {
  themeMode?: ThemeMode;
}

export function AdminLogsView({ themeMode = 'dark' }: AdminLogsViewProps) {
  const resolvedTheme = resolveThemeMode(themeMode);
  const themeClasses = getThemeAdaptiveClasses(resolvedTheme);

  const [activeTab, setActiveTab] = useState<'AUDIT' | 'ERRORS'>('AUDIT');

  // PG-ADM-07: 실시간 감사로그 상태
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('ALL');
  const [selectedResult, setSelectedResult] = useState('ALL');
  const [loadingAudit, setLoadingAudit] = useState(false);

  // PG-ADM-08: 시스템 에러 스택 추적 상태
  const [errors, setErrors] = useState<SystemErrorItem[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedResolved, setSelectedResolved] = useState('ALL');
  const [selectedError, setSelectedError] = useState<SystemErrorItem | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // 1. 감사 로그 비동기 조회 (API 연동)
  const fetchAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const params = new URLSearchParams();
      if (searchKeyword.trim()) params.append('keyword', searchKeyword.trim());
      if (selectedEventType !== 'ALL') params.append('eventType', selectedEventType);
      if (selectedResult !== 'ALL') params.append('result', selectedResult);

      const res = await fetch(`/api/admin/logs/audit?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (e: any) {
      console.warn('감사 로그 조회 폴백:', e.message);
    } finally {
      setLoadingAudit(false);
    }
  };

  // 2. 시스템 에러 로그 비동기 조회 (API 연동)
  const fetchErrorLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSeverity !== 'ALL') params.append('severity', selectedSeverity);
      if (selectedResolved !== 'ALL') params.append('resolved', selectedResolved);

      const res = await fetch(`/api/admin/logs/errors?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.errors)) {
        setErrors(data.errors);
      }
    } catch (e: any) {
      console.warn('에러 로그 조회 폴백:', e.message);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [searchKeyword, selectedEventType, selectedResult]);

  useEffect(() => {
    fetchErrorLogs();
  }, [selectedSeverity, selectedResolved]);

  // 에러 조치 상태 토글
  const handleToggleResolve = async (errId: string, currentResolved: boolean) => {
    try {
      const res = await fetch(`/api/admin/logs/errors/${errId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: !currentResolved }),
      });
      const data = await res.json();
      if (data.success) {
        setErrors(data.errors || errors.map((e) => (e.id === errId ? { ...e, resolved: !currentResolved } : e)));
        if (selectedError && selectedError.id === errId) {
          setSelectedError({ ...selectedError, resolved: !currentResolved });
        }
        setNotice(`✅ [${errId}] 에러가 [${!currentResolved ? '조치 완료' : '미조치'}] 상태로 전환되었습니다.`);
      }
    } catch (e: any) {
      setNotice(`⚠️ 에러 상태 변경 예외: ${e.message}`);
    }
  };

  // 클립보드 복사
  const handleCopyStack = (stack: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(stack);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className={`space-y-4 text-xs ${themeClasses.textMain}`}>
      {notice && (
        <div className="p-3 bg-indigo-950 border border-indigo-500/40 rounded-xl text-indigo-200 flex justify-between items-center shadow-lg">
          <span className="font-medium">{notice}</span>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white px-2">✕</button>
        </div>
      )}

      {/* 2대 메인 탭: PG-ADM-07 실시간 감사로그 vs PG-ADM-08 시스템 에러 스택 추적 */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1.5 rounded-xl border ${themeClasses.panel}`}>
        <Button
          variant={activeTab === 'AUDIT' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('AUDIT')}
          className="w-full text-xs font-semibold min-h-[44px] sm:min-h-[36px]"
        >
          📋 PG-ADM-07: 실시간 접속 및 감사로그 스트림 ({logs.length})
        </Button>
        <Button
          variant={activeTab === 'ERRORS' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('ERRORS')}
          className="w-full text-xs font-semibold min-h-[44px] sm:min-h-[36px]"
        >
          🚨 PG-ADM-08: 시스템 에러 및 예외 스택 추적 ({errors.filter((e) => !e.resolved).length}건 미조치)
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* 1. PG-ADM-07: 실시간 감사로그 스트림 뷰                                    */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-3">
          {/* 헤더 및 컨트롤 바 */}
          <Card variant="subtle" className={`p-3.5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border ${themeClasses.card}`}>
            <div>
              <span className="font-bold text-sm block">📋 시스템 다차원 감사로그 및 추적 타임라인 (Express/DB 연동)</span>
              <p className={`text-[11px] mt-0.5 ${themeClasses.textMuted}`}>작업자, IP, 리소스 변경 내역을 실시간 검색 및 모니터링합니다.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="작업자, IP, 리소스 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className={`w-full sm:w-48 text-xs min-h-[44px] sm:min-h-[32px] ${themeClasses.input}`}
              />
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className={`rounded px-2.5 py-1 text-xs min-h-[44px] sm:min-h-[32px] ${themeClasses.input}`}
              >
                <option value="ALL">전체 이벤트</option>
                <option value="ROLE_UPDATE">권한변경 (ROLE_UPDATE)</option>
                <option value="IP_BLOCKED">IP차단 (IP_BLOCKED)</option>
                <option value="PDF_VIEW">PDF열람 (PDF_VIEW)</option>
                <option value="OCR_EXEC">OCR실행 (OCR_EXEC)</option>
                <option value="SETTINGS_CHANGE">설정변경 (SETTINGS_CHANGE)</option>
                <option value="MENU_UPDATE">메뉴변경 (MENU_UPDATE)</option>
              </select>
              <select
                value={selectedResult}
                onChange={(e) => setSelectedResult(e.target.value)}
                className={`rounded px-2.5 py-1 text-xs min-h-[44px] sm:min-h-[32px] ${themeClasses.input}`}
              >
                <option value="ALL">전체 결과</option>
                <option value="SUCCESS">성공 (SUCCESS)</option>
                <option value="BLOCKED">차단 (BLOCKED)</option>
                <option value="WARN">경고 (WARN)</option>
              </select>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const csvContent =
                    'data:text/csv;charset=utf-8,' +
                    'ID,일시,작업자,이벤트,대상리소스,접속IP,결과\n' +
                    logs.map((l) => `${l.id},${l.timestamp},${l.actor},${l.eventType},"${l.targetResource}",${l.clientIp},${l.result}`).join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="whitespace-nowrap text-xs min-h-[44px] sm:min-h-[32px]"
              >
                CSV 내보내기
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchAuditLogs}
                disabled={loadingAudit}
                className="whitespace-nowrap text-xs min-h-[44px] sm:min-h-[32px]"
              >
                {loadingAudit ? '조회 중...' : '🔄 새로고침'}
              </Button>
            </div>
          </Card>

          <div className={`flex justify-between items-center text-[11px] px-1 ${themeClasses.textMuted}`}>
            <span>
              감사 원장 레코드: <Badge variant="primary" size="sm">{logs.length}</Badge> 건 실시간 스트림
            </span>
          </div>

          {/* 데스크톱 테이블 */}
          <div className={`hidden md:block rounded-xl overflow-hidden border shadow-sm ${themeClasses.panel}`}>
            <table className="w-full text-left">
              <thead className={`border-b border-slate-800 ${themeClasses.shellBg} ${themeClasses.textMuted}`}>
                <tr>
                  <th className="p-3">일시</th>
                  <th className="p-3">작업자</th>
                  <th className="p-3">이벤트 구분</th>
                  <th className="p-3">대상 리소스</th>
                  <th className="p-3">접속 IP</th>
                  <th className="p-3 text-center">결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className={`p-3 ${themeClasses.textMuted}`}>{log.timestamp}</td>
                    <td className="p-3 font-medium font-sans">{log.actor}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.eventType === 'IP_BLOCKED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : log.eventType === 'ROLE_UPDATE'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {log.eventType}
                      </span>
                    </td>
                    <td className="p-3 font-sans">{log.targetResource}</td>
                    <td className={`p-3 ${themeClasses.textMuted}`}>{log.clientIp}</td>
                    <td className="p-3 text-center">
                      <Badge
                        variant={log.result === 'SUCCESS' ? 'success' : log.result === 'BLOCKED' ? 'danger' : 'warning'}
                        size="sm"
                        dot={true}
                      >
                        {log.result}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 전용 카드 뷰 (0px 가로스크롤 보장) */}
          <div className="block md:hidden space-y-2.5">
            {logs.map((log) => (
              <Card key={log.id} variant="subtle" className={`p-3.5 space-y-2 border ${themeClasses.card}`}>
                <div className="flex justify-between items-center">
                  <Badge
                    variant={log.eventType === 'IP_BLOCKED' ? 'danger' : 'primary'}
                    size="sm"
                  >
                    {log.eventType}
                  </Badge>
                  <Badge
                    variant={log.result === 'SUCCESS' ? 'success' : log.result === 'BLOCKED' ? 'danger' : 'warning'}
                    size="sm"
                    dot={true}
                  >
                    {log.result}
                  </Badge>
                </div>
                <div className="font-semibold text-sm">{log.targetResource}</div>
                <div className={`grid grid-cols-2 gap-1 text-[11px] font-mono pt-1 border-t border-slate-800/40 ${themeClasses.textMuted}`}>
                  <div>작업자: <span className="opacity-90">{log.actor}</span></div>
                  <div className="text-right">IP: <span className="opacity-90">{log.clientIp}</span></div>
                </div>
                <div className={`text-[10px] font-mono text-right opacity-70`}>{log.timestamp}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PG-ADM-08: 시스템 에러 및 예외 스택 추적 모달 & 뷰                      */}
      {/* ========================================================================= */}
      {activeTab === 'ERRORS' && (
        <div className="space-y-3">
          <Card variant="subtle" className={`p-3.5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border ${themeClasses.card}`}>
            <div>
              <span className="font-bold text-sm block">🚨 시스템 에러 및 예외 스택 추적 센터 (PG-ADM-08)</span>
              <p className={`text-[11px] mt-0.5 ${themeClasses.textMuted}`}>심각도별 예외 발생 건을 추적하고 소스 콜스택을 정밀 분석합니다.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className={`rounded px-2.5 py-1 text-xs min-h-[44px] sm:min-h-[32px] ${themeClasses.input}`}
              >
                <option value="ALL">전체 심각도</option>
                <option value="FATAL">치명적 (FATAL)</option>
                <option value="ERROR">오류 (ERROR)</option>
                <option value="WARN">경고 (WARN)</option>
              </select>
              <select
                value={selectedResolved}
                onChange={(e) => setSelectedResolved(e.target.value)}
                className={`rounded px-2.5 py-1 text-xs min-h-[44px] sm:min-h-[32px] ${themeClasses.input}`}
              >
                <option value="ALL">전체 조치 상태</option>
                <option value="false">미조치 항목</option>
                <option value="true">조치 완료 항목</option>
              </select>
            </div>
          </Card>

          {/* 에러 목록 카드 뷰 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {errors.map((err) => (
              <div
                key={err.id}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-2.5 shadow-sm transition-all ${
                  err.severity === 'FATAL'
                    ? 'border-rose-500/50 bg-rose-950/20'
                    : err.severity === 'ERROR'
                    ? 'border-amber-500/40 bg-amber-950/20'
                    : `${themeClasses.card}`
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={err.severity === 'FATAL' ? 'danger' : err.severity === 'ERROR' ? 'warning' : 'neutral'}
                      size="sm"
                    >
                      {err.severity}
                    </Badge>
                    <span className="font-bold text-sm">{err.title}</span>
                  </div>
                  <Badge variant={err.resolved ? 'success' : 'danger'} size="sm">
                    {err.resolved ? '✓ 조치 완료' : '⚠️ 미조치'}
                  </Badge>
                </div>

                <p className={`text-xs ${themeClasses.textMuted}`}>{err.message}</p>
                <div className="text-[11px] font-mono opacity-80 truncate">
                  소스: <strong>{err.sourceFile}</strong>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800/40">
                  <span className={`text-[10px] font-mono ${themeClasses.textMuted}`}>{err.timestamp}</span>
                  <div className="flex gap-1.5">
                    <Button
                      variant={err.resolved ? 'secondary' : 'success'}
                      size="sm"
                      onClick={() => handleToggleResolve(err.id, err.resolved)}
                      className="text-xs px-2.5 py-1 min-h-[36px] sm:min-h-[28px]"
                    >
                      {err.resolved ? '재오픈' : '조치 완료'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedError(err);
                        setShowErrorModal(true);
                      }}
                      className="text-xs px-3 py-1 min-h-[36px] sm:min-h-[28px]"
                    >
                      스택 추적 🔍
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PG-ADM-08: 스택트레이스 상세 모달 */}
      {showErrorModal && selectedError && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${themeClasses.panel}`}>
            <div className={`p-4 border-b border-slate-800 flex justify-between items-center ${themeClasses.shellBg}`}>
              <div className="flex items-center gap-2.5">
                <Badge variant={selectedError.severity === 'FATAL' ? 'danger' : 'warning'} size="sm">
                  {selectedError.severity}
                </Badge>
                <h3 className="font-bold text-base">{selectedError.title} ({selectedError.id})</h3>
              </div>
              <button
                onClick={() => setShowErrorModal(false)}
                className="text-slate-400 hover:text-white px-2 py-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <div className="space-y-1">
                <span className={`text-xs font-semibold ${themeClasses.textMuted}`}>오류 요약 메시지:</span>
                <p className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-rose-300 border border-slate-800">
                  {selectedError.message}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-semibold ${themeClasses.textMuted}`}>콜스택 및 예외 추적 (StackTrace):</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopyStack(selectedError.stack)}
                    className="text-[11px] px-2 py-0.5"
                  >
                    {copySuccess ? '✓ 복사됨' : '📋 스택 복사'}
                  </Button>
                </div>
                <pre className="p-3 rounded-lg bg-slate-950 text-indigo-200 font-mono text-[11px] overflow-x-auto border border-slate-800 whitespace-pre leading-relaxed max-h-[300px]">
                  {selectedError.stack}
                </pre>
              </div>

              <div className={`grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800/40 ${themeClasses.textMuted}`}>
                <div>발생 시각: <strong>{selectedError.timestamp}</strong></div>
                <div className="text-right">추적 소스: <strong>{selectedError.sourceFile}</strong></div>
              </div>
            </div>

            <div className={`p-4 border-t border-slate-800 flex justify-end gap-2 ${themeClasses.shellBg}`}>
              <Button
                variant={selectedError.resolved ? 'secondary' : 'success'}
                size="sm"
                onClick={() => handleToggleResolve(selectedError.id, selectedError.resolved)}
                className="text-xs min-h-[44px] sm:min-h-[36px]"
              >
                {selectedError.resolved ? '미조치로 전환' : '✓ 조치 완료로 표시'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowErrorModal(false)}
                className="text-xs min-h-[44px] sm:min-h-[36px]"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
