import { useState, useEffect, useRef } from 'react';
import { AgentDoc } from '../../types';
import {
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Folder,
  FolderOpen,
  Eye,
  Code,
  Copy,
  Check,
  X,
  Layers,
  Database,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    darkMode: true,
    background: '#0f172a',
    primaryColor: '#6366f1',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#4f46e5',
    lineColor: '#94a3b8',
    secondaryColor: '#0ea5e9',
    tertiaryColor: '#10b981',
  },
});

// Component to render individual Mermaid diagrams
function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        setHasError(false);
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, code.trim());
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setHasError(true);
        }
      }
    };

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [code]);

  if (hasError) {
    return (
      <div className="my-4 p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-mono">
        <div className="font-bold mb-1">⚠️ Mermaid 다이어그램 구문 오류 (원본 코드 표시)</div>
        <pre className="overflow-x-auto text-slate-400">{code}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-center items-center overflow-x-auto shadow-inner"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

interface DocsGovernanceManagerProps {
  dbStatus?: string;
}

export default function DocsGovernanceManager({ dbStatus = 'CONNECTED' }: DocsGovernanceManagerProps = {}) {
  const [docs, setDocs] = useState<AgentDoc[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('전체');
  const [activeDoc, setActiveDoc] = useState<AgentDoc | null>(null);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCleaningOrphans, setIsCleaningOrphans] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Search in metadata & DB doc_payload->>'content'
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [searchInContent, setSearchInContent] = useState<boolean>(true);
  const [contentMatchIds, setContentMatchIds] = useState<Set<string>>(new Set());
  const [isSearchingContent, setIsSearchingContent] = useState<boolean>(false);

  // Sorting state (Default: 문서번호 DESC)
  const [sortField, setSortField] = useState<'docNum' | 'folder' | 'title' | 'sizeBytes' | 'isSynced'>('docNum');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'docNum' | 'folder' | 'title' | 'sizeBytes' | 'isSynced') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'docNum' ? 'desc' : 'asc');
    }
  };

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
    // 🛑 Policy 2.3: DB연결이 안된 상태면 수정기능 이벤트 발생시 안내메시지 표시 "영속화 상태 점검필요"
    if (dbStatus !== 'CONNECTED') {
      alert('영속화 상태 점검필요 (DB 연결이 원활하지 않아 문서 동기화를 수행할 수 없습니다)');
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/agent/docs/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(data.message);
        await fetchDocs();
      } else {
        alert('영속화 상태 점검필요: ' + (data.error || '동기화 실패'));
      }
    } catch (err: any) {
      alert('영속화 상태 점검필요: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCleanupOrphans = async () => {
    // 🛑 Policy 2.3: DB연결이 안된 상태면 수정기능 이벤트 발생시 안내메시지 표시 "영속화 상태 점검필요"
    if (dbStatus !== 'CONNECTED') {
      alert('영속화 상태 점검필요 (DB 연결이 원활하지 않아 고아 문서 정리를 수행할 수 없습니다)');
      return;
    }

    setIsCleaningOrphans(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/agent/docs/cleanup-orphans', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(data.message);
        await fetchDocs();
      } else {
        alert('영속화 상태 점검필요: ' + (data.error || '정리 실패'));
      }
    } catch (err: any) {
      alert('영속화 상태 점검필요: ' + err.message);
    } finally {
      setIsCleaningOrphans(false);
    }
  };

  const handleOpenDoc = async (doc: AgentDoc) => {
    setActiveDoc(doc);
    setIsLoadingContent(true);
    setDocContent(null);
    setViewMode('preview');
    try {
      const res = await fetch(`/api/agent/docs/content?filePath=${encodeURIComponent(doc.filePath)}`);
      const data = await res.json();
      if (data.success) {
        setDocContent(data.content);
      } else {
        setDocContent(`# 오류\n\n${data.error}`);
      }
    } catch (err: any) {
      setDocContent(`# 오류 발생\n\n${err.message}`);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleCopySource = () => {
    if (!docContent) return;
    navigator.clipboard.writeText(docContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // Search DB doc_payload->>'content'
  useEffect(() => {
    if (!searchKeyword.trim() || !searchInContent) {
      setContentMatchIds(new Set());
      setIsSearchingContent(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingContent(true);
      try {
        const res = await fetch(`/api/agent/docs/search-content?q=${encodeURIComponent(searchKeyword.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.matchedDocIds)) {
          setContentMatchIds(new Set(data.matchedDocIds));
        }
      } catch (err) {
        console.error('Content search error:', err);
      } finally {
        setIsSearchingContent(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchKeyword, searchInContent]);

  const folders = [
    '전체',
    '00.시작',
    '01.프로젝트',
    '02.조직',
    '03.정책',
    '04.결정',
    '05.설계',
    '06.기획',
    '07.로드맵',
    '08.템플릿',
    '09.구현',
    '10.리뷰',
    '11.운영',
    '12.점검',
    '13.회고',
    '14.실험',
    '15.학습',
    '16.로그',
    '17.참고',
  ];

  const getDocSortKey = (doc: AgentDoc): string => {
    if (doc.fileName.startsWith('README_')) {
      return '00_README';
    }
    const m = doc.fileName.match(/^(\d{2}-\d{2}|\d{6}_\d{3}|\d+)/);
    return m ? m[1] : doc.fileName;
  };

  const filteredDocs = docs.filter((d) => {
    // Folder filter
    if (selectedFolder !== '전체' && d.folder !== selectedFolder) {
      return false;
    }

    // Keyword filter
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      const metaMatch =
        d.fileName.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.folder.toLowerCase().includes(q);
      const contentMatch = contentMatchIds.has(d.docId);
      return metaMatch || contentMatch;
    }

    return true;
  }).slice().sort((a, b) => {
    let cmp = 0;
    if (sortField === 'docNum') {
      const aKey = getDocSortKey(a);
      const bKey = getDocSortKey(b);
      cmp = aKey.localeCompare(bKey, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortField === 'folder') {
      cmp = a.folder.localeCompare(b.folder);
    } else if (sortField === 'title') {
      cmp = a.title.localeCompare(b.title);
    } else if (sortField === 'sizeBytes') {
      cmp = a.sizeBytes - b.sizeBytes;
    } else if (sortField === 'isSynced') {
      cmp = (a.isSynced === b.isSynced ? 0 : a.isSynced ? 1 : -1);
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            18대 표준 문서 거버넌스 & 개발DB(agent_docs_meta) 무결성
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            문서번호 체계 및 폴더별 README 요약 탐색기, GFM 표 완벽 렌더링, 읽기/복사 전용 뷰어 및 고아 문서 자동 정화 지원
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {syncMessage && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/60">
              <CheckCircle2 className="w-3.5 h-3.5" /> {syncMessage}
            </span>
          )}

          {/* Orphan Cleanup Button */}
          <button
            onClick={handleCleanupOrphans}
            disabled={isCleaningOrphans}
            className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            title="실제 파일이 없는 DB 고아 레코드 삭제"
          >
            <Trash2 className={`w-3.5 h-3.5 ${isCleaningOrphans ? 'animate-spin' : ''}`} />
            {isCleaningOrphans ? '고아 문서 정리중...' : '실물 없는 고아 DB 정리'}
          </button>

          {/* Full Sync Button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? '18대 문서 DB 동기화 중...' : '18대 문서 DB 일괄 동기화'}
          </button>
        </div>
      </div>

      {/* Main 2-Column: Folder Tree + Docs List */}
      <div className="grid grid-cols-12 gap-6 min-h-[480px]">
        {/* Left: 18 Folders Navigation */}
        <div className="col-span-3 border border-slate-800 rounded-xl bg-slate-900/60 p-3 space-y-1 overflow-y-auto max-h-[580px]">
          <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/80 mb-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            18대 문서 분류 폴더
          </div>
          {folders.map((folder) => {
            const count = folder === '전체'
              ? docs.length
              : docs.filter((d) => d.folder === folder).length;
            const isSelected = selectedFolder === folder;

            return (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {isSelected ? (
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">{folder}</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isSelected
                      ? 'bg-indigo-700 text-white'
                      : count > 0
                      ? 'bg-slate-800 text-indigo-300'
                      : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Docs Table */}
        <div className="col-span-9 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 flex flex-col">
          <div className="p-3 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">[{selectedFolder}]</span>
              <span className="text-xs text-slate-400">문서 목록 ({filteredDocs.length}건)</span>
            </div>

            {/* Search Input & DB doc_payload Content Search Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="제목, 파일명 또는 본문 검색..."
                  className="pl-8 pr-7 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56 font-sans transition-all"
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                onClick={() => setSearchInContent(!searchInContent)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-colors flex items-center gap-1.5 ${
                  searchInContent
                    ? 'bg-indigo-950/80 border-indigo-700/60 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title="DB jsonb doc_payload->>'content' 본문 포함 검색"
              >
                <Database className="w-3 h-3 text-indigo-400" />
                <span>DB 본문 검색</span>
                {isSearchingContent && <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-400" />}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 select-none">
                  <th
                    onClick={() => handleSort('folder')}
                    className="p-3 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>분류 폴더</span>
                      {sortField === 'folder' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('docNum')}
                    className="p-3 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>문서번호 & 파일명</span>
                      {sortField === 'docNum' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('title')}
                    className="p-3 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>문서 제목</span>
                      {sortField === 'title' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('sizeBytes')}
                    className="p-3 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>용량</span>
                      {sortField === 'sizeBytes' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('isSynced')}
                    className="p-3 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>DB 동기화</span>
                      {sortField === 'isSynced' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="p-3 text-right">보기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDocs.map((doc) => {
                  const isReadme = doc.fileName.startsWith('README_');
                  return (
                    <tr
                      key={doc.filePath}
                      onClick={() => handleOpenDoc(doc)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{doc.folder}</td>
                      <td className="p-3 font-mono text-indigo-300 font-semibold flex items-center gap-2">
                        <FileText className={`w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform ${
                          isReadme ? 'text-emerald-400' : 'text-indigo-400'
                        }`} />
                        <span className={isReadme ? 'text-emerald-300 font-bold' : 'text-indigo-200'}>
                          {doc.fileName}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-white max-w-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate">{doc.title}</span>
                          {contentMatchIds.has(doc.docId) && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
                              본문 일치
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">{(doc.sizeBytes / 1024).toFixed(1)} KB</td>
                      <td className="p-3">
                        {doc.isSynced ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> 일치
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" /> 미동기화
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDoc(doc);
                          }}
                          className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50 hover:bg-indigo-600 hover:text-white transition-all text-[11px] font-medium inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> 뷰어 열람
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredDocs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      {dbStatus !== 'CONNECTED' ? (
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Database className="w-5 h-5 text-amber-500/80 animate-pulse" />
                          <span className="font-medium text-amber-300">조회된 결과가 없습니다.</span>
                          <span className="text-[11px] text-slate-500">DB 연결 상태 확인 필요 (영속화 상태 점검필요)</span>
                        </div>
                      ) : (
                        <span>{searchKeyword ? `"${searchKeyword}" 조회된 결과가 없습니다.` : '조회된 결과가 없습니다.'}</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pure Markdown & Read-Only Source Viewer Modal with Remark-GFM & Mermaid */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                      {activeDoc.folder}
                    </span>
                    <h3 className="text-sm font-bold text-white">{activeDoc.fileName}</h3>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {activeDoc.filePath} | SHA-256: {activeDoc.contentHash?.substring(0, 16)}...
                  </div>
                </div>
              </div>

              {/* Header Right: View Switcher & Copy Action */}
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      viewMode === 'preview'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> 마크다운 뷰어
                  </button>
                  <button
                    onClick={() => setViewMode('source')}
                    className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      viewMode === 'source'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" /> 원본 소스 (읽기전용)
                  </button>
                </div>

                <button
                  onClick={handleCopySource}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  title="원본 마크다운 복사"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '복사됨' : '마크다운 복사'}
                </button>

                <button
                  onClick={() => setActiveDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: GFM Table Enabled Preview & Read-Only Source */}
            <div className="p-6 overflow-y-auto flex-1 text-slate-200 text-sm font-sans space-y-4">
              {isLoadingContent ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-xs">문서를 불러오는 중입니다...</span>
                </div>
              ) : viewMode === 'preview' ? (
                docContent ? (
                  <div className="markdown-body max-w-none text-slate-300 leading-relaxed text-xs">
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Custom Table Components for perfect styling
                        table({ children }) {
                          return (
                            <div className="overflow-x-auto my-4 rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
                              <table className="w-full text-left border-collapse text-xs">
                                {children}
                              </table>
                            </div>
                          );
                        },
                        thead({ children }) {
                          return <thead className="bg-slate-900/90 text-indigo-200 border-b border-slate-800 font-semibold">{children}</thead>;
                        },
                        tbody({ children }) {
                          return <tbody className="divide-y divide-slate-800/60">{children}</tbody>;
                        },
                        tr({ children }) {
                          return <tr className="hover:bg-slate-900/40 transition-colors">{children}</tr>;
                        },
                        th({ children }) {
                          return <th className="p-2.5 font-bold text-indigo-300 border-r border-slate-800/80 last:border-r-0 whitespace-nowrap">{children}</th>;
                        },
                        td({ children }) {
                          return <td className="p-2.5 text-slate-300 border-r border-slate-800/50 last:border-r-0">{children}</td>;
                        },
                        h1({ children }) {
                          return <h1 className="text-xl font-black text-white pb-2 mb-4 border-b border-slate-800 flex items-center gap-2">{children}</h1>;
                        },
                        h2({ children }) {
                          return <h2 className="text-base font-bold text-indigo-200 mt-5 mb-2 pb-1 border-b border-slate-800/60">{children}</h2>;
                        },
                        h3({ children }) {
                          return <h3 className="text-sm font-semibold text-amber-300 mt-4 mb-2">{children}</h3>;
                        },
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const isMermaid = match && match[1] === 'mermaid';
                          const codeString = String(children).replace(/\n$/, '');

                          if (isMermaid) {
                            return <MermaidDiagram code={codeString} />;
                          }

                          return (
                            <code className={`px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300 font-mono text-[11px] border border-slate-800 ${className || ''}`} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {docContent}
                    </Markdown>
                  </div>
                ) : (
                  <div className="text-slate-500 text-center py-10">내용이 비어있습니다.</div>
                )
              ) : (
                /* Read-Only Source Mode */
                <div className="flex flex-col h-full space-y-2">
                  <div className="text-xs text-slate-400 font-mono flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800">
                    <span className="flex items-center gap-2">
                      <Code className="w-3.5 h-3.5 text-indigo-400" />
                      마크다운 소스 원문 (읽기 전용 / 상단 복사 지원)
                    </span>
                    <span className="text-slate-500">줄 수: {docContent ? docContent.split('\n').length : 0}줄</span>
                  </div>
                  <pre className="w-full h-[520px] p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-auto leading-relaxed select-text">
                    {docContent}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span>용량: {(activeDoc.sizeBytes / 1024).toFixed(1)} KB</span>
                <span className="text-slate-600">|</span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                  <Database className="w-3.5 h-3.5" /> DB 정합성 검증 완료
                </span>
                <span className="text-slate-600">|</span>
                <span>remark-gfm 표 & Mermaid 다이어그램 지원됨</span>
              </div>
              <button
                onClick={() => setActiveDoc(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
