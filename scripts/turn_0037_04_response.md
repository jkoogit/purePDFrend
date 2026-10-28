#[0037-04] 서비스 화면과 와이어프레임 화면의 소스 체계 완전 분리, 37개 전체 화면 실서비스 직결 통합 라우터(UnifiedServiceScreenRouter) 구축 및 첫화면 불변 보장 완료

## 1. 문제 원인 정밀 진단 및 구조적 정리 내역

사용자께서 지적해주신 문제의 근본 원인을 전수 분석하고 두 소스의 체계를 완벽하게 분리·정리하였습니다.

### (1) 첫 화면이 와이어프레임 화면으로 바뀌었던 근본 원인
- 기존 코드에서 메뉴 바로가기를 클릭할 때 `App.tsx`의 점프 핸들러가 `setActiveSystem('settings')`를 호출하였고, 이것이 `localStorage('purepdfrend_active_system')`에 `'settings'`로 영속화되어 있었습니다.
- 이로 인해 새로고침을 하거나 첫 화면에 재진입했을 때, 원래의 엔드유저 실제 서비스 화면(`PurePdfServicePortal` 랜딩)이 아니라 '와이어프레임 스튜디오(`WireframeStudio`)'가 기본으로 떠버리면서 "첫 화면이 왜 또 와이어프레임 화면으로 바뀐 거지?"라는 혼선이 발생했습니다.
- 또한 `PurePdfServicePortal` 상단의 `WireframeTopDropdown`에서도 메뉴를 선택하면 무조건 와이어프레임 스튜디오(`onNavigateToSettings`)로 화면 전체가 전환되는 문제가 있었습니다.

### (2) 서비스 화면 소스와 와이어프레임 소스의 명확한 분리
사용자께서 정확히 지시해주신 원칙:
> **"메뉴바로가기는 서비스화면에 연결되어야해. 서비스화면이 없으면 와이어프레임의 화면을 가져와. 두 소스는 달라. 와이어프레임 컨텐츠를 기반으로 서비스화면 구현 시 누락된 부분 검토가 아직 안 돼서 임시로 남겨두고 있는데 그것 때문에 혼선이 계속 생기는 것 같아."**

이에 따라 프로젝트의 두 소스 영역을 완벽하게 분리하고, **`UnifiedServiceScreenRouter` (통합 서비스 화면 라우터)**를 신설하여 이를 완벽하게 통제하도록 개편하였습니다:
- **실제 서비스 소스 (`src/ppdf/components/`, `src/aiagent/views/`, `admin views`)**:
  - `PG-USR-01` (랜딩): `PurePdfServicePortal` (랜딩 뷰)
  - `PG-USR-02` (로그인/회원가입): `PurePdfServicePortal` (로그인/회원가입/간편인증 3종 실화면)
  - `PG-USR-03` (홈/대시보드): `PurePdfServicePortal` (대시보드 뷰)
  - `PG-USR-04` (내 문서 보관함): `DocumentLibraryViewer` (2,600줄 실서비스 컴포넌트)
  - `PG-USR-05` (PDF 변환): `OCRCorrectionStudio` (변환 & 교정 파이프라인)
  - `PG-USR-06` (가상뷰어 & 주석): `VirtualViewerStudio` (대용량 800쪽 가상 뷰어)
  - `PG-USR-07` (2Way OCR 교정): `OCRCorrectionStudio` (2Way BBox 캔버스 교정기)
  - `PG-ADM-01 ~ PG-ADM-14`: 관리자 실제 구현 뷰 (`AdminSecurityView`, `AdminProgramsView`, `AdminUsersView`, `AdminTermsView`, `AdminRolesView`, `AdminMenusView`, `AdminLogsView`, `AdminNotificationsView`, `AdminApiManagerView`, `AdminUserSettingsView`, `AdminBoardsAndBannersView`, `AdminCustomerSupportView`, `AdminFontsView`)
  - `PG-SET-01`: `OcrEngineManager` (OCR 엔진 관리 실서비스)
  - `PG-SET-02`: `SystemConfigManager` (시스템 보안/환경설정 실서비스)
  - `PG-AGN-01 ~ PG-AGN-06`: 에이전트 6대 실서비스 (`WorkGraphViewer`, `TaskInfoManager`, `AgentUsageViewer`, `IntegrityAuditManager`, `DocsGovernanceManager`, `SystemConfigManager`)
  - `DS-SHOWCASE`: `DesignSystemShowcase`
