# 11. 운영 (Operations & Deployment) 요약 가이드

## 📋 폴더 개요
Cloud Run 배포 가이드, 환경변수 설정, Nginx 리버스 프록시 및 운영 모니터링 절차를 다룹니다.

## 📑 하위 문서 목록
| 문서번호 | 파일명 | 문서 제목 | 주요 내용 요약 |
| :--- | :--- | :--- | :--- |
| `09-01` | `09-01_가상화_스크롤_구현_명세.md` | 가상화 스크롤 구현 명세 | 800쪽 렌더링 시 DOM 윈도잉 및 ResizeObserver 버퍼 계산식 |
| `11-01` | `11-01_클라우드런_배포_및_운영_가이드.md` | Cloud Run 배포 및 운영 가이드 | 포트 3000 바인딩, 도커 컨테이너 빌드, 환경변수 시크릿 관리 방안 |
| `11-02` | `11-02_에이전트_토큰_및_세션인계_운영프로세스_가이드.md` | 에이전트 토큰 관리 및 무손실 세션 인계 운영프로세스 가이드 | BRI 가드레일, 단계별 SOP, HandoffDossier 및 Scorecard 운영 절차 |

<div align="center">
  <img src="./images/README_운영_diag_1.svg" alt="11. 운영 (Operations & Deployment) 요약 가이드 - 아키텍처 및 상태 흐름도 다이어그램 1" style="max-width: 100%; height: auto; border: 1px solid #334155; border-radius: 12px;" />
  <p><em>[그림] 11. 운영 (Operations & Deployment) 요약 가이드 - 아키텍처 및 상태 흐름도 다이어그램 1</em></p>
</div>

```mermaid
graph LR
    Build[Vite & Esbuild 빌드] --> Container[Docker 컨테이너 패키징]
    Container --> CloudRun[Google Cloud Run 3000 포트]
    CloudRun --> User[엔드유저 접속]
```
