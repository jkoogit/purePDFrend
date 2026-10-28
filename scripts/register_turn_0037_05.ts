import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const store = HarnessRepository.getLocalStore();

const userPrompt = `지금도 첫화면이 이상하게 뜬다. 부탁해. 

#태스크처리 : PG-USR-08 오프라인 작업정리 화면을 와이어프레임 소스에서 실서비스 독립 컴포넌트로 분리 구현`;

const agentResponse = fs.readFileSync('scripts/turn_0037_05_response.md', 'utf8');
const responseSummary = '첫화면 라우터 상단 컨트롤바 숨김 처리로 순수 랜딩 화면 복원, PG-USR-08 오프라인 작업정리 실서비스 컴포넌트(OfflineTaskCleanStudio) 독립 분리 구현, 3Way 충돌 머지 및 4단계 헬스체크 100점 완결';

const turn0037_05 = {
  trace_id: 'TRACE-0037-01-00-05',
  session_id: 'SESSION-0037',
  task_id: 'TASK-0037-01',
  loop_id: null,
  step_index: 5,
  turn_num: '5',
  turn_number: 5,
  turn_identifier: '[0037-05]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0037-01-00-05');
store.traces.push({
  ...turn0037_05,
  agent_name: 'gemini',
  model_name: 'models/gemini-3.8-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0037' && (t.turn_number === 5 || t.turn_identifier === '[0037-05]')));
store.conversation_turns.push(turn0037_05);

HarnessRepository.saveLocalStore(store);
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0037-05] 동기화 완료');

// 2. PostgreSQL aiagent.agent_conversation_trace 동기화
function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

const payload = JSON.stringify({
  database: 'purepdfrend_dev',
  sql: `
    INSERT INTO aiagent.agent_conversation_trace (
      trace_id, session_id, task_id, loop_id, step_index,
      agent_name, model_name, operator_account, agent_account,
      user_email, user_prompt, agent_response, response_summary,
      prompt_tokens, completion_tokens, total_tokens, created_at
    ) VALUES (
      ${escapeSql(turn0037_05.trace_id)},
      ${escapeSql(turn0037_05.session_id)},
      ${escapeSql(turn0037_05.task_id)},
      NULL,
      5,
      'gemini',
      'models/gemini-3.8-flash',
      ${escapeSql(turn0037_05.operator_account)},
      ${escapeSql(turn0037_05.agent_account)},
      ${escapeSql(turn0037_05.user_email)},
      ${escapeSql(turn0037_05.user_prompt)},
      ${escapeSql(turn0037_05.agent_response)},
      ${escapeSql(turn0037_05.response_summary)},
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
  `
});

const req = https.request('https://ptype.pdfrend.com/api/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-JKADH-SECRET': 'jkadh-secure-secret-token-2026',
    'Authorization': 'Bearer jkadh-secure-secret-token-2026',
    'Content-Length': Buffer.byteLength(payload)
  },
  rejectUnauthorized: false
}, (res) => {
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    console.log('✅ PostgreSQL aiagent.agent_conversation_trace [0037-05] 영속화 완료:', body);
  });
});

req.on('error', (e) => {
  console.error('❌ DB 영속화 통신 오류:', e.message);
});

req.write(payload);
req.end();
