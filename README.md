# 📘 purePDFrend (스캔 도서 PDF 제작 & OCR 교정 스튜디오)

> **purePDFrend**는 대용량 스캔 도서의 고품질 PDF 변환, 가상화 뷰어 기반 실시간 페이지 탐색, 하이브리드(로컬 WASM + Gemini Multimodal) OCR 교정 스튜디오, 그리고 3계층 AI 에이전트 거버넌스 하네스 엔진을 통합 제공하는 차세대 웹 플랫폼입니다.

---

## 📑 목차 (Table of Contents)
1. [🌟 주요 핵심 기능](#-주요-핵심-기능)
2. [⚙️ 시스템 요구사항 (Prerequisites)](#️-시스템-요구사항-prerequisites)
3. [🚀 로컬 개발 및 실행 방법 (Quick Start)](#-로컬-개발-및-실행-방법-quick-start)
4. [🔧 환경 변수 설정 (.env)](#-환경-변수-설정-env)
5. [🧪 테스트 및 무결성 진단 도구](#-테스트-및-무결성-진단-도구)
6. [🏗️ 아키텍처 및 디렉토리 구조](#️-아키텍처-및-디렉토리-구조)
7. [🛡️ AI 에이전트 거버넌스 및 재해복구(DR)](#️-ai-에이전트-거버넌스-및-재해복구dr)
8. [❓ 문제 해결 (Troubleshooting)](#-문제-해결-troubleshooting)

---

## 🌟 주요 핵심 기능

### 1. 📖 스캔 도서 PDF 제작 & 가상화 뷰어 스튜디오
- **대용량(800쪽+) 초고속 가상 스크롤**: DOM 노드 재활용 및 LRU 메모리 캐시 가드를 통해 수백 페이지의 스캔 도서도 메모리 낭비나 버벅임 없이 60fps로 매끄럽게 렌더링.
- **이미지 전처리 파이프라인**: 캔버스 기반 자동 기울기 보정(Deskew), 대비/이진화 필터, 여백 정리.
- **투명 텍스트 레이어 임베딩**: OCR로 인식된 텍스트 좌표를 스캔 이미지 하단에 투명 PDF 레이어로 결합하여 100% 검색 가능한(Searchable) PDF 생성 (`pdf-lib`, `pdfjs-dist`).

### 2. 🔍 하이브리드 OCR 엔진
- **로컬 WASM OCR (Tesseract.js)**: 오프라인 환경에서도 100% 무료로 동작하는 브라우저 내장 OCR (한글, 영문, 일본어, 한자).
- **클라우드 멀티모달 OCR (Gemini 2.5 Flash)**: 수식, 고어, 필기체, 복잡 다단 문서 인식률 99% 이상의 고품질 AI 교정.

### 3. 🤖 AI 에이전트 거버넌스 하네스 (Harness Engine)
- **3계층 상태 머신**: `#세션시작` ➔ `#태스크시작` (READ-ONLY 계획) ➔ `#태스크처리` (TDD/DDD) ➔ `#태스크정리` (리뷰) ➔ `#태스크승급` (배포).
- **토큰 쿼터 보호 및 429 에러 격리**: Quota 한도 초과(429) 대화 턴을 영구 격리하고 Flash 모델로 자동 Graceful Degradation 전개.
- **비-LLM 긴급 Push 및 무중단 DR**: 세션 행(Hang) 또는 토큰 소진 시 비-LLM 엔드포인트(`EmergencyGitPushEngine`)를 통해 원격 GitHub 브랜치로 소스를 즉각 보존.

### 4. 🗄️ 듀얼 데이터 스토어 (원격 PostgreSQL + 로컬 JSON 폴백)
- 원격 DB 브릿지 연결 장애 시에도 `data/local_agent_store.json`을 통해 UI/UX 먹통(Zero-Hang) 없이 오프라인 독립 실행.

---

## ⚙️ 시스템 요구사항 (Prerequisites)

- **Node.js**: `v20.0.0` 이상 (LTS 권장, `v22+` 완벽 호환)
- **패키지 매니저**: `npm` (`v9.0.0` 이상)
- **웹 브라우저**: 최신 Chrome, Edge, Safari 등 (WebAssembly 및 Canvas 지원 브라우저)

---

## 🚀 로컬 개발 및 실행 방법 (Quick Start)

### 1단계: 패키지 설치
프로젝트 루트 디렉토리에서 필요한 의존성 패키지를 설치합니다.
```bash
npm install
```

### 2단계: 개발 서버 실행 (Express + Vite 통합 모드)
`server.ts`는 Express API 백엔드와 Vite 프론트엔드 HMR(Hot Module Replacement)을 단일 포트에서 통합 서빙합니다.
```bash
npm run dev
```
- 터미널에 서버 구동 메시지가 표시되면 브라우저에서 아래 주소로 접속합니다:
  - 🌐 **웹 접속 주소**: [http://localhost:3000](http://localhost:3000)

### 3단계: 프로덕션 빌드 및 실행
상용 배포용 번들을 생성하고 프로덕션 서버를 실행하려면 아래 명령어를 사용합니다.
```bash
# 1. 프론트엔드 빌드 및 서버 번들링 (dist/ 생성)
npm run build

# 2. 프로덕션 서버 구동
npm start
```

---

## 🔧 환경 변수 설정 (.env)

프로젝트 루트에 `.env` 파일을 생성하거나 시스템 환경 변수를 등록하여 사용합니다. 설정하지 않은 경우 안전한 기본값으로 자동 폴백됩니다.

```env
# [서버 포트 설정]
PORT=3000

# [원격 PostgreSQL DB 브릿지 연동]
REMOTE_DB_BRIDGE_URL=https://ptype.pdfrend.com
REMOTE_DB_BRIDGE_SECRET=jkadh-secure-secret-token-2026

# [Google Gemini AI API 키 (OCR 및 거버넌스 분석용)]
GEMINI_API_KEY=your_gemini_api_key_here

# [GitHub API 연동 토큰 (원격 커밋/푸시 및 PR/이슈 자동 관리)]
GITHUB_TOKEN=your_github_personal_access_token_here
```

---

## 🧪 테스트 및 무결성 진단 도구

`purePDFrend`는 시스템 안정성과 데이터 거버넌스 준수를 위한 전방위 검증 스크립트를 제공합니다.

| 명령어 | 설명 |
| :--- | :--- |
| `npm run check:service` | **[추천]** 인프라, DB 브릿지, 7종 복합 인덱스, 거버넌스 정합성, 문서 해시, 429 격리 상태 종합 전수 진단 |
| `npm run lint` | TypeScript 정적 타입 검사 (`tsc --noEmit`) |
| `npm test` | 가상화 뷰어 및 메모리 가드 단위 테스트 실행 |
| `npm run test:all` | 거버넌스 ID, 토큰 쿼터, OCR 전처리, 긴급 Push 및 DR 전체 통합 테스트 |
| `npm run sync:branches` | 원격 Git 브랜치(`dev`, `stg`, `main`) 최신 커밋 정합성 점검 및 동기화 |
| `npm run push:github` | Git Data API를 통한 변경 파일 원격 `dev` 브랜치 자동 커밋 & 푸시 |

---

## 🏗️ 아키텍처 및 디렉토리 구조

```plaintext
purePDFrend/
├── src/
│   ├── aiagent/                # AI 에이전트 거버넌스 도메인 & 서비스
│   │   ├── domain/             # 토큰 쿼터, 상태 머신, 거버넌스 엔티티
│   │   ├── services/           # Harness, Emergency Git Push, 감사 서비스
│   │   └── types/              # 에이전트 규약 및 인터페이스
│   ├── components/             # React UI 컴포넌트 (스튜디오 뷰어, OCR 교정기, 에이전트 대시보드)
│   ├── ppdf/                   # 순수 PDF 가상화 뷰어 엔진 및 메모리 가드
│   └── main.tsx                # 프론트엔드 진입점
├── data/
│   └── local_agent_store.json  # DB 미연결 시 로컬 폴백 저장소
├── docs/                       # 표준 기술 문서 체계 (00.시작 ~ 17.참고)
│   ├── 03.정책/                # 코딩 및 아키텍처, 거버넌스 정책
│   ├── 05.설계/                # 가상화 뷰어, OCR 파이프라인 설계서
│   └── 13.회고/                # 세션별 회고 문서
├── scripts/                    # 헬스체크, GitHub 푸시, 브랜치 동기화 스크립트
├── tests/                      # TDD 단위 및 통합 테스트 스위트
├── server.ts                   # Express + Vite 통합 백엔드/프론트엔드 서버
├── package.json                # 프로젝트 메타데이터 및 스크립트 정의
├── vite.config.ts              # Vite 설정
├── AGENTS.md                   # AI 에이전트 최우선 거버넌스 행동 강령
└── GEMINI.md                   # Gemini 모델 티어링 및 쿼터 헌법
```

---

## 🛡️ AI 에이전트 거버넌스 및 재해복구(DR)

1. **상태 머신 준수**:
   - 모든 AI 에이전트는 [AGENTS.md](file:///d:/dev/workspace/git.jkoogit/purePDFrend/AGENTS.md)의 라이프사이클에 따라 `#세션시작` ➔ `#태스크시작` (READ-ONLY) ➔ `#태스크처리` ➔ `#태스크정리` ➔ `#태스크승급` 순서로만 코드를 수정합니다.
2. **토큰 소진 및 세션 행(Hang) 대응**:
   - 세션 정지 또는 429 오류 발생 시 상단 헤더의 **[🚨 긴급 소스 GitHub Push]** 버튼을 클릭하여 작업 소스를 원격에 안전하게 백업한 뒤, 새 창에서 `#세션복구`를 인입하여 작업을 이어받습니다.
3. **무중단 Zero-Hang 원칙**:
   - 외부 네트워크나 DB가 단절되어도 UI가 멈추지 않고 로컬 스토리지 및 캐시로 안전하게 폴백됩니다.

---

## ❓ 문제 해결 (Troubleshooting)

### Q1. `Port 3000 is already in use` 에러가 발생합니다.
- 기존에 실행 중인 node 프로세스가 포트를 점유하고 있을 수 있습니다.
- **Windows PowerShell**:
  ```powershell
  # 3000번 포트 점유 프로세스 확인 및 종료
  Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
  ```

### Q2. 원격 DB 연결 상태가 `DISCONNECTED`로 표시됩니다.
- `purePDFrend`는 **무중단 운영 정책(Zero-Hang Principle)**에 따라 DB가 미연결 상태여도 `data/local_agent_store.json`을 통해 모든 기능(PDF 뷰어, OCR, 에이전트 대시보드)이 정상 동작합니다.
- 네트워크 연결 복구 시 자동으로 원격 동기화가 재개됩니다.

### Q3. 서비스가 정상 작동하는지 한 번에 확인하고 싶습니다.
- 아래 명령어로 4단계 전수 가드레일 진단을 실행하세요:
  ```bash
  npm run check:service
  ```
