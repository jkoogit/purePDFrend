import { useState, useEffect, useRef } from 'react';
import { AgentDoc } from '../types';
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
  Save
} from 'lucide-react';
import Markdown from 'react-markdown';
import mermaid from 'mermaid';

// Initialize mermaid once
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
        <div className="font-bold mb-1">⚠️ Mermaid 다이어그램 구문 오류</div>
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

export default function DocsGovernanceManager() {
  const [docs, setDocs] = useState<AgentDoc[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('전체');
  const [activeDoc, setActiveDoc] = useState<AgentDoc | null>(null);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
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
        setEditedContent(data.content);
      } else {
        setDocContent(`# 오류\n\n${data.error}`);
        setEditedContent(`# 오류\n\n${data.error}`);
      }
    } catch (err: any) {
      setDocContent(`# 오류 발생\n\n${err.message}`);
      setEditedContent(`# 오류 발생\n\n${err.message}`);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleSaveDoc = async () => {
    if (!activeDoc) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/agent/docs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: activeDoc.filePath,
          content: editedContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDocContent(editedContent);
        setSyncMessage(`문서(${activeDoc.fileName}) 저장 및 DB 반영 완료! [ID: ${data.docId}]`);
        await fetchDocs();
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`저장 에러: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopySource = () => {
    navigator.clipboard.writeText(editedContent || docContent || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

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

  const filteredDocs = selectedFolder === '전체'
    ? docs
    : docs.filter((d) => d.folder === selectedFolder);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            18대 표준 문서 거버넌스 & DB 무결성 동기화
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            문서번호 부여 체계 및 18대 폴더별 README_제목.md 요약 탐색기, 마크다운/소스 분리 뷰어 및 Mermaid 다이어그램을 실시간 지원합니다.
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
          <div className="p-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">[{selectedFolder}]</span>
              <span className="text-xs text-slate-400">문서 목록 ({filteredDocs.length}건)</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              클릭 시 마크다운 뷰어 & 원본 소스 대조창이 열립니다.
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400">
                  <th className="p-3">분류 폴더</th>
                  <th className="p-3">문서번호 & 파일명</th>
                  <th className="p-3">문서 제목</th>
                  <th className="p-3">용량</th>
                  <th className="p-3">DB 동기화</th>
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
                        <span className={isReadme ? 'text-emerald-300' : 'text-indigo-200'}>
                          {doc.fileName}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-white max-w-xs truncate">{doc.title}</td>
                      <td className="p-3 text-slate-400">{(doc.sizeBytes / 1024).toFixed(1)} KB</td>
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
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                      해당 분류 폴더에 문서가 아직 등록되지 않았습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full Markdown & Source Viewer Modal with Mermaid Rendering */}
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

              {/* Header Right: View Switcher & Actions */}
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
                    <Code className="w-3.5 h-3.5" /> 소스 원문 편집
                  </button>
                </div>

                <button
                  onClick={handleCopySource}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  title="원본 텍스트 복사"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '복사됨' : '복사'}
                </button>

                {viewMode === 'source' && (
                  <button
                    onClick={handleSaveDoc}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? '저장 & DB 반영중...' : '수정내용 저장 & DB반영'}
                  </button>
                )}

                <button
                  onClick={() => setActiveDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Toggle between Markdown Preview & Source Code Editor */}
            <div className="p-6 overflow-y-auto flex-1 text-slate-200 text-sm font-sans space-y-4">
              {isLoadingContent ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-xs">문서를 불러오는 중입니다...</span>
                </div>
              ) : viewMode === 'preview' ? (
                docContent ? (
                  <div className="markdown-body prose prose-invert max-w-none prose-headings:text-indigo-200 prose-a:text-indigo-400 prose-table:border-slate-800 prose-th:bg-slate-950 prose-td:border-slate-800 text-slate-300 leading-relaxed text-xs">
                    <Markdown
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const isMermaid = match && match[1] === 'mermaid';
                          const codeString = String(children).replace(/\n$/, '');

                          if (isMermaid) {
                            return <MermaidDiagram code={codeString} />;
                          }

                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {editedContent || docContent}
                    </Markdown>
                  </div>
                ) : (
                  <div className="text-slate-500 text-center py-10">내용이 비어있습니다.</div>
                )
              ) : (
                /* Source Mode: Editable textarea */
                <div className="flex flex-col h-full space-y-2">
                  <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                    <span>Markdown 원본 편집 모드 (수정 후 우상단 '수정내용 저장 & DB반영' 클릭)</span>
                    <span>줄 수: {editedContent.split('\n').length}줄</span>
                  </div>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-[520px] p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none"
                    placeholder="마크다운 내용을 입력하세요..."
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span>용량: {(activeDoc.sizeBytes / 1024).toFixed(1)} KB</span>
                <span className="text-slate-600">|</span>
                <span>Mermaid 다이어그램 자동 렌더링 지원됨</span>
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
