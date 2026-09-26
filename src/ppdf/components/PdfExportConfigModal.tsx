import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  ShieldCheck,
  Lock,
  BookOpen,
  Sparkles,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PdfMetadataBundleFactory } from '../domain/metadata/facade/PdfMetadataBundleFactory';
import { PdfSecurityPolicy, PdfSecurityProfileType } from '../domain/security/models/PdfSecurityPolicy';
import { PdfSecurityStrategyFactory } from '../domain/security/factory/PdfSecurityStrategyFactory';
import { PdfSecurityPolicyBuilder } from '../domain/security/builder/PdfSecurityPolicyBuilder';
import { PdfExportPipeline, ExportResult } from '../domain/export/services/PdfExportPipeline';

interface PdfExportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle?: string;
  defaultAuthor?: string;
  pageCount?: number;
  sampleText?: string;
}

export default function PdfExportConfigModal({
  isOpen,
  onClose,
  defaultTitle = '디지털 도서 아카이빙 표준 가이드',
  defaultAuthor = 'purePDFrend 연구소',
  pageCount = 120,
  sampleText,
}: PdfExportConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'metadata' | 'security'>('metadata');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessResult, setExportSuccessResult] = useState<ExportResult | null>(null);

  // Metadata Form State
  const [title, setTitle] = useState<string>(defaultTitle);
  const [author, setAuthor] = useState<string>(defaultAuthor);
  const [publisher, setPublisher] = useState<string>('뉴런데브 출판');
  const [isbn, setIsbn] = useState<string>('979-11-987654-3-2');
  const [readingRound, setReadingRound] = useState<'1독' | '2독' | '3독'>('2독');
  const [currentPage, setCurrentPage] = useState<number>(60);
  const [isLectureBook, setIsLectureBook] = useState<boolean>(true);

  // Security Form State
  const [profileType, setProfileType] = useState<PdfSecurityProfileType>('READ_ONLY_DIST');
  const [userPassword, setUserPassword] = useState<string>('');
  const [ownerPassword, setOwnerPassword] = useState<string>('purepdf-master-key');
  const [showUserPass, setShowUserPass] = useState<boolean>(false);
  const [showOwnerPass, setShowOwnerPass] = useState<boolean>(false);

  // Permissions state initialized from READ_ONLY strategy
  const defaultSecPolicy = PdfSecurityStrategyFactory.createStrategy('READ_ONLY').buildPolicy({
    ownerPassword: 'purepdf-master-key',
  });
  const [permPrinting, setPermPrinting] = useState<boolean>(defaultSecPolicy.permissions.canPrint);
  const [permModify, setPermModify] = useState<boolean>(defaultSecPolicy.permissions.canModify);
  const [permCopy, setPermCopy] = useState<boolean>(defaultSecPolicy.permissions.canCopy);
  const [permAnnotate, setPermAnnotate] = useState<boolean>(defaultSecPolicy.permissions.canAnnotate);

  // Handle Strategy Change
  const handleStrategyChange = (st: PdfSecurityProfileType) => {
    setProfileType(st);
    const strategy = PdfSecurityStrategyFactory.createStrategy(st);
    const policy = strategy.buildPolicy({
      userPassword,
      ownerPassword: ownerPassword || 'master-key',
    });
    setPermPrinting(policy.permissions.canPrint);
    setPermModify(policy.permissions.canModify);
    setPermCopy(policy.permissions.canCopy);
    setPermAnnotate(policy.permissions.canAnnotate);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccessResult(null);

    try {
      // 1. Assemble Metadata Bundle
      const metadataBundle = PdfMetadataBundleFactory.createBookBundle({
        title,
        author,
        publisher,
        isbn,
        totalPages: pageCount,
        currentPage,
        readingStatus: readingRound,
        isLectureBook,
      });

      // 2. Assemble Security Policy
      const currentStrategy = PdfSecurityStrategyFactory.createStrategy(profileType);
      let secPolicy: PdfSecurityPolicy;

      if (profileType === 'CUSTOM') {
        secPolicy = new PdfSecurityPolicyBuilder()
          .withProfileType('CUSTOM')
          .withAlgorithm('AES_256')
          .withRevision(6)
          .withUserPassword(userPassword)
          .withOwnerPassword(ownerPassword || 'master-key')
          .withPermissions({
            canPrint: permPrinting,
            canModify: permModify,
            canCopy: permCopy,
            canAnnotate: permAnnotate,
            canFillForms: true,
            canAccessText: true,
            canAssemble: false,
            canPrintHighQuality: permPrinting,
          })
          .build();
      } else {
        secPolicy = currentStrategy.buildPolicy({
          userPassword: userPassword || undefined,
          ownerPassword: ownerPassword || 'purepdf-master-key',
        });
      }

      // 3. Run Pipeline
      const result = await PdfExportPipeline.buildSecuredPdf({
        fileName: `${title.replace(/\s+/g, '_')}_secured.pdf`,
        metadata: metadataBundle,
        securityPolicy: secPolicy,
        pageCount: 3,
        sampleText: sampleText || `${title} - purePDFrend 고품질 컴파일 검증 문서`,
      });

      // 4. Download and show success
      PdfExportPipeline.triggerBrowserDownload(result.fileName, result.pdfBytes);
      setExportSuccessResult(result);
    } catch (err: any) {
      alert(`PDF 내보내기 실패: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                PDF 내보내기 및 보안/메타데이터 통합 설정
              </h3>
              <p className="text-[11px] text-slate-400">
                표준 8대 메타데이터, 도서 서지·회독 상태 및 ISO 32000-1 암호화 정책 결합
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('metadata')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'metadata'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            1. 도서 서지 & 독서 메타데이터
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            2. 보안 프로필 & 권한 제어
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Metadata Tab */}
          {activeTab === 'metadata' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">도서 제목</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">저자 / 역자</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">출판사</label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">표준 ISBN</label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Reading Progress VO Form */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    독서 회독(Round) 및 진도율 주입
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {Math.round((currentPage / pageCount) * 100)}% 진행됨
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">회독 차수</label>
                    <div className="flex gap-1.5">
                      {(['1독', '2독', '3독'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setReadingRound(r)}
                          className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                            readingRound === r
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">현재 페이지 ({pageCount}p 기준)</label>
                    <input
                      type="number"
                      min={1}
                      max={pageCount}
                      value={currentPage}
                      onChange={(e) => setCurrentPage(Math.min(pageCount, Math.max(1, Number(e.target.value))))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                  <input
                    type="checkbox"
                    id="lectureCheck"
                    checked={isLectureBook}
                    onChange={(e) => setIsLectureBook(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="lectureCheck" className="text-xs text-slate-300 cursor-pointer">
                    뉴런데브 / 인프런 강의 교재 활동 메타데이터 함께 주입
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  상황별 5대 보안 전략 프로필 선택
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'NONE', label: '공개용 (보안 해제)', color: 'slate' },
                    { id: 'READ_ONLY_DIST', label: '열람 전용 배포', color: 'indigo' },
                    { id: 'ENTERPRISE_CONFIDENTIAL', label: '사내 대외비 (AES-128)', color: 'emerald' },
                    { id: 'STRICT_DRM', label: '엄격한 DRM (AES-256)', color: 'rose' },
                    { id: 'CUSTOM', label: '사용자 정의 커스텀', color: 'amber' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleStrategyChange(p.id as PdfSecurityProfileType)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        profileType === p.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xs'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{p.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.id}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Password Setup */}
              {profileType !== 'NONE' && (
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    열람자 및 관리자 듀얼 비밀번호 설정
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        열람자 비밀번호 (/User) {profileType === 'STRICT_DRM' ? '(필수)' : '(선택)'}
                      </label>
                      <div className="relative">
                        <input
                          type={showUserPass ? 'text' : 'password'}
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          placeholder="미설정 시 바로 열람"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white pr-8 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUserPass(!showUserPass)}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                        >
                          {showUserPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        문서 관리자 비밀번호 (/Owner) (권한 해제용)
                      </label>
                      <div className="relative">
                        <input
                          type={showOwnerPass ? 'text' : 'password'}
                          value={ownerPassword}
                          onChange={(e) => setOwnerPassword(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white pr-8 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOwnerPass(!showOwnerPass)}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                        >
                          {showOwnerPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Permissions Control */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  ISO 32000-1 권한 비트마스크 (/P) 설정
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permPrinting}
                      disabled={profileType !== 'CUSTOM'}
                      onChange={(e) => setPermPrinting(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600"
                    />
                    <span>인쇄 허용 (Bit 3)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permModify}
                      disabled={profileType !== 'CUSTOM'}
                      onChange={(e) => setPermModify(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600"
                    />
                    <span>문서 내용 수정 (Bit 4)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permCopy}
                      disabled={profileType !== 'CUSTOM'}
                      onChange={(e) => setPermCopy(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600"
                    />
                    <span>텍스트/그래픽 복사 (Bit 5)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permAnnotate}
                      disabled={profileType !== 'CUSTOM'}
                      onChange={(e) => setPermAnnotate(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600"
                    />
                    <span>주석/메모 작성 (Bit 6)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {exportSuccessResult && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-2.5 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-200">
                <div className="font-bold text-emerald-300">
                  파일 내보내기 완료: {exportSuccessResult.fileName} ({Math.round(exportSuccessResult.fileSizeBytes / 1024)} KB)
                </div>
                <div className="text-[11px] text-slate-400">
                  메타데이터({exportSuccessResult.metadataSummary.readingRound}) 및 보안 프로필({exportSuccessResult.securitySummary.profileType}, {exportSuccessResult.securitySummary.algorithm})이 성공적으로 주입되었습니다.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            총 예상 크기: <strong className="text-white font-mono">~35 KB</strong> (표준 컴파일)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              닫기
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? '컴파일 및 다운로드 중...' : '보안 PDF 내보내기 실행'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
