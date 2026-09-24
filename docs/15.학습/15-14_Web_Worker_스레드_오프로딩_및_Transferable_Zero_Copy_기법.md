# 15-14. Web Worker 스레드 오프로딩 및 Transferable Zero-Copy 기법 해설

> **문서 관리 메타데이터**
> - 문서번호: `LEA-ENG-014`
> - 제정일자: 2026-09-25
> - 최근개정: 2026-09-25 (v1.0.0 제정)
> - 책임조직: 플랫폼 비즈니스 엔진 코어팀 / 기술교육위원회
> - 적용범위: `src/ppdf/workers/SearchablePdfWorker.ts`, `src/ppdf/services/SearchablePdfWorkerClient.ts`
> - 관련 문서:
>   - [03-01. 문서 작성 및 편집이력 정책](../03.정책/03-01_문서작성_및_편집이력_정책.md)
>   - [05-15. Web Worker Searchable PDF 백그라운드 컴파일 엔진 설계](../05.설계/05-15_Web_Worker_Searchable_PDF_백그라운드_컴파일_엔진_설계.md)
>   - [15-11. pdf-lib 기반 투명 텍스트 레이어 임베딩 및 Searchable PDF 생성 기법](./15-11_pdf-lib_기반_투명_텍스트_레이어_임베딩_및_Searchable_PDF_생성_기법.md)
>   - [18-01. 사용자 PDF 스튜디오 이용 매뉴얼](../18.메뉴얼/18-01_사용자_PDF_스튜디오_이용_매뉴얼.md)

---

## 1. 개요 및 학습 목표
본 문서는 브라우저 환경에서 수백 쪽의 PDF를 생성하거나 대용량 바이너리 연산을 수행할 때 메인 UI 스레드가 멈추는 **프리징(Freeze/Hang) 현상을 해결하기 위한 Web Worker 스레드 오프로딩 아키텍처**와 **Transferable Objects를 통한 제로 카피(Zero-Copy) 메모리 최적화 기법**을 심층 해설합니다.

---

## 2. Web Worker 스레드 분리 아키텍처

```mermaid
graph TB
    subgraph "Main UI Thread (브라우저 화면 60fps 유지)"
        A[사용자 클릭: Searchable PDF 내보내기] --> B[SearchablePdfWorkerClient]
        B --> C[UI 프로그레스 모달 렌더링]
        B -.->|Cancel 요청 시 即時 terminate| D[Worker 자원 회수]
    end

    subgraph "Web Worker Thread (백그라운드 독립 OS 스레드)"
        E[SearchablePdfWorker] --> F[pdf-lib PDFDocument 생성]
        F --> G[페이지 루프: 이미지 & 투명 텍스트 합성]
        G --> H[doc.save: 바이너리 직렬화]
    end

    B -->|postMessage START_COMPILE| E
    G -->|postMessage PROGRESS 0%~100%| B
    H -->|postMessage SUCCESS, [pdfBytes.buffer] (Zero-Copy)| B
```

### 2-1. 메인 스레드 이벤트 루프의 한계
- 자바스크립트는 기본적으로 싱글 스레드 이벤트 루프에서 실행됩니다.
- PDF 페이지 파싱, BBox 투명 텍스트 좌표 계산, 폰트 글리프 매핑, 이미지 디코딩과 같은 무거운 연산이 메인 스레드에서 실행되면 마우스 클릭, 스크롤, CSS 애니메이션이 모두 중단(0fps)됩니다.

### 2-2. Web Worker 스레드 오프로딩의 장점
- 브라우저는 Web Worker를 별도의 OS 네이티브 스레드에서 실행합니다.
- 백그라운드 스레드에서 800쪽 PDF를 합성하더라도 사용자는 뷰어 스크롤, 줌, 메뉴 조작을 **0ms 지연**으로 자유롭게 수행할 수 있습니다.

---

## 3. Transferable Objects를 통한 Zero-Copy 메모리 전송

### 3-1. 구조화 복제(Structured Clone) vs 소유권 이전(Transferable)

| 비교 항목 | 구조화 복제 (Structured Clone) | Transferable Objects (소유권 이전) |
| :--- | :--- | :--- |
| **작동 원리** | 데이터를 바이트 단위로 전체 복제 | 메모리 포인터(소유권)만 즉각 이전 |
| **복사 비용** | $O(N)$ (100MB 기준 약 50~150ms 소요) | $O(1)$ (**0ms 즉시 이전**) |
| **메모리 점유** | 송신 스레드와 수신 스레드에 **2배 메모리 점유** | 단일 메모리 유지 (송신 스레드에서는 분리됨) |
| **구현 방법** | `postMessage({ pdfBytes })` | `postMessage({ pdfBytes }, [pdfBytes.buffer])` |

### 3-2. 핵심 코드 구현

```typescript
// Web Worker 내부: 바이너리 ArrayBuffer 소유권 이전
const result = await SearchablePdfExportEngine.createSearchablePdf(pages, options);
const buffer = result.pdfBytes.buffer;

(self as any).postMessage(
  {
    type: 'SUCCESS',
    jobId,
    result,
  },
  [buffer] // Transferable Array
);
```

---

## 4. 지능형 환경 폴백 (Graceful Fallback) 설계
- Web Worker를 지원하지 않는 환경(예: Node.js TDD 환경, 구형 웹뷰)에서는 Worker 생성 예외를 감지하여 동기 엔진 `SearchablePdfExportEngine.createSearchablePdf()`로 자동 폴백합니다.
- 동일한 인터페이스(`compileSearchablePdfAsync`)를 유지함으로써 프론트엔드 컴포넌트는 실행 환경과 무관하게 안정적인 코드를 작성할 수 있습니다.

---

## 📋 편집 이력 (Revision History)

| 작업일자 | 이슈 | 태스크 | 작업자 | 작업내용 | 사용 AI 모델명 | 에이전트 | 참고링크 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-09-25 | #16 | TASK-0013-02 | gemini | 최초 제정: Web Worker 스레드 오프로딩 및 Transferable Zero-Copy 기법 해설 작성 | Gemini 3.7 Flash | Google Antigravity | [05-15. Web Worker 설계](../05.설계/05-15_Web_Worker_Searchable_PDF_백그라운드_컴파일_엔진_설계.md) |
