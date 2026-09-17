# 06. 개발DB 아키텍처 (Database Architecture)

본 문서는 PostgreSQL 개발 데이터베이스 **`purepdfrend_dev`**의 `aiagent` 스키마 설계 및 테이블 거버넌스 규칙을 기술합니다.

---

## 1. 데이터베이스 연결 정보
- **서버 인프라**: PostgreSQL 17.10 (Debian) on `ptype.pdfrend.com`
- **데이터베이스명**: `purepdfrend_dev`
- **전용 스키마**: `aiagent`
- **접속 보안**: `X-JKADH-SECRET` 토큰 기반 Remote Bridge

---

## 2. 핵심 테이블 목록

### 1) `aiagent.harness_session_meta`
- 전체 하네스 세션의 생명주기를 영속화합니다.
- 컬럼: `session_id`(PK), `session_name`, `work_group`, `status_cd`, `ai_agent`, `ai_model`, `started_at`, `ended_at`, `doc_payload`(JSONB), 6대 감사 컬럼.

### 2) `aiagent.harness_task_meta`
- Git 작업 브랜치 단위의 태스크 정보를 관리합니다.
- 컬럼: `task_id`(PK), `session_id`(FK), `task_name`, `status_cd`, `git_branch`, `started_at`, `ended_at`, `doc_payload`(JSONB), 6대 감사 컬럼.

### 3) `aiagent.harness_loop_meta`
- 원자적 WorkItem 단위의 루프 상태를 관리합니다.
- 컬럼: `loop_id`(PK), `task_id`(FK), `session_id`, `loop_name`, `status_cd`, `started_at`, `ended_at`, `doc_payload`(JSONB), 6대 감사 컬럼.

### 4) `aiagent.agent_docs_meta`
- `/docs` 디렉토리 내 마크다운 파일들의 메타데이터와 SHA-256 해시를 관리하여 100% 동기화를 보장합니다.
- 컬럼: `doc_id`(PK), `file_path`, `category`, `title`, `content_hash`, `last_synced_at`, `doc_payload`(JSONB), 6대 감사 컬럼.

### 5) `aiagent.agent_conversation_trace`
- 각 턴의 프롬프트, 응답, 도구 호출 및 토큰 소비량을 투명하게 기록합니다.
- 컬럼: `trace_id`(PK), `session_id`, `task_id`, `step_index`, `agent_name`, `model_name`, `user_prompt`, `agent_response`, `tool_calls`(JSONB), `prompt_tokens`, `completion_tokens`, `total_tokens`, 6대 감사 컬럼.

### 6) `aiagent.harness_graph_node_meta`
- 3계층(세션, 태스크, 루프) 작업 그래프 시각화 카드 및 관계도 정보입니다.
- 컬럼: `node_id`(PK), `session_id`, `entity_type`, `entity_id`, `title`, `status_cd`, `pos_x`, `pos_y`, `depends_on`(JSONB), `graph_payload`(JSONB).
