#[0036-08] [TASK-0036-04] 서비스 화면 UI/UX 리뷰 및 공통 탑바/랜딩 고도화 계획 수립 보고

---

### 1. 도메인 분석 및 아키텍처 영향도 평가

AGENTS.md [규칙 2.1] READ-ONLY 분석 정책에 따라 소스 코드 및 문서 수정을 일체 보류하고, 사용자가 요청하신 5대 UI/UX 개선 요구사항을 DOM 셀렉터 및 컴포넌트 구조 단위로 심층 분석하였습니다.

```mermaid
graph TD
    subgraph AS_IS [1. 현재 구조 (AS-IS)]
        TOP_OLD["공통 Top Header (Navbar.tsx)<br/>- WireframeRibbonLayer (메뉴 바로가기)<br/>- DB 연결 상태 뱃지 [1.1]<br/>- DR 긴급관제 버튼 [1.2]<br/>- 정밀점검 버튼 [1.3]<br/>- 테마 토글 (다크 고정) [2]<br/>- 헤더 핀"]
        
        HARNESS_OLD["에이전트 서브 네비 (Navbar.tsx)<br/>- 1단 도메인 탭 / 2단 서브뷰 탭<br/>- 'AGENTS.md 준거 거버넌스 활성' 텍스트"]
        
        PORTAL_OLD["서비스 포털 (PurePdfServicePortal.tsx)<br/>- 상단 포털 헤더 카드 (기술 중심 소개문구) [4]<br/>- 중복 비로그인 안내 배너 [3.1]<br/>- 롤링 이벤트 배너<br/>- 정보 탭 (공지/리뷰/가이드)<br/>- 공유 문서 검색 입력창 (배경 대비 부족) [5]"]
    end

    subgraph TO_BE [2. 개선 목표 구조 (TO-BE)]
        TOP_NEW["공통 Top Header (클린 일반 사용자용)<br/>- WireframeRibbonLayer (메뉴 바로가기)<br/>- 테마 토글 (주간/야간/여명 동적 컬러 반영) [2]<br/>- 헤더 핀<br/>- (일반 사용자에게 불필요한 시스템 버튼 3종 제거)"]
        
        HARNESS_NEW["에이전트 서브 네비 (거버넌스 전문 제어)<br/>- 1단 도메인 탭 / 2단 서브뷰 탭<br/>- [기능이동 3종] DB 상태 뱃지 + DR 긴급관제 + 정밀점검 [1.1~1.3]"]
        
        PORTAL_NEW["서비스 포털 (직관적 사용자 경험)<br/>- 쉬운 설명문구 ('웹에서 바로 문서를 열고...') [4]<br/>- 중복 로그인 배너 완전 삭제 [3.1]<br/>- 롤링 배너 & 정보 탭<br/>- 검색 인풋 식별성 강화 (음영/테두리 대비 돋보임) [5]"]
    end

    TOP_OLD -- "버튼 3종 거버넌스 도메인으로 이관" --> HARNESS_NEW
    TOP_OLD -- "테마 토글 동적 컬러 적용" --> TOP_NEW
    PORTAL_OLD -- "중복 배너 삭제 & 문구 개편 & 인풋 대비 강화" --> PORTAL_NEW

    style TOP_NEW fill:#0284c7,stroke:#0369a1,color:#fff
    style HARNESS_NEW fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style PORTAL_NEW fill:#10b981,stroke:#059669,color:#fff
```

---

### 2. 세부 항목별 분석 및 구현 전략

#### 2.1 [1번 항목] 공통 Top 영역 3대 버튼 ➔ 에이전트 시스템 서브바 이동
- **대상 버튼 3종**:
  1. `1.1` **DB 연결 인디케이터** (`div:nth-child(2)`): DB 연결 상태(`정상`/`로컬`) 뱃지 및 호버 툴팁
  2. `1.2` **DR 긴급관제 버튼** (`#btn-emergency-recovery-panel`): 비-LLM 긴급 Push 및 DR 관제실 모달
  3. `1.3` **정밀점검 버튼** (`#btn-service-health-check`): 서비스 전수 4단계 가드레일 진단 모달
- **이동 타겟**:
  - `Navbar.tsx` 내부 `activeSystem === 'harness'`(에이전트관리 시스템)일 때만 노출되는 2단 서브 네비게이션 우측 영역(현재 `AGENTS.md 준거 거버넌스 활성` 텍스트 영역)으로 3개 버튼을 정규 이전.
- **기대 효과**:
  - 일반 서비스 사용자에게 개발자 전용 버튼(DR 긴급관제, 정밀점검, DB 연결)이 노출되지 않아 글로벌 탑바가 대폭 간결해짐.
  - 에이전트 관리자가 에이전트 시스템 화면에 진입했을 때만 직관적으로 거버넌스 도구를 즉시 조작할 수 있도록 역할 기반 UX 완성.

#### 2.2 [2번 항목] 테마 모드별 버튼색 반영 (`#btn-theme-toggle`)
- **현재 상태**: 다크 색상(`bg-slate-900 border-slate-800 text-slate-300`)으로 하드코딩.
- **개선 방안**: `resolvedTheme`에 따라:
  - **주간(light)**: 밝은 배경 및 선명한 테두리 (`bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-xs`)
  - **야간(dark)**: 어두운 배경 (`bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700`)
  - **여명(dawn)**: 딥나이트 블루 배경 (`bg-[#0e1a38] border-[#1e3066] text-sky-200 hover:bg-[#132247] hover:border-sky-500/50`)
