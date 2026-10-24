#[0035-03] 서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화 계획 수립 (READ-ONLY)

---

### 1. 도메인 분석 및 아키텍처 영향도 평가 (AGENTS.md [규칙 2.1-1])

- **도메인 분석**:
  * 대상 도메인: `서비스 도메인(PDF 서비스 포털, 헤더, 뷰어)` + `공통 디자인 시스템(tokens.ts, Navbar, 4모드 테마)` + `하네스 거버넌스 도메인(중복 뷰 정리)`
  * 프로젝트 방향성이 '에이전트 관리 중심'에서 '엔드유저 실서비스 포털 중심'으로 전환됨에 따라, 화면 진입점, 상단 헤더, 테마 색상 위계가 서비스 화면에 최적화되도록 아키텍처를 재편합니다.
- **아키텍처 영향도**:
  * [tokens.ts](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/styles/tokens.ts): 4모드(Light, Dark, Dawn, System) 시맨틱 표면(Surface), 보더(Border), 텍스트(Text), 악센트(Accent) 정규화 헬퍼 확장
  * [Navbar.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/shared/components/Navbar.tsx): 중복 서브메뉴 정리, 상단 중앙 **Top 화면목록(25개) 단일 바로가기** 앵커링, 이중 헤더 방지
  * [PurePdfServicePortal.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/PurePdfServicePortal.tsx): 내부 중복 헤더 제거, 클린 레이아웃 개편, 4모드 디자인 토큰 전면 대입
  * [App.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/App.tsx): 에이전트 시스템(`harness`) 내 중복 와이어프레임 뷰 제거 및 단일 진입로 확립
  * 기술문서: [docs/05.설계/](file:///d:/dev/repository/git.jkoogit/purePDFrend/docs/05.설계/) 내 `05-32` 설계서 및 [docs/10.리뷰/](file:///d:/dev/repository/git.jkoogit/purePDFrend/docs/10.리뷰/) 내 `10-57` 리뷰 문서 발행

---

### 2. 세션 / 태스크 / 루프 식별 정보 (AGENTS.md [규칙 2.1-2])

| 구분 | 식별자 | 명칭 및 상태 | 비고 |
| :--- | :--- | :--- | :--- |
| **세션 ID** | `SESSION-0035` | `[0035] 서비스 화면 중심 디자인 시스템 일관성 완결 및 네비게이션 단일화` | 하네스 스토어 동기화 완료 |
| **태스크 ID** | `TASK-0035-01` | `서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화` | 상태: `준비 (READY)` |
| **루프 ID** | `LOOP-0035-01` | `서비스 화면 토큰 대입 & 네비게이션 중복 제거 단위 검증 루프` | 루프 타당성 승인 |
| **작업 브랜치** | `task/0035_01_admin_p5_api_pdf_viewer_Gemini` | Base SHA: `d1d66875843ba630b2114f5ad1a4a1c94131a49a` | 원격 dev 100% 일치 |
| **GitHub 이슈** | **[#100](https://github.com/jkoogit/purePDFrend/issues/100)** | 세션 및 태스크 목표 연동 | Open 상태 |

---

### 3. 구체적인 세부 작업 계획 (작업별 번호 항목) (AGENTS.md [규칙 2.1-4])

1. **[작업 1: 디자인 토큰(tokens.ts) 4모드 시맨틱 정규화]** `[공통/디자인시스템]`
   - Light / Dark / Dawn / System 4모드별 Canvas, Panel, Card, Border, Text(Main/Muted), Accent 시맨틱 색상표 완전 현행화
   - WCAG AA(4.5:1) 가독성 보장 및 고대비 대비율 검증 헬퍼(`getThemeAdaptiveClasses`) 확장
2. **[작업 2: Top 화면목록(25개 프로그램 바로가기) 단일화 컴포넌트 앵커링]** `[서비스/공통]`
   - [WireframeTopDropdown.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/WireframeTopDropdown.tsx)를 글로벌 단일 진실 공급원(SSOT)으로 승격
   - [Navbar.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/shared/components/Navbar.tsx) 상단 중앙에 고정 배치하여 어느 화면(서비스/설정/에이전트)에서든 1클릭 즉시 이동 보장
   - [Navbar.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/shared/components/Navbar.tsx) 내부의 별도 중복 `btn-navbar-wireframe-dropdown` 제거
3. **[작업 3: 서비스 포털 상단 바와 글로벌 Navbar 2중 헤더 중복 해소]** `[서비스 화면]`
   - [PurePdfServicePortal.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/PurePdfServicePortal.tsx) 상단의 중복 로고, 중복 드롭다운, 중복 테마 토글을 정리하고 클린 레이아웃으로 개편
   - 글로벌 Navbar 하나로 브랜드/Top화면목록/권한/테마/DR관제/점검 도구를 일원화
4. **[작업 4: 에이전트 시스템(harness) 내 중복 와이어프레임 뷰 제거 및 다이어트]** `[에이전트/하네스]`
   - [App.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/App.tsx)의 `activeView === 'wireframes'` 뷰를 정리하고, 와이어프레임은 `settings` 및 Top 퀵점프로 일원화
   - 에이전트 마스터는 본연의 4대 거버넌스(`graph`, `task`, `usage`, `audit`) 및 지식창고(`docs`, `settings`), OCR엔진(`ocr`)에 집중
5. **[작업 5: 서비스 화면 기준 토큰 적용 및 인라인 색상 하드코딩 제거]** `[서비스 화면]`
   - [PurePdfServicePortal.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/PurePdfServicePortal.tsx) 내 롤링 배너, 공지/리뷰/가이드 탭, 샘플 문서 목록에 `getThemeAdaptiveClasses()` 전면 대입
   - 4모드 전환 시 색상 부조화(Light 모드 명도 부족, Dawn 모드 테두리 탁함) 완전 해소
6. **[작업 6: 설계 및 리뷰 문서 발행 및 4단계 서비스 종합점검]** `[문서/품질]`
   - `docs/05.설계/05-32_서비스화면_중심_디자인시스템_토큰_통합_및_네비게이션_단일화_설계서.md` 발행
   - `docs/10.리뷰/261024_057_서비스화면_디자인시스템_및_네비게이션_단일화_코드리뷰.md` 발행
   - 4단계 서비스 종합점검 100점 만점 [A+ (PERFECT)] 및 `tsc --noEmit` 무결성 검증

---

### 4. 사전 확인 질문 및 백로그 분기 안내 (AGENTS.md [규칙 2.1-4, 2.1-5])

- **사전 확인 질문**:
  1. Top 화면목록(25개) 드롭다운에서 현재 분류 체계('쇼케이스 1개', '사용자 서비스 9개', '관리자 서비스 16개')를 유지한 채 검색 필터 및 퀵 점프를 강화하는 형태로 진행하면 적절할까요?
  2. 에이전트 시스템(`harness`) 메뉴에서 '와이어프레임' 탭을 제거할 때, 기존 글로벌 네비게이션 커스텀 이벤트(`purepdfrend-navigate-wireframe`)는 그대로 호환 유지하도록 처리하고자 합니다.
- **태스크 작업 범위 외 항목 백로그 분기**:
  - 기존 계획에 포함되었던 **"Phase 5 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST API 연동"** 작업은 현재 UI/UX 뼈대와 네비게이션이 안정화된 이후 진행하는 것이 합당하므로, **`BACKLOG-0035-01`로 공식 분기하여 차기 세션에서 처리**합니다.
  - *"태스크 작업 범위를 벗어난 REST API 연동 요청을 백로그로 등록하고 이번 태스크에서 제외하여 진행합니다."*

---

### 5. 루프 분석 (LOOP-0035-01 사양) (AGENTS.md [규칙 2.1-8])

- **루프 처리 타당성**: 토큰 치환, 네비게이션 중복 제거, 4모드 테마 렌더링 검증 등 동일 패턴의 단위 검증이 반복되므로 루프 체계 적용이 매우 적합함.
- **문제의 목표**: 서비스 포털 및 네비게이션 영역의 색상 하드코딩 0개 달성 및 네비게이션 헤더 단일화.
- **입력 변수**: `themeMode` ('light' | 'dark' | 'dawn' | 'system'), `userRole`, `currentProgId`
- **출력 변수**: 단일 헤더 렌더링 트리, 4모드 테마 클래스 맵, 25개 프로그램 퀵점프 디스패처
- **평가 기준**:
  1. 4모드 테마 전환 시 텍스트 및 카드 시각적 깨짐 0건
  2. 25개 와이어프레임 화면 1클릭 퀵 점프 100% 정상 작동
  3. `tsc --noEmit` 타입 검사 오류 0건 및 4단계 서비스 종합점검 100점 만점 [A+] 유지

---

### 6. 승인 후 즉시 실행할 수 있는 정제된 후속 프롬프트 (AGENTS.md [규칙 2.1-7])

본 계획을 승인하고 실제 코드 수정 및 단위 검증을 진행하시려면 아래 프롬프트를 입력해 주시기 바랍니다.

```markdown
#태스크처리 [0035-01] 서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화 구현
```
