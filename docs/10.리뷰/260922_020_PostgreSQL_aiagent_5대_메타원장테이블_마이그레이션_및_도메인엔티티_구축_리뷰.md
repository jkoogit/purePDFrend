# 10-20. PostgreSQL aiagent 5대 메타·원장 테이블 마이그레이션 및 도메인 엔티티 구축 리뷰

> **문서 상태**: 승인 (Approved)  
> **태스크 ID**: `TASK-20260922-001`  
> **세션 ID**: `SESSION-20260922-006`  
> **작성일자**: 2026-09-22  
> **검토자**: purePDFrend 아키텍처 및 데이터 거버넌스 팀  

---

## 📌 1. 개요 및 배경

본 리뷰 문서는 **SESSION-20260922-006**의 첫 번째 과제인 **`[01] PostgreSQL aiagent 5대 메타·원장 테이블 DDL 마이그레이션 및 도메인 엔티티 완결`**의 구현 결과와 아키텍처 정합성을 종합 검증하고 기록하는 기술 리뷰 보고서입니다.

AI 코딩 에이전트의 대화 턴 사용량을 단순 집계하는 수준을 넘어, **사용자 계정(UserAccount)**, **멀티 모델 카탈로그(ModelCatalog)**, **등급별 요금제(BillingPlan)**, **격리된 쿼터 원장(AccountQuotaLedger)** 및 **전 생명주기 감사 추적 로그(QuotaTransactionLog)**를 구축함으로써 다차원 쿼터 거버넌스의 영속성 기반을 완성했습니다.

### 🎯 핵심 달성 목표
1. **PostgreSQL aiagent 스키마 내 5대 신규 테이블 및 인덱스, 시드 데이터 구축**:
   - `agent_billing_plan`, `agent_model_catalog`, `agent_user_account`, `agent_account_quota_ledger`, `agent_quota_transaction_log`
2. **TypeScript OOP/DDD 도메인 모델링 및 불변성·자가 동결 규칙 구현**:
   - Aggregate Root(`AccountQuotaLedger`), Value Object(`BillingPlan`, `QuotaTransactionLog`), Entity(`UserAccount`, `ModelCatalog`) 분리
3. **Express 백엔드 REST API 8종 및 고신뢰 듀얼 스토어 폴백 연동**:
   - 원격 DB 연결 상태와 무관하게 `data/local_agent_store.json`과 자동 상호 보완 동기화
4. **TDD 단위 테스트(Suite 7 추가) 100% 통과 및 프로덕션 빌드 무결성 확보**:
   - 7개 테스트 스위트 전수 통과, `tsc --noEmit` 에러 0건, `compile_applet` 빌드 성공

---

## 🏗️ 2. 변경 상세 내역

### 2.1 데이터베이스 스키마 및 마이그레이션 (`scripts/migrate_quota_meta_tables.ts`)
* **`agent_billing_plan`**:
  * 4대 등급(`PLAN-FREE`, `PLAN-STARTER`, `PLAN-PRO`, `PLAN-ENTERPRISE`) 및 우선순위(`priority_tier`: 1~10), 버스트 허용 배수(`max_burst_multiplier`), 초과 정책(`BLOCK`, `THROTTLE`, `PAY_AS_YOU_GO`) 관리.
* **`agent_model_catalog`**:
  * 멀티 모델(`models/gemini-3.8-flash`, `models/gemini-3.8-pro`, `claude-3-5-sonnet`, `gpt-4o`, `deepseek-chat`)의 1K 입력/출력 토큰 단가(USD) 및 컨텍스트 윈도우 한도 관리.
* **`agent_user_account`**:
  * 계정 상태(`ACTIVE`, `FROZEN`, `SUSPENDED`), 조직 그룹, 요금제 외래키 연결.
* **`agent_account_quota_ledger`**:
  * 낙관적 락(`version`) 적용, 잔여 쿼터 음수 방어 `CHECK (remaining_quota >= 0 OR overage_allowed = true)` 제약조건 적용.
* **`agent_quota_transaction_log`**:
  * 트랜잭션 유형(`GRANT`, `DEDUCT`, `REFUND`, `FREEZE`, `UNFREEZE`), 변동 토큰(`token_delta`), 직후 잔액(`balance_after`), 사유(`reason_desc`)를 기록하는 불변 감사 원장.

