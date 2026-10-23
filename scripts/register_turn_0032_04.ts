import fs from 'fs';
import path from 'path';
import https from 'https';

const storePath = path.resolve('data/local_agent_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const userPrompt = `#태스크정리 [0032-01] Phase 2 사용자 와이어프레임(PG-USR-05~07) tokens.ts 전면 대입 및 4모드 고대비 표준화 코드리뷰 발행 및 원격 커밋 동기화`;
const agentResponse = fs.readFileSync(path.resolve('scripts/turn_0032_04_response.md'), 'utf-8');
const responseSummary = 'Phase 2 사용자 와이어프레임(PG-USR-05~07) tokens.ts 전면 대입 및 가상뷰어·문서관리 4모드 고대비 표준화 코드리뷰(053) 발행, README_리뷰 색인 현행화, 하네스 스토어 \'정리완료\' 동기화 및 원격 브랜치 커밋 푸시 완료';

const turn0032_04 = {
  trace_id: 'TRACE-0032-01-00-04',
  session_id: 'SESSION-0032',
  task_id: 'TASK-0032-01',
  loop_id: 'LOOP-0032-04',
  step_index: 4,
  turn_num: '4',
  turn_number: 4,
  turn_identifier: '[0032-04]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0032-01-00-04');
store.traces.push({
  ...turn0032_04,
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
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0032' && (t.turn_number === 4 || t.turn_identifier === '[0032-04]')));
store.conversation_turns.push(turn0032_04);

// task 상태 현행화
if (store.sessions) {
  const currentSession = store.sessions.find((s: any) => s.session_id === 'SESSION-0032');
  if (currentSession && currentSession.doc_payload && currentSession.doc_payload.tasks) {
    const task = currentSession.doc_payload.tasks.find((t: any) => t.task_id === 'TASK-0032-01');
    if (task) {
      task.status = '정리완료';
    }
  }
}
if (store.tasks) {
  const tsk = store.tasks.find((t: any) => t.task_id === 'TASK-0032-01');
  if (tsk) {
    tsk.status = '정리완료';
    tsk.status_cd = '정리';
    tsk.updated_at = new Date().toISOString();
  }
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0032-04] 동기화 완료');

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
    'TRACE-0032-01-00-04', 'SESSION-0032', 'TASK-0032-01', 'LOOP-0032-04', 4, 'gemini', 'models/gemini-1.5-flash',
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
