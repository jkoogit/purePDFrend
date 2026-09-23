# 06. 기획 (Product & Functional Specs) 요약 가이드

## 📋 폴더 개요
서비스 시나리오, 사용자 스토리, 요구사항 정의서 및 인터페이스 기획안을 수록합니다.

## 📑 하위 문서 목록
| 문서번호 | 파일명 | 문서 제목 | 주요 내용 요약 |
| :--- | :--- | :--- | :--- |
| `06-01` | `06-01_모바일반응형_UIUX_오브젝트_표준기획서.md` | 모바일 반응형 UI/UX 및 표준 오브젝트 기획서 | 모바일 8대 뷰 사용자 여정, 5대 표준 오브젝트 UI 명세서 및 인터랙션 시나리오 |
| `06-02` | `06-02_에이전트_사용량_거버넌스_및_쿼터관리_기획서.md` | 에이전트 사용량 거버넌스 및 쿼터 관리 기능 기획서 | TokenBurnoutGauge 연료게이지, HandoffDossierModal, ScorecardModal UX 사양 |

<div align="center">
  <img src="./images/README_기획_diag_1.svg" alt="06. 기획 (Product & Functional Specs) 요약 가이드 - 아키텍처 및 상태 흐름도 다이어그램 1" style="max-width: 100%; height: auto; border: 1px solid #334155; border-radius: 12px;" />
  <p><em>[그림] 06. 기획 (Product & Functional Specs) 요약 가이드 - 아키텍처 및 상태 흐름도 다이어그램 1</em></p>
</div>

```mermaid
journey
    title 사용자 여정: 도서 스캔본 PDF 제작
    section 파일 등록
      고해상도 스캔본 업로드: 5: 사용자
      대용량 38MB 메모리가드 활성화: 5: 시스템
    section 교정 작업
      2-Way BBox 캔버스 대조: 4: 사용자
      OCR 텍스트 실시간 수정: 5: 사용자
    section 목차 및 컴파일
      TOC 계층구조 트리 편집: 4: 사용자
      ISO 32000 표준 PDF 빌드: 5: 시스템
```
