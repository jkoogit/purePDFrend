import { useState } from 'react';

export interface TermVersionItem {
  id: string; // DOC_GRP_01
  title: string;
  version: string;
  isLatestApplied: boolean; // 적용버전 체크 (요청 7 반영)
  updatedAt: string;
  content: string;
}

const INITIAL_TERMS: TermVersionItem[] = [
  { id: 'DOC_GRP_01', title: '서비스 이용약관', version: 'v1.0', isLatestApplied: false, updatedAt: '2026-08-01', content: '서비스 이용조건 초판입니다.' },
  { id: 'DOC_GRP_01', title: '서비스 이용약관', version: 'v2.0', isLatestApplied: true, updatedAt: '2026-10-01', content: '오프라인 3-Way 병합 정책이 반영된 최신 서비스 이용약관입니다.' },
  { id: 'DOC_GRP_02', title: '개인정보 수집·이용', version: 'v1.0', isLatestApplied: false, updatedAt: '2026-08-01', content: '개인정보 수집 기본 항목 안내입니다.' },
  { id: 'DOC_GRP_02', title: '개인정보 수집·이용', version: 'v1.1', isLatestApplied: true, updatedAt: '2026-10-01', content: '개인정보 불변원칙 헌장이 추가 반영된 개정판입니다.' },
  { id: 'DOC_GRP_03', title: '마케팅 정보 수신동의', version: 'v1.0', isLatestApplied: true, updatedAt: '2026-09-01', content: '마케팅 혜택 및 프로모션 안내 동의입니다.' },
  { id: 'DOC_GRP_08', title: '오프라인 동기화 정책', version: 'v1.0', isLatestApplied: true, updatedAt: '2026-10-02', content: '로컬 IndexedDB 및 충돌 해결 정책 안내입니다.' },
];

