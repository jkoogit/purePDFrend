# purePDFrend (엔터프라이즈 스캔 PDF 제작 & AI 에이전트 하네스 스튜디오)

> **purePDFrend**는 수백 쪽 분량의 고해상도 도서 스캔 이미지를 경량 가상화 기술로 브라우저에서 안전하게 열람·교정하고, 고정밀 OCR과 계층형 TOC(목차), 표준 주석을 결합하여 국제 표준(ISO 32000)을 준수하는 고품질 PDF를 제작하는 엔터프라이즈 스튜디오입니다.  
> 또한, AI 에이전트와의 협업을 위한 3계층(세션-태스크-루프) 거버넌스 하네스와 대화 턴 감사 추적 체계를 내장하고 있습니다.

---

## 🚀 빠른 시작 (Quick Start)

### 1. 실행 환경 요구사항
- **런타임**: Node.js v20+ 또는 Bun
- **포트**: `3000` (Dev Server)

### 2. 패키지 설치 및 개발 서버 실행
```bash
# 종속성 설치
npm install
# 또는 bun install

# 프론트엔드 + 백엔드 개발 서버 동시 기동 (포트 3000)
npm run dev
# 또는 bun dev
```

브라우저에서 `http://localhost:3000`으로 접속하여 서비스를 이용할 수 있습니다.

### 3. 검증 및 빌드 스크립트
```bash
# TypeScript 정적 타입 검증 (린트)
npm run lint

# 서비스 전수 헬스체크 (4단계 무결성 검증)
npm run check:service

# 프로덕션 빌드 (Vite + Express Server 번들)
npm run build

# 프로덕션 서버 실행
npm start
```

---

## 📚 주요 기능 체계

### 1. 관리자 서비스 14대 기능 (PG-ADM-01 ~ 14)
- **PG-ADM-01 대시보드**: 시스템 리소스, 사용자 현황, 활성 세션 모니터링
- **PG-ADM-02 회원 및 접근 권한 관리**: RBAC 역할 기반 사용자 권한 제어
- **PG-ADM-03 AI 모델 및 프롬프트 관리**: Gemini / Claude / OpenAI 티어링 설정
- **PG-ADM-04 토큰 및 쿼터 관리**: 다차원 쿼터 정책 및 Graceful Degradation 관제
- **PG-ADM-05 대화 턴 감사 추적기**: 대화 턴 전수 영속화 및 429 토큰 소진 격리
- **PG-ADM-06 문서 거버넌스 매니저**: 18대 문서 체계 및 변경 이력 관리
- **PG-ADM-07 작업 그래프 뷰어**: 세션-태스크-루프 계층 시각화 및 필터 관제
- **PG-ADM-08 비-LLM 세션 재해복구(DR) 관제실**: 1-클릭 긴급 Git Push 및 스냅샷 복구
- **PG-ADM-09 OCR 엔진 및 사전 관리**: Tesseract.js 및 Gemini 멀티모달 OCR 관리
- **PG-ADM-10 PDF 보안 및 DRM 정책기**: AES-256 암호화 및 상황별 보안 전략 설정
- **PG-ADM-11 도서 서지 및 메타데이터 주입기**: 독서회독, 활동 이력 메타데이터 관리
- **PG-ADM-12 시스템 환경설정**: 3대 영역 설정 및 세션 자원 재동기화
- **PG-ADM-13 서비스 자가진단 가드레일**: 4단계 헬스체크 및 무결성 감사
- **PG-ADM-14 WireframeStudio 프로토타입**: 반응형 와이어프레임 시나리오 캔버스

### 2. 사용자 서비스 9대 화면 (PG-USR-01 ~ 09)
- **PG-USR-01 로그인/계정 포털**: 사용자 인증 및 세션 인계
- **PG-USR-02 내 서재 및 도서 목록**: 스캔 도서 및 제작 문서 관리
- **PG-USR-03 800쪽 대용량 가상화 뷰어**: 38MB 메모리 가드 기반 고속 렌더링
- **PG-USR-04 2-Way BBox OCR 교정기**: 캔버스 영역과 텍스트 에디터 양방향 동기화
- **PG-USR-05 PDF 레이아웃 편집기**: 페이지 분할, 병합, 순서 재배열, 회전
- **PG-USR-06 주석 및 형광펜 도구**: 메모, 하이라이트, 벡터 드로잉 주석
- **PG-USR-07 Searchable PDF 내보내기**: 투명 텍스트 레이어 결합 및 인코딩
- **PG-USR-08 오프라인 동기화 관리**: IndexedDB 기반 오프라인 캐시 및 충돌 병합
- **PG-USR-09 개인 설정 및 사용량 통계**: 개인 단축키, 테마 및 쿼터 확인

---

## 🛡️ AI 에이전트 거버넌스 규약 (AGENTS.md)

purePDFrend 프로젝트는 엄격한 AI 에이전트 생명주기를 준수합니다:
- **`#세션시작`**: 원격 이슈/PR 및 브랜치 일치 점검 ➔ 작업 브랜치 생성
- **`#태스크시작`**: READ-ONLY 분석, 세부 계획 수립 및 피드백 대기
- **`#태스크처리`**: 단위 기능 구현, TDD, `tsc --noEmit` 정적 검증
- **`#태스크정리`**: 리뷰 문서 작성, GitHub Git Data API를 통한 원격 커밋 Push
- **`#태스크승급`**: `dev` ➔ `stg` ➔ `main` 원격 브랜치 자동 배포 승급
- **`#세션정리`**: 회고록 작성, 이슈 종결 확인, 최종 배포 동기화
- **🚨 비-LLM 긴급 Push**: 세션 정지 시 LLM 우회 100% 안전 소스 백업 보장

---

## 🏛️ 기술 스택 및 아키텍처
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Mermaid
- **Backend / API**: Express 4, tsx
- **PDF Core**: pdf-lib, pdfjs-dist
- **Architecture**: 헥사고날 / 클린 아키텍처 (Ports & Adapters, Strategy Pattern)
