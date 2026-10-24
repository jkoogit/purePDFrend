import fs from 'fs';
import https from 'https';

const storePath = 'data/local_agent_store.json';
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const userPrompt = `#세션시작 [0032] Phase 2 사용자 와이어프레임(PG-USR-05~07) tokens.ts 전면 대입 및 가상뷰어·문서관리 4모드 고대비 표준화

[작업 세션 컨텍스트]
- 작업자: jkok2j2m (jkok2j2m@gmail.com)
- 추천 모델: Gemini 1.5 Flash (Tier 2, RPD 2,500회 무중단 모드)
- 직전 세션 기준 SHA: 3c26becba60df1aa66f04ad1ce41816405d8a35c (dev/stg/main 100% 일치)
- 핵심 참조 문서:
  * docs/07.로드맵/07-02_화면별_디자인_토큰_적용현황_및_단계별_로드맵.md (v1.1.0)
  * docs/13.회고/13-24_SESSION-261023-0031_세션종합_KPT_회고록.md
  * docs/10.리뷰/261023_052_Phase1_사용자_와이어프레임_tokens_전면대입_및_4모드_고대비검증_코드리뷰.md
  * docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md
  * src/styles/tokens.ts
  * src/ppdf/views/wireframes/UserWireframes.tsx
- 주요 작업 목표:
  1. 원격 dev 최신 커밋 자동 풀(npx tsx scripts/pull_remote_dev.ts) 및 샌드박스 동기화
  2. 로드맵 07-02 기반 Phase 2 대상 화면(PG-USR-05 내 문서관리, PG-USR-06 800쪽 가상뷰어, PG-USR-07 협업/주석)의 하드코딩 인라인 스타일을 tokens.ts 유틸리티로 전면 전환 (대입률 100% 달성)
  3. 4모드(Light, Dark, Dawn, System) 테마 스위칭 시 고대비 가독성 및 44px 모바일 최소 터치 타깃, Zero-Pill 사각 라운딩 표준 준수
  4. 단위 테스트(tests/wireframe_shells_and_tokens.test.ts) 및 4단계 서비스 전수점검 100점 만점 [A+ (PERFECT)] 무결성 검증`;

const agentResponse = `#[0032-01] SESSION-0032 세션 시작 및 환경 점검 완결 (Phase 2 tokens.ts 전면 대입 준비)

---

### 1. 세션 환경 점검 및 초기화 결과 요약

| 점검 항목 | 결과 / 상태 | 상세 내용 |
| :--- | :---: | :--- |
| **세션 ID 및 명칭** | **SESSION-0032** | \`[0032] Phase 2 사용자 와이어프레임(PG-USR-05~07) tokens.ts 전면 대입 및 가상뷰어·문서관리 4모드 고대비 표준화\` |
| **원격 \`dev\` 자동 풀** | **100% 완료** | \`npx tsx scripts/pull_remote_dev.ts\` 무손실 동기화 완결 (\`81057d53\`) |
| **원격 이슈 & PR 점검** | **0건 (이상무)** | Open Issues: 0건, Open PRs: 0건 (모두 정상 종결 확인) |
| **3대 원격 브랜치 일치** | **100% 일치** | \`dev\`, \`stg\`, \`main\` 브랜치 최신 커밋 SHA (\`81057d538bc0b018831fcdcb99efc56b4b07ed6f\`) 완벽 일치 |
| **신규 GitHub 이슈** | **[#97](https://github.com/jkoogit/purePDFrend/issues/97)** | 세션 목표 및 로드맵 연계 등록 완료 |
| **작업 브랜치** | **준비 완료** | \`task/0032_01_wireframe_tokens_phase2_Gemini\` 로컬 생성 및 체크아웃 |
| **하네스 메타 스토어** | **동기화 완료** | \`data/local_agent_store.json\` 및 원격 DB \`aiagent.harness_session_meta\` 등록 완결 |

---

### 2. Phase 2 핵심 작업 대상 및 이행 전략

- **대상 화면 (로드맵 07-02 기준)**:
  1. **PG-USR-05 (내 문서관리 / 라이브러리)**:
     - 문서 목록 그리드/테이블, 폴더 필터, 태그, 상태 뱃지, 페이지네이션 토큰 전면 대입
  2. **PG-USR-06 (800쪽 대용량 가상화 뷰어 스튜디오)**:
     - 뷰어 프레임, 툴바, 줌/회전 컨트롤, 가상 스크롤 페이지 카드, 썸네일 사이드바 토큰 대입
  3. **PG-USR-07 (협업 / 주석 피드백 스튜디오)**:
     - 주석 패널, 협업자 아바타, 코멘트 스레드, 드로잉 툴바, 공유 모달 토큰 대입
- **표준 준수 원칙**:
  - **4모드 고대비**: Light, Dark, Dawn, System 테마 전환 시 텍스트 및 경계선 가독성 100% 보장
  - **터치 타깃**: 모바일 기준 44px 최소 터치 영역 보장
  - **형태 표준**: Zero-Pill 원칙 (알약형 배제, 사각 및 세련된 직사각형 반경 적용)
  - **품질 검증**: 단위 테스트(\`tests/wireframe_shells_and_tokens.test.ts\`) 및 4단계 서비스 전수점검 100점 만점 [A+ (PERFECT)]

---

### 3. 후속 실행 프롬프트 제안

세션 환경 구성이 완결되었으므로, **규칙 2.1**에 따라 READ-ONLY 계획 수립을 위한 \`#태스크시작\`을 진행합니다.

\`\`\`markdown
#태스크시작 [0032-01] Phase 2 사용자 와이어프레임(PG-USR-05~07) tokens.ts 전면 대입 및 가상뷰어·문서관리 4모드 고대비 표준화 계획 수립
\`\`\``;

const responseSummary = 'SESSION-0032 세션 시작 점검 완결, 원격 dev 최신 커밋(SHA: 81057d53) 무손실 동기화, 3대 브랜치 일치 검증, 신규 이슈(#97) 등록 및 작업 브랜치 생성, 하네스 스토어 등록 완료';

const turn0032_01 = {
  trace_id: 'TRACE-0032-01-00-01',
  session_id: 'SESSION-0032',
  task_id: 'TASK-0032-01',
  loop_id: null,
  step_index: 1,
  turn_num: '1',
  turn_number: 1,
  turn_identifier: '[0032-01]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0032-01-00-01');
store.traces.push({
  ...turn0032_01,
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
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0032' && (t.turn_number === 1 || t.turn_identifier === '[0032-01]')));
store.conversation_turns.push(turn0032_01);

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0032-01] 동기화 완료');

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
    'TRACE-0032-01-00-01', 'SESSION-0032', 'TASK-0032-01', NULL, 1, 'gemini', 'models/gemini-1.5-flash',
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
  timeout: 3000,
}, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => console.log('원격 DB 턴 적재 결과:', b.slice(0, 100)));
});
req.on('error', e => console.log('원격 DB 비동기 에러 (로컬 정상):', e.message));
req.write(payload);
req.end();
