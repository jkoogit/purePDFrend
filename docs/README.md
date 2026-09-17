# purePDFrend - Architecture & Standards Documentation

본 저장소의 `/docs` 디렉토리는 purePDFrend 대용량 스캔 도서 PDF 제작, 다국어 OCR 교정 및 하네스 개발 플랫폼의 공식 표준 문서 집합입니다.

---

## 📚 표준 문서 목록 (Standard Documents)

| 번호 | 문서 파일명 | 문서 제목 | 핵심 내용 | 개정 버전 |
|---|---|---|---|---|
| **00** | `00-terminology-glossary.md` | 서비스 체계 용어 정의 & 커뮤니케이션 | 기본서비스(하네스) vs 대상서비스(PDF 스튜디오) 용어 체계 | v1.0.0 |
| **01** | `01-architecture-overview.md` | 아키텍처 총괄 개요 | 3계층 아키텍처, 800쪽 대용량 가상화, OCR 파이프라인 | v1.0.0 |
| **06** | `06-database-architecture.md` | `purepdfrend_dev` DB 아키텍처 | PostgreSQL `aiagent` 스키마, 6대 공통 감사 컬럼 | v1.0.0 |
| **08** | `08-task-graph-management.md` | 작업 그래프 관리 거버넌스 | 3계층(세션/태스크/루프) 관계도, 카드 간격 및 뷰모드 | v1.0.0 |
| **09** | `09-harness-lifecycle.md` | 하네스 3계층 라이프사이클 | 세션-태스크-루프 상태머신 및 파일 수정 권한 매트릭스 | v1.0.0 |
| **15** | `15-table-governance-and-audit.md` | 테이블 거버넌스 및 6대 공통 감사 | 6대 감사 컬럼, 낙관적 락 버전, JSONB 페이로드 표준 | v1.0.0 |

---

## 📑 프로젝트 이슈 및 브랜치
- **현재 작업 브랜치**: `task/바이브코딩환경구축-및-에이전트관리설계_gemini`
- **연결 세션 ID**: `SESSION-20260917-001`
- **연결 태스크 ID**: `TASK-20260917-001`
- **동기화 대상 DB**: `purepdfrend_dev` on `ptype.pdfrend.com`
