#[0035-04] 서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화 구현 완료 보고

> **세션 ID**: `SESSION-0035`  
> **태스크 ID**: `TASK-0035-01`  
> **작업 브랜치**: `task/0035_01_admin_p5_api_pdf_viewer_Gemini`  
> **기준 커밋 SHA**: `d1d66875843ba630b2114f5ad1a4a1c94131a49a`  
> **하네스 상태**: `#태스크처리` 완결 ➔ `#태스크정리` 대기

---

### 1. 작업 개요 및 핵심 구현 성과

사용자 검토 및 사전 승인된 계획에 따라, 현시점에서 불필요한 백엔드 API 연동을 지양하고 **엔드유저 서비스 화면 중심의 디자인 시스템(tokens.ts) 일관성 확보 및 네비게이션 중복 해소·Top 단일화**를 100% 무결점으로 구현 완료하였습니다.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PDFrend 최상단 글로벌 헤더 (Navbar.tsx)                 │
│  [브랜드 로고]    [3대 시스템 스위처]    [Top 화면목록(25개) SSOT]   [4모드 테마]  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
      [서비스 포털 (Service Portal)]       [서비스설정 (Settings Studio)]
      - 클린 단일 서비스 컨텍스트 바        - 25개 와이어프레임 & 시스템 설정
      - 이중 헤더 및 중복 드롭다운 제거      - 프로그램 선택 시 즉각 양방향 동기화
      - themeClasses 4모드 시맨틱 토큰     - Harness 내부 중복 와이어프레임 뷰 제거
```

---

### 2. 세부 구현 내역

#### (1) 설계 문서 신규 발행 및 인덱싱 완결
- **설계서 발행**: [05-32_서비스화면_중심_디자인시스템_토큰_통합_및_네비게이션_단일화_설계서.md](file:///d:/dev/repository/git.jkoogit/purePDFrend/docs/05.설계/05-32_서비스화면_중심_디자인시스템_토큰_통합_및_네비게이션_단일화_설계서.md) (DOC-05-32)
- **인덱스 현행화**: [README_설계.md](file:///d:/dev/repository/git.jkoogit/purePDFrend/docs/05.설계/README_설계.md)에 Phase 5 서비스 중심 토큰 및 네비게이션 단일화 항목 등록.

#### (2) 디자인 시스템 토큰 정규화 (`src/styles/tokens.ts`)
- `getThemeAdaptiveClasses(theme: ResolvedTheme)` 시맨틱 헬퍼 확장:
  * `buttonPrimary`: Light(`bg-blue-600 text-white hover:bg-blue-500`), Dawn(`bg-sky-500 text-white hover:bg-sky-400`), Dark(`bg-blue-600 text-white hover:bg-blue-500`)
  * `buttonSecondary`, `buttonOutline`, `cardHover`, `subPanel`, `badgeBrand` 등을 4모드(Light, Dawn, Dark, System)별로 완벽 정의.

#### (3) 글로벌 헤더 Top 화면목록(25개) 단일화 (`src/shared/components/Navbar.tsx`)
- 최상단 글로벌 헤더 중앙에 `<WireframeTopDropdown theme={resolvedTheme} />`를 단일 SSOT로 통합.
- 기존의 별도 중복 드롭다운 마크업 및 미사용 상태(`isWireframeMenuOpen`, `handleJumpToWireframe`)를 완전히 제거.

#### (4) 와이어프레임 드롭다운 양방향 동기화 (`src/ppdf/components/WireframeTopDropdown.tsx`)
- `selectedProgId` 상태 및 `purepdfrend-navigate-wireframe` 커스텀 이벤트 리스너 연동.
- 4모드 적응형 스타일(검색창, 퀵필터 탭, 프로그램 카드 호버/선택) 강화.

#### (5) 서비스 포털 이중 헤더 해소 및 토큰 대입 (`src/ppdf/components/PurePdfServicePortal.tsx`)
- 상단에 중복 배치되었던 자체 로고, 중복 드롭다운, 중복 테마 전환 메뉴, 시스템 전환 버튼을 전면 제거.
- 세련된 단일 서비스 컨텍스트 바(환영 메시지 + 권한 상태 칩 + 로그인/로그아웃 버튼)로 교체.
- 대시보드 환영 카드, 4대 주요 지표, 7대 PDF 핵심 도구, 롤링 배너, 정보 탭, 공유 문서 조회 바, 로그인/권한 모달, 800쪽 뷰어 모달에 `themeClasses` 시맨틱 토큰 100% 대입.

#### (6) 하네스 마스터 내 잔여 뷰 정리 (`src/App.tsx`)
- 하네스(`harness`) 도메인 내에 남아있던 `activeView === 'wireframes'` 뷰 마운트 구문을 제거하여 `activeSystem === 'settings'`(서비스설정)으로 일원화.

---

### 3. 검증 결과

1. **정적 타입 검사 (`node ./node_modules/typescript/bin/tsc --noEmit`)**:
   - 컴파일 오류: **0건 (ALL PASSED)**
2. **4단계 전수 점검 및 가드레일 진단 (`scripts/service_health_check.ts`)**:
   - [1단계] 서버 헬스체크 & PostgreSQL DB 브릿지 & 7종 복합 인덱스: **합격**
   - [2단계] 하네스 계층 데이터 정합성 & 토큰 집계 & 작업그래프: **합격**
   - [3단계] 무결성 종합 감사 점수: **100점 만점 [A+ (PERFECT)]** (고아 레코드 0건, 429 격리 준수)
   - [4단계] 60개 기술문서 SHA-256 해시 & JSONB GIN 검색: **합격**

---

### 4. 다음 단계 안내

본 태스크의 구현 및 검증이 완료되었으므로, 규칙 2.3에 따라 코드리뷰 문서 발행 및 Git 동기화를 위한 `#태스크정리`를 진행하실 수 있습니다.

```bash
#태스크정리 [0035-01] 서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화 태스크정리
```
