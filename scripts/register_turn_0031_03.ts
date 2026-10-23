import fs from 'fs';
import https from 'https';

const storePath = 'data/local_agent_store.json';
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const userPrompt = '#태스크시작 [0031-01] Phase 1 대상 사용자 와이어프레임(PG-USR-02~04) tokens.ts 전면 대입 및 4모드 고대비 검증 상세 계획 수립';
const responseSummary = 'TASK-0031-01 Phase 1 사용자 와이어프레임(PG-USR-02~04) tokens.ts 전면 대입 및 4모드 고대비 검증 상세 계획 및 루프 분석 수립 완결';
const agentResponse = `#[0031-03] TASK-0031-01 Phase 1 사용자 와이어프레임(PG-USR-02~04) tokens.ts 전면 대입 상세 계획 수립

- 작업 대상: PG-USR-02(로그인/회원가입), PG-USR-03(홈화면 대시보드), PG-USR-04(마이페이지/사용자관리)
- 4모드 테마(Light, Dark, Dawn, System) 실시간 감지 및 getThemeAdaptiveClasses 동적 바인딩 아키텍처 수립
- 44px 모바일 터치 타깃 및 Zero-Pill 규격 검증 계획 수립
- 루프 분석(LOOP-0031-01) 타당성 검토 완료 및 사전 확인 질의 제시`;

const trace0031_03 = {
  trace_id: 'TRACE-0031-01-00-03',
  session_id: 'SESSION-0031',
  task_id: 'TASK-0031-01',
  loop_id: null,
  step_index: 3,
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0031-01-00-03');
store.traces.push(trace0031_03);

// store.conversation_turns 동기화
if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0031' && (t.turn_number === 3 || t.turn_identifier === '[0031-03]')));
store.conversation_turns.push({
  trace_id: 'TRACE-0031-01-00-03',
  session_id: 'SESSION-0031',
  task_id: 'TASK-0031-01',
  turn_num: '3',
  turn_number: 3,
  turn_identifier: '[0031-03]',
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
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0031-03] 동기화 완료');

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
    'TRACE-0031-01-00-03', 'SESSION-0031', 'TASK-0031-01', NULL, 3, 'gemini', 'models/gemini-1.5-flash',
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
