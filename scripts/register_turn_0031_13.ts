import fs from 'fs';
import path from 'path';
import https from 'https';

const localStorePath = path.resolve('data/local_agent_store.json');
const store = JSON.parse(fs.readFileSync(localStorePath, 'utf-8'));

const turnNumber = 13;
const userPrompt = `원격에 배포한거 맞아/`;

const responseSummary = '원격(GitHub) 실제 배포 상태 정밀 조회(git ls-remote: 3c26becb 미배포 확인), 로컬 머지 완료 상태와의 차이점 및 원격 Push 완결 2대 방법(IDE UI 1클릭 vs 터미널 1회 푸시) 명확 안내';

const agentResponse = fs.readFileSync(path.resolve('scripts/turn_0031_13_response.md'), 'utf-8');

const traceRecord = {
  trace_id: 'TRACE-0031-01-00-13',
  session_id: 'SESSION-0031',
  task_id: 'TASK-0031-01',
  loop_id: 'LOOP-0031-01',
  step_index: turnNumber,
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

if (!store.traces) store.traces = [];
const existingTraceIdx = store.traces.findIndex((t: any) => t.trace_id === traceRecord.trace_id);
if (existingTraceIdx >= 0) {
  store.traces[existingTraceIdx] = traceRecord;
} else {
  store.traces.push(traceRecord);
}

fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), 'utf-8');
console.log('✅ 로컬 스토어 턴 13 영속화 완료!');

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
    '${traceRecord.trace_id}', '${traceRecord.session_id}', '${traceRecord.task_id}', '${traceRecord.loop_id}', ${traceRecord.step_index},
    '${traceRecord.agent_name}', '${traceRecord.model_name}',
    '${traceRecord.operator_account}', '${traceRecord.agent_account}', '${traceRecord.user_email}',
    ${escapeSql(traceRecord.user_prompt)}, ${escapeSql(traceRecord.agent_response)}, ${escapeSql(traceRecord.response_summary)},
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
  res.on('end', () => console.log('✅ 원격 DB 턴 13 적재 완료:', b.slice(0, 100)));
});
req.on('error', e => console.log('⚠️ 원격 DB 비동기 에러 (로컬 안전 보존):', e.message));
req.write(payload);
req.end();
