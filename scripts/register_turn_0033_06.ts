import fs from 'fs';
import path from 'path';
import https from 'https';

const storePath = path.resolve('data/local_agent_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const userPrompt = `#태스크시작 [0033-02] 하네스 태스크/세션 UPSERT 스키마 헬퍼 함수 표준화 및 도메인 레포지토리 리팩토링`;
const agentResponse = fs.readFileSync(path.resolve('scripts/turn_0033_06_response.md'), 'utf-8');
const responseSummary = '하네스 태스크/세션 UPSERT 스키마 헬퍼 함수 표준화 및 도메인 레포지토리 리팩토링 READ-ONLY 계획 수립 완료 (5대 세부 작업, 루프 분석, DDL 정합성 분석 및 태스크처리 프롬프트 도출)';

const turn0033_06 = {
  trace_id: 'TRACE-0033-02-00-06',
  session_id: 'SESSION-0033',
  task_id: 'TASK-0033-02',
  loop_id: 'LOOP-0033-02',
  step_index: 6,
  turn_num: '6',
  turn_number: 6,
  turn_identifier: '[0033-06]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0033-02-00-06');
store.traces.push({
  ...turn0033_06,
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
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0033' && (t.turn_number === 6 || t.turn_identifier === '[0033-06]')));
store.conversation_turns.push(turn0033_06);

// task 객체 등록
const taskObj = {
  task_id: 'TASK-0033-02',
  session_id: 'SESSION-0033',
  task_name: '[0033-02] 하네스 태스크/세션 UPSERT 스키마 헬퍼 함수 표준화 및 도메인 레포지토리 리팩토링',
  status_cd: '계획수립',
  priority: 'HIGH',
  assigned_agent: 'gemini',
  git_branch: 'task/0033_02_harness_repo_refactor_Gemini',
  started_at: new Date().toISOString(),
  ended_at: null,
  doc_payload: {
    plan_items: [
      '1. 하네스 메타 엔티티 타입 표준화 (src/aiagent/domain/harness/types.ts)',
      '2. 하네스 도메인 레포지토리 구현 (src/aiagent/domain/harness/HarnessRepository.ts)',
      '3. Express 서버 REST API 확장 (POST /api/agent/sessions, tasks, loops in server.ts)',
      '4. TDD 단위 테스트 및 무결성 검증 (tests/harness_repository_schema.test.ts)',
      '5. 아키텍처 학습 문서 발행 (docs/15.학습/15-25...)'
    ],
    completed_items: [],
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com'
  },
  created_sys: 'agent-harness',
  created_by: 'jkok2j2m',
  updated_sys: 'agent-harness',
  updated_by: 'jkok2j2m',
  version: 1,
  status: '계획수립',
  updated_at: new Date().toISOString()
};

if (!Array.isArray(store.tasks)) {
  store.tasks = [];
}
store.tasks = store.tasks.filter((t: any) => t.task_id !== 'TASK-0033-02');
store.tasks.unshift(taskObj);

// session.doc_payload.tasks 등록
if (store.sessions) {
  const currentSession = store.sessions.find((s: any) => s.session_id === 'SESSION-0033');
  if (currentSession && currentSession.doc_payload) {
    if (!Array.isArray(currentSession.doc_payload.tasks)) {
      currentSession.doc_payload.tasks = [];
    }
    const existing = currentSession.doc_payload.tasks.find((t: any) => t.task_id === 'TASK-0033-02');
    if (!existing) {
      currentSession.doc_payload.tasks.push({
        task_id: 'TASK-0033-02',
        task_name: taskObj.task_name,
        status: '계획수립'
      });
    } else {
      existing.status = '계획수립';
    }
  }
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('✅ data/local_agent_store.json (traces, conversation_turns, tasks) [0033-06] 동기화 완료');

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
    'TRACE-0033-02-00-06', 'SESSION-0033', 'TASK-0033-02', 'LOOP-0033-02', 6, 'gemini', 'models/gemini-1.5-flash',
    'jkok2j2m', 'jkok2j2m@gmail.com', 'jkok2j2m@gmail.com',
    ${escapeSql(userPrompt)}, ${escapeSql(agentResponse)}, ${escapeSql(responseSummary)},
    0, 0, 0, now()
  ) ON CONFLICT (trace_id) DO UPDATE SET
    user_prompt = EXCLUDED.user_prompt,
    agent_response = EXCLUDED.agent_response,
    response_summary = EXCLUDED.response_summary;

  INSERT INTO aiagent.harness_task_meta (
    task_id, session_id, task_name, status_cd, git_branch,
    doc_payload, started_at, version, created_sys, created_by, updated_sys, updated_by
  ) VALUES (
    'TASK-0033-02', 'SESSION-0033', ${escapeSql(taskObj.task_name)}, '계획수립', 'task/0033_02_harness_repo_refactor_Gemini',
    ${escapeSql(JSON.stringify(taskObj.doc_payload))}, now(), 1, 'agent-harness', 'jkok2j2m', 'agent-harness', 'jkok2j2m'
  ) ON CONFLICT (task_id) DO UPDATE SET
    status_cd = EXCLUDED.status_cd,
    doc_payload = EXCLUDED.doc_payload,
    updated_by = EXCLUDED.updated_by;`
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
    console.log('✅ Remote DB agent_conversation_trace & harness_task_meta [0033-06] 저장 성공:', b);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.warn('⚠️ Remote DB 저장 실패 (로컬 스토어 유지):', err.message);
  process.exit(0);
});

req.write(payload);
req.end();
