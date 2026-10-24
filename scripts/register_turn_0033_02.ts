import fs from 'fs';
import path from 'path';
import https from 'https';

const storePath = path.resolve('data/local_agent_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const userPrompt = `#태스크시작 [0033-01] Phase 3 관리자 1단계 핵심화면(PG-ADM-01~04) 실제 REST API 연동 및 사용자 잔여화면(PG-USR-08~09) tokens.ts 전면 완결 계획 수립`;
const agentResponse = fs.readFileSync(path.resolve('scripts/turn_0033_02_response.md'), 'utf-8');
const responseSummary = 'Phase 3 관리자 1단계(PG-ADM-01~04) 실제 REST API 연동 및 사용자 잔여(PG-USR-08~09) tokens.ts 전면 완결 READ-ONLY 계획 수립 완료 (5대 세부 작업, 루프 분석, 범위 무결성 확인 및 태스크처리 프롬프트 도출)';

const turn0033_02 = {
  trace_id: 'TRACE-0033-01-00-02',
  session_id: 'SESSION-0033',
  task_id: 'TASK-0033-01',
  loop_id: 'LOOP-0033-01',
  step_index: 2,
  turn_num: '2',
  turn_number: 2,
  turn_identifier: '[0033-02]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0033-01-00-02');
store.traces.push({
  ...turn0033_02,
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
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0033' && (t.turn_number === 2 || t.turn_identifier === '[0033-02]')));
store.conversation_turns.push(turn0033_02);

// task 상태 현행화
if (store.sessions) {
  const currentSession = store.sessions.find((s: any) => s.session_id === 'SESSION-0033');
  if (currentSession && currentSession.doc_payload && currentSession.doc_payload.tasks) {
    const task = currentSession.doc_payload.tasks.find((t: any) => t.task_id === 'TASK-0033-01');
    if (task) {
      task.status = '계획수립';
    }
  }
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0033-02] 동기화 완료');

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
    'TRACE-0033-01-00-02', 'SESSION-0033', 'TASK-0033-01', 'LOOP-0033-01', 2, 'gemini', 'models/gemini-1.5-flash',
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
  res.on('end', () => console.log('원격 DB 턴 적재 결과:', b.slice(0, 100)));
});
req.on('error', e => console.log('원격 DB 비동기 에러 (로컬 정상):', e.message));
req.write(payload);
req.end();
