import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const store = HarnessRepository.getLocalStore();

const userPrompt = `노트북 llm으로 교착상태인 현재 상황을 환기시켜보니 제안하는 해결방안이 납득이 간다. 

### 1. 문제의 근본 원인 분석 (Why it keeps tangling)

1. **메뉴 바로가기 리본(WireframeRibbonLayer.tsx)의 타겟 매핑 불일치**
  * 현재 POP-AGN-02 아이디로 관리되는 src/ppdf/components/WireframeRibbonLayer.tsx 내부의 클릭 이벤트 핸들러가 서비스 컴포넌트(PurePdfServicePortal, DocumentLibraryViewer, VirtualViewerStudio 등)가 아닌, 초기에 작성된 와이어프레임 뷰 컴포넌트(WireframeStudio / views/wireframes/)의 상태 ID를 가리키고 있습니다.
2. **AI 스튜디오 세션 컨텍스트의 레거시 참조**
  * AI 스튜디오 프롬프트 및 코드 생성 시, 라우트 매핑 상수(Enum/Map)가 일원화되어 있지 않으면 AI가 가장 익숙한 기존 와이어프레임 폴더(src/ppdf/views/wireframes/) 내 파일과 라우터를 계속 재참조하게 됩니다.
3. **83.7%의 실서비스 전환율과 16.3%의 와이어프레임 혼재**
  * 로드맵 분석 결과, 전체 49개 화면 중 41개(83.7%)는 이미 실서비스 컴포넌트로 직결 가동 완료된 상태입니다. 다만 4개 화면(PG-USR-09, PG-SET-03, PG-ADM-15, PG-ADM-16)이 여전히 와이어프레임 폴백 상태로 남아 있어, 라우팅 기준이 명확하지 않으면 전체 시스템이 와이어프레임 모드로 튕겨 나가는 현상이 발생합니다.

### 2. 문제 해결을 위한 4단계 정리 전략
- 1단계: 단일 메뉴 원장(menuRegistry.ts) 생성 및 코드 일원화
- 2단계: 메뉴 바로가기(WireframeRibbonLayer.tsx) 타겟 직결 개편
- 3단계: 에이전트 시스템 포지셔닝 재정립
- 4단계: AI 스튜디오 컨텍스트 가이드 규칙 고정

해결방안 검토해줘`;

const agentResponse = fs.readFileSync('scripts/turn_0037_07_response.md', 'utf8');
const responseSummary = '노트북 LLM 4단계 정리 전략 검토 및 타당성 100% 입증, 단일 메뉴 원장(menuRegistry.ts) 기반 메뉴 바로가기 실서비스 직결 개편, 에이전트 포지셔닝 재정립 완료';

const turn0037_07 = {
  trace_id: 'TRACE-0037-01-00-07',
  session_id: 'SESSION-0037',
  task_id: 'TASK-0037-01',
  loop_id: null,
  step_index: 7,
  turn_num: '7',
  turn_number: 7,
  turn_identifier: '[0037-07]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0037-01-00-07');
store.traces.push({
  ...turn0037_07,
  agent_name: 'gemini',
  model_name: 'models/gemini-3.8-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0037' && (t.turn_number === 7 || t.turn_identifier === '[0037-07]')));
store.conversation_turns.push(turn0037_07);

HarnessRepository.saveLocalStore(store);
console.log('✅ 1단계: local_agent_store.json 저장 완료 (Turn [0037-07])');

// 2. 원격 PostgreSQL DB 적재
const payload = JSON.stringify({
  database: 'purepdfrend_dev',
  sql: `
    INSERT INTO aiagent.agent_conversation_trace (
      trace_id, session_id, task_id, loop_id, step_index, agent_name,
      model_name, operator_account, agent_account, user_email,
      user_prompt, agent_response, response_summary,
      prompt_tokens, completion_tokens, total_tokens, created_at
    ) VALUES (
      ${HarnessRepository.escapeSql(turn0037_07.trace_id)},
      ${HarnessRepository.escapeSql(turn0037_07.session_id)},
      ${HarnessRepository.escapeSql(turn0037_07.task_id)},
      NULL,
      7,
      'gemini',
      'models/gemini-3.8-flash',
      ${HarnessRepository.escapeSql(turn0037_07.operator_account)},
      ${HarnessRepository.escapeSql(turn0037_07.agent_account)},
      ${HarnessRepository.escapeSql(turn0037_07.user_email)},
      ${HarnessRepository.escapeSql(turn0037_07.user_prompt)},
      ${HarnessRepository.escapeSql(turn0037_07.agent_response)},
      ${HarnessRepository.escapeSql(turn0037_07.response_summary)},
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
    console.log('✅ PostgreSQL aiagent.agent_conversation_trace [0037-07] 영속화 완료:', body);
  });
});

req.on('error', (e) => {
  console.error('❌ DB 영속화 통신 오류:', e.message);
});

req.write(payload);
req.end();