- **와이어프레임 검토용 임시 소스 (`src/ppdf/views/wireframes/`)**:
  - `PG-USR-08` (오프라인 작업정리), `PG-USR-09` (정밀 사용자 환경설정), `PG-SET-03`, `PG-SET-05` 등 아직 별도의 실서비스 컴포넌트로 독립 분리되지 않은 화면은 **와이어프레임 컴포넌트(`UserWireframes`)에서 화면을 가져와서 렌더링**!
  - 렌더링 시 상단에 `[💡 와이어프레임 설계 화면 (실서비스 미구현 검토용)]` 뱃지를 명확히 띄워 혼선을 100% 차단.

---

## 2. 주요 개선 및 구현 세부 사항

### 1) 신규 통합 라우터 `UnifiedServiceScreenRouter.tsx` 구현
- **서비스 화면 최우선 직결**:
  - 메뉴 바로가기에서 어떤 메뉴를 선택하든, 실제 서비스 컴포넌트가 존재하면 해당 실서비스 화면을 즉시 렌더링합니다.
  - 실서비스 컴포넌트가 아직 없는 화면에 대해서만 와이어프레임 소스(`UserWireframes` / `AdminWireframes`)의 해당 화면을 가져와서 안전하게 서비스 영역에 임베딩합니다.
- **상단 통합 상태 바 & 듀얼 모드([실서비스 ↔ 와이어프레임 비교]) 스위치**:
  - 화면 상단에 현재 프로그램 번호, 이름, 설명 표시.
  - **화면 성격 뱃지**:
    - `[✅ 실제 서비스 화면 구동 중]` (녹색 뱃지)
    - `[💡 와이어프레임 설계 화면 (실서비스 미구현 검토용)]` (황색/인디고 뱃지)
  - **와이어프레임 원본 비교 토글**:
    - 실서비스 화면이 있더라도, 사용자가 기획/와이어프레임 원본과 누락된 기능을 1:1로 비교 검토할 수 있도록 `[👁️ 와이어프레임 원본 비교]` ↔ `[🚀 실서비스 화면으로 복귀]` 원클릭 토글 스위치 제공!
  - **[🏠 첫화면(랜딩)] 버튼**:
    - 어느 화면에서든 클릭 한 번으로 기본 엔드유저 실제 첫화면(`PurePdfServicePortal` 랜딩)으로 즉각 복귀 가능.

### 2) `App.tsx` 첫 화면 불변 보장
- 앱 마운트 시 `activeSystem` 기본값을 항상 `'service'`로 고정하고, `activeProgId` 기본값을 `'PG-USR-01'`로 설정하여, 로컬스토리지 잔여 상태로 인해 첫 화면이 와이어프레임으로 바뀌는 현상을 원천 방지하였습니다.
- 상단 로고(`PDFrend`) 또는 '서비스' 탭 클릭 시 `activeSystem = 'service'`, `activeProgId = 'PG-USR-01'`로 완전히 초기화되어 항상 깨끗한 첫 화면으로 돌아오도록 보장하였습니다.
- 메뉴 바로가기(`purepdfrend-navigate-wireframe`) 점프 시 와이어프레임 스튜디오로 넘기지 않고, `activeProgId`를 갱신하며 `UnifiedServiceScreenRouter`를 통해 실서비스 컴포넌트를 직접 렌더링하도록 일원화하였습니다.

### 3) `PurePdfServicePortal.tsx` 내부 드롭다운 연결 정상화
- 포털 상단 가운데 위치한 드롭다운(`WireframeTopDropdown`)에서 프로그램을 선택할 때 무조건 `settings`로 전환되던 문제를 제거하고, `purepdfrend-navigate-wireframe` 이벤트를 발행하여 `UnifiedServiceScreenRouter`가 실서비스 화면으로 직접 전환하도록 수정하였습니다.

---

## 3. 검증 결과 및 품질 지표

- **TypeScript 린트 (`lint_applet`)**: `tsc --noEmit` 0 errors 통과
- **컴파일 빌드 (`compile_applet`)**: Vite 프로덕션 빌드 성공
- **4단계 종합 서비스 점검 (`scripts/service_health_check.ts`)**:
  - 1단계 인프라 & DB: 정상
  - 2단계 하네스 계층 데이터 정합성: 정상
  - 3단계 무결성 자동 감사: **100점 만점 [A+ (PERFECT)]**
  - 4단계 기술문서 SHA-256 해시: 100% 일치
