import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';
import { TurnTraceService } from '../src/aiagent/domain/token-quota/services/TurnTraceService';

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
      timeout: 20000,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
  const traceId = 'TRACE-0022-01-00-02';
  const promptText = `토큰 소진 이후 4시 지나서 작업 재개
태스크처리 [0022_01] 미 완료 건 처리
및 토큰 모니터링 데이터 수집`;

  const responseText = `# [0022_01] 계정 전환 및 샌드박스 초기화 시 원격 dev 소스 자동 Pull & 브랜치 정돈 거버넌스 수립 처리 완결 보고
1. 원격 dev 최신 소스 자동 동기화 엔진 (scripts/pull_remote_dev.ts) 고도화 완결
2. 대화 턴 전수 영속화 및 No-LLM 요약 추출 도메인 서비스 (TurnTraceService.ts) 구현 완결
3. server.ts 대화 턴 저장 API 및 일괄 정합성 보정(Reconcile) 엔드포인트(/api/agent/trace/reconcile) 탑재
4. TDD 단위 테스트(tests/turn_trace_and_pull.test.ts) 14개 검증 100% 통과
5. 신규 운영정책 03-21 및 학습문서 15-20 발행, AGENTS.md v2.2 개정 완료
6. KST 16:00 리셋 이후 토큰 모니터링 데이터 수집 및 쿼터 건전성 확인 (Tier 1 Pro 250회, Tier 2 Flash 2482회)
7. TASK-0022-01 하네스 스토어 및 DB 등록 완료`;

  const record = TurnTraceService.buildTraceRecord({
    trace_id: traceId,
    session_id: 'SESSION-0022',
    task_id: 'TASK-0022-01',
    step_index: 2,
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    prompt_tokens: 1850,
    completion_tokens: 1100,
  });

  // 1. Local Store
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const otherTraces = (store.traces || []).filter((t: any) => t.trace_id !== traceId);
  store.traces = [record, ...otherTraces];
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 에 ${traceId} 저장 완료`);

  // 2. Remote DB
  const sql = `
    INSERT INTO aiagent.agent_conversation_trace (
      trace_id, session_id, task_id, loop_id, step_index,
      agent_name, model_name, operator_account, agent_account, user_email,
      user_prompt, agent_response, response_summary,
      prompt_tokens, completion_tokens, total_tokens, created_at
    ) VALUES (
      ${escapeSql(record.trace_id)}, ${escapeSql(record.session_id)}, ${escapeSql(record.task_id)}, NULL, ${record.step_index},
      ${escapeSql(record.agent_name)}, ${escapeSql(record.model_name)}, ${escapeSql(record.operator_account)}, ${escapeSql(record.agent_account)}, ${escapeSql(record.user_email)},
      ${escapeSql(record.user_prompt)}, ${escapeSql(record.agent_response)}, ${escapeSql(record.response_summary)},
      ${record.prompt_tokens}, ${record.completion_tokens}, ${record.total_tokens}, now()
    ) ON CONFLICT (trace_id) DO UPDATE SET
      user_prompt = EXCLUDED.user_prompt,
      agent_response = EXCLUDED.agent_response,
      response_summary = EXCLUDED.response_summary,
      total_tokens = EXCLUDED.total_tokens;
  `;
  const dbRes = await executeSql(sql);
  console.log('✅ DB aiagent.agent_conversation_trace 저장 결과:', dbRes?.success ? '성공' : dbRes?.error);
}

main().catch(console.error);
