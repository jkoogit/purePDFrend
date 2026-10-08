import { useState } from 'react';
import { Button, Input, Badge, Card } from '@shared/components/ui';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  eventType: 'ROLE_UPDATE' | 'IP_BLOCKED' | 'PDF_VIEW' | 'OCR_EXEC' | 'SETTINGS_CHANGE';
  targetResource: string;
  clientIp: string;
  result: 'SUCCESS' | 'BLOCKED' | 'WARN';
}

const INITIAL_LOGS: AuditLogItem[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-10-06 14:10:22',
    actor: 'dev_lead@purepdf.kr',
    eventType: 'ROLE_UPDATE',
    targetResource: 'USER-0921 (ROLE_EDITOR 부여)',
    clientIp: '211.234.120.44',
    result: 'SUCCESS',
  },
  {
    id: 'LOG-002',
    timestamp: '2026-10-06 13:55:01',
    actor: 'system_gate',
    eventType: 'IP_BLOCKED',
    targetResource: '45.33.32.156 (무차별 대입 탐지)',
    clientIp: '45.33.32.156',
    result: 'BLOCKED',
  },
  {
    id: 'LOG-003',
    timestamp: '2026-10-06 13:20:18',
    actor: 'user_0921@corp.com',
    eventType: 'PDF_VIEW',
    targetResource: 'DOC-2026-0041 (840쪽 계약서 열람)',
    clientIp: '121.130.88.19',
    result: 'SUCCESS',
  },
  {
    id: 'LOG-004',
    timestamp: '2026-10-06 12:45:00',
    actor: 'admin_mgr@purepdf.kr',
    eventType: 'SETTINGS_CHANGE',
    targetResource: 'PG-ADM-01 (2FA 필수 적용 스위치 ON)',
    clientIp: '175.209.11.82',
    result: 'SUCCESS',
  },
  {
    id: 'LOG-005',
    timestamp: '2026-10-06 11:10:45',
    actor: 'guest_8812@gmail.com',
    eventType: 'OCR_EXEC',
    targetResource: 'OCR-JOB-771 (이미지 추출 시도)',
    clientIp: '182.222.10.99',
    result: 'WARN',
  },
];

export function AdminLogsView() {
  const [logs] = useState<AuditLogItem[]>(INITIAL_LOGS);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('ALL');
  const [selectedResult, setSelectedResult] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesKeyword =
      !searchKeyword.trim() ||
      log.actor.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      log.clientIp.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      log.targetResource.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      log.id.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchesType = selectedEventType === 'ALL' || log.eventType === selectedEventType;
    const matchesResult = selectedResult === 'ALL' || log.result === selectedResult;

    return matchesKeyword && matchesType && matchesResult;
  });

  return (
    <div className="space-y-4 text-xs">
      {/* 헤더 및 컨트롤 바 (검색 기능 추가 - 요청 6 반영) */}
      <Card variant="subtle" className="p-3.5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div>
          <span className="font-bold text-white text-sm">📋 시스템 다차원 감사로그 및 추적 타임라인</span>
          <p className="text-[11px] text-slate-400 mt-0.5">작업자, IP, 리소스 변경 내역을 실시간 검색 및 모니터링합니다.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="작업자, IP, 리소스 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full sm:w-48 text-xs"
          />
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
          >
            <option value="ALL">전체 이벤트</option>
            <option value="ROLE_UPDATE">권한변경 (ROLE_UPDATE)</option>
            <option value="IP_BLOCKED">IP차단 (IP_BLOCKED)</option>
            <option value="PDF_VIEW">PDF열람 (PDF_VIEW)</option>
            <option value="OCR_EXEC">OCR실행 (OCR_EXEC)</option>
            <option value="SETTINGS_CHANGE">설정변경 (SETTINGS_CHANGE)</option>
          </select>
          <select
            value={selectedResult}
            onChange={(e) => setSelectedResult(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
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
                filteredLogs.map((l) => `${l.id},${l.timestamp},${l.actor},${l.eventType},"${l.targetResource}",${l.clientIp},${l.result}`).join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="whitespace-nowrap text-xs"
          >
            CSV 내보내기
          </Button>
        </div>
      </Card>

      <div className="flex justify-between items-center text-slate-400 text-[11px] px-1">
        <span>
          감사 원장 레코드: <Badge variant="primary" size="sm">{filteredLogs.length}</Badge> / {logs.length}건
        </span>
      </div>

      {/* 데스크톱 테이블 */}
      <div className="hidden md:block bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3">일시</th>
              <th className="p-3">작업자</th>
              <th className="p-3">이벤트 구분</th>
              <th className="p-3">대상 리소스</th>
              <th className="p-3">접속 IP</th>
              <th className="p-3 text-center">결과</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-900/40">
                <td className="p-3 text-slate-400">{log.timestamp}</td>
                <td className="p-3 font-medium text-slate-200">{log.actor}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    log.eventType === 'IP_BLOCKED'
                      ? 'bg-rose-500/10 text-rose-300'
                      : log.eventType === 'ROLE_UPDATE'
                      ? 'bg-purple-500/10 text-purple-300'
                      : 'bg-indigo-500/10 text-indigo-300'
                  }`}>
                    {log.eventType}
                  </span>
                </td>
                <td className="p-3 text-slate-300 font-sans">{log.targetResource}</td>
                <td className="p-3 text-slate-400">{log.clientIp}</td>
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

      {/* 모바일 전용 카드 뷰 (요청 6 반영: 0px 가로스크롤 보장) */}
      <div className="block md:hidden space-y-2.5">
        {filteredLogs.map((log) => (
          <Card key={log.id} variant="subtle" className="p-3 space-y-2">
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
            <div className="font-semibold text-slate-200">{log.targetResource}</div>
            <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
              <div>작업자: <span className="text-slate-300">{log.actor}</span></div>
              <div className="text-right">IP: <span className="text-slate-300">{log.clientIp}</span></div>
            </div>
            <div className="text-[10px] font-mono text-slate-500 text-right">{log.timestamp}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