### 2.2 도메인 엔티티 계층 (`src/aiagent/domain/token-quota/models/`)
* **`BillingPlan.ts`**: 요금제 엔티티. `isBurstPermitted(burstScore)`, `isHardBlockedOnExhaustion()` 비즈니스 규칙 캡슐화.
* **`ModelCatalog.ts`**: 모델 엔티티. `calculateCost(prompt, completion)` 입출력 토큰 정밀 USD 비용 산출 및 컨텍스트 한도 검증.
* **`UserAccount.ts`**: 사용자 엔티티. `freeze(reason)`, `unfreeze()`, `changePlan()` 상태 전이 캡슐화.
* **`AccountQuotaLedger.ts`**: 쿼터 원장 애그리게이트 루트.
  * `deduct(tokens, context)`: 원장 차감, 한도 초과 시 자동 원장 동결(`FROZEN`) 및 감사 로그(`QuotaTransactionLog`) 자동 생성.
  * `grant(tokens, reason)`: 추가 쿼터 충전 시 잔여 쿼터 확보에 따른 자동 동결 해제.
* **`QuotaTransactionLog.ts`**: 감사 추적 값 객체(VO).

### 2.3 백엔드 Express REST API 8종 (`server.ts`)
* `GET /api/agent/meta/plans`: 요금제 목록
* `GET /api/agent/meta/models`: 모델 카탈로그 목록
* `GET /api/agent/meta/users`: 사용자 목록 및 플랜/원장 조인 현황
* `GET /api/agent/meta/ledgers`: 쿼터 원장 전체 모니터링
* `GET /api/agent/meta/ledger/:userId`: 특정 사용자 원장 및 최근 감사 로그(20건)
* `POST /api/agent/meta/user/save`: 사용자 계정 생성 및 플랜 변경, 원장 초기화
* `POST /api/agent/meta/ledger/toggle-freeze`: 원장 수동 동결/해제 및 감사 로그 생성
* `POST /api/agent/meta/ledger/grant`: 쿼터 추가 부여 및 원장 잔액 갱신

---

## 📊 3. 검증 및 품질 결과

* **PostgreSQL 원격 DB 검증**:
  * `information_schema.tables` 조회 결과 11개 테이블 전수 정상 확인.
  * 시드 데이터(플랜 4건, 모델 6건, 사용자 2건, 원장 2건, 초기 지급 로그 2건) 정상 확인.
* **TDD 단위 테스트 (`tests/token_quota_domain.test.ts`)**:
  * Test Suite 1 ~ 7 전수 통과 (`7/7 Passed`).
  * 신규 Suite 7: 요금제 버스트 허용 판정, 모델 USD 비용 계산, 사용자 동결/해제, 원장 초과 차감 시 자동 동결 방어, 충전 시 자동 동결 해제 검증 완료.
* **정적 타입 검사 (`lint_applet` / `tsc --noEmit`)**:
  * TypeScript 에러 0건 (Clean).
* **프로덕션 빌드 (`compile_applet`)**:
  * Vite & esbuild 번들링 성공 (`Build succeeded - the applet is compiled`).

---

## 🎯 4. 후속 태스크 계획 (TASK-02 & TASK-03)

* **TASK-02: 턴 파이프라인 실시간 원장 차감 및 CBRI 복합 쿼터 엔진 연동**
  * `POST /api/agent/turn/complete` 실행 시 `AccountQuotaLedger.deduct()` 자동 인터셉트 연결.
  * 복합 소진 위험 지수($CBRI$) 산출 및 고갈 전 선제 Throttling/Block 제어.
* **TASK-03: 관리자 백오피스 메타 거버넌스 및 쿼터 제어 대시보드 UI 구축**
  * 사용자 관리, 모델 카탈로그 비교, 요금제 게이지, 긴급 충전/동결 토글 컴포넌트 프론트엔드 구현.

---

## 📋 편집 이력 (Revision History)

| 작업일자 | 이슈 | 태스크 | 작업자 | 작업내용 | 사용 AI 모델명 | 에이전트 | 참고링크 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-09-24 | #12 | TASK-0013 | gemini | 거버넌스 4대 ID 포맷 개선 및 18대 문서 체계 편집이력/다이어그램 표준화 | Gemini 1.5 Pro | Google Antigravity | [03-01. 문서 정책](../03.정책/03-01_문서작성_및_편집이력_정책.md) |
