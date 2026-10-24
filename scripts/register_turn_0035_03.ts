import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const store = HarnessRepository.getLocalStore();

const userPrompt = `#태스크시작 [0035-01] 서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화 계획 수립`;

const agentResponse = fs.readFileSync('scripts/turn_0035_03_response.md', 'utf8');
const responseSummary = 'TASK-0035-01 서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화 계획 수립 완료 (READ-ONLY 도메인 분석, 아키텍처 영향도, 6대 작업 계획, 사전 질문, 백로그 분기 안내, LOOP-0035-01 루프 분석, 후속 프롬프트 제시)';

const turn0035_03 = {
  trace_id: 'TRACE-0035-01-00-03',
  session_id: 'SESSION-0035',
  task_id: 'TASK-0035-01',
  loop_id: 'LOOP-0035-01',
  step_index: 3,
  turn_num: '3',
  turn_number: 3,
  turn_identifier: '[0035-03]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0035-01-00-03');
store.traces.push({
  ...turn0035_03,
  agent_name: 'gemini',
  model_name: 'models/gemini-1.5-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0035' && (t.turn_number === 3 || t.turn_identifier === '[0035-03]')));
store.conversation_turns.push(turn0035_03);

// Update task metadata in store
if (Array.isArray(store.tasks)) {
  const task = store.tasks.find((t: any) => t.task_id === 'TASK-0035-01');
  if (task) {
    task.task_name = '서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화';
    task.status_cd = '준비';
    task.doc_payload = {
      ...(task.doc_payload || {}),
      scope: '서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화',
      backlog_ids: ['BACKLOG-0035-01']
    };
  }
}

HarnessRepository.saveLocalStore(store);
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0035-03] 동기화 완료');

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
    'TRACE-0035-01-00-03', 'SESSION-0035', 'TASK-0035-01', 'LOOP-0035-01', 3, 'gemini', 'models/gemini-1.5-flash',
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
