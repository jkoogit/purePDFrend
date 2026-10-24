import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const store = HarnessRepository.getLocalStore();

const userPrompt = `태스크시작 전에 검토하고 있던 다음작업을 검토해줘, 
* 현시점에서 아직 디자인 설계가 정리되지 않았는데, 
   api 연동같은 기능구현하는게 적절한걸까.

1. 앞서 와이어프레임 리뷰를 진행한 뒤에 
2. 지금은 와이어프레임 화면 기반으로 서비스 화면을 구성하는 과정이야.
2.1. 직전까지 서비스화면에 대한 토큰요소를 기반으로 디자인 정책을 수립했고, 
2.2. 그 과정에서 틀어지거나 보완이 필요한 디자인 요소가 있어.
  - 서비스화면을 기준으로 리뷰가 필요할것 같아. (이번세션부터 다뤄볼까해)
  - 테마기준 요소 및 토큰요소  색상이 적절하지 않고, 일관되지가 않아.
  - 서비스화면을 우선으로 개발모드를 시작하다보니 에이전트시스템 우선일때의 네비게이션 기준으로 정리가 필요할것 같아(리뷰 작업 대상)
  - 리뷰 과정에서 불필요한 요소 정리 필요 : 에이전트시스템에 와이어프레임이 있는데, 서비스화면으로 이관을 했으니 기능이관이 완료되면 삭제
3. 개발과정에서 화면이동을 위한 임시 기능 : top 화면목록으로만 이동할수 있게 네비게이션 중복 간소화

이런 작업일정 검토해줘`;

const agentResponse = fs.readFileSync('scripts/turn_0035_02_response.md', 'utf8');
const responseSummary = '서비스 화면 중심 디자인 시스템(토큰/테마) 선행 정비 및 네비게이션 구조 간소화 일정 검토 의견 보고 (디자인 선행 타당성 100% 동의, 테마 색상 일원화, 네비게이션 중복 제거 및 Top 25개 화면목록 단일화 로드맵 제안)';

const turn0035_02 = {
  trace_id: 'TRACE-0035-01-00-02',
  session_id: 'SESSION-0035',
  task_id: 'TASK-0035-01',
  loop_id: null,
  step_index: 2,
  turn_num: '2',
  turn_number: 2,
  turn_identifier: '[0035-02]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0035-01-00-02');
store.traces.push({
  ...turn0035_02,
  agent_name: 'gemini',
  model_name: 'models/gemini-1.5-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0035' && (t.turn_number === 2 || t.turn_identifier === '[0035-02]')));
store.conversation_turns.push(turn0035_02);

HarnessRepository.saveLocalStore(store);
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0035-02] 동기화 완료');

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
    'TRACE-0035-01-00-02', 'SESSION-0035', 'TASK-0035-01', NULL, 2, 'gemini', 'models/gemini-1.5-flash',
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
