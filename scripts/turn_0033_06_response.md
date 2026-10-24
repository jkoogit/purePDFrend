#[0033-06] [00] 하네스 태스크/세션 UPSERT 스키마 헬퍼 함수 표준화 및 도메인 레포지토리 리팩토링 계획 수립

---

### 1. 도메인 분석 및 아키텍처 영향도 평가

- **대상 도메인 (AI 에이전트 하네스 메타 거버넌스 및 영속화 계층)**:
  1. **PostgreSQL 원장 테이블 스키마 정합성 보장**:
     - `aiagent.harness_session_meta`: 세션 ID, 세션명, 상태코드(`status_cd`), 브랜치, 시작/종료일시, `doc_payload`(JSONB)
     - `aiagent.harness_task_meta`: 태스크 ID, 세션 ID, 태스크명, 상태코드(`status_cd`), 브랜치, 시작/종료일시, `doc_payload`(JSONB) (주의: `priority`, `assigned_agent` 등 미존재 컬럼 자동 정제)
     - `aiagent.harness_loop_meta`: 루프 ID, 태스크 ID, 세션 ID, 루프명, 상태코드(`status_cd`), 시작일시(`started_at` NOT NULL), `doc_payload`(JSONB)
  2. **하이브리드 듀얼 영속화(Dual-Persistence) 단일 진실 공급원(SSOT) 구축**:
     - 현재 각 스크립트(`init_session`, `register_task`, `promote_task` 등)마다 개별 인라인 SQL과 `local_agent_store.json` 조작 코드가 중복 분산되어 발생하던 스키마 불일치 런타임 오류 원천 차단.
     - 도메인 레포지토리 패턴(Repository Pattern)을 적용하여 로컬 JSON 스토어와 원격 PostgreSQL DB 간의 트랜잭션 무결성 및 무중단 폴백(Zero-Hang Principle) 일원화.
  3. **Express 백엔드 하네스 API 확장 (`server.ts`)**:
     - `POST /api/agent/sessions` (세션 등록 및 UPSERT)
     - `POST /api/agent/tasks` (태스크 등록 및 상태 갱신)
     - `POST /api/agent/loops` (루프 등록 및 이력 관리)

- **아키텍처 영향도**:
  - **도메인 계층 (`src/aiagent/domain/harness/`)**:
    - `types.ts`: 실제 PostgreSQL DDL과 100% 호환되는 엄격한 TypeScript 타입 인터페이스 정의
    - `HarnessRepository.ts`: 세션, 태스크, 루프의 안전한 UPSERT 및 SQL 이스케이프, 로컬 폴백 제어 파사드
  - **서비스 계층 (`server.ts`)**:
    - 기존 조회 전용(GET) 엔드포인트에 더해 표준 RESTful 쓰기 엔드포인트(POST) 탑재
  - **기존 비즈니스 영향**:
    - 순수 에이전트 하네스 인프라 리팩토링으로 기존 PDF 변환/뷰어 및 사용자 화면에는 사이드이펙트 전무 (영향도 0%).

---

### 2. 세션 / 태스크 / 루프 식별 체계

- **세션 번호**: `[0033]` (`SESSION-0033`)
- **태스크 번호**: `[0033-02]` (`TASK-0033-02`)
- **루프 번호**: `LOOP-0033-02`
- **태스크 명**: `하네스 태스크/세션 UPSERT 스키마 헬퍼 함수 표준화 및 도메인 레포지토리 리팩토링`
- **담당 모델**: Gemini 1.5 Flash (Tier 2 구현/TDD)
- **작업 브랜치**: `task/0033_02_harness_repo_refactor_Gemini`

---

### 3. 구체적인 세부 작업 계획 (5대 번호 항목)

1. **[에이전트] 하네스 메타 엔티티 타입 표준화 (`src/aiagent/domain/harness/types.ts`)**:
   - `HarnessSessionEntity`, `HarnessTaskEntity`, `HarnessLoopEntity` 인터페이스 선언
   - 실제 PostgreSQL 컬럼 스키마 및 `local_agent_store.json` JSON 구조와 100% 일치하도록 정규화
