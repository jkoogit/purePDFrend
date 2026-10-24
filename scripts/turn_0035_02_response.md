#[0035-02] 서비스 화면 중심 디자인 시스템 선행 정비 및 네비게이션 구조 간소화 일정 검토 의견 보고

---

### 1. 현시점 작업 방향성에 대한 총평 및 타당성 검토

사용자님께서 제기해 주신 **"디자인 설계가 완전히 정리되지 않은 상태에서 REST API 연동을 진행하는 것이 적절한가?"**에 대한 의문은 **소프트웨어 공학 및 제품 설계 관점에서 전적으로 타당하며 매우 정확한 지적**입니다.

#### 💡 API 연동 선행 시 발생할 수 있는 부작용 (위험 요소)
1. **화면 구조 변경에 따른 연쇄 수정(Churn & Refactoring Debt)**:
   - UI 레이아웃, 폼 필드, 테이블 구조, 탭 배치가 변경되면 이에 바인딩된 React 상태(`state`), 유효성 검사, API 호출 훅, 비동기 핸들러가 모두 연쇄적으로 깨져 중복 작업이 발생합니다.
2. **에이전트 시스템 ➔ 서비스 화면 중심 전환기 불일치**:
   - 현재 플랫폼은 초기 'AI 에이전트 하네스 마스터' 중심에서 '엔드유저 PDF 서비스 포털' 중심으로 무게중심이 완전히 이동하는 과도기입니다.
   - 이 시점에서 와이어프레임과 서비스 화면 간의 컴포넌트 이관, 테마/토큰 통일, 네비게이션 간소화가 먼저 확정되지 않으면 화면마다 다른 UI 규격이 고착화됩니다.
3. **결론**:
   - **"API 연동을 즉시 진행하지 않고, 서비스 화면 중심의 디자인 시스템(토큰/테마) 일관성 확보 및 네비게이션 구조 정리를 이번 세션의 최우선 작업으로 재편하는 것"**이 훨씬 견고하고 빠른 길입니다.

---

### 2. 제기해 주신 4대 핵심 과제별 현황 진단 및 해결 방향

#### 1) 서비스 화면 기준 화면 리뷰 및 디자인 정책 수립 (2.1 & 2.2)
- **현황 진단**:
  - 와이어프레임 25종에 대한 토큰화는 완료되었으나, 이를 실제 사용자가 사용하는 `PurePdfServicePortal` 및 실서비스 화면 컴포넌트로 통합하는 과정에서 여백, 버튼 크기, 폰트 위계, 카드 패딩 등의 편차가 발생하고 있습니다.
- **해결 방안**:
  - 이번 세션에서 서비스 화면을 기준으로 한 **통합 UI/UX 리뷰 문서(`DOC-10-57` 또는 `DOC-05-32`)**를 발행하고, 서비스 포털 화면 뼈대를 단일 표준으로 고정합니다.

#### 2) 테마 기준 요소 및 토큰 요소 색상 일관성 부조화 교정
- **현황 진단**:
  - [tokens.ts](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/styles/tokens.ts)에 4모드(Light, Dark, Dawn, System)가 정의되어 있으나, [PurePdfServicePortal.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/PurePdfServicePortal.tsx), [Navbar.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/shared/components/Navbar.tsx) 등에 인라인 클래스(`bg-slate-900/90`, `bg-[#070e22]`, `border-[#1e3066]`, 임의 HSL)가 여전히 혼재되어 있습니다.
  - 특히 Light 모드에서 일부 텍스트의 대비(Contrast) 부족, Dawn(여명) 모드에서의 카드 배경과 테두리 색상 명도 차이 미흡으로 시각적 통일감이 저해됩니다.
- **해결 방안**:
  - `tokens.ts`의 `getThemeAdaptiveClasses()` 헬퍼를 전면 보강하여 Surface(Canvas, Panel, Card, CardActive), Border, Text(Main, Muted), Accent 색상을 완전 토큰화하고 컴포넌트 내 하드코딩 색상을 100% 제거합니다.

