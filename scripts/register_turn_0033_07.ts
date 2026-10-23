import fs from 'fs';
import path from 'path';
import https from 'https';

const storePath = path.resolve('data/local_agent_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const userPrompt = `#태스크처리 [0033-02] 하네스 태스크/세션 UPSERT 스키마 헬퍼 함수 표준화 및 도메인 레포지토리 리팩토링 구현`;
const agentResponse = fs.readFileSync(path.resolve('scripts/turn_0033_07_response.md'), 'utf-8');
const responseSummary = '하네스 태스크/세션 UPSERT 스키마 헬퍼 함수 표준화 및 도메인 레포지토리 리팩토링 구현 완료 (HarnessRepository 구축, POST REST API 3종 장착, 8개 단위테스트 100% 통과, 서비스점검 100점 만점 [A+], 학습문서 15-25 발행)';

const turn0033_07 = {
  trace_id: 'TRACE-0033-02-00-07',
  session_id: 'SESSION-0033',
  task_id: 'TASK-0033-02',
  loop_id: 'LOOP-0033-02',
  step_index: 7,
  turn_num: '7',
  turn_number: 7,
  turn_identifier: '[0033-07]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0033-02-00-07');
store.traces.push({
  ...turn0033_07,
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
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0033' && (t.turn_number === 7 || t.turn_identifier === '[0033-07]')));
store.conversation_turns.push(turn0033_07);

// task 상태 현행화
if (Array.isArray(store.tasks)) {
  const task = store.tasks.find((t: any) => t.task_id === 'TASK-0033-02');
  if (task) {
    task.status_cd = '진행중';
    task.status = 'IN_PROGRESS';
  }
}

if (store.sessions) {
  const currentSession = store.sessions.find((s: any) => s.session_id === 'SESSION-0033');
  if (currentSession && currentSession.doc_payload && Array.isArray(currentSession.doc_payload.tasks)) {
    const task = currentSession.doc_payload.tasks.find((t: any) => t.task_id === 'TASK-0033-02');
    if (task) {
      task.status = '진행중';
    }
  }
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0033-07] 동기화 완료');

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
    'TRACE-0033-02-00-07', 'SESSION-0033', 'TASK-0033-02', 'LOOP-0033-02', 7, 'gemini', 'models/gemini-1.5-flash',
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
    console.log('✅ Remote DB agent_conversation_trace [0033-07] 저장 성공:', b);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.warn('⚠️ Remote DB 저장 실패 (로컬 스토어 유지):', err.message);
  process.exit(0);
});

req.write(payload);
req.end();