export function AdminTermsView() {
  const [terms, setTerms] = useState<TermVersionItem[]>(INITIAL_TERMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyAppliedVersions, setOnlyAppliedVersions] = useState(false); // 약관별 적용버전만 조회 체크 (요청 7)
  const [selectedTerm, setSelectedTerm] = useState<TermVersionItem>(INITIAL_TERMS[1]);
  const [showDetailModal, setShowDetailModal] = useState(false); // 상세정보 팝업 (요청 4 반영)

  // Version bump type: vX.0 (개정) vs vX.1 (수정)
  const [versionBumpType, setVersionBumpType] = useState<'major' | 'minor'>('minor');
  const [editContent, setEditContent] = useState(INITIAL_TERMS[1].content);
  const [notice, setNotice] = useState<string | null>(null);

  const calculateNewVersion = (currentVer: string, type: 'major' | 'minor') => {
    const raw = parseFloat(currentVer.replace('v', ''));
    if (type === 'major') {
      return `v${(Math.floor(raw) + 1.0).toFixed(1)}`;
    }
    return `v${(raw + 0.1).toFixed(1)}`;
  };

  const handleCreateNewVersion = () => {
    const newVer = calculateNewVersion(selectedTerm.version, versionBumpType);
    const newDoc: TermVersionItem = {
      id: selectedTerm.id,
      title: selectedTerm.title,
      version: newVer,
      isLatestApplied: true,
      updatedAt: new Date().toISOString().split('T')[0],
      content: editContent,
    };

    // 이전 동일 약관들의 isLatestApplied를 false로 전환하고 새 버전 등록
    setTerms([
      newDoc,
      ...terms.map((t) => (t.id === selectedTerm.id ? { ...t, isLatestApplied: false } : t)),
    ]);
    setSelectedTerm(newDoc);
    setNotice(`🎉 [${selectedTerm.title}] 새 파일 등록 완료! 버전: ${newVer} (${versionBumpType === 'major' ? '개정판' : '경미수정'})`);
  };

  const filteredTerms = terms
    .filter((t) => (onlyAppliedVersions ? t.isLatestApplied : true))
    .filter((t) => (searchTerm ? t.title.includes(searchTerm) || t.id.includes(searchTerm) || t.content.includes(searchTerm) : true));

  return (
    <div className="space-y-4 text-xs">
      {notice && (
        <div className="p-3 bg-indigo-950/80 border border-indigo-500/40 rounded-xl text-indigo-200 flex justify-between items-center">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-[11px] text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 검색 & 적용버전 체크 필터 (요청 7 반영) */}
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="약관 명칭, 문서ID, 본문 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs w-full sm:w-64"
          />
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium whitespace-nowrap">
            <input
              type="checkbox"
              checked={onlyAppliedVersions}
              onChange={(e) => setOnlyAppliedVersions(e.target.checked)}
              className="accent-indigo-500 w-4 h-4"
            />
            <span>적용 버전만 조회 (최신 활성본)</span>
          </label>
        </div>
        <span className="text-slate-400 text-[11px]">검색 결과: {filteredTerms.length}건</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 약관 목록 */}
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          {filteredTerms.map((t, idx) => (
            <div
              key={`${t.id}-${t.version}-${idx}`}
              onClick={() => {
                setSelectedTerm(t);
                setEditContent(t.content);
                setShowDetailModal(true);
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedTerm.id === t.id && selectedTerm.version === t.version
                  ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-400'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-slate-400 text-[11px]">{t.id}</span>
                <span className={`px-2 py-0.2 rounded font-mono text-[10px] ${t.isLatestApplied ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-slate-800 text-slate-500'}`}>
                  {t.isLatestApplied ? '적용중' : '과거버전'}
                </span>
              </div>
              <div className="font-bold text-slate-200">{t.title}</div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
                <span className="text-indigo-400 font-bold">{t.version}</span>
                <span>{t.updatedAt}</span>
              </div>
              <div className="mt-2 pt-1 border-t border-slate-900 flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-sans">클릭 시 팝업 조회</span>
                <span className="px-2 py-0.5 bg-indigo-950/80 text-indigo-300 rounded font-medium">
                  🔍 약관 상세 팝업
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 약관 편집 & 새 버전 파일 등록 패널 (요청 7 반영) */}
        <div className="lg:col-span-2 p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div>
              <span className="font-bold text-white text-sm">{selectedTerm.title}</span>
              <span className="ml-2 font-mono text-indigo-400">{selectedTerm.id} ({selectedTerm.version})</span>
            </div>
            <span className="text-slate-400 text-[11px]">이전 내용을 바탕으로 새 버전 파일 발행</span>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 text-[11px]">약관 본문 내용 (위지윅 / 마크다운 편집):</label>
            <textarea
              rows={8}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 font-mono text-xs leading-relaxed"
            />
          </div>

          {/* 버전 설정: v1.0 (개정) vs v1.1 (수정) */}
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
            <span className="font-semibold text-indigo-300">📌 신규 발행 버전 체계 선택:</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="vBump"
                  checked={versionBumpType === 'minor'}
                  onChange={() => setVersionBumpType('minor')}
                  className="accent-indigo-500"
                />
                <span className="text-slate-300 font-mono">vX.1 (경미 수정: {calculateNewVersion(selectedTerm.version, 'minor')})</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="vBump"
                  checked={versionBumpType === 'major'}
                  onChange={() => setVersionBumpType('major')}
                  className="accent-indigo-500"
                />
                <span className="text-slate-300 font-mono">vX.0 (주요 개정: {calculateNewVersion(selectedTerm.version, 'major')})</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleCreateNewVersion}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow"
            >
              🚀 수정 내용 새 파일 등록 및 버전 발행
            </button>
          </div>
        </div>
      </div>

      {/* 약관 상세정보 팝업 모달 (요청 4 반영) */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/60 rounded-2xl p-4 sm:p-5 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <span className="font-bold text-white text-base">{selectedTerm.title}</span>
                <span className="ml-2 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-xs">
                  {selectedTerm.id} | {selectedTerm.version}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white text-base px-2">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">적용 여부:</span>
                <span className={`font-semibold ${selectedTerm.isLatestApplied ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {selectedTerm.isLatestApplied ? '✅ 최신 활성 적용본' : '📁 과거 개정 이력본'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">최종 개정일시:</span>
                <span className="font-mono text-slate-300">{selectedTerm.updatedAt}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 text-xs font-semibold block">약관 전문 내용:</span>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                {selectedTerm.content}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-slate-500 text-[11px] font-mono">법적 효력 검증 및 동의 원장 감사 완료</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditContent(selectedTerm.content);
                    setShowDetailModal(false);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs"
                >
                  에디터에 복사
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
