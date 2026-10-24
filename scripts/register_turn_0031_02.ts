import fs from 'fs';
import https from 'https';

const storePath = 'data/local_agent_store.json';
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const userPrompt = '로컬서비스 시작';
const responseSummary = 'purePDFrend 로컬 개발 서버(Express 4 + Vite 6, 포트 3000) 의존성 복구 및 데몬 구동 완결 (HTTP 200 OK 검증 완료)';
const agentResponse = `#[0031-02] purePDFrend 로컬 개발 서버 구동 완료

- 서비스 URL: http://localhost:3000 (모든 인터페이스 0.0.0.0:3000 바인딩)
- 서버 스택: Express 4.21.2 + Vite 6.0.0 통합 개발 서버
- 헬스체크 결과: HTTP 200 OK 정상 수신 완료
- 비즈니스 서비스 오프라인 무중단 독립 실행 보장`;

const trace0031_02 = {
  trace_id: 'TRACE-0031-01-00-02',
  session_id: 'SESSION-0031',
  task_id: 'TASK-0031-01',
  loop_id: null,
  step_index: 2,
  agent_name: 'gemini',
  model_name: 'models/gemini-1.5-flash',
  operator_account: 'jkok2j2m',
  agent_account: 'jkok2j2m@gmail.com',
  user_email: 'jkok2j2m@gmail.com',
  user_prompt: userPrompt,
  agent_response: agentResponse,
  response_summary: responseSummary,
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
  created_at: new Date().toISOString()
};

// store.traces 동기화
if (!Array.isArray(store.traces)) {
  store.traces = [];
}
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0031-01-00-02');
store.traces.push(trace0031_02);

// store.conversation_turns 동기화
if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0031' && (t.turn_number === 2 || t.turn_identifier === '[0031-02]')));
store.conversation_turns.push({
  trace_id: 'TRACE-0031-01-00-02',
  session_id: 'SESSION-0031',
  task_id: 'TASK-0031-01',
  turn_num: '2',
  turn_number: 2,
  turn_identifier: '[0031-02]',
  operator_account: 'jkok2j2m',
  agent_account: 'jkok2j2m@gmail.com',
  user_email: 'jkok2j2m@gmail.com',
  user_prompt: userPrompt,
  agent_response_summary: responseSummary,
  agent_response: agentResponse,
  status: 'SUCCESS',
  created_at: new Date().toISOString()
});

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0031-02] 동기화 완료');

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
    'TRACE-0031-01-00-02', 'SESSION-0031', 'TASK-0031-01', NULL, 2, 'gemini', 'models/gemini-1.5-flash',
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
  timeout: 3000,
}, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => console.log('원격 DB 턴 적재 결과:', b.slice(0, 100)));
});
req.on('error', e => console.log('원격 DB 비동기 에러 (로컬 정상):', e.message));
req.write(payload);
req.end();