- 테마 선택 팝오버 메뉴도 4모드 테마 클래스(`themeClasses.dropdown`)와 일치하도록 함께 개선.

#### 2.3 [3번 항목] 중복 로그인 안내 배너 삭제
- **대상**: [PurePdfServicePortal.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/PurePdfServicePortal.tsx) 570행:
  `{!isLoggedIn && (<div className="p-4 rounded-2xl border ...">... 로그인하고 대시보드 열기 ➔</div>)}`
- **조치**: 상단 포털 헤더 우측(307~332행)에 이미 `[로그인 / 권한시뮬]` 및 `[회원가입]` 버튼이 완비되어 있으므로, 롤링 배너 상단의 중복 배너 요소를 완전히 제거하여 불필요한 시각적 피로도 해소.

#### 2.4 [4번 항목] 비기술자 친화적 서비스 소개 문구 개편
- **대상**: [PurePdfServicePortal.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/PurePdfServicePortal.tsx) 246~248행:
  - **기존 문구**: `"대용량 스캔 PDF 듀얼 OCR, 800쪽 고속 가상화 뷰어 및 7대 핵심 도구 스튜디오"` (기술/기능 중심적)
  - **개편 제안 (안내 문구)**:
    - **추천안 A**: `"프로그램 설치 없이 웹에서 바로 PDF 문서를 열고, 글자를 추출하며, 안전하게 편집하고 공유할 수 있는 스마트 전자문서 서비스입니다."`
    - **추천안 B**: `"누구나 편리하게 PDF 문서를 빠르게 열람하고, 문서 내 글자를 쉽게 검색·복사하며, 다양한 문서 도구를 자유롭게 활용해보세요."`

#### 2.5 [5번 항목] 공유 열람 문서 검색 입력창 식별성 및 대비 개선
- **대상**: [PurePdfServicePortal.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/PurePdfServicePortal.tsx) 879행 `<input ... />`
- **개선 방안**:
  - 카드 배경과 명확한 시각적 구분을 위한 **음영 및 배경 대비 강화** (라이트: `bg-slate-50/90`, 다크: `bg-slate-950/90`, 여명: `bg-[#070e22]`).
  - 테두리 대비 강화 (`border-2 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`).
  - 입력창 좌측에 `Search(돋보기)` 인라인 아이콘 배치로 텍스트 입력 영역의 시각적 인지성(Affordance) 대폭 향상.

---

### 3. 세부 작업 계획 (Task Breakdown)

| 번호 | 작업 대상 컴포넌트 | 구분 | 세부 작업 내용 |
| :---: | :--- | :---: | :--- |
| **1** | [Navbar.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/shared/components/Navbar.tsx) | 서비스 | 공통 Top 헤더에서 3대 버튼(DB 인디케이터, DR 긴급관제, 정밀점검) 제거 후 에이전트관리 2단 서브바 우측으로 기능 이전 |
| **2** | [Navbar.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/shared/components/Navbar.tsx) | 서비스 | `#btn-theme-toggle` 및 팝오버 메뉴에 주간/야간/여명 4모드 동적 테마 클래스 대입 |
| **3** | [PurePdfServicePortal.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/PurePdfServicePortal.tsx) | 서비스 | 상단 로그인/회원가입과 중복되는 비로그인 환영 배너 블록 완전 삭제 |
| **4** | [PurePdfServicePortal.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/PurePdfServicePortal.tsx) | 서비스 | 포털 메인 카드 서브타이틀을 비기술자 친화적인 알기 쉬운 서비스 소개 문구로 교체 |
| **5** | [PurePdfServicePortal.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/PurePdfServicePortal.tsx) | 서비스 | 공유 문서 검색 입력창에 명확한 배경 대비, 테두리, 포커스 링 및 검색 아이콘 적용 |
| **6** | 설계/리뷰 문서 및 가드레일 | 문서/검증 | `DOC-05-36` 설계서 발행, `DOC-10-61` 리뷰 발행, `tsc --noEmit` 및 `service_health_check` 100점 통과 |

---

### 4. 사전 확인 및 선택 질문

> **[질문 4.1] 서비스 소개 문구(4번 항목) 선호도**:  
> 아래 추천안 중 선호하시는 문구를 선택하시거나, 직접 원하시는 문구를 지정해 주시면 그대로 반영하겠습니다:
> - **옵션 1 (추천 - 직관적 설명)**:  
>   *"프로그램 설치 없이 웹에서 바로 PDF 문서를 열고, 글자를 추출하며, 안전하게 편집하고 공유할 수 있는 스마트 전자문서 서비스입니다."*
> - **옵션 2 (사용자 편의 중심)**:  
>   *"누구나 편리하게 PDF 문서를 빠르게 열람하고, 문서 내 글자를 쉽게 검색·복사하며, 다양한 문서 도구를 자유롭게 활용해보세요."*

---

### 5. 후속 실행 프롬프트 제안

계획을 승인하시고 단위 구현을 착수하시려면 아래 프롬프트를 입력해 주시기 바랍니다:

```text
#태스크처리 [0036-04] 서비스화면리뷰 UI/UX 개선 (버튼 3종 에이전트 시스템 이동, 테마 토글 버튼색 반영, 중복 로그인 배너 삭제, 친화적 소개문구 개편, 검색창 식별성 강화)
```
