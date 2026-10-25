import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const store = HarnessRepository.getLocalStore();

const userPrompt = `#태스크정리 : 태스크처리 후에는 정리를 해야지
#태스크승급 까지 일괄 처리해줘`;

const agentResponse = fs.readFileSync('scripts/turn_0036_04_response.md', 'utf8');
const responseSummary = '[TASK-0036-01] 태스크 정리 및 승급 완료 보고 (상단 리본 인라인 일체화 및 4대 시스템 네비게이션 완결, 3대 브랜치 100% 동기화 승급)';

const turn0036_04 = {
  trace_id: 'TRACE-0036-01-00-04',
  session_id: 'SESSION-0036',
  task_id: 'TASK-0036-01',
  loop_id: 'LOOP-0036-01',
  step_index: 4,
  turn_num: '4',
  turn_number: 4,
  turn_identifier: '[0036-04]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0036-01-00-04');
store.traces.push({
  ...turn0036_04,
  agent_name: 'gemini',
  model_name: 'models/gemini-1.5-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0036' && (t.turn_number === 4 || t.turn_identifier === '[0036-04]')));
store.conversation_turns.push(turn0036_04);

HarnessRepository.saveLocalStore(store);
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0036-04] 동기화 완료');

// 2. PostgreSQL aiagent.agent_conversation_trace 동기화
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
    'TRACE-0036-01-00-04', 'SESSION-0036', 'TASK-0036-01', 'LOOP-0036-01', 4, 'gemini', 'models/gemini-1.5-flash',
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
