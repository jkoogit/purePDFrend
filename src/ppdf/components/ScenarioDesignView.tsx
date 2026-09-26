import { useState } from 'react';
import {
  UploadCloud,
  SplitSquareVertical,
  ListTree,
  Highlighter,
  Download,
  CheckCircle2,
  CheckCircle,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import PdfSecurityConfigManager from './PdfSecurityConfigManager';
import PdfExportConfigModal from './PdfExportConfigModal';

export default function ScenarioDesignView() {
  const [activeScenario, setActiveScenario] = useState<number>(1);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Interactive mockup states
  // Scenario 1: Upload & Virtual Loader
  const [simulatedPageCount, setSimulatedPageCount] = useState<number>(120);
  const [virtualScrollIndex, setVirtualScrollIndex] = useState<number>(1);

  // Scenario 2: 2-Way OCR Bounding Box
  const [activeBoxId, setActiveBoxId] = useState<number>(1);
  const [ocrBoxes, setOcrBoxes] = useState([
    { id: 1, text: '제1장 디지털 도서의 아카이빙 개요', x: 12, y: 15, w: 75, h: 8, confidence: 0.98 },
    { id: 2, text: '1.1 대용량 스캔 페이지 분할 파이프라인', x: 12, y: 28, w: 68, h: 7, confidence: 0.94 },
    { id: 3, text: '브라우저 메모리 고갈 방지를 위해 IndexedDB 청킹 적용', x: 12, y: 38, w: 78, h: 10, confidence: 0.91 },
    { id: 4, text: 'PDF 표준 Outlines 구조를 생성하여 전자책 목차 자동 빌드', x: 12, y: 52, w: 80, h: 9, confidence: 0.96 },
  ]);

  // Scenario 3: TOC Tree
  const [tocItems] = useState([
    { id: 1, level: 1, title: '제1편 엔터프라이즈 PDF 제작 총괄', page: 1 },
    { id: 2, level: 2, title: '제1장 스캔 이미지 전처리 및 보정', page: 5 },
    { id: 3, level: 3, title: '1.1 왜곡 보정 및 여백 트리밍', page: 12 },
    { id: 4, level: 2, title: '제2장 OCR 바운딩 박스 교정', page: 24 },
    { id: 5, level: 1, title: '제2편 주석 관리 및 툼스톤 동기화', page: 48 },
  ]);

  // Scenario 4: Tombstone Annotations
  const [annotations, setAnnotations] = useState([
    { id: 'ANN-001', type: '하이라이트 (노랑)', page: 3, author: '검수자 A', isDeleted: false, text: '중요 표준 규격' },
    { id: 'ANN-002', type: '스티키 노트', page: 5, author: '검수자 B', isDeleted: false, text: '용어 통일 필요' },
    { id: 'ANN-003', type: '취소선', page: 8, author: '검수자 A', isDeleted: true, text: '오탈자 삭제됨 (Tombstone)' },
  ]);

  const scenarios = [
    {
      id: 1,
      title: '시나리오 1: 파일 업로드 & 800쪽 대용량 가상 뷰어',
      subtitle: 'IndexedDB 분할 저장 및 가상 뷰포트 메모리 가드',
      icon: UploadCloud,
      color: 'indigo',
    },
    {
      id: 2,
      title: '시나리오 2: 2-Way 대조 OCR 바운딩 박스 교정기',
      subtitle: '원본 캔버스 박스 ↔ 텍스트 에디터 실시간 양방향 포커스',
      icon: SplitSquareVertical,
      color: 'amber',
    },
    {
      id: 3,
      title: '시나리오 3: 계층형 목차 (TOC) 북마크 에디터',
      subtitle: '부/장/절 트리 계층 및 PDF 표준 Outlines 생성',
      icon: ListTree,
      color: 'emerald',
    },
    {
      id: 4,
      title: '시나리오 4: PDF 표준 주석 & 툼스톤 동기화',
      subtitle: '하이라이트, 스티키 노트 및 3-Way 병합 충돌 방지',
      icon: Highlighter,
      color: 'rose',
    },
    {
      id: 5,
      title: '시나리오 5: 최종 PDF 표준 컴파일러',
      subtitle: '원본 이미지 + 보정 OCR 레이어 + 북마크 결합 빌드',
      icon: Download,
      color: 'sky',
    },
    {
      id: 6,
      title: '시나리오 6: PDF 보안 권한 및 상황별 암호화 정책 관리자',
      subtitle: '전략/팩토리/빌더/파사드 패턴 기반 상황별(공개/열람/대외비/DRM) 보안 관리',
      icon: Lock,
      color: 'emerald',
    },
  ];

  const handleUpdateBoxText = (id: number, newText: string) => {
    setOcrBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, text: newText } : b)));
  };

  const handleToggleTombstone = (id: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isDeleted: !a.isDeleted } : a))
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 max-w-7xl mx-auto w-full gap-4">
      {/* Scenario Selection Header Tabs (반응형 줄바꿈 및 스크롤바 제거) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 px-3 shadow-lg flex flex-wrap items-center gap-2 no-scrollbar">
        {scenarios.map((s) => {
          const Icon = s.icon;
          const isActive = activeScenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveScenario(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 select-none ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="break-keep">{s.title.split(':')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace for the selected scenario */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 4 Cols: Architectural Blueprint & Logical Completeness Checklist */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col shadow-xl overflow-y-auto space-y-4">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-semibold uppercase">
              서비스 시나리오 {activeScenario}
            </span>
            <h2 className="text-base font-bold text-white mt-1.5">
              {scenarios[activeScenario - 1].title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {scenarios[activeScenario - 1].subtitle}
            </p>
          </div>

          {/* Scenario Specific Architecture Spec */}
          <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-indigo-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              핵심 아키텍처 규칙 & 데이터 흐름
            </div>

            {activeScenario === 1 && (
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside text-[11px]">
                <li><strong className="text-slate-200">청킹 영속화:</strong> 800페이지 업로드 시 IndexedDB에 페이지별(Page-Level) 독립 레코드로 분할 저장</li>
                <li><strong className="text-slate-200">메모리 가드:</strong> 브라우저 뷰포트에 보이는 페이지만 DOM에 렌더링하고 나머지는 가상화(Virtual Windowing)</li>
                <li><strong className="text-slate-200">충돌 0%:</strong> 특정 페이지를 편집해도 타 페이지에 I/O 부하 및 락(Lock) 없음</li>
              </ul>
            )}

            {activeScenario === 2 && (
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside text-[11px]">
                <li><strong className="text-slate-200">1:1 양방향 포커스:</strong> 좌측 스캔본의 바운딩 박스를 클릭하면 우측 텍스트 입력창 자동 스크롤 & 활성화</li>
                <li><strong className="text-slate-200">박스 직접 조작:</strong> 캔버스 위에서 마우스 드래그로 영역 이동 및 크기 조절</li>
                <li><strong className="text-slate-200">신뢰도 시각화:</strong> OCR 엔진 인식률(Confidence)에 따라 녹색/주황색/적색 테두리 색상 코딩</li>
              </ul>
            )}

            {activeScenario === 3 && (
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside text-[11px]">
                <li><strong className="text-slate-200">다단계 계층 트리:</strong> 부(Part), 장(Chapter), 절(Section) 계층 인덴트 및 드래그 순서 변경</li>
                <li><strong className="text-slate-200">페이지 링크:</strong> 각 목차 항목 클릭 시 해당 페이지로 즉시 점프</li>
                <li><strong className="text-slate-200">PDF 표준 Outlines:</strong> 최종 빌드 시 PDF 규격의 북마크 딕셔너리 트리를 100% 자동 생성</li>
              </ul>
            )}

            {activeScenario === 4 && (
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside text-[11px]">
                <li><strong className="text-slate-200">경량 Import/Export:</strong> 수십 KB 크기의 순수 JSON 파일로 주석 레이어만 고속 입출력</li>
                <li><strong className="text-slate-200">툼스톤 삭제 관리:</strong> 주석 삭제 시 물리 삭제 대신 <code className="text-amber-300">isDeleted: true</code> 기록</li>
                <li><strong className="text-slate-200">3-Way 병합 보장:</strong> 다른 검수자가 삭제한 주석이 재추출/병합 시 부활하는 오류 원천 방지</li>
              </ul>
            )}

            {activeScenario === 5 && (
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside text-[11px]">
                <li><strong className="text-slate-200">pdf-lib 컴파일:</strong> 원본 고해상도 이미지 + 투명 검색 가능 텍스트 레이어 합성</li>
                <li><strong className="text-slate-200">표준 주석 병합:</strong> 하이라이트, 메모, 북마크 트리를 단일 표준 PDF로 래핑</li>
                <li><strong className="text-slate-200">비용 0원 빌드:</strong> 로컬 Tesseract 및 브라우저 엔진으로 API 비용 발생 없이 완료</li>
              </ul>
            )}

            {activeScenario === 6 && (
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside text-[11px]">
                <li><strong className="text-slate-200">상황별 전략 패턴:</strong> 공개/열람전용/대외비/DRM 등 배포 목적별 보안 정책 즉시 전환</li>
                <li><strong className="text-slate-200">ISO 32000-1 권한:</strong> 8대 세부 권한 플래그(인쇄, 수정, 복사, 주석 등) 비트마스크 연산</li>
                <li><strong className="text-slate-200">표준 키 유도 (Alg 2~7):</strong> MD5/SHA-256 KDF 및 32B 표준 패딩 기반 /O, /U 해시 생성</li>
                <li><strong className="text-slate-200">메타데이터 보안 연계:</strong> TASK-0014-01 서지/활동 메타데이터의 /EncryptMetadata 통제</li>
              </ul>
            )}
          </div>

          {/* Logical Completeness Checklist */}
          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              논리적 완성도 점검 항목 (Checklist)
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>데이터 지속성 (페이지별 IndexedDB 독립 영속화)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>메모리 누수 방지 (800쪽 뷰포트 언로드 캐싱)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>동시 검수 정합성 (Tombstone 기반 병합 충돌 방지)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>표준 호환성 (Acrobat Reader 100% 호환 PDF 생성)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 8 Cols: Interactive Visual Prototype Workspace */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col shadow-xl overflow-y-auto">
          {/* Scenario 1: Upload & Virtual 800-Page Loader Mockup */}
          {activeScenario === 1 && (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                  스캔 이미지 업로드 및 가상 스크롤 로더 시뮬레이터
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">총 페이지 수:</span>
                  <div className="flex items-center gap-1">
                    {[50, 120, 500, 800].map((count) => (
                      <button
                        key={count}
                        onClick={() => setSimulatedPageCount(count)}
                        className={`px-2 py-0.5 rounded font-mono text-xs ${
                          simulatedPageCount === count
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {count}쪽
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upload Dropzone Preview */}
              <div className="p-6 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl bg-slate-900/40 text-center cursor-pointer transition-colors">
                <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white">스캔 사진(JPG/PNG) 또는 기존 PDF 파일을 드래그하여 놓으세요</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  800쪽 대용량 도서도 브라우저 멈춤 없이 즉시 IndexedDB 분할 청크로 격리 수신됩니다.
                </p>
              </div>

              {/* Virtual Page Grid Mockup */}
              <div className="flex-1 bg-slate-900/60 rounded-xl p-4 border border-slate-800 overflow-y-auto space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
                  <span>뷰포트 가상 로딩 상태: <strong>{simulatedPageCount} 페이지 중 8개 페이지만 활성 렌더링</strong></span>
                  <span className="text-emerald-400 font-mono font-semibold">메모리 점유: 38.4 MB (정상)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <div
                        key={pageNum}
                        onClick={() => setVirtualScrollIndex(pageNum)}
                        className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          virtualScrollIndex === pageNum
                            ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                            : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-full h-24 bg-slate-950 rounded border border-slate-800/80 mb-2 flex items-center justify-center text-slate-600 text-[10px] font-mono">
                          [스캔본 {pageNum}p]
                        </div>
                        <span className="text-xs font-mono text-slate-300 font-semibold">{pageNum} 페이지</span>
                        <div className="text-[10px] text-emerald-400 mt-0.5">IndexedDB 캐시됨</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Scenario 2: 2-Way Bounding Box OCR Editor Mockup */}
          {activeScenario === 2 && (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <SplitSquareVertical className="w-4 h-4 text-amber-400" />
                  2-Way 대조 OCR 바운딩 박스 교정 작업대
                </h3>
                <span className="text-xs text-slate-400">
                  활성 영역: <strong className="text-amber-400">Box #{activeBoxId}</strong>
                </span>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                {/* Left: Scan Preview with visual bounding boxes */}
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 relative flex flex-col justify-between overflow-hidden">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
                    좌측: 원본 스캔본 캔버스 (BBox 오버레이)
                  </div>

                  <div className="relative flex-1 bg-slate-900/90 rounded-lg border border-slate-800 p-3 overflow-hidden">
                    {ocrBoxes.map((box) => (
                      <div
                        key={box.id}
                        onClick={() => setActiveBoxId(box.id)}
                        style={{
                          position: 'absolute',
                          left: `${box.x}%`,
                          top: `${box.y}%`,
                          width: `${box.w}%`,
                          height: `${box.h}%`,
                        }}
                        className={`border-2 rounded transition-all cursor-pointer flex items-center justify-between px-2 text-[10px] font-mono ${
                          activeBoxId === box.id
                            ? 'border-amber-400 bg-amber-400/20 text-amber-200 shadow-md ring-2 ring-amber-400/30'
                            : 'border-indigo-500/70 bg-indigo-500/10 text-indigo-300 hover:border-indigo-400'
                        }`}
                      >
                        <span className="truncate">{box.text}</span>
                        <span className="text-[9px] px-1 rounded bg-black/60 shrink-0">
                          {Math.round(box.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 text-center">
                    박스를 클릭하거나 드래그하여 크기/위치를 직관적으로 수정합니다.
                  </span>
                </div>

                {/* Right: Text Editor with 1:1 Focus Sync */}
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col overflow-y-auto space-y-2.5">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    우측: OCR 추출 텍스트 실시간 교정기
                  </div>

                  {ocrBoxes.map((box) => (
                    <div
                      key={box.id}
                      onClick={() => setActiveBoxId(box.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        activeBoxId === box.id
                          ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono text-amber-400 font-semibold">Box #{box.id}</span>
                        <span className="text-slate-500">신뢰도: {Math.round(box.confidence * 100)}%</span>
                      </div>
                      <input
                        type="text"
                        value={box.text}
                        onChange={(e) => handleUpdateBoxText(box.id, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scenario 3: TOC Bookmark Editor Mockup */}
          {activeScenario === 3 && (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-emerald-400" />
                  계층형 목차(TOC) 트리 에디터 및 PDF Outlines 매퍼
                </h3>
                <span className="text-xs text-slate-400">항목 수: {tocItems.length}개</span>
              </div>

              <div className="flex-1 bg-slate-900/60 rounded-xl p-4 border border-slate-800 overflow-y-auto space-y-2">
                {tocItems.map((item) => (
                  <div
                    key={item.id}
                    style={{ marginLeft: `${(item.level - 1) * 24}px` }}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-between hover:border-emerald-500/50 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-semibold text-white">{item.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        레벨 {item.level}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-slate-400 text-[11px]">
                      <span>연결 페이지: <strong className="text-emerald-400">{item.page}p</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scenario 4: PDF Annotations & Tombstones Mockup */}
          {activeScenario === 4 && (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Highlighter className="w-4 h-4 text-rose-400" />
                  PDF 표준 주석 및 툼스톤(Tombstone) 동기화 검사기
                </h3>
                <span className="text-xs text-slate-400">JSON 추출/병합 시 충돌 0% 보장</span>
              </div>

              <div className="flex-1 bg-slate-900/60 rounded-xl p-4 border border-slate-800 overflow-y-auto space-y-3">
                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-3.5 rounded-lg border transition-all flex items-center justify-between text-xs ${
                      ann.isDeleted
                        ? 'border-rose-900/60 bg-rose-950/20 opacity-60'
                        : 'border-slate-800 bg-slate-950'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-400 font-semibold">{ann.id}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {ann.type}
                        </span>
                        <span className="text-slate-400 text-[11px]">작성자: {ann.author} ({ann.page}p)</span>
                        {ann.isDeleted && (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-bold border border-rose-800">
                            툼스톤 (삭제됨)
                          </span>
                        )}
                      </div>
                      <div className={`text-slate-200 ${ann.isDeleted ? 'line-through text-slate-500' : ''}`}>
                        "{ann.text}"
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleTombstone(ann.id)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                        ann.isDeleted
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {ann.isDeleted ? '삭제 취소' : '툼스톤 삭제'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scenario 5: Final PDF Compiler Mockup */}
          {activeScenario === 5 && (
            <div className="flex flex-col h-full justify-center items-center text-center p-8 space-y-4">
              <div className="p-4 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Download className="w-10 h-10" />
              </div>
              <h3 className="text-base font-bold text-white">최종 고품질 PDF 표준 빌더 (pdf-lib)</h3>
              <p className="text-xs text-slate-400 max-w-md">
                스캔 이미지 + 투명 OCR 텍스트 레이어 + 목차 북마크(/Outlines) + 표준 주석을 결합하여
                표준 전자문서 규격(ISO 32000-1) 호환 PDF로 즉시 컴파일합니다.
              </p>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-left w-full max-w-md space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span>합성될 페이지 수:</span>
                  <strong className="font-mono text-white">120 Pages</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>OCR 텍스트 레이어:</span>
                  <strong className="text-emerald-400 font-semibold">Tesseract.js 한/영 교정완료</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>전자책 북마크 트리:</span>
                  <strong className="text-indigo-400 font-semibold">5개 계층 생성</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>예상 빌드 시간:</span>
                  <strong className="font-mono text-amber-400">1.8초 (클라이언트 WASM)</strong>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF 내보내기 & 보안/메타데이터 통합 설정</span>
                </button>
              </div>
            </div>
          )}

          {/* Scenario 6: PDF Security & Situational Encryption Policy Manager */}
          {activeScenario === 6 && (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400">상황별 보안 프로필을 실제 PDF 파일에 주입하여 다운로드합니다.</span>
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>내보내기 모달 열기</span>
                </button>
              </div>
              <PdfSecurityConfigManager />
            </div>
          )}
        </div>
      </div>

      {/* PDF Export Config Modal */}
      <PdfExportConfigModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        defaultTitle="디지털 도서 아카이빙 표준 가이드"
        defaultAuthor="purePDFrend 연구소"
        pageCount={simulatedPageCount}
        sampleText="제1장 디지털 도서의 아카이빙 개요 - purePDFrend 고품질 컴파일 검증 문서"
      />
    </div>
  );
}
