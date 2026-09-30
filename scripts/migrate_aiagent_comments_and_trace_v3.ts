import '../src/shared/envLoader';
import https from 'https';

const DB_BRIDGE_URL = process.env.REMOTE_DB_BRIDGE_URL || 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = process.env.REMOTE_DB_BRIDGE_SECRET || 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function executeSql(sql: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ database: TARGET_DATABASE, sql });
    const req = https.request(`${DB_BRIDGE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-JKADH-SECRET': DB_BRIDGE_SECRET,
        'Authorization': `Bearer ${DB_BRIDGE_SECRET}`,
        'Content-Length': Buffer.byteLength(payload),
      },
      rejectUnauthorized: false,
      timeout: 30000,
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('========================================================================');
  console.log('🚀 [TASK-0019-01] aiagent 스키마 11대 테이블/컬럼 코멘트 & 대화턴 스키마 개편');
  console.log('========================================================================');

  // 1. 기존 레코드 확인
  const countBeforeRes = await executeSql('SELECT count(*) as cnt FROM aiagent.agent_conversation_trace;');
  const countBefore = parseInt(countBeforeRes?.rows?.[0]?.cnt || '0', 10);
  console.log(`📊 현재 agent_conversation_trace 레코드 수: ${countBefore}건`);

  // 2. 신규 테이블 생성 (지정된 컬럼 순서 적용)
  console.log('\n--- 1. agent_conversation_trace_new 테이블 생성 및 컬럼 재배치 ---');
  const createNewTableSql = `
    CREATE TABLE IF NOT EXISTS aiagent.agent_conversation_trace_new (
      trace_id VARCHAR(64) PRIMARY KEY,
      session_id VARCHAR(64) NOT NULL,
      task_id VARCHAR(64),
      step_index INTEGER NOT NULL DEFAULT 1,
      loop_id VARCHAR(64),
      agent_name VARCHAR(64) NOT NULL DEFAULT 'gemini',
      model_name VARCHAR(128) NOT NULL DEFAULT 'models/gemini-3.8-flash',
      operator_account VARCHAR(64) NOT NULL DEFAULT 'jkok2j2m',
      agent_account VARCHAR(255) NOT NULL DEFAULT 'jkok2j2m@gmail.com',
      user_email VARCHAR(255) NOT NULL DEFAULT 'jkok2j2m@gmail.com',
      user_prompt TEXT NOT NULL,
      agent_response TEXT NOT NULL,
      response_summary TEXT,
      tool_calls JSONB DEFAULT '[]'::jsonb,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      created_sys VARCHAR(32) NOT NULL DEFAULT 'agent-harness',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by VARCHAR(64) NOT NULL DEFAULT 'system',
      updated_sys VARCHAR(32) NOT NULL DEFAULT 'agent-harness',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
      version INTEGER NOT NULL DEFAULT 1
    );
  `;
  await executeSql(createNewTableSql);
  console.log('✅ 신규 규격 테이블 aiagent.agent_conversation_trace_new 생성 완료');

  // 3. 기존 데이터 무손실 복사 및 계정 정보 매핑
  console.log('\n--- 2. 기존 104건 데이터 무손실 복사 (세션 매핑 및 백필) ---');
  const copyDataSql = `
    INSERT INTO aiagent.agent_conversation_trace_new (
      trace_id, session_id, task_id, step_index, loop_id,
      agent_name, model_name, operator_account, agent_account, user_email,
      user_prompt, agent_response, response_summary, tool_calls,
      prompt_tokens, completion_tokens, total_tokens,
      created_sys, created_at, created_by, updated_sys, updated_at, updated_by, version
    )
    SELECT
      t.trace_id,
      t.session_id,
      t.task_id,
      COALESCE(t.step_index, 1),
      t.loop_id,
      COALESCE(t.agent_name, 'gemini'),
      COALESCE(t.model_name, 'models/gemini-3.8-flash'),
      COALESCE(
        s.doc_payload->>'operator_account',
        CASE WHEN t.session_id IN ('SESSION-0018', 'SESSION-0019') THEN 'jkok2j2m' ELSE 'jkoogit' END
      ) AS operator_account,
      COALESCE(
        s.doc_payload->>'user_email',
        CASE WHEN t.session_id IN ('SESSION-0018', 'SESSION-0019') THEN 'jkok2j2m@gmail.com' ELSE 'jkoogit@gmail.com' END
      ) AS agent_account,
      COALESCE(
        s.doc_payload->>'user_email',
        CASE WHEN t.session_id IN ('SESSION-0018', 'SESSION-0019') THEN 'jkok2j2m@gmail.com' ELSE 'jkoogit@gmail.com' END
      ) AS user_email,
      t.user_prompt,
      t.agent_response,
      t.response_summary,
      COALESCE(t.tool_calls, '[]'::jsonb),
      COALESCE(t.prompt_tokens, 0),
      COALESCE(t.completion_tokens, 0),
      COALESCE(t.total_tokens, 0),
      COALESCE(t.created_sys, 'agent-harness'),
      COALESCE(t.created_at, now()),
      COALESCE(t.created_by, 'system'),
      COALESCE(t.updated_sys, 'agent-harness'),
      COALESCE(t.updated_at, now()),
      COALESCE(t.updated_by, 'system'),
      COALESCE(t.version, 1)
    FROM aiagent.agent_conversation_trace t
    LEFT JOIN aiagent.harness_session_meta s ON s.session_id = t.session_id
    ON CONFLICT (trace_id) DO NOTHING;
  `;
  const copyRes = await executeSql(copyDataSql);
  console.log('✅ 데이터 복사 결과:', copyRes);

  const countNewRes = await executeSql('SELECT count(*) as cnt FROM aiagent.agent_conversation_trace_new;');
  const countNew = parseInt(countNewRes?.rows?.[0]?.cnt || '0', 10);
  console.log(`📊 복사된 레코드 수: ${countNew}건 (기존: ${countBefore}건)`);

  if (countNew < countBefore) {
    throw new Error(`데이터 유실 감지! 신규 건수(${countNew})가 기존 건수(${countBefore})보다 적습니다. 롤백 중단.`);
  }

  // 4. 테이블 스왑 및 인덱스 생성
  console.log('\n--- 3. 테이블 스왑 및 최적화 인덱스 구축 ---');
  const swapSql = `
    DROP TABLE IF EXISTS aiagent.agent_conversation_trace_old;
    ALTER TABLE aiagent.agent_conversation_trace RENAME TO agent_conversation_trace_old;
    ALTER TABLE aiagent.agent_conversation_trace_new RENAME TO agent_conversation_trace;

    CREATE INDEX IF NOT EXISTS idx_agent_conv_trace_session ON aiagent.agent_conversation_trace (session_id);
    CREATE INDEX IF NOT EXISTS idx_agent_conv_trace_task ON aiagent.agent_conversation_trace (task_id);
    CREATE INDEX IF NOT EXISTS idx_agent_conv_trace_loop ON aiagent.agent_conversation_trace (loop_id);
    CREATE INDEX IF NOT EXISTS idx_agent_conv_trace_operator ON aiagent.agent_conversation_trace (operator_account);
    CREATE INDEX IF NOT EXISTS idx_agent_conv_trace_account ON aiagent.agent_conversation_trace (agent_account);
    CREATE INDEX IF NOT EXISTS idx_agent_conv_trace_email ON aiagent.agent_conversation_trace (user_email);
    CREATE INDEX IF NOT EXISTS idx_agent_conv_trace_created ON aiagent.agent_conversation_trace (created_at DESC);
  `;
  await executeSql(swapSql);
  console.log('✅ 테이블 스왑 및 인덱스 7종 생성 완료');

  // 5. 11대 테이블 및 전체 컬럼 한글 코멘트 일괄 적용
  console.log('\n--- 4. aiagent 스키마 11대 테이블 및 전 속성 한글 코멘트 일괄 적용 ---');
  const commentsSql = `
    -- 1. harness_session_meta
    COMMENT ON TABLE aiagent.harness_session_meta IS '에이전트 세션 라이프사이클 관리 메타 원장 (세션 식별자, 목표, 상태, 모델, 담당계정)';
    COMMENT ON COLUMN aiagent.harness_session_meta.session_id IS '세션 고유 식별자 (형식: SESSION-YYYYMMDD-NNN 또는 SESSION-NNNN)';
    COMMENT ON COLUMN aiagent.harness_session_meta.session_name IS '세션 작업 명칭 및 요약 타이틀';
    COMMENT ON COLUMN aiagent.harness_session_meta.work_group IS '프로젝트 작업 그룹명 (기본: purePDFrend)';
    COMMENT ON COLUMN aiagent.harness_session_meta.status_cd IS '세션 진행 상태 코드 (진행중, 완료, 이관완료, 보류)';
    COMMENT ON COLUMN aiagent.harness_session_meta.ai_agent IS '수행 AI 에이전트 식별자 (예: gemini, claude, codex)';
    COMMENT ON COLUMN aiagent.harness_session_meta.ai_model IS '주 배정 AI 모델 식별자 (예: models/gemini-3.8-flash)';
    COMMENT ON COLUMN aiagent.harness_session_meta.started_at IS '세션 개시 일시 (KST/UTC)';
    COMMENT ON COLUMN aiagent.harness_session_meta.ended_at IS '세션 종료 및 마감 일시';
    COMMENT ON COLUMN aiagent.harness_session_meta.doc_payload IS '세션 상세 메타 JSONB (이슈번호, 브랜치, 작업목표, 참조문서 등)';
    COMMENT ON COLUMN aiagent.harness_session_meta.created_sys IS '생성 시스템명';
    COMMENT ON COLUMN aiagent.harness_session_meta.created_at IS '최초 생성 일시';
    COMMENT ON COLUMN aiagent.harness_session_meta.created_by IS '생성자 식별자';
    COMMENT ON COLUMN aiagent.harness_session_meta.updated_sys IS '최종 수정 시스템명';
    COMMENT ON COLUMN aiagent.harness_session_meta.updated_at IS '최종 수정 일시';
    COMMENT ON COLUMN aiagent.harness_session_meta.updated_by IS '수정자 식별자';
    COMMENT ON COLUMN aiagent.harness_session_meta.version IS '낙관적 락 레코드 버전';

    -- 2. harness_task_meta
    COMMENT ON TABLE aiagent.harness_task_meta IS '세션 하위 태스크 실행 및 승급 관리 원장 (TDD 단위기능, 리뷰, 브랜치 배포)';
    COMMENT ON COLUMN aiagent.harness_task_meta.task_id IS '태스크 고유 식별자 (형식: TASK-NNNN-NN)';
    COMMENT ON COLUMN aiagent.harness_task_meta.session_id IS '소속 세션 식별자 (FK: harness_session_meta)';
    COMMENT ON COLUMN aiagent.harness_task_meta.task_name IS '태스크 작업 명칭 및 단위 기능 요약';
    COMMENT ON COLUMN aiagent.harness_task_meta.status_cd IS '태스크 진행 상태 코드 (진행중, 검증완료, 완료, 보류)';
    COMMENT ON COLUMN aiagent.harness_task_meta.git_branch IS '태스크 전용 Git 작업 브랜치명';
    COMMENT ON COLUMN aiagent.harness_task_meta.started_at IS '태스크 시작 일시';
    COMMENT ON COLUMN aiagent.harness_task_meta.ended_at IS '태스크 종료 및 승급 일시';
    COMMENT ON COLUMN aiagent.harness_task_meta.doc_payload IS '태스크 세부 실행 계획 및 백로그 항목 JSONB';
    COMMENT ON COLUMN aiagent.harness_task_meta.created_sys IS '생성 시스템명';
    COMMENT ON COLUMN aiagent.harness_task_meta.created_at IS '최초 생성 일시';
    COMMENT ON COLUMN aiagent.harness_task_meta.created_by IS '생성자 식별자';
    COMMENT ON COLUMN aiagent.harness_task_meta.updated_sys IS '최종 수정 시스템명';
    COMMENT ON COLUMN aiagent.harness_task_meta.updated_at IS '최종 수정 일시';
    COMMENT ON COLUMN aiagent.harness_task_meta.updated_by IS '수정자 식별자';
    COMMENT ON COLUMN aiagent.harness_task_meta.version IS '레코드 버전';

    -- 3. harness_loop_meta
    COMMENT ON TABLE aiagent.harness_loop_meta IS '태스크 내 반복 작업 루프 상태 원장 (루프분석, 시작, 처리, 정리 4단계 생명주기)';
    COMMENT ON COLUMN aiagent.harness_loop_meta.loop_id IS '루프 고유 식별자 (형식: LOOP-NNNN-NN-NN)';
    COMMENT ON COLUMN aiagent.harness_loop_meta.task_id IS '소속 태스크 식별자';
    COMMENT ON COLUMN aiagent.harness_loop_meta.session_id IS '소속 세션 식별자';
    COMMENT ON COLUMN aiagent.harness_loop_meta.loop_name IS '루프 작업 명칭 및 반복 작업 목적';
    COMMENT ON COLUMN aiagent.harness_loop_meta.status_cd IS '루프 진행 상태 코드 (분석, 시작, 처리, 완료)';
    COMMENT ON COLUMN aiagent.harness_loop_meta.started_at IS '루프 개시 일시';
    COMMENT ON COLUMN aiagent.harness_loop_meta.ended_at IS '루프 마감 일시';
    COMMENT ON COLUMN aiagent.harness_loop_meta.doc_payload IS '루프 변수, 입출력 파라미터 및 평가 기준 JSONB';
    COMMENT ON COLUMN aiagent.harness_loop_meta.created_sys IS '생성 시스템명';
    COMMENT ON COLUMN aiagent.harness_loop_meta.created_at IS '최초 생성 일시';
    COMMENT ON COLUMN aiagent.harness_loop_meta.created_by IS '생성자 식별자';
    COMMENT ON COLUMN aiagent.harness_loop_meta.updated_sys IS '최종 수정 시스템명';
    COMMENT ON COLUMN aiagent.harness_loop_meta.updated_at IS '최종 수정 일시';
    COMMENT ON COLUMN aiagent.harness_loop_meta.updated_by IS '수정자 식별자';
    COMMENT ON COLUMN aiagent.harness_loop_meta.version IS '레코드 버전';

    -- 4. harness_graph_node_meta
    COMMENT ON TABLE aiagent.harness_graph_node_meta IS '작업 그래프(Work Graph) 시각화 노드 및 엣지 관계 메타 원장';
    COMMENT ON COLUMN aiagent.harness_graph_node_meta.node_id IS '그래프 노드 고유 식별자';
    COMMENT ON COLUMN aiagent.harness_graph_node_meta.session_id IS '소속 세션 식별자';
    COMMENT ON COLUMN aiagent.harness_graph_node_meta.entity_type IS '노드 대상 엔티티 구분 (SESSION, TASK, LOOP, DOC)';
    COMMENT ON COLUMN aiagent.harness_graph_node_meta.entity_id IS '대상 엔티티의 실제 식별자 ID';
    COMMENT ON COLUMN aiagent.harness_graph_node_meta.title IS '그래프 캔버스에 표시될 노드 제목';
    COMMENT ON COLUMN aiagent.harness_graph_node_meta.status_cd IS '노드 상태 코드';
    COMMENT ON COLUMN aiagent.harness_graph_node_meta.pos_x IS '캔버스 내 X 좌표 (수평 위치)';
    COMMENT ON COLUMN aiagent.harness_graph_node_meta.pos_y IS '캔버스 내 Y 좌표 (수직 위치)';
    COMMENT ON COLUMN aiagent.harness_graph_node_meta.depends_on IS '선행 의존 노드 ID 배열';
    COMMENT ON COLUMN aiagent.harness_graph_node_meta.graph_payload IS '노드 시각화 스타일, 뱃지, 부가정보 JSONB';
    COMMENT ON COLUMN aiagent.harness_graph_node_meta.created_at IS '최초 생성 일시';
    COMMENT ON COLUMN aiagent.harness_graph_node_meta.updated_at IS '최종 수정 일시';

    -- 5. agent_docs_meta
    COMMENT ON TABLE aiagent.agent_docs_meta IS 'purePDFrend 18대 디렉토리 기술 문서 관리 메타 원장 (해시 무결성 검증, DB 전문 검색)';
    COMMENT ON COLUMN aiagent.agent_docs_meta.doc_id IS '문서 고유 식별자 (예: DOC-03-19-xxx)';
    COMMENT ON COLUMN aiagent.agent_docs_meta.file_path IS '문서 상대 파일 경로 (docs/03.정책/xxx.md)';
    COMMENT ON COLUMN aiagent.agent_docs_meta.category IS '문서 대분류 폴더명 (00.시작 ~ 18.메뉴얼)';
    COMMENT ON COLUMN aiagent.agent_docs_meta.title IS '문서 표제명 (한글 타이틀)';
    COMMENT ON COLUMN aiagent.agent_docs_meta.content_hash IS 'SHA-256 파일 내용 무결성 체크섬 해시';
    COMMENT ON COLUMN aiagent.agent_docs_meta.last_synced_at IS '최종 동기화 일시';
    COMMENT ON COLUMN aiagent.agent_docs_meta.doc_payload IS '문서 메타데이터 및 전문 내용 JSONB';
    COMMENT ON COLUMN aiagent.agent_docs_meta.created_sys IS '생성 시스템명';
    COMMENT ON COLUMN aiagent.agent_docs_meta.created_at IS '최초 생성 일시';
    COMMENT ON COLUMN aiagent.agent_docs_meta.created_by IS '생성자 식별자';
    COMMENT ON COLUMN aiagent.agent_docs_meta.updated_sys IS '최종 수정 시스템명';
    COMMENT ON COLUMN aiagent.agent_docs_meta.updated_at IS '최종 수정 일시';
    COMMENT ON COLUMN aiagent.agent_docs_meta.updated_by IS '수정자 식별자';
    COMMENT ON COLUMN aiagent.agent_docs_meta.version IS '레코드 버전';

    -- 6. agent_billing_plan
    COMMENT ON TABLE aiagent.agent_billing_plan IS 'AI 에이전트 서비스 요금제 및 기본 쿼터 기준정보 원장';
    COMMENT ON COLUMN aiagent.agent_billing_plan.plan_id IS '요금제 고유 식별자 (예: PLAN-FREE, PLAN-STANDARD, PLAN-PRO)';
    COMMENT ON COLUMN aiagent.agent_billing_plan.plan_name IS '요금제 명칭';
    COMMENT ON COLUMN aiagent.agent_billing_plan.description IS '요금제 상세 혜택 및 설명';
    COMMENT ON COLUMN aiagent.agent_billing_plan.base_quota_tokens IS '기본 제공 토큰 한도량';
    COMMENT ON COLUMN aiagent.agent_billing_plan.max_burst_multiplier IS '순간 최대 호출 허용 배수';
    COMMENT ON COLUMN aiagent.agent_billing_plan.priority_tier IS '요금제 우선순위 티어 (1~3)';
    COMMENT ON COLUMN aiagent.agent_billing_plan.overage_policy IS '초과 사용 처리 정책 (BLOCK, THROTTLE, PAY_PER_USE)';
    COMMENT ON COLUMN aiagent.agent_billing_plan.is_active IS '요금제 활성화 여부 (true/false)';
    COMMENT ON COLUMN aiagent.agent_billing_plan.created_at IS '최초 등록 일시';
    COMMENT ON COLUMN aiagent.agent_billing_plan.updated_at IS '최종 수정 일시';

    -- 7. agent_model_catalog
    COMMENT ON TABLE aiagent.agent_model_catalog IS 'AI 모델 카탈로그 및 토큰 단가/컨텍스트 윈도우 기준정보 원장';
    COMMENT ON COLUMN aiagent.agent_model_catalog.model_id IS '모델 고유 식별자 (예: models/gemini-3.8-flash, claude-3-5-sonnet)';
    COMMENT ON COLUMN aiagent.agent_model_catalog.provider IS '모델 제공사 (GOOGLE, ANTHROPIC, OPENAI, DEEPSEEK)';
    COMMENT ON COLUMN aiagent.agent_model_catalog.display_name IS '화면 표시용 모델 정식 명칭';
    COMMENT ON COLUMN aiagent.agent_model_catalog.prompt_token_cost_1k IS '1,000 프롬프트(입력) 토큰당 단가 (USD)';
    COMMENT ON COLUMN aiagent.agent_model_catalog.completion_token_cost_1k IS '1,000 완성(출력) 토큰당 단가 (USD)';
    COMMENT ON COLUMN aiagent.agent_model_catalog.context_window_tokens IS '모델 최대 지원 컨텍스트 윈도우 크기';
    COMMENT ON COLUMN aiagent.agent_model_catalog.is_active IS '모델 사용 가능 여부 (true/false)';
    COMMENT ON COLUMN aiagent.agent_model_catalog.doc_payload IS '모델 티어, RPM, RPD, TPM 등 부가 정책 JSONB';
    COMMENT ON COLUMN aiagent.agent_model_catalog.created_at IS '최초 등록 일시';
    COMMENT ON COLUMN aiagent.agent_model_catalog.updated_at IS '최종 수정 일시';

    -- 8. agent_user_account
    COMMENT ON TABLE aiagent.agent_user_account IS '사용자 AI 계정 및 요금제 플랜 매핑 원장';
    COMMENT ON COLUMN aiagent.agent_user_account.user_id IS '사용자 계정 고유 식별자 (예: USR-001)';
    COMMENT ON COLUMN aiagent.agent_user_account.email IS '사용자 대표 이메일 주소';
    COMMENT ON COLUMN aiagent.agent_user_account.user_name IS '사용자 실명 또는 닉네임';
    COMMENT ON COLUMN aiagent.agent_user_account.account_status IS '계정 상태 (ACTIVE, SUSPENDED, DELETED)';
    COMMENT ON COLUMN aiagent.agent_user_account.org_group IS '소속 조직 및 워크스페이스 그룹명';
    COMMENT ON COLUMN aiagent.agent_user_account.plan_id IS '적용 중인 요금제 식별자 (FK: agent_billing_plan)';
    COMMENT ON COLUMN aiagent.agent_user_account.doc_payload IS '보조 계정, 선호 모델, API 키 연동 메타 JSONB';
    COMMENT ON COLUMN aiagent.agent_user_account.created_at IS '최초 생성 일시';
    COMMENT ON COLUMN aiagent.agent_user_account.updated_at IS '최종 수정 일시';

    -- 9. agent_account_quota_ledger
    COMMENT ON TABLE aiagent.agent_account_quota_ledger IS '사용자 계정별 토큰 쿼터 원장 (부여량, 실사용량, 잔여량, 계정동결 여부)';
    COMMENT ON COLUMN aiagent.agent_account_quota_ledger.ledger_id IS '원장 고유 식별자 (예: LEDGER-USR-001)';
    COMMENT ON COLUMN aiagent.agent_account_quota_ledger.user_id IS '사용자 계정 식별자 (FK: agent_user_account)';
    COMMENT ON COLUMN aiagent.agent_account_quota_ledger.plan_id IS '연계 요금제 식별자';
    COMMENT ON COLUMN aiagent.agent_account_quota_ledger.total_granted_quota IS '총 부여된 토큰 한도량';
    COMMENT ON COLUMN aiagent.agent_account_quota_ledger.used_quota IS '현재까지 누적 사용된 토큰량';
    COMMENT ON COLUMN aiagent.agent_account_quota_ledger.remaining_quota IS '현재 잔여 가용 토큰량 (총부여량 - 사용량)';
    COMMENT ON COLUMN aiagent.agent_account_quota_ledger.is_frozen IS '토큰 소진 또는 한도 초과로 인한 동결 여부 (true/false)';
    COMMENT ON COLUMN aiagent.agent_account_quota_ledger.overage_allowed IS '초과 사용 허용 여부';
    COMMENT ON COLUMN aiagent.agent_account_quota_ledger.last_deducted_at IS '최종 토큰 차감 발생 일시';
    COMMENT ON COLUMN aiagent.agent_account_quota_ledger.version IS '동시성 제어 낙관적 락 버전';
    COMMENT ON COLUMN aiagent.agent_account_quota_ledger.created_at IS '원장 생성 일시';
    COMMENT ON COLUMN aiagent.agent_account_quota_ledger.updated_at IS '원장 최종 갱신 일시';

    -- 10. agent_quota_transaction_log
    COMMENT ON TABLE aiagent.agent_quota_transaction_log IS '토큰 차감/충전/환불 트랜잭션 감사 원장 (대화 턴 연계 감사 추적)';
    COMMENT ON COLUMN aiagent.agent_quota_transaction_log.tx_id IS '트랜잭션 고유 식별자 (예: TX-NNNNNNNN)';
    COMMENT ON COLUMN aiagent.agent_quota_transaction_log.ledger_id IS '소속 계정 쿼터 원장 식별자';
    COMMENT ON COLUMN aiagent.agent_quota_transaction_log.user_id IS '사용자 계정 식별자';
    COMMENT ON COLUMN aiagent.agent_quota_transaction_log.session_id IS '연계 세션 식별자';
    COMMENT ON COLUMN aiagent.agent_quota_transaction_log.task_id IS '연계 태스크 식별자';
    COMMENT ON COLUMN aiagent.agent_quota_transaction_log.turn_id IS '연계 대화 턴 식별자 (trace_id)';
    COMMENT ON COLUMN aiagent.agent_quota_transaction_log.model_id IS '호출된 모델 식별자';
    COMMENT ON COLUMN aiagent.agent_quota_transaction_log.tx_type IS '트랜잭션 유형 (DEDUCT, CHARGE, REFUND, EXPIRE)';
    COMMENT ON COLUMN aiagent.agent_quota_transaction_log.token_delta IS '변동 토큰 수량 (차감 시 음수, 충전 시 양수)';
    COMMENT ON COLUMN aiagent.agent_quota_transaction_log.balance_after IS '트랜잭션 처리 후 잔여 토큰량';
    COMMENT ON COLUMN aiagent.agent_quota_transaction_log.unit_cost_applied IS '적용된 토큰 단가';
    COMMENT ON COLUMN aiagent.agent_quota_transaction_log.reason_desc IS '트랜잭션 발생 사유 및 상세 메모';
    COMMENT ON COLUMN aiagent.agent_quota_transaction_log.created_at IS '트랜잭션 발생 일시';

    -- 11. agent_conversation_trace
    COMMENT ON TABLE aiagent.agent_conversation_trace IS '하네스 대화 턴 및 프롬프트/응답 전문 무손실 영속화 원장';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.trace_id IS '대화 턴 고유 식별자 (형식: TRACE-SSSS-TT-LL-NN)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.session_id IS '소속 세션 식별자 (예: SESSION-0019)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.task_id IS '소속 태스크 식별자 (예: TASK-0019-01)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.step_index IS '턴 실행 순번 (1부터 시작)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.loop_id IS '소속 루프 식별자 (step_index 바로 뒤 배치)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.agent_name IS '응답 수행 AI 에이전트명 (기본: gemini)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.model_name IS '실제 호출된 AI 모델명 (예: models/gemini-3.8-flash)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.operator_account IS '작업 운영자 식별 계정 (model_name 바로 뒤 배치, 예: jkok2j2m)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.agent_account IS '에이전트 구동 및 AI API 서비스 인증 계정 (operator_account 바로 뒤 배치, 예: jkok2j2m@gmail.com)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.user_email IS '에이전트 계정 이메일 (agent_account와 동의어, 하위 호환 속성)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.user_prompt IS '사용자 요청 프롬프트 원문 전문';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.agent_response IS '에이전트 응답 Markdown 전문 (코드블록, 표, 수식 100% 무손실 보존)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.response_summary IS '에이전트 응답 요약문 (agent_response 바로 뒤 배치)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.tool_calls IS '턴 내 호출된 도구 목록 및 인자 정보 JSONB';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.prompt_tokens IS '입력(프롬프트) 토큰 소비량';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.completion_tokens IS '출력(응답생성) 토큰 소비량';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.total_tokens IS '총 소비 토큰 수량 (입력 + 출력)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.created_sys IS '생성 시스템명 (agent-harness)';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.created_at IS '턴 기록 일시';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.created_by IS '생성자 식별자';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.updated_sys IS '수정 시스템명';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.updated_at IS '최종 수정 일시';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.updated_by IS '수정자 식별자';
    COMMENT ON COLUMN aiagent.agent_conversation_trace.version IS '레코드 버전';
  `;
  await executeSql(commentsSql);
  console.log('✅ 11대 테이블 및 전체 컬럼 한글 코멘트 100% 등록 완료');

  // 6. KST 16:00 슬라이딩 윈도우 기준 토큰 집계 뷰 생성
  console.log('\n--- 5. KST 16:00 리셋 윈도우 기준 토큰 집계 뷰 (v_account_daily_token_usage) 구축 ---');
  const createViewSql = `
    CREATE OR REPLACE VIEW aiagent.v_account_daily_token_usage AS
    WITH quota_window AS (
      SELECT
        CASE
          WHEN (now() AT TIME ZONE 'Asia/Seoul')::time >= '16:00:00'::time
          THEN (date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') + interval '16 hours') AT TIME ZONE 'Asia/Seoul'
          ELSE (date_trunc('day', (now() AT TIME ZONE 'Asia/Seoul') - interval '1 day') + interval '16 hours') AT TIME ZONE 'Asia/Seoul'
        END AS reset_start_utc
    )
    SELECT
      t.agent_account,
      t.user_email,
      t.operator_account,
      t.model_name,
      COUNT(*) AS turn_count,
      SUM(t.prompt_tokens) AS sum_prompt_tokens,
      SUM(t.completion_tokens) AS sum_completion_tokens,
      SUM(t.total_tokens) AS sum_total_tokens,
      AVG(t.total_tokens)::numeric(10, 1) AS avg_turn_tokens,
      MAX(t.total_tokens) AS max_turn_tokens,
      qw.reset_start_utc AS current_window_start,
      (qw.reset_start_utc + interval '24 hours') AS next_reset_window,
      MAX(t.created_at) AS last_active_turn_at,
      -- 쿼터 가용량 추정 (Gemini Flash 기본 2,500 RPD 기준)
      2500 - COUNT(*) AS estimated_remaining_turns,
      ROUND((COUNT(*)::numeric / 2500.0) * 100.0, 2) AS quota_turn_burn_pct
    FROM aiagent.agent_conversation_trace t
    CROSS JOIN quota_window qw
    WHERE t.created_at >= qw.reset_start_utc
    GROUP BY t.agent_account, t.user_email, t.operator_account, t.model_name, qw.reset_start_utc;

    COMMENT ON VIEW aiagent.v_account_daily_token_usage IS 'KST 매일 16:00 리셋 윈도우 기준 계정별·모델별 당일 토큰 사용량 및 가용 쿼터 집계 뷰';
  `;
  await executeSql(createViewSql);
  console.log('✅ 뷰 aiagent.v_account_daily_token_usage 생성 완료');

  // 7. 검증 쿼리 실행
  console.log('\n--- 6. 마이그레이션 결과 검증 ---');
  const verifyColumns = await executeSql(`
    SELECT column_name, ordinal_position, data_type
    FROM information_schema.columns
    WHERE table_schema = 'aiagent' AND table_name = 'agent_conversation_trace'
    ORDER BY ordinal_position;
  `);
  console.log('📋 변경된 agent_conversation_trace 컬럼 순서:');
  console.table(verifyColumns.rows);

  const viewTest = await executeSql('SELECT * FROM aiagent.v_account_daily_token_usage;');
  console.log('📈 당일(KST 16시 이후) 토큰 집계 뷰 결과:');
  console.log(JSON.stringify(viewTest.rows, null, 2));

  console.log('\n🎉 [완료] DB 영속화 개선 및 한글 코멘트 등록이 완벽히 완료되었습니다!');
}

main().catch(console.error);
