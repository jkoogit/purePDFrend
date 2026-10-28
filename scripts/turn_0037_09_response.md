#[0037-09] TASK-0037-01 메뉴 바로가기 개편 및 실서비스 직결 아키텍처 상태 '완료' 승급 및 원격 브랜치 배포 완료

> **세션 번호**: `[0037]` (SESSION-0037)  
> **태스크 번호**: `[01]` (TASK-0037-01)  
> **턴 식별자**: `#[0037-09]`  
> **작업 구분**: `#태스크승급` (READ-ONLY 태스크 상태 '완료' 승급, 원격 3대 브랜치 배포 승급 및 세션 잔여 태스크 안내)  
> **검증 상태**: `reconcile_session_traces.ts` 대화턴 100% 영속화, 원격 3대 브랜치(`dev`, `stg`, `main`) 최신 커밋 SHA 100% 일치 교차 검증 완료 (`714bae9e...`)

---

### 1. 원격 브랜치 배포 승급 및 SHA 교차 검증 결과 (Promotion Verification)

GitHub REST API(`POST /repos/:owner/:repo/merges`) 및 패스트포워드 엔진을 통해 `dev` 브랜치의 최신 커밋을 `stg` 및 `main` 브랜치에 즉시 배포 승급하였으며, 3대 브랜치의 최신 커밋 SHA 일치 여부를 교차 검증하였습니다.

| 브랜치 | 최신 커밋 SHA | 승급 상태 | 커밋 메시지 / 비고 |
| :---: | :---: | :---: | :--- |
| **`dev`** | `714bae9e2c6f8fc6900c73d1b77a288285821944` | **기준 커밋 (Base)** | PR #111 Merge: `[TASK-0037-01] 메뉴 바로가기 개편, 단일 메뉴 원장 구축...` |
| **`stg`** | `714bae9e2c6f8fc6900c73d1b77a288285821944` | **승급 완료 (Fast-forward)** | `dev` 브랜치 최신 커밋 100% 동기화 (Status: 200 OK) |
| **`main`** | `714bae9e2c6f8fc6900c73d1b77a288285821944` | **배포 완료 (Production)** | 프로덕션 운영 브랜치 즉시 승급 반영 (Status: 200 OK) |

**교차 검증 판정**: `dev === stg === main` 3대 브랜치 SHA 100% 일치 확인 (무손실 동기화 완결).

---

### 2. 태스크 작업 결과 리뷰 (Task Deliverables Review)

#### [에이전트 거버넌스 및 백엔드 작업]
- **문서작성**:
  - `docs/07.로드맵/07-03_전체_화면_리뷰대상_목록_및_소스_연계_로드맵.md`: 전체 49개 화면(메뉴 37개 + 팝업 12개) 분류, 소스 위치, 실서비스 컴포넌트 경로, 3대 배포 URL 전수 매트릭스 수립.
  - `docs/10.리뷰/261028_052_메뉴바로가기_개편_단일메뉴원장_구축_및_실서비스직결_아키텍처_완결_코드리뷰.md`: `10-52` 코드리뷰 문서 발행 및 아키텍처 개편 상세 기록.
  - `docs/10.리뷰/README_리뷰.md`: 코드리뷰 인덱스 10-52 항목 등록 및 현행화.
- **백엔드 (API & DB)**:
  - `POST /api/agent/docs/sync`: 222개 마크다운 문서 SHA-256 해시 일괄 동기화 및 실물 없는 고아 문서 25건 완전 정리.
  - `POST /api/agent/trace/reconcile`: SESSION-0037 전체 대화턴(Turn 1~8) 원격 DB(`aiagent.agent_conversation_trace`) 100% 무손실 영속화.
  - `aiagent.harness_task_meta`: `TASK-0037-01` 상태를 `완료`(`COMPLETED`)로 원격 DB 최종 승급 현행화.

