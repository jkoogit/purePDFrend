# 15. 테이블 거버넌스 및 6대 공통 감사 기준 (Table Governance & Audit)

본 문서는 `purepdfrend_dev` 데이터베이스에 생성되는 모든 엔터티가 준수해야 하는 6대 감사 컬럼과 JSONB 페이로드 규칙을 정의합니다.

---

## 1. 6대 공통 감사 컬럼 (Audit Columns)

모든 하네스 및 도메인 테이블은 아래 6개 표준 감사 컬럼을 반드시 포함해야 합니다:

| 컬럼명 | 데이터 타입 | Nullable | 기본값 | 설명 |
| :--- | :--- | :---: | :--- | :--- |
| `created_sys` | VARCHAR | NO | `'agent-service'` | 최초 생성 시스템 식별자 |
| `created_at` | TIMESTAMPTZ | NO | `now()` | 최초 레코드 생성 일시 |
| `created_by` | VARCHAR | NO | `'system'` | 최초 레코드 등록자 (에이전트명/사용자명) |
| `updated_sys` | VARCHAR | NO | `'agent-service'` | 최종 수정 시스템 식별자 |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | 최종 레코드 갱신 일시 |
| `updated_by` | VARCHAR | NO | `'system'` | 최종 레코드 수정자 |
| `version` | INTEGER | NO | `1` | 낙관적 락(Optimistic Lock) 버전 번호 |

---

## 2. JSONB 페이로드 거버넌스

- 각 테이블의 `doc_payload` 또는 `graph_payload`는 비구조화된 확장 메타데이터를 저장합니다.
- 필수 키 검증: 스키마 버전(`schema_version`), 생성 에이전트, 확장 프로퍼티를 명확히 기재합니다.