#### 3) 네비게이션 기준 정리 및 불필요 요소 제거 (에이전트 우선 ➔ 서비스 우선)
- **현황 진단**:
  - [App.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/App.tsx)에서 `activeSystem === 'settings'`(서비스설정)와 `activeSystem === 'harness'`(에이전트관리 ➔ 와이어프레임 뷰) 양쪽에 [WireframeStudio.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/WireframeStudio.tsx)가 중복 마운트되어 있습니다.
  - 최상단 글로벌 [Navbar.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/shared/components/Navbar.tsx)와 서비스 포털 자체 상단 바가 2단으로 중복 노출되어 헤더가 지나치게 많은 화면 영역을 차지합니다.
- **해결 방안**:
  - **불필요 요소 제거**: 서비스 화면으로 이관된 와이어프레임 뷰를 에이전트 시스템(`harness`) 메뉴에서 정리하고, 하네스는 본연의 역할인 '작업그래프/태스크/토큰통계/무결성감사' 4대 거버넌스 뷰로 특화합니다.
  - **헤더 단일화**: 서비스 우선 모드에서는 단일 클린 헤더를 노출하고, 에이전트/설정은 우상단 관리자 프로필 메뉴 또는 권한 전환 시에만 깔끔하게 진입하도록 통합합니다.

#### 4) 개발용 화면 이동 기능의 "Top 화면목록(25개 바로가기)" 단일화
- **현황 진단**:
  - 개발 및 검수 중 25개 와이어프레임/서비스화면을 이동할 때 메뉴를 여러 단계 클릭해야 하는 불편함이 있습니다.
- **해결 방안**:
  - 현재 구현된 [WireframeTopDropdown.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/WireframeTopDropdown.tsx)를 최상단 글로벌 헤더 중앙에 단일 배치하여, **어느 화면에서든 1클릭으로 25개 전체 화면(사용자 9종 + 관리자 16종 + 쇼케이스)을 즉시 점프·검수**할 수 있도록 네비게이션을 극도로 단순화합니다.

---

### 3. 재조정된 단계별 작업 로드맵 제안

| 세션 | 기존 계획 | **사용자 피드백 반영 재조정 계획 (추천)** | 주요 산출물 |
| :---: | :--- | :--- | :--- |
| **SESSION-0035<br/>(현재 세션)** | Phase 5 관리자 REST API 연동 및 PDF 뷰어 토큰 통합 | **서비스 화면 중심 디자인 시스템(토큰/테마) 일관성 완결 & 네비게이션 중복 정리 & Top 단일화** | - `tokens.ts` 4모드 색상/시맨틱 일원화<br/>- Navbar 및 서비스 헤더 단일화<br/>- Top 화면목록(25개) 단일 점프 배치<br/>- 에이전트 내 중복 와이어프레임 정리<br/>- 설계/리뷰 문서 발행 (`DOC-05-32`) |
| **SESSION-0036<br/>(차기 세션)** | 관리자 모바일 반응형 최적화 | **PDF 핵심 3대 뷰어(순수 뷰어, 가상 스크롤, OCR 교정 스튜디오) 실서비스 화면 연동 및 토큰화 완결** | - PDF 뷰어 3종 실서비스 통합<br/>- 뷰어 툴바/사이드바 디자인 시스템 대입 |
| **SESSION-0037<br/>(후속 세션)** | - | **Phase 5 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST API 연동 (백엔드 데이터 바인딩)** | - PG-ADM-09 알림센터 REST API<br/>- PG-ADM-11 API키/웹훅 REST API<br/>- PG-ADM-12 공지/배너 CRUD REST API |

---

### 4. 하네스 스토어 및 세션 목표 동기화 방안

제안해 드린 일정 재조정에 동의해 주시면, 아래 사항을 즉시 반영하여 안전하게 작업을 시작합니다:
1. **GitHub 이슈 [#100](https://github.com/jkoogit/purePDFrend/issues/100)**의 목표를 '서비스 화면 디자인 토큰/테마 일관성 정비 및 네비게이션 단일화'로 현행화
2. [HarnessRepository](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/aiagent/domain/harness/HarnessRepository.ts)의 `SESSION-0035` 및 `TASK-0035-01` 목표 메타데이터 갱신
3. READ-ONLY 계획 수립(`#[0035-03]`)을 위한 `#태스크시작` 진행

---

### 5. 후속 프롬프트 제안

위 작업 일정 및 재조정 방향에 대해 승인해 주시면 아래 프롬프트로 즉시 `#태스크시작`을 진행하겠습니다.

```markdown
#태스크시작 [0035-01] 서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화 계획 수립
```