2. **[에이전트] 하네스 도메인 레포지토리 구현 (`src/aiagent/domain/harness/HarnessRepository.ts`)**:
   - `upsertSession()`, `upsertTask()`, `upsertLoop()` 메서드 구현
   - 안전한 SQL 쿼리 빌더(파라미터 바인딩 및 특수문자 이스케이프) 내장
   - DB 장애 시 로컬 스토어 무중단 폴백(정책 02-05 준수) 및 로컬 스토어 즉시 동기화
3. **[백엔드] Express 서버 REST API 확장 ([server.ts](file:///d:/dev/repository/git.jkoogit/purePDFrend/server.ts))**:
   - `POST /api/agent/sessions`: 신규 세션 등록 및 상태 갱신
   - `POST /api/agent/tasks`: 태스크 시작/정리/완료 상태 갱신
   - `POST /api/agent/loops`: 루프 생성 및 결과 갱신
4. **[테스트] TDD 단위 테스트 및 무결성 검증**:
   - `tests/harness_repository_schema.test.ts` 작성: 3대 엔티티 UPSERT, 스키마 정합성, 로컬 폴백 단위 테스트
   - `tsc --noEmit` 정적 컴파일 검증 (오류 0건)
   - `scripts/service_health_check.ts` 4단계 전수 점검 100점 만점 [A+ (PERFECT)] 유지 확인
5. **[문서/학습] 아키텍처 학습 문서 발행**:
   - `docs/15.학습/15-25_하네스_메타원장_도메인레포지토리_및_스키마표준화_아키텍처.md` 작성

---

### 4. 루프 분석 (`LOOP-0033-02`)

1. **타당성 검토**:
   - 세션, 태스크, 루프 3대 엔티티의 스키마 빌더 및 로컬-원격 듀얼 동기화 로직은 정형화된 반복 패턴을 가집니다. 단위 루프(`LOOP-0033-02`)를 통해 순차적으로 엔티티별 매핑 정합성을 점증적으로 검증하는 것이 매우 타당합니다.
2. **문제의 목표 및 데이터 분석**:
   - 목표: SQL 구문 오류(컬럼 누락, NOT NULL 위반) 0% 달성 및 하네스 관리 코드 일원화
   - 데이터: `purepdfrend_dev` DB 원장 3개 테이블 스키마 및 `data/local_agent_store.json`
3. **조건 및 범위**:
   - 조건: DB 연결 실패 시에도 로컬 스토어에 무손실 저장되고 `LOCAL_FALLBACK` 응답 반환
   - 범위: `src/aiagent/domain/harness/`, `server.ts`, `tests/`
4. **입력/출력 변수 및 평가 기준**:
   - 입력: `HarnessSession`, `HarnessTask`, `HarnessLoop` 파라미터 객체
   - 출력: `{ success: boolean, source: 'REMOTE_DB' | 'LOCAL_FALLBACK' }`
   - 평가 기준: 단위 테스트 전수 통과, 4단계 서비스 점검 100점 만점, `tsc --noEmit` 무결점

---

### 5. 사전 확인 질문 및 작업 범위 무결성 평가

- **태스크 작업 범위 확인**:
  - 본 태스크는 **AI 에이전트 거버넌스 및 하네스 인프라 영역**에 집중되며, 순수 PDF 비즈니스 로직(OCR, 가상뷰어, 캔버스크롭 등)에 대한 소스 변경은 포함되지 않습니다.
  - 범위 이탈 요청은 확인되지 않았습니다.

---

### 6. 후속 실행을 위한 정제된 프롬프트

본 계획에 동의하시고 실제 구현 및 TDD 검증을 진행하시려면 아래의 정제된 프롬프트를 입력해 주시기 바랍니다.

```bash
#태스크처리 [0033-02] 하네스 태스크/세션 UPSERT 스키마 헬퍼 함수 표준화 및 도메인 레포지토리 리팩토링 구현
```
