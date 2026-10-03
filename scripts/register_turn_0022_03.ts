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
  const traceId = 'TRACE-0022-01-00-03';
  const promptText = `#세션정리 [0022] SESSION-0021 DB 미적재 턴 일괄 동기화 및 원격 dev 자동 Pull 거버넌스 수립`;

  const responseText = `# [0022] SESSION-0022 세션 최종 정리 및 완료 보고
1. 원격 GitHub 이슈(#58) 정상 Closed 종결 및 PR(#59) 머지 상태 검증 완료
2. 회고 문서(docs/13.회고/13-18) 발행 및 README_회고.md 인덱스 현행화
3. 하네스 스토어(data/local_agent_store.json) 및 DB 세션 상태 '완료' 승급
4. 미해결 백로그 BACKLOG-0021-01 '완료' 마감
5. GitHub Git Data API 기반 최종 커밋 생성 및 dev/stg/main 3대 브랜치 배포 승급 동기화 완결`;

  const record = TurnTraceService.buildTraceRecord({
    trace_id: traceId,
    session_id: 'SESSION-0022',
    task_id: 'TASK-0022-01',
    step_index: 3,
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    prompt_tokens: 1400,
    completion_tokens: 950,
  });

  // 1. Local store
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