#### [서비스(PDF) 프론트엔드 작업]
- **단일 메뉴 원장 (`src/shared/constants/menuRegistry.ts`) 구축**:
  - 전체 49개 화면의 단일 진실 공급원(SSOT) 정의 및 `isRealServiceScreen()`, `getProgramMeta()` 유틸리티 함수 제공 [TASK-0037-01].
- **메뉴 바로가기 레이어 (`src/ppdf/components/WireframeRibbonLayer.tsx`) 개편**:
  - 로컬 하드코딩 배열 삭제 및 `menuRegistry.ts` 직결, 41개 실서비스 화면 `실서비스 직결` 배지 표시, 미전환 4개 화면 `⚠️ 와이어프레임` 경고 배지 분기 [TASK-0037-01].
  - 상단 버튼 영역 터치/마우스 슬라이드 드래그 및 휠 가로 스크롤 적용, 모바일 키패드 자동 팝업 방지를 위해 자동 포커스(`focus()`) 배제 [TASK-0037-01].
- **공통 탑 드롭다운 (`src/ppdf/components/WireframeTopDropdown.tsx`) 개편**:
  - `menuRegistry.ts` 기반 화면 메타데이터 직결 및 실서비스 상태 연동 [TASK-0037-01].
- **화면 라우터 중앙화 (`src/ppdf/views/UnifiedServiceScreenRouter.tsx`)**:
  - `hasRealServiceScreen` 중복 로컬 함수 제거, `isRealServiceScreen` 기반 실서비스 화면 렌더링 직결, 첫화면(`PG-USR-01`) 상단 네비게이션 제어 바 자동 숨김 [TASK-0037-01].
- **글로벌 이벤트 연동 (`src/App.tsx`)**:
  - `purepdfrend-navigate-screen` 및 `purepdfrend-navigate-wireframe` 듀얼 이벤트 청취 및 안전한 화면 직결 네비게이션 보장 [TASK-0037-01].

#### [테스트 및 가드레일 진단]
- **정적 검증 (`tsc --noEmit`)**: 0 errors (PASS) [TASK-0037-01].
- **빌드 검증 (`vite build`)**: Production 번들 컴파일 100% 성공 [TASK-0037-01].
- **4단계 종합 진단 (`service_health_check.ts`)**: 100점 만점 [A+ PERFECT] 전 항목 합격 (고아 0건, 429 격리 0건) [TASK-0037-01].

---

### 3. 세션 내 잔여 태스크 현황 및 다음 진행 선택지

AGENTS.md 거버넌스 규칙 [규칙 2.4]에 의거하여, `#태스크승급` 이후 입력되는 프롬프트는 `#태스크시작` 또는 `#세션정리`로 엄격히 제한됩니다.

| 태스크 ID | 태스크명 | 상태 | 우선순위 |
| :---: | :--- | :---: | :---: |
| **`TASK-0037-01`** | **메뉴 바로가기 개편, 단일 메뉴 원장 구축 및 실서비스 직결 아키텍처 완결** | **완료 (COMPLETED)** | **HIGH** |
| `TASK-0037-02` | PG-USR-09 정밀 사용자 환경설정 화면 실서비스 컴포넌트화 및 와이어프레임 전환 | 미착수 (대기) | MEDIUM |
| `TASK-0037-03` | PG-SET-03 단축키 및 제스처 바인딩 화면 실서비스 컴포넌트화 | 미착수 (대기) | MEDIUM |

```bash
# 선택지 1 (추천): 이번 세션의 핵심 목표가 모두 달성되었으므로 세션 정리 및 회고록(13-30) 작성
#세션정리 : SESSION-0037 메뉴 바로가기 개편 및 실서비스 직결 아키텍처 완결 세션 마감

# 선택지 2: 잔여 미전환 4개 화면 중 PG-USR-09 정밀 환경설정 실서비스 전환 태스크 착수
#태스크시작 : TASK-0037-02 PG-USR-09 정밀 사용자 환경설정 화면 실서비스 컴포넌트화
```
