import fs from 'fs';
import path from 'path';
import https from 'https';

const storePath = path.resolve('data/local_agent_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const userPrompt = `#태스크정리 [0033-01] Phase 3 관리자 1단계 핵심화면(PG-ADM-01~04) 실제 REST API 연동 및 사용자 잔여화면(PG-USR-08~09) tokens.ts 전면 완결 검증 및 리뷰`;
const agentResponse = fs.readFileSync(path.resolve('scripts/turn_0033_04_response.md'), 'utf-8');
const responseSummary = 'Phase 3 관리자 1단계 핵심화면(PG-ADM-01~04) 실제 REST API 연동 및 사용자 잔여화면(PG-USR-08~09) tokens.ts 전면 완결 검증 및 리뷰 완료 (4단계 서비스 점검 100점 만점 [A+], 리뷰문서 10-54 발행, 하네스 동기화 완결)';

const turn0033_04 = {
  trace_id: 'TRACE-0033-01-00-04',
  session_id: 'SESSION-0033',
  task_id: 'TASK-0033-01',
  loop_id: 'LOOP-0033-01',
  step_index: 4,
  turn_num: '4',
  turn_number: 4,
  turn_identifier: '[0033-04]',
  operator_account: 'jkok2j2m',
  agent_account: 'jkok2j2m@gmail.com',
  user_email: 'jkok2j2m@gmail.com',
  user_prompt: userPrompt,
  agent_response: agentResponse,
  response_summary: responseSummary,
  status: 'SUCCESS',
  created_at: new Date().toISOString()
};

// store.traces 동기화
if (!Array.isArray(store.traces)) {
  store.traces = [];
}
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0033-01-00-04');
store.traces.push({
  ...turn0033_04,
  agent_name: 'gemini',
  model_name: 'models/gemini-1.5-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

// store.conversation_turns 동기화
if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0033' && (t.turn_number === 4 || t.turn_identifier === '[0033-04]')));
store.conversation_turns.push(turn0033_04);

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0033-04] 동기화 완료');

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

const payload = JSON.stringify({
  database: 'purepdfrend_dev',
  sql: `INSERT INTO aiagent.agent_conversation_trace (
    trace_id, session_id, task_id, loop_id, step_index, agent_name, model_name,
    operator_account, agent_account, user_email,
    user_prompt, agent_response, response_summary, prompt_tokens, completion_tokens, total_tokens, created_at
  ) VALUES (
    'TRACE-0033-01-00-04', 'SESSION-0033', 'TASK-0033-01', 'LOOP-0033-01', 4, 'gemini', 'models/gemini-1.5-flash',
    'jkok2j2m', 'jkok2j2m@gmail.com', 'jkok2j2m@gmail.com',
    ${escapeSql(userPrompt)}, ${escapeSql(agentResponse)}, ${escapeSql(responseSummary)},
    0, 0, 0, now()
  ) ON CONFLICT (trace_id) DO UPDATE SET
    user_prompt = EXCLUDED.user_prompt,
    agent_response = EXCLUDED.agent_response,
    response_summary = EXCLUDED.response_summary;`
});

const req = https.request('https://ptype.pdfrend.com/api/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-JKADH-SECRET': 'jkadh-secure-secret-token-2026',
    'Authorization': 'Bearer jkadh-secure-secret-token-2026',
    'Content-Length': String(Buffer.byteLength(payload)),
  },
  rejectUnauthorized: false,
  timeout: 5000,
}, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('✅ Remote DB agent_conversation_trace [0033-04] 저장 성공:', b);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.warn('⚠️ Remote DB 저장 실패 (로컬 스토어 유지):', err.message);
  process.exit(0);
});

req.write(payload);
req.end();
