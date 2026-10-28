#[0037-03] 메뉴 바로가기 모바일 슬라이드/드래그/휠 스크롤 적용, 간편인증 3종 연동 및 시스템 설정 관리, 37개 전체 서비스 화면 직결 네비게이션 전수 정밀 구축 완료

## 1. 개요 및 핵심 요구사항 조치 결과
사용자 피드백으로 접수된 3가지 핵심 기능 및 사용성 개선 요구사항을 100% 반영 완료하였습니다.

1. **메뉴 바로가기 모바일 모드 슬라이드/드래그/휠 스크롤 적용**:
   - `WireframeRibbonLayer.tsx`의 상단 카테고리 필터 탭(`전체`, `사용자`, `관리자`, `설정`, `에이전트`)이 모바일 뷰포트에서 줄바꿈되는 현상을 해결하였습니다.
   - 마우스 드래그(Drag), 터치 스와이프(Touch/Pan), 마우스 휠(Wheel Horizontal Scroll)을 지원하는 반응형 스크롤 컨테이너를 구현하고 `whitespace-nowrap shrink-0` 스타일을 적용하여 어떠한 해상도에서도 끊김 없이 부드럽게 탐색할 수 있도록 하였습니다.
2. **로그인 / 회원가입 간편인증 3종(카카오, 네이버, 구글) 연동 및 시스템 정책 제어**:
   - `UserWireframes.tsx`에 카카오, 네이버, 구글 원클릭 간편인증 체계를 전면 도입하였습니다.
   - **시스템 설정 제어**: 보안 정책(`easyAuthPolicy`: `optional` [기본값: 제공 및 생략가능], `required` [필수], `disabled` [비활성화])을 상단에 탑재하여 관리자가 간편인증 수단의 필수/선택 여부를 유연하게 통제할 수 있습니다.
   - **회원가입 ➔ 로그인 연동**: 회원가입 3단계에서 인증한 소셜 수단(카카오/네이버/구글)이 로컬 영속 스토리지(`purepdfrend_social_auth_account`)에 저장되며, 로그인 화면 접근 시 '회원가입 시 연동된 대표 간편인증 수단'으로 자동 감지되어 원클릭 간편 로그인으로 즉시 진입할 수 있도록 구현하였습니다.
3. **메뉴 바로가기 링크 전수 점검 및 37개 전체 서비스 화면 직결**:
   - 기존에 쇼케이스(`DesignSystemShowcase`)로 잘못 리다이렉트되던 11개 설정/에이전트 프로그램(대표적으로 `PG-SET-01` OCR 엔진 관리)을 전수 수정하였습니다.
   - **실서비스 화면 우선 원칙**: 실서비스가 존재하는 11개 핵심 화면(에이전트 6종 ➔ 하네스 콘솔, OCR 관리 ➔ `OcrEngineManager`, 시스템설정 ➔ `SystemConfigManager`, 서비스포털 ➔ `PurePdfServicePortal` 등)은 실제 동작하는 서비스 컴포넌트로 직접 연결하고, 와이어프레임 전용 기능만 와이어프레임 뷰로 안전하게 연결하였습니다.
   - `Navbar`, `WireframeTopDropdown`, `StudioShell`, `WireframeRibbonLayer` 전반에 걸쳐 37개 전체 프로그램 레지스트리(`ALL_SYSTEM_PROGRAMS`)를 일원화 적용하였습니다.

---

## 2. 세부 구현 내역

### (1) `WireframeRibbonLayer.tsx` (모바일 슬라이드/드래그/휠 & 줄바꿈 방지)
- `filterTabsContainerRef` 기반 마우스 드래그 상태 관리(`isFilterDragging`, `startX`, `scrollLeft`) 및 휠 이벤트 리스너(`handleFilterWheel`) 구현.
- 각 카테고리 탭 및 내부 배너/텍스트에 `shrink-0 whitespace-nowrap select-none`을 부여하여 가로 줄바꿈을 원천 차단.
- 37개 전체 서비스에 대해 `[실서비스]` (Emerald) vs `[와이어프레임]` (Indigo) 뱃지를 시각화하여 사용자가 이동 대상 화면의 성격을 사전에 인지할 수 있도록 보강.

### (2) `UserWireframes.tsx` (간편인증 3종 매핑 & 시스템 정책 제어)
- `easyAuthPolicy` 상태: `'optional'` | `'required'` | `'disabled'` 관리 및 시스템 정책 배너 제공.
- 회원가입 3단계:
  - 카카오, 네이버, 구글 간편인증 선택 시 원클릭 인증 완료 처리 및 계정 정보(`pureMaster@kakao.com` 등) 생성.
  - `easyAuthPolicy === 'optional'` 시 "간편인증 생략하고 가입완료" 버튼 지원.
  - `easyAuthPolicy === 'required'` 시 간편인증 미완료 가입 방어.
- 회원가입 4단계: 인증된 간편인증 수단 뱃지 표시 및 로그인 연동 안내.
- 로그인 화면:
  - 회원가입 시 등록된 간편인증 수단이 있을 경우 `[⭐ 회원가입 시 연동된 대표 간편인증]` 강조 카드 노출.
  - 간편인증 버튼 클릭 시 등록된 계정으로 즉시 일치 검증 및 자동 로그인 처리(`handleSocialEasyLogin`).

### (3) 전역 네비게이션 및 실서비스 직결 인터셉터
- `src/App.tsx`: `handleWireframeJump`에서 에이전트 6종, OCR 관리, 시스템설정, 서비스포털을 실서비스 모달 및 탭으로 직접 팝업/전환.
- `src/ppdf/views/wireframes/WireframeStudio.tsx`: `detail.type === 'settings'` 인입 시 `PG-SET-03/05`는 `UserWireframes`, `PG-SET-04`는 `AdminWireframes`로 분기하여 쇼케이스 폴백 문제 완전 해소.
- `src/shared/components/Navbar.tsx` & `src/ppdf/components/WireframeTopDropdown.tsx`: 구형 25개 드롭다운을 37개 전체 지원 리본 레이어로 교체 및 5개 필터 탭 지원.

---

## 3. 서비스 전수 검증 및 품질 지표
- **4단계 종합 서비스 점검 (`scripts/service_health_check.ts`)**:
  - `1단계` 인프라 & DB 연결: 정상
  - `2단계` 하네스 계층 데이터 정합성: 정상 (세션 34건, 태스크 58건, 루프 32건, 대화턴 100건)
  - `3단계` 시스템 무결성 자동 감사: **100점 만점 [A+ (PERFECT)]** (고아 레코드 0건, 토큰 격리 준수)
  - `4단계` 기술문서 & 전문 검색엔진: 245개 문서 SHA-256 해시 100% 일치 확인
- **TypeScript 린트 (`lint_applet`)**: 0 errors, 통과 (`tsc --noEmit`)
- **컴파일 빌드 (`compile_applet`)**: Vite 프로덕션 빌드 성공
