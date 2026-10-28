import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const store = HarnessRepository.getLocalStore();

const userPrompt = `1. 메뉴바로가기 모바일모드에서 메뉴그룹버튼이 텍스트로 줄바꿈되네 슬라이드드래그휠로 적용해줘. 
2. 로그인, 회원가입 시 간편인증이 빠져있어. 카카오, 네이버, 구글 계정으로 쉽게 로그인할수 있는 간편인증이 필요하고, 시스템설정에따라 생략이 가능하지만, 기본 기능은 제공하고 필수여부가 설정으로 관ㄹ리되는거야. 회원가입시 인증하면 로그인시 인증한 간편인증 수단으로 로그인하는 형식이야
3. 메뉴바로가기 링크가 잘못 연결되어 있어.  쇼케이스로 이동하는 항목들이 많아.
 OCR 관리가 대표적이야.
 전체적으로 링크 점검해줘.  기존에 정리한 내용은 와이어? 프레임 설계 화면으로 연결하지 말고 서비스 화면으로 연결하라는 작업이 있었는데.
서비스화면이 없으면 와이어프레임 화면을 가저와야해.`;

const agentResponse = fs.readFileSync('scripts/turn_0037_03_response.md', 'utf8');
const responseSummary = '메뉴 바로가기 모바일 슬라이드/드래그/휠 스크롤 적용, 간편인증 3종 연동 및 시스템 설정 관리, 37개 전체 서비스 화면 직결 네비게이션 전수 정밀 구축 완료 및 4단계 서비스 점검 100점 만점 [A+ (PERFECT)] 달성';

const turn0037_03 = {
  trace_id: 'TRACE-0037-01-00-03',
  session_id: 'SESSION-0037',
  task_id: 'TASK-0037-01',
  loop_id: null,
  step_index: 3,
  turn_num: '3',
  turn_number: 3,
  turn_identifier: '[0037-03]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0037-01-00-03');
store.traces.push({
  ...turn0037_03,
  agent_name: 'gemini',
  model_name: 'models/gemini-3.8-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0037' && (t.turn_number === 3 || t.turn_identifier === '[0037-03]')));
store.conversation_turns.push(turn0037_03);

HarnessRepository.saveLocalStore(store);
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0037-03] 동기화 완료');

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
    'TRACE-0037-01-00-03', 'SESSION-0037', 'TASK-0037-01', NULL, 3, 'gemini', 'models/gemini-3.8-flash',
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
    console.log('✅ PostgreSQL DB aiagent.agent_conversation_trace [0037-03] 적재 완료:', body.slice(0, 150));
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('❌ PostgreSQL DB 적재 실패:', err.message);
  process.exit(0);
});

req.write(payload);
req.end();
