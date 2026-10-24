import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const store = HarnessRepository.getLocalStore();

const userPrompt = `[0035] Phase 5 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST API 연동 및 PDF 핵심 뷰어 실서비스 tokens.ts 통합

#세션시작 [0035] Phase 5 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST API 연동 및 PDF 핵심 뷰어 실서비스 tokens.ts 통합

[작업 세션 컨텍스트]
- 작업자: jkok2j2m (jkok2j2m@gmail.com)
- 추천 모델: Gemini 1.5 Flash (Tier 2, RPD 2,500회 무중단 모드)
- 직전 세션 기준 SHA: d1d66875843ba630b2114f5ad1a4a1c94131a49a (dev/stg/main 100% 일치)
- 핵심 참조 문서:
  * docs/07.로드맵/07-02_화면별_디자인_토큰_적용현황_및_단계별_로드맵.md (v1.5.0)
  * docs/13.회고/13-27_SESSION-261024-0034_세션종합_KPT_회고록.md (DOC-13-27)
  * docs/10.리뷰/261024_056_Phase4_관리자_2단계_API_연동_및_관리자_tokens_전면완결_코드리뷰.md (DOC-10-56)
  * docs/05.설계/05-31_Phase4_관리자_2단계_API_연동_및_관리자_tokens_전면완결_설계서.md (DOC-05-31)
  * docs/15.학습/15-25_하네스_메타원장_도메인레포지토리_및_스키마표준화_아키텍처.md (DOC-15-25)
  * docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md
  * src/styles/tokens.ts
  * src/ppdf/views/wireframes/admin/AdminExtendedModulesView.tsx
  * src/aiagent/domain/harness/HarnessRepository.ts
  * AGENTS.md v2.2 - 하네스 처리 숙지 및 개선요소 검토
  * GEMINI.md v1.0.0

[세션 핵심 작업 목표]
1. Phase 5 관리자 3단계 확장 3개 화면군 실제 REST API 연동 (BACKLOG-0034-01):
   - PG-ADM-09: 알림 센터 템플릿 및 인앱/이메일 발송 현황 (Express/PostgreSQL REST API 연동)
   - PG-ADM-11: 외부 연계 API 키 발급/폐기 및 웹훅 이벤트 발송 관리 (보안 인증 및 엔드포인트 연동)
   - PG-ADM-12: 공지 게시판 및 롤링 배너 관리 (게시물 CRUD, 배너 우선순위 및 기간 설정 API 연동)
2. PDF 핵심 비즈니스 3대 뷰어 화면 실서비스 연동 및 tokens.ts 통합 (BACKLOG-0034-02):
   - 와이어프레임 25개 100% 토큰화 달성에 이어 실제 PDF 엔진 렌더링 화면(순수 뷰어, 가상 스크롤, OCR 레이아웃 교정)에 디자인 토큰 완전 적용
3. 관리자 전 화면 모바일 반응형 0px 가로스크롤 및 Table-to-Card 전환 전수 최적화 (BACKLOG-0034-03):
   - 15개 관리자 화면 전 영역 모바일 뷰포트 정밀 검증
4. 하네스 거버넌스 및 품질 가드레일:
   - HarnessRepository 기반 세션/태스크 DDL 정규화 및 Zero-Hang 5초 타임아웃 자율 폴백 가동
   - 4단계 서비스 종합 점검 100점 만점 [A+ (PERFECT)] 유지
   - Zero-Loss 대화 턴 전수 영속화 및 dev/stg/main 3대 브랜치 동기화`;

const agentResponse = fs.readFileSync('scripts/turn_0035_01_response.md', 'utf8');
const responseSummary = 'SESSION-0035 세션 시작 점검 완결, 원격 dev 최신 커밋(SHA: d1d66875) 무손실 동기화, 3대 브랜치 일치 검증, 신규 이슈 등록(#100) 및 작업 브랜치 생성, HarnessRepository 기반 스토어 및 DB 동기화 완료';

const turn0035_01 = {
  trace_id: 'TRACE-0035-01-00-01',
  session_id: 'SESSION-0035',
  task_id: 'TASK-0035-01',
  loop_id: null,
  step_index: 1,
  turn_num: '1',
  turn_number: 1,
  turn_identifier: '[0035-01]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0035-01-00-01');
store.traces.push({
  ...turn0035_01,
  agent_name: 'gemini',
  model_name: 'models/gemini-1.5-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0035' && (t.turn_number === 1 || t.turn_identifier === '[0035-01]')));
store.conversation_turns.push(turn0035_01);

HarnessRepository.saveLocalStore(store);
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0035-01] 동기화 완료');

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
    'TRACE-0035-01-00-01', 'SESSION-0035', 'TASK-0035-01', NULL, 1, 'gemini', 'models/gemini-1.5-flash',
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
