# 07. 로드맵 (Roadmap & Milestones) 요약 가이드

## 📋 폴더 개요
purePDFrend의 분기별 릴리즈 마일스톤, 기능 구현 우선순위 및 장기 발전 계획을 다룹니다.

## 📑 하위 문서 목록
| 문서번호 | 파일명 | 문서 제목 | 주요 내용 요약 |
| :--- | :--- | :--- | :--- |
| `07-01` | `07-01_릴리즈_로드맵_및_추진계획.md` | 릴리즈 로드맵 및 추진계획 | Phase 1(하네스&문서체계) -> Phase 2(가상화 뷰어) -> Phase 3(OCR 교정기) -> Phase 4(PDF 컴파일러) |

```mermaid
gantt
    title purePDFrend 추진 로드맵
    dateFormat  YYYY-MM-DD
    section Phase 1
    하네스 거버넌스 & 18대 문서 체계      :done,    des1, 2026-09-17, 2026-09-18
    section Phase 2
    800쪽 대용량 가상 뷰어 (38MB 가드)   :active,  des2, 2026-09-18, 2026-09-22
    section Phase 3
    2-Way BBox 캔버스 & 듀얼 OCR       :         des3, 2026-09-23, 2026-09-28
    section Phase 4
    TOC 아웃라인 & PDF 표준 컴파일러     :         des4, 2026-09-29, 2026-10-05
```
