import React, { useState } from 'react';
import { Button, Input, Textarea, Badge, Card, CardHeader, CardTitle, CardContent, Modal } from '@shared/components/ui';

export interface TermVersionItem {
  id: string; // DOC_GRP_01
  title: string;
  version: string;
  isLatestApplied: boolean; // 적용버전 체크
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
  const [onlyAppliedVersions, setOnlyAppliedVersions] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<TermVersionItem>(INITIAL_TERMS[1]);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
        <div className="p-3 bg-blue-950/80 border border-blue-500/40 rounded-xl text-blue-200 flex justify-between items-center animate-fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-[11px] text-blue-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* 검색 & 적용버전 체크 필터 */}
      <Card variant="subtle">
        <div className="p-3 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <Input
                type="text"
                placeholder="약관 명칭, 문서ID, 본문 검색..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                touchTarget={false}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium whitespace-nowrap">
              <input
                type="checkbox"
                checked={onlyAppliedVersions}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOnlyAppliedVersions(e.target.checked)}
                className="accent-blue-500 w-4 h-4 cursor-pointer"
              />
              <span>적용 버전만 조회 (최신 활성본)</span>
            </label>
          </div>
          <span className="text-slate-400 text-[11px] font-mono self-end sm:self-center">
            검색 결과: <strong className="text-blue-400">{filteredTerms.length}</strong>건
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 약관 목록 */}
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          {filteredTerms.map((t, idx) => (
            <Card
              key={`${t.id}-${t.version}-${idx}`}
              interactive
              onClick={() => {
                setSelectedTerm(t);
                setEditContent(t.content);
                setShowDetailModal(true);
              }}
              variant="subtle"
              className={`p-3 space-y-2 cursor-pointer transition-all ${
                selectedTerm.id === t.id && selectedTerm.version === t.version
                  ? 'border-blue-500 ring-1 ring-blue-400 bg-blue-950/30'
                  : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-slate-400 text-[11px]">{t.id}</span>
                <Badge variant={t.isLatestApplied ? 'success' : 'neutral'} size="sm" dot>
                  {t.isLatestApplied ? '적용중' : '과거버전'}
                </Badge>
              </div>
              <div className="font-bold text-slate-200 text-sm">{t.title}</div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                <Badge variant="primary" size="sm">
                  {t.version}
                </Badge>
                <span>{t.updatedAt}</span>
              </div>
              <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-sans">클릭 시 팝업 조회</span>
                <Badge variant="info" size="sm">
                  🔍 약관 상세 팝업
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        {/* 약관 편집 & 새 버전 파일 등록 패널 */}
        <Card variant="subtle" className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <span>{selectedTerm.title}</span>
                <Badge variant="primary" size="sm">
                  {selectedTerm.id} ({selectedTerm.version})
                </Badge>
              </CardTitle>
            </div>
            <span className="text-slate-400 text-[11px]">이전 내용을 바탕으로 새 버전 파일 발행</span>
          </CardHeader>

          <CardContent className="space-y-3">
            <Textarea
              label="약관 본문 내용 (위지윅 / 마크다운 편집)"
              rows={8}
              value={editContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
              className="font-mono text-xs leading-relaxed"
            />


            {/* 버전 설정 */}
            <Card variant="subtle" className="p-3 space-y-2">
              <span className="font-semibold text-blue-300">📌 신규 발행 버전 체계 선택:</span>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="vBump"
                    checked={versionBumpType === 'minor'}
                    onChange={() => setVersionBumpType('minor')}
                    className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-slate-300 font-mono">vX.1 (경미 수정: {calculateNewVersion(selectedTerm.version, 'minor')})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="vBump"
                    checked={versionBumpType === 'major'}
                    onChange={() => setVersionBumpType('major')}
                    className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-slate-300 font-mono">vX.0 (주요 개정: {calculateNewVersion(selectedTerm.version, 'major')})</span>
                </label>
              </div>
            </Card>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateNewVersion}
              >
                🚀 수정 내용 새 파일 등록 및 버전 발행
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 약관 상세정보 팝업 모달 */}
      {showDetailModal && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          size="lg"
          title={
            <div className="flex items-center gap-2">
              <span>{selectedTerm.title}</span>
              <Badge variant="primary" size="sm">
                {selectedTerm.id} | {selectedTerm.version}
              </Badge>
            </div>
          }
          footer={
            <div className="flex justify-between items-center w-full">
              <span className="text-slate-500 text-[11px] font-mono">법적 효력 검증 및 동의 원장 감사 완료</span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditContent(selectedTerm.content);
                    setShowDetailModal(false);
                  }}
                >
                  에디터에 복사
                </Button>
                <Button variant="primary" size="sm" onClick={() => setShowDetailModal(false)}>
                  닫기
                </Button>
              </div>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">적용 여부:</span>
              <Badge variant={selectedTerm.isLatestApplied ? 'success' : 'neutral'} size="sm" dot>
                {selectedTerm.isLatestApplied ? '최신 활성 적용본' : '과거 개정 이력본'}
              </Badge>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">최종 개정일시:</span>
              <span className="font-mono text-slate-300 font-semibold">{selectedTerm.updatedAt}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-slate-400 text-xs font-semibold block">약관 전문 내용:</span>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
              {selectedTerm.content}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

