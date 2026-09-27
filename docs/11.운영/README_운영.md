# 11. 운영 (Operations & Deployment) 요약 가이드

## 📋 폴더 개요
Cloud Run 배포 가이드, 환경변수 설정, Nginx 리버스 프록시 및 운영 모니터링 절차를 다룹니다.

## 📑 하위 문서 목록
| 문서번호 | 파일명 | 문서 제목 | 주요 내용 요약 |
| :--- | :--- | :--- | :--- |
| `11-01` | `11-01_클라우드런_배포_및_운영_가이드.md` | Cloud Run 배포 및 운영 가이드 | 포트 3000 바인딩, 도커 컨테이너 빌드, 환경변수 시크릿 관리 방안 |

```mermaid
graph LR
    Build[Vite & Esbuild 빌드] --> Container[Docker 컨테이너 패키징]
    Container --> CloudRun[Google Cloud Run 3000 포트]
    CloudRun --> User[엔드유저 접속]
```
