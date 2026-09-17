# 01. 아키텍처 총괄 개요 (Architecture Overview)

본 문서는 **purePDFrend**의 전반적인 기술 아키텍처와 데이터 흐름, 대용량 처리 파이프라인을 정의합니다.

---

## 1. 3계층 아키텍처 (Client - Server - DB)

```
[ 웹 & 모바일 브라우저 / PWA ]
  ├── 800쪽 가상 스크롤 뷰어 (React + Tailwind)
  ├── 2-Way 대조 OCR 바운딩 박스 인터랙션
  ├── 계층형 목차(TOC) 트리 에디터
  ├── PDF 표준 주석 레이어 & 툼스톤 동기화
  └── 로컬 캐시: IndexedDB (페이지별 독립 청킹 저장)
            │
            ▼ (REST API / WebSocket / Vite Proxy)
[ Express Full-Stack 백엔드 (Node.js + TS) ]
  ├── 하네스 거버넌스 API (/api/agent/*)
  ├── 문서 SHA-256 검증 및 동기화 엔진 (/api/agent/docs/sync)
  ├── 작업 그래프 노드/엣지 디스패처 (/api/agent/graph)
  ├── OCR 하이브리드 엔진 (Tesseract.js WASM + Gemini 2.5 Flash)
  └── PDF 컴파일러 (pdf-lib 표준 빌더)
            │
            ▼ (Secure Remote DB Bridge: X-JKADH-SECRET)
[ PostgreSQL 개발DB (purepdfrend_dev) ]
  └── 스키마: aiagent
        ├── harness_session_meta
        ├── harness_task_meta
        ├── harness_loop_meta
        ├── agent_docs_meta
        ├── agent_conversation_trace
        └── harness_graph_node_meta
```

---

## 2. 800쪽 대용량 스캔 도서 처리 파이프라인

1. **스트리밍 분할 수신**:
   - 스캔 이미지 목록 또는 기존 PDF를 수신할 때 전체 바이트를 단일 객체로 유지하지 않고 페이지별 청크로 분할
2. **IndexedDB 온디맨드 페이징**:
   - 브라우저 메인 메모리 사용량을 100MB 미만으로 엄격히 제한
   - 뷰포트에 진입하는 페이지만 캔버스에 렌더링하고, 뷰포트를 벗어난 페이지는 텍스처 메모리 즉시 반환 (LRU Eviction)
3. **페이지 단위 격리 수정**:
   - 17페이지의 OCR을 수정하면 17페이지 레코드만 갱신되므로 타 페이지와의 충돌 0% 보장
