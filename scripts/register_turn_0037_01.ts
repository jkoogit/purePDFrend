import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const store = HarnessRepository.getLocalStore();

const userPrompt = `[0037] 4대 시스템 37개 전체 서비스 화면 순차적 사용성 및 실화면 심화 리뷰

#세션시작 : [0037] 4대 시스템 37개 전체 서비스 화면 순차적 사용성 및 실화면 심화 리뷰
- 작업목표:
  1. 4대 시스템(사용자 9종, 관리자 16종, 설정 5종, 에이전트 6종, 쇼케이스 1종) 37개 서비스 화면의 실화면 렌더링 상태 및 레이아웃 점검
  2. 와이어프레임과 실제 서비스 화면 간 간극(인라인 스타일, 하드코딩 색상, 컴포넌트 재사용성) 전수 정밀 리뷰
  3. DS-SHOWCASE 30대 표준 원자/분자 컴포넌트 풀의 실서비스 화면 적용률 확대 및 불필요한 중복 요소 정돈
  4. 4모드(Light, Dark, Dawn, System) 고대비 가독성, 44px 모바일 터치타깃, Zero-Pill 규격 수호
  5. 4단계 서비스 종합점검 100점 만점 [A+ (PERFECT)] 및 무결성 유지
- 작업계정: jkok2j2m (jkok2j2m@gmail.com)
- 참조문서:
  - docs/13.회고/13-29_SESSION-261026-0036_세션종합_KPT_회고록.md
  - docs/07.로드맵/07-02_화면별_디자인_토큰_적용현황_및_단계별_로드맵.md
  - docs/05.설계/05-37_30대_표준_원자_분자_컴포넌트_및_인터랙티브_디자인시스템_쇼케이스_설계서.md
  - docs/10.리뷰/261025_062_30대_표준_원자_분자_컴포넌트_및_인터랙티브_쇼케이스_코드리뷰.md
  - docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md`;

const agentResponse = fs.readFileSync('scripts/turn_0037_01_response.md', 'utf8');
const responseSummary = 'SESSION-0037 세션 시작 점검 완결, 원격 dev 최신 커밋(SHA: 8d9ee6f) 무손실 동기화, 3대 브랜치 일치 검증, 신규 이슈 등록(#110) 및 작업 브랜치 생성, HarnessRepository 기반 스토어 및 DB 동기화 완료';

const turn0037_01 = {
  trace_id: 'TRACE-0037-01-00-01',
  session_id: 'SESSION-0037',
  task_id: 'TASK-0037-01',
  loop_id: null,
  step_index: 1,
  turn_num: '1',
  turn_number: 1,
  turn_identifier: '[0037-01]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0037-01-00-01');
store.traces.push({
  ...turn0037_01,
  agent_name: 'gemini',
  model_name: 'models/gemini-3.8-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0037' && (t.turn_number === 1 || t.turn_identifier === '[0037-01]')));
store.conversation_turns.push(turn0037_01);

HarnessRepository.saveLocalStore(store);
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0037-01] 동기화 완료');

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
    'TRACE-0037-01-00-01', 'SESSION-0037', 'TASK-0037-01', NULL, 1, 'gemini', 'models/gemini-3.8-flash',
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
