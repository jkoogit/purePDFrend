import https from 'https';

const DB_BRIDGE_URL = process.env.REMOTE_DB_BRIDGE_URL || 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = process.env.REMOTE_DB_BRIDGE_SECRET || 'jkadh-secure-secret-token-2026';
const database = 'purepdfrend_dev';

function executeSql(sql: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ database, sql });
    const req = https.request(`${DB_BRIDGE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-JKADH-SECRET': DB_BRIDGE_SECRET,
        'Authorization': `Bearer ${DB_BRIDGE_SECRET}`,
        'Content-Length': Buffer.byteLength(payload),
      },
      rejectUnauthorized: false,
      timeout: 10000,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          resolve({ raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

export async function runMigration() {
  console.log('[Migration] Starting PostgreSQL aiagent 5 meta & quota tables migration...');

  const ddlSql = `
    -- 1. 요금제 메타 테이블
    CREATE TABLE IF NOT EXISTS aiagent.agent_billing_plan (
      plan_id VARCHAR(64) PRIMARY KEY,
      plan_name VARCHAR(64) NOT NULL UNIQUE,
      description TEXT,
      base_quota_tokens BIGINT NOT NULL DEFAULT 1000000,
      max_burst_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.50,
      priority_tier INT NOT NULL DEFAULT 5,
      overage_policy VARCHAR(32) NOT NULL DEFAULT 'BLOCK',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- 2. 모델 카탈로그 기준정보 테이블
    CREATE TABLE IF NOT EXISTS aiagent.agent_model_catalog (
      model_id VARCHAR(128) PRIMARY KEY,
      provider VARCHAR(32) NOT NULL,
      display_name VARCHAR(128) NOT NULL,
      prompt_token_cost_1k NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
      completion_token_cost_1k NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
      context_window_tokens INT NOT NULL DEFAULT 128000,
      is_active BOOLEAN NOT NULL DEFAULT true,
      doc_payload JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- 3. 사용자 계정 메타 테이블
    CREATE TABLE IF NOT EXISTS aiagent.agent_user_account (
      user_id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      user_name VARCHAR(128) NOT NULL,
      account_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
      org_group VARCHAR(128) NOT NULL DEFAULT 'purePDFrend',
      plan_id VARCHAR(64) NOT NULL REFERENCES aiagent.agent_billing_plan(plan_id),
      doc_payload JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- 4. 계정별 쿼터 원장 테이블
    CREATE TABLE IF NOT EXISTS aiagent.agent_account_quota_ledger (
      ledger_id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES aiagent.agent_user_account(user_id) ON DELETE CASCADE,
      plan_id VARCHAR(64) NOT NULL REFERENCES aiagent.agent_billing_plan(plan_id),
      total_granted_quota BIGINT NOT NULL DEFAULT 0,
      used_quota BIGINT NOT NULL DEFAULT 0,
      remaining_quota BIGINT NOT NULL DEFAULT 0,
      is_frozen BOOLEAN NOT NULL DEFAULT false,
      overage_allowed BOOLEAN NOT NULL DEFAULT false,
      last_deducted_at TIMESTAMPTZ,
      version INT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT chk_ledger_positive CHECK (remaining_quota >= 0 OR overage_allowed = true)
    );

    -- 5. 원장 트랜잭션 상세 감사 테이블
    CREATE TABLE IF NOT EXISTS aiagent.agent_quota_transaction_log (
      tx_id VARCHAR(64) PRIMARY KEY,
      ledger_id VARCHAR(64) NOT NULL REFERENCES aiagent.agent_account_quota_ledger(ledger_id) ON DELETE CASCADE,
      user_id VARCHAR(64) NOT NULL,
      session_id VARCHAR(64),
      task_id VARCHAR(64),
      turn_id VARCHAR(64),
      model_id VARCHAR(128),
      tx_type VARCHAR(32) NOT NULL,
      token_delta BIGINT NOT NULL,
      balance_after BIGINT NOT NULL,
      unit_cost_applied NUMERIC(10,4),
      reason_desc TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- 인덱스 생성
    CREATE INDEX IF NOT EXISTS idx_user_account_email ON aiagent.agent_user_account(email);
    CREATE INDEX IF NOT EXISTS idx_user_account_plan ON aiagent.agent_user_account(plan_id);
    CREATE INDEX IF NOT EXISTS idx_quota_ledger_user ON aiagent.agent_account_quota_ledger(user_id);
    CREATE INDEX IF NOT EXISTS idx_tx_log_ledger ON aiagent.agent_quota_transaction_log(ledger_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tx_log_session ON aiagent.agent_quota_transaction_log(session_id);
    CREATE INDEX IF NOT EXISTS idx_tx_log_user ON aiagent.agent_quota_transaction_log(user_id);
  `;

  const ddlRes = await executeSql(ddlSql);
  console.log('[Migration] DDL Execution Result:', ddlRes);

  // 6. 초기 기준 시드(Seed) 적재
  const seedSql = `
    -- 요금제 시드
    INSERT INTO aiagent.agent_billing_plan (plan_id, plan_name, description, base_quota_tokens, max_burst_multiplier, priority_tier, overage_policy)
    VALUES
      ('PLAN-FREE', 'Free Tier', '기본 무료 체험 플랜 (월 50만 토큰)', 500000, 1.20, 1, 'BLOCK'),
      ('PLAN-STARTER', 'Starter Plan', '개인 개발자 및 스타터 플랜 (월 200만 토큰)', 2000000, 1.50, 3, 'BLOCK'),
      ('PLAN-PRO', 'Pro Plan', '전문 엔지니어링 및 다국어 OCR 플랜 (월 1,000만 토큰)', 10000000, 2.00, 7, 'THROTTLE'),
      ('PLAN-ENTERPRISE', 'Enterprise Plan', '기업 전용 무제한 및 최우선 대역폭 플랜 (월 5,000만 토큰 기본)', 50000000, 3.00, 10, 'PAY_AS_YOU_GO')
    ON CONFLICT (plan_id) DO UPDATE SET
      description = EXCLUDED.description,
      base_quota_tokens = EXCLUDED.base_quota_tokens,
      priority_tier = EXCLUDED.priority_tier,
      updated_at = now();

    -- 모델 카탈로그 시드
    INSERT INTO aiagent.agent_model_catalog (model_id, provider, display_name, prompt_token_cost_1k, completion_token_cost_1k, context_window_tokens)
    VALUES
      ('models/gemini-3.8-flash', 'gemini', 'Gemini 3.8 Flash (기본)', 0.0001, 0.0004, 1000000),
      ('models/gemini-2.5-pro', 'gemini', 'Gemini 2.5 Pro (고지능 추론)', 0.0012, 0.0048, 2000000),
      ('claude-3-5-sonnet', 'claude', 'Claude 3.5 Sonnet v2', 0.0030, 0.0150, 200000),
      ('claude-3-5-haiku', 'claude', 'Claude 3.5 Haiku', 0.0008, 0.0040, 200000),
      ('gpt-4o', 'openai', 'GPT-4o Omnimodal', 0.0025, 0.0100, 128000),
      ('deepseek-v3', 'deepseek', 'DeepSeek V3 (Reasoning)', 0.0002, 0.0008, 64000)
    ON CONFLICT (model_id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      prompt_token_cost_1k = EXCLUDED.prompt_token_cost_1k,
      completion_token_cost_1k = EXCLUDED.completion_token_cost_1k,
      context_window_tokens = EXCLUDED.context_window_tokens,
      updated_at = now();

    -- 시스템 기본 관리자/데모 사용자 시드
    INSERT INTO aiagent.agent_user_account (user_id, email, user_name, account_status, org_group, plan_id)
    VALUES
      ('USR-SYS-ADMIN', 'jkoogit@gmail.com', '시스템 관리자', 'ACTIVE', 'purePDFrend Core', 'PLAN-ENTERPRISE'),
      ('USR-DEMO-DEV', 'developer@purepdfrend.com', '선임 개발자', 'ACTIVE', 'purePDFrend Dev Team', 'PLAN-PRO')
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      user_name = EXCLUDED.user_name,
      plan_id = EXCLUDED.plan_id,
      updated_at = now();

    -- 기본 쿼터 원장 시드
    INSERT INTO aiagent.agent_account_quota_ledger (ledger_id, user_id, plan_id, total_granted_quota, used_quota, remaining_quota, is_frozen, overage_allowed, version)
    VALUES
      ('LDG-SYS-ADMIN', 'USR-SYS-ADMIN', 'PLAN-ENTERPRISE', 50000000, 124500, 49875500, false, true, 1),
      ('LDG-DEMO-DEV', 'USR-DEMO-DEV', 'PLAN-PRO', 10000000, 52300, 9947700, false, false, 1)
    ON CONFLICT (ledger_id) DO NOTHING;

    -- 초기 원장 지급 감사 로그 시드
    INSERT INTO aiagent.agent_quota_transaction_log (tx_id, ledger_id, user_id, session_id, task_id, turn_id, model_id, tx_type, token_delta, balance_after, unit_cost_applied, reason_desc)
    VALUES
      ('QTX-INIT-001', 'LDG-SYS-ADMIN', 'USR-SYS-ADMIN', 'SESSION-20260922-006', 'TASK-01', 'TURN-01', 'models/gemini-3.8-flash', 'GRANT', 50000000, 49875500, 0.0000, 'Enterprise Plan 월간 기본 쿼터 지급')
    ON CONFLICT (tx_id) DO NOTHING;
  `;

  const seedRes = await executeSql(seedSql);
  console.log('[Migration] Seed Execution Result:', seedRes);

  // 테이블 검증 조회
  const verifyRes = await executeSql(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'aiagent' 
    ORDER BY table_name;
  `);
  console.log('[Migration] Current aiagent tables in PostgreSQL:');
  console.table(verifyRes.rows);
}

runMigration().catch(console.error);
