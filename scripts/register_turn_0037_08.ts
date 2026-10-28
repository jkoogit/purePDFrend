import fs from 'fs';
import path from 'path';
import https from 'https';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function executeSql(sql: string): Promise<any> {
  return new Promise((resolve) => {
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
      timeout: 15000,
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { resolve({ error: body }); }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(payload);
    req.end();
  });
}

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function main() {
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const userPrompt = '#태스크정리 : TASK-0037-01 메뉴 바로가기 개편 및 실서비스 직결 아키텍처 완료 리뷰';
  const agentResponse = fs.readFileSync('scripts/turn_0037_08_response.md', 'utf8');
  const responseSummary = 'TASK-0037-01 코드리뷰(10-52) 발행, 인덱스 현행화, 222개 문서 DB 동기화, 4단계 서비스 점검 100점 만점 [A+ PERFECT], GitHub Git Data API 커밋(8abd1df) 및 PR #111 dev 머지 완료';

  const turn0037_08 = {
    trace_id: 'TRACE-0037-01-00-08',
    session_id: 'SESSION-0037',
    task_id: 'TASK-0037-01',
    loop_id: null,
    step_index: 8,
    turn_num: '8',
    turn_number: 8,
    turn_identifier: '[0037-08]',
    operator_account: 'jkok2j2m',
    agent_account: 'jkok2j2m@gmail.com',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: userPrompt,
    agent_response: agentResponse,
    response_summary: responseSummary,
    status: 'SUCCESS',
    created_at: new Date().toISOString()
  };

  // 1. local_agent_store.json traces & conversation_turns 동기화
  if (!Array.isArray(store.traces)) {
    store.traces = [];
  }
  store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0037-01-00-08');
  store.traces.push({
    ...turn0037_08,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) {
    store.conversation_turns = [];
  }
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0037' && (t.turn_number === 8 || t.turn_identifier === '[0037-08]')));
  store.conversation_turns.push(turn0037_08);

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ 1단계: local_agent_store.json 저장 완료 (Turn [0037-08])');

  // 2. PostgreSQL DB 적재
  const payload = `
    INSERT INTO aiagent.agent_conversation_trace (
      trace_id, session_id, task_id, loop_id, step_index, agent_name,
      model_name, operator_account, agent_account, user_email,
      user_prompt, agent_response, response_summary,
      prompt_tokens, completion_tokens, total_tokens, created_at
    ) VALUES (
      ${escapeSql(turn0037_08.trace_id)},
      ${escapeSql(turn0037_08.session_id)},
      ${escapeSql(turn0037_08.task_id)},
      NULL,
      8,
      'gemini',
      'models/gemini-3.8-flash',
      ${escapeSql(turn0037_08.operator_account)},
      ${escapeSql(turn0037_08.agent_account)},
      ${escapeSql(turn0037_08.user_email)},
      ${escapeSql(turn0037_08.user_prompt)},
      ${escapeSql(turn0037_08.agent_response)},
      ${escapeSql(turn0037_08.response_summary)},
      0, 0, 0,
      NOW()
    )
    ON CONFLICT (trace_id) DO UPDATE SET
      session_id = EXCLUDED.session_id,
      task_id = EXCLUDED.task_id,
      step_index = EXCLUDED.step_index,
      user_prompt = EXCLUDED.user_prompt,
      agent_response = EXCLUDED.agent_response,
      response_summary = EXCLUDED.response_summary,
      created_at = NOW();
  `;

  const res = await executeSql(payload);
  console.log('✅ PostgreSQL aiagent.agent_conversation_trace [0037-08] 영속화 완료:', res);
}

main().catch(console.error);
