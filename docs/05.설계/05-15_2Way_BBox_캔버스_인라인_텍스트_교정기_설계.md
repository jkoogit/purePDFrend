# 🎯 2-Way BBox 캔버스 인라인 텍스트 교정기 설계서 (05-15)

> **문서 식별자**: `DOC-05-15-2WAY-BBOX-CORRECTION-STUDIO`  
> **최초 작성일**: `2026-09-24`  
> **최종 수정일**: `2026-09-24`  
> **작성자**: AI Agent (Session-0012 / Task-0017)  
> **상태**: `APPROVED` (설계 승인 완료)

---

## 1. 개요 및 목적

본 문서는 스캔 도서 페이지의 OCR 결과(바운딩 박스 BBox 및 텍스트)를 사용자가 시각적으로 직관적이면서도 빠르고 정확하게 교정할 수 있도록 지원하는 **2-Way BBox 캔버스 인라인 텍스트 교정기 (`OCRCorrectionStudio`)**의 세부 설계를 정의합니다.

### 1.1 핵심 설계 요구사항
1. **2-Way 양방향 실시간 포커스 (Bi-Directional Focus Sync)**:
   - 좌측 원본 캔버스 BBox 클릭 ➔ 우측 에디터 해당 텍스트 행으로 스무스 자동 스크롤 및 활성 테두리 강조.
   - 우측 에디터 입력창 클릭/포커스 ➔ 좌측 캔버스 해당 BBox 펄스 링(Pulse Ring) 하이라이트.
2. **마우스 BBox 드래그 & 리사이즈**:
   - BBox 위치 이동 및 4개 모서리/변 리사이즈 핸들 드래그를 통한 정밀 좌표 조정.
   - `enableBBoxSnap` 활성화 시 4px 그리드 스냅 지원 (`Shift` 키로 일시 해제).
3. **무제한 실행취소/다시실행 (HistoryManager<BoundingBoxItem[]>)**:
   - 텍스트 수정, BBox 이동/크기 변경, 병합(Merge), 분할(Split), 삭제(Delete) 등 모든 조작을 불변 커맨드 스택으로 보존.
   - 단축키 `Ctrl+Z`, `Ctrl+Y` 지원.
4. **앙상블 AI 선택적 보정 (Ensemble AI Refinement)**:
   - 신뢰도 80% 미만 저신뢰도 박스 및 수식 기호에 대해 Gemini/PaddleOCR 멀티모달 앙상블로 원클릭 정밀 재인식.
5. **PDF 시스템 설정 연동 (Live Sync vs Explicit Apply)**:
   - `liveSyncCorrection: true` 시 500ms 디바운스로 뷰어에 실시간 자동 동기화.
   - `liveSyncCorrection: false` 시 상단 [💾 뷰어에 반영] 버튼을 통해 명시적 저장 및 복귀.

---

## 2. 컴포넌트 구조 및 상호작용 다이어그램

```mermaid
flowchart LR
    subgraph OCRCorrectionStudio [🎯 OCRCorrectionStudio 2-Way 교정기]
        direction TB
        subgraph Canvas_Pane [🖼️ 좌측: 캔버스 BBox 레이어]
            CANVAS[원본 이미지 캔버스]
            BBOX[BBox 박스 (드래그/리사이즈/포커스)]
            SNAP[스냅 가이드라인]
        end

        subgraph Editor_Pane [📝 우측: 인라인 텍스트 에디터]
            LIST[에디터 행 리스트]
            INPUT[인라인 텍스트 Input]
            CONF[신뢰도 경고 배지]
        end

        subgraph History_Engine [🧠 HistoryManager<BoundingBoxItem[]>]
            STACK[무제한 Undo/Redo 스택]
        end

        CANVAS <-->|2-Way 양방향 포커스| LIST
        BBOX -->|조작 이벤트| STACK
        INPUT -->|텍스트 수정 이벤트| STACK
    end

    subgraph Config_Manager [⚙️ PdfConfigManager]
        CFG[In-Memory Write-Through 설정]
    end

    subgraph Viewer_Studio [📖 VirtualViewerStudio]
        VSTATE[페이지 ocrBoxes 상태]
    end

    Config_Manager -->|liveSync, snap, badge 설정| OCRCorrectionStudio
    OCRCorrectionStudio -->|onSave 또는 디바운스 LiveSync| VSTATE
```

---

## 3. BBox 상태 및 액션 인터페이스 정의

```typescript
export interface BBoxState {
  boxes: BoundingBoxItem[];
  activeBoxId: string | number | null;
  selectedBoxIds: Set<string | number>;
  zoomLevel: number;
  isPanMode: boolean;
  panOffset: { x: number; y: number };
  dragState: {
    isDragging: boolean;
    dragType: 'move' | 'resize-se' | 'resize-nw' | 'resize-ne' | 'resize-sw' | null;
    targetId: string | number | null;
    startX: number;
    startY: number;
    initialBox?: BoundingBoxItem;
  };
}
```

---

## 4. 편집 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | `2026-09-24` | 2-Way BBox 캔버스 인라인 텍스트 교정기 아키텍처 및 HistoryManager 연동, LiveSync 디바운스 규약 신규 설계 | AI Agent |
