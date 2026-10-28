import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const store = HarnessRepository.getLocalStore();

const userPrompt = `1. 메뉴 바로가기 
1.1 상단 시스템버튼 여역. 슬라이드드래그휠 이벤트 적용.
1.2 메뉴바로가기 열면 적용되어있는 포커스온 하지말것. 포커스온 시 모바일에서는 키패드가 뜨는게 불편해. 

* 로드맵 문서로 전체 화면목록을 리부대상으로 리스트업 해줘. 
-대상 : 전체화면
-구분 : 메뉴, 팝업
-출처 : 서비스화면, 와이어프레임화면
-시스템 : 사용자,관리자,시스템,에이전트,기타(쇼케이스 등)
-소스위치, 파일명, 화면 타이틀
-소스링크, 화면링크(ai스튜디오, 안티그래비티, dev배포 도메인)`;

const agentResponse = fs.readFileSync('scripts/turn_0037_06_response.md', 'utf8');
const responseSummary = '메뉴 바로가기 상단 시스템 버튼 영역 슬라이드 드래그 및 휠 스크롤 적용, 모바일 포커스온(focus()) 배제, 07-03 전체 화면(메뉴 37개+팝업 12개) 리뷰대상 목록 및 소스 연계 로드맵 수립 완료';

const turn0037_06 = {
  trace_id: 'TRACE-0037-01-00-06',
  session_id: 'SESSION-0037',
  task_id: 'TASK-0037-01',
  loop_id: null,
  step_index: 6,
  turn_num: '6',
  turn_number: 6,
  turn_identifier: '[0037-06]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0037-01-00-06');
store.traces.push({
  ...turn0037_06,
  agent_name: 'gemini',
  model_name: 'models/gemini-3.8-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0037' && (t.turn_number === 6 || t.turn_identifier === '[0037-06]')));
store.conversation_turns.push(turn0037_06);

HarnessRepository.saveLocalStore(store);
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0037-06] 동기화 완료');

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
      ${escapeSql(turn0037_06.trace_id)},
      ${escapeSql(turn0037_06.session_id)},
      ${escapeSql(turn0037_06.task_id)},
      NULL,
      6,
      'gemini',
      'models/gemini-3.8-flash',
      ${escapeSql(turn0037_06.operator_account)},
      ${escapeSql(turn0037_06.agent_account)},
      ${escapeSql(turn0037_06.user_email)},
      ${escapeSql(turn0037_06.user_prompt)},
      ${escapeSql(turn0037_06.agent_response)},
      ${escapeSql(turn0037_06.response_summary)},
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
    console.log('✅ PostgreSQL aiagent.agent_conversation_trace [0037-06] 영속화 완료:', body);
  });
});

req.on('error', (e) => {
  console.error('❌ DB 영속화 통신 오류:', e.message);
});

req.write(payload);
req.end();
