# 01. 프로젝트 (Project Overview) 요약 가이드

## 📋 폴더 개요
purePDFrend 프로젝트의 배경, 비전, 핵심 비즈니스 목표 및 엔터프라이즈 PDF 제작 스튜디오의 전체적인 범위를 다룹니다.

## 📑 하위 문서 목록
| 문서번호 | 파일명 | 문서 제목 | 주요 내용 요약 |
| :--- | :--- | :--- | :--- |
| `01-01` | `01-01_프로젝트_개요_및_범위.md` | 프로젝트 개요 및 범위 | 800쪽 대용량 가상화, 2-Way BBox, 듀얼 OCR, 바이브 코딩 하네스 비전 및 범위 |

<div align="center">
  <img src="./images/README_프로젝트_diag_1.svg" alt="01. 프로젝트 (Project Overview) 요약 가이드 - 아키텍처 및 상태 흐름도 다이어그램 1" style="max-width: 100%; height: auto; border: 1px solid #334155; border-radius: 12px;" />
  <p><em>[그림] 01. 프로젝트 (Project Overview) 요약 가이드 - 아키텍처 및 상태 흐름도 다이어그램 1</em></p>
</div>

```mermaid
graph TD
    Vision[엔터프라이즈 스캔 PDF 스튜디오] --> G1[800쪽 38MB 메모리가드]
    Vision --> G2[2-Way BBox 동기화]
    Vision --> G3[듀얼 OCR 파이프라인]
    Vision --> G4[AI 에이전트 바이브코딩]
```
