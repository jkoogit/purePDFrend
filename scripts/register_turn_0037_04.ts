import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const store = HarnessRepository.getLocalStore();

const userPrompt = `뭐지. 첫화면이 왜 또 바뀐거야. 
메뉴바로가기는 서비스화면과 연결이 되어야하는데 검토한 첫화면이 다시 와이어프레임 화면으로 추정되는 이전화면으로 바뀐건. 
서비스화면과 와이어프레임 화면간에 관리가 안되는것 같아.
와이어프레임 컨텐츠를기반으로 서비스화면구현 시 누락된부분 검토가 아직 안되서 임시로 남겨두고있는데 그것때문에 혼선이 계속 생기는것 같아. 

이거 정리가 안될까. 
메뉴바로가기는 서비스화면에 연결되어야해. 
서비시화면이 없으면 와이어프레임의 화면을 가져와. 
두 소스는 달라.`;

const agentResponse = fs.readFileSync('scripts/turn_0037_04_response.md', 'utf8');
const responseSummary = '서비스 화면과 와이어프레임 화면의 소스 체계 완전 분리, 37개 전체 화면 실서비스 직결 통합 라우터(UnifiedServiceScreenRouter) 구축, 와이어프레임 원본 비교 토글 스위치 제공 및 첫화면 불변 보장 완료';

const turn0037_04 = {
  trace_id: 'TRACE-0037-01-00-04',
  session_id: 'SESSION-0037',
  task_id: 'TASK-0037-01',
  loop_id: null,
  step_index: 4,
  turn_num: '4',
  turn_number: 4,
  turn_identifier: '[0037-04]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0037-01-00-04');
store.traces.push({
  ...turn0037_04,
  agent_name: 'gemini',
  model_name: 'models/gemini-3.8-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0037' && (t.turn_number === 4 || t.turn_identifier === '[0037-04]')));
store.conversation_turns.push(turn0037_04);

HarnessRepository.saveLocalStore(store);
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0037-04] 동기화 완료');

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
    'TRACE-0037-01-00-04', 'SESSION-0037', 'TASK-0037-01', NULL, 4, 'gemini', 'models/gemini-3.8-flash',
    'jkok2j2m', 'jkok2j2m@gmail.com', 'jkok2j2m@gmail.com',
    ${escapeSql(userPrompt)}, ${escapeSql(agentResponse)}, ${escapeSql(responseSummary)},
    0, 0, 0, NOW()
  ) ON CONFLICT (trace_id) DO UPDATE SET
    user_prompt = EXCLUDED.user_prompt,
    agent_response = EXCLUDED.agent_response,
    response_summary = EXCLUDED.response_summary,
    step_index = EXCLUDED.step_index,
    created_at = NOW();`
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
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('✅ PostgreSQL DB aiagent.agent_conversation_trace [0037-04] 적재 완료:', body.slice(0, 150));
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('❌ PostgreSQL DB 적재 실패:', err.message);
  process.exit(0);
});

req.write(payload);
req.end();
