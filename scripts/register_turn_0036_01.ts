import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const store = HarnessRepository.getLocalStore();

const userPrompt = `[0036] 상단 리본 네비게이션 인라인 일체화(화면 부유 증상 조치) 및 Phase 5 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST API 연동

#세션시작 [0036] 상단 리본 네비게이션 인라인 일체화(화면 부유 증상 조치) 및 Phase 5 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST API 연동

[작업 세션 컨텍스트]
- 작업자: jkok2j2m (jkok2j2m@gmail.com)
- 추천 모델: Gemini 1.5 Flash (Tier 2, RPD 2,500회 무중단 모드)
- 직전 세션 기준 SHA: 1dbe5f8e4898a5457c5ace7b5f6bdaefa63206a9 (dev/stg/main 100% 일치, Clean Working Tree)
- 핵심 참조 문서: agents.md 하네스 정책 명심할것.
  * docs/13.회고/13-28_SESSION-261025-0035_세션종합_KPT_회고록.md (DOC-13-28)
  * docs/05.설계/05-33_상단_리본_접이식_레이어_모듈_네비게이션_설계서.md (DOC-05-33)
  * docs/10.리뷰/261025_058_상단_리본_접이식_레이어_모듈_네비게이션_코드리뷰.md (DOC-10-58)
  * docs/07.로드맵/07-02_화면별_디자인_토큰_적용현황_및_단계별_로드맵.md (v1.5.0)

[세션 주요 목표]
1. [화면배치 조치] 상단 리본 네비게이션(#btn-top-ribbon-trigger)의 absolute top-0 z-50 부유 구조를 Navbar 정규 인라인 버튼으로 일체화하여 화면 가림 및 붕 떠있는 증상 완결 조치
2. [Phase 5 API] 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST 엔드포인트 연동 및 목업 데이터 폴백 완비
3. [PDF 뷰어] 순수 뷰어/가상 스크롤/OCR 스튜디오 실서비스 tokens.ts 통합 및 렌더링 최적화
4. [거버넌스] 4단계 서비스 종합점검 100점 만점 [A+ (PERFECT)] 유지 및 3대 브랜치 패리티 일치`;

const agentResponse = fs.readFileSync('scripts/turn_0036_01_response.md', 'utf8');
const responseSummary = 'SESSION-0036 세션 시작 점검 완결, 원격 dev 최신 커밋(SHA: 1dbe5f8e) 무손실 동기화, 3대 브랜치 일치 검증, 신규 이슈 등록(#106) 및 작업 브랜치 생성, HarnessRepository 기반 스토어 및 DB 동기화 완료';

const turn0036_01 = {
  trace_id: 'TRACE-0036-01-00-01',
  session_id: 'SESSION-0036',
  task_id: 'TASK-0036-01',
  loop_id: null,
  step_index: 1,
  turn_num: '1',
  turn_number: 1,
  turn_identifier: '[0036-01]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0036-01-00-01');
store.traces.push({
  ...turn0036_01,
  agent_name: 'gemini',
  model_name: 'models/gemini-1.5-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0036' && (t.turn_number === 1 || t.turn_identifier === '[0036-01]')));
store.conversation_turns.push(turn0036_01);

HarnessRepository.saveLocalStore(store);
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0036-01] 동기화 완료');

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
    'TRACE-0036-01-00-01', 'SESSION-0036', 'TASK-0036-01', NULL, 1, 'gemini', 'models/gemini-1.5-flash',
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
