import { useState, useEffect } from 'react';
import { AgentDoc } from '../types';
import { FileText, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DocsGovernanceManager() {
  const [docs, setDocs] = useState<AgentDoc[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/agent/docs');
      const data = await res.json();
      if (data.success) {
        setDocs(data.docs);
      }
    } catch (err) {
      console.error('Failed to load docs:', err);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/agent/docs/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(data.message);
        await fetchDocs();
      }
    } catch (err: any) {
      alert('문서 동기화 실패: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            프로젝트 관리 문서 체계 및 DB 무결성 동기화
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            /docs 폴더 내 7대 표준 마크다운 파일의 SHA-256 해시를 검증하고 purepdfrend_dev.aiagent.agent_docs_meta와 100% 동기화합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {syncMessage && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/60">
              <CheckCircle2 className="w-3.5 h-3.5" /> {syncMessage}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'DB 동기화 중...' : '원클릭 DB 동기화 실행'}
          </button>
        </div>
      </div>

      {/* Docs Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
              <th className="p-3">문서 파일명</th>
              <th className="p-3">문서 제목</th>
              <th className="p-3">SHA-256 콘텐츠 해시 (Local vs DB)</th>
              <th className="p-3">용량</th>
              <th className="p-3 text-right">동기화 상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {docs.map((doc) => (
              <tr key={doc.filePath} className="hover:bg-slate-900/50 transition-colors">
                <td className="p-3 font-mono text-indigo-300 font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  {doc.fileName}
                </td>
                <td className="p-3 font-medium text-white max-w-xs truncate">{doc.title}</td>
                <td className="p-3 font-mono text-[11px] text-slate-400">
                  <div className="truncate max-w-xs" title={doc.contentHash}>
                    {doc.contentHash.substring(0, 16)}...{doc.contentHash.substring(48)}
                  </div>
                </td>
                <td className="p-3 text-slate-400">{(doc.sizeBytes / 1024).toFixed(1)} KB</td>
                <td className="p-3 text-right">
                  {doc.isSynced ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> 동기화 일치 (100%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <AlertTriangle className="w-3 h-3" /> 불일치 (동기화 필요)
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
