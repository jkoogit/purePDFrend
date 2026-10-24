import fs from 'fs';
import path from 'path';
import https from 'https';

const localStorePath = path.resolve('data/local_agent_store.json');
const store = JSON.parse(fs.readFileSync(localStorePath, 'utf-8'));

const turnNumber = 4;
const userPrompt = '#태스크처리 [0031-01] Phase 1 대상 사용자 와이어프레임(PG-USR-02~04) tokens.ts 전면 대입 및 4모드 고대비 검증 실행';
const responseSummary = 'Phase 1 대상 사용자 와이어프레임(PG-USR-02~04) tokens.ts 전면 대입, 4모드 고대비 및 44px 터치타깃·Zero-Pill 규격 검증 완결';

const agentResponse = `#[0031-04] Phase 1 대상 사용자 와이어프레임(PG-USR-02~04) tokens.ts 전면 대입 및 4모드 고대비 검증 완결 보고

### 1. 작업 개요 및 핵심 성과 요약
- **하네스 태스크**: \`TASK-0031-01\` (루프 \`LOOP-0031-01\` 1차 단위 반복 완결)
- **대상 화면**:
  1. **\`PG-USR-02\`**: 로그인 / 회원가입 (소셜/이메일 2FA 탭 전환, 4단계 회원가입 위저드, 프로필 크롭 연동)
  2. **\`PG-USR-03\`**: 홈 대시보드 (7대 PDF 도구 퀵 그리드, 최근 문서 배너, 7대 도구 전용 인라인 작업 스튜디오)
  3. **\`PG-USR-04\`**: 마이페이지 / 사용자관리 (프로필 요약 카드, 기본정보 인라인 수정 폼, 2FA 정책/주인증수단 그리드, 비밀번호 변경 서랍)
- **품질 지표 달성**:
  * **하드코딩 다크 클래스 전면 퇴출**: Tailwind \`bg-slate-900\`, \`bg-slate-950\`, \`border-slate-800\` 등을 \`themeClasses\` 유틸리티로 100% 치환
  * **4모드(Light, Dark, Dawn, System) 테마 완비**: WCAG AA 4.5:1 이상 고대비 가독성 확보
  * **44px 모바일 터치 타깃 준수**: 모든 주요 대화형 요소 \`min-h-[44px]\` 확보
  * **Zero-Pill 라운딩 준수**: 아바타 외 모든 직사각형 컴포넌트 \`rounded-xl\`, \`rounded-2xl\` 적용 (\`rounded-full\` 알약형 배제)

---

### 2. 세부 수정 내역

| 대상 화면 / 파일 | 주요 수정 컴포넌트 및 영역 | 적용된 tokens.ts 토큰 및 스타일 |
| :--- | :--- | :--- |
| **\`tokens.ts\`** | 테마 적응형 헬퍼 확장 | \`buttonSecondary\`, \`tabInactive\`, \`tabActive\` (Light, Dawn, Dark 3대 테마 완비) |
| **\`UserWireframes.tsx\`** | 최상단 테마 감지 훅 | \`MutationObserver\`(\`data-theme\`) + \`storage\` 이벤트 실시간 감지 및 \`themeClasses\` 바인딩 |
| **\`PG-USR-02\`** | 로그인 카드 | ID/PW 인풋(\`themeClasses.input\`, \`min-h-[44px]\`), 소셜로그인 버튼 3종(\`min-h-[44px]\`) |
| **\`PG-USR-02\`** | 회원가입 위저드 (Step 1~4) | 약관동의 패널, 프로필 사진 업로드 & 정보입력, 2FA 수단 선택 탭 4종(\`themeClasses.tabActive\`/\`tabInactive\`), 가입완료 축하 카드 |
| **\`PG-USR-03\`** | 7대 PDF 도구 대시보드 | 7대 핵심 도구 퀵 그리드(\`themeClasses.card\`), 최근 처리 문서 배너(\`themeClasses.panel\`), 뷰어로 열기 버튼 |
| **\`PG-USR-03\`** | 7대 인라인 작업 스튜디오 | 상단 공통 네비바, 1. 카메라 스캔, 2. 이미지➔PDF, 3. PDF OCR, 4. OCR➔TEXT, 5. 문서관리, 6. PDF 압축, 7. PDF 보안 전면 치환 |
| **\`PG-USR-04\`** | 프로필 요약 카드 | 읽기 모드 카드(\`themeClasses.card\`), 아바타 연필 수정 버튼, PRO 회원 배지, 기본정보 수정 버튼 |
| **\`PG-USR-04\`** | 기본정보 인라인 수정 폼 | 실명/별명/전화번호/이메일 4대 인풋, 중복확인 버튼, 이메일 6자리 인증 서랍(\`themeClasses.panel\`), 저장/취소 버튼 |
| **\`PG-USR-04\`** | 계정 보안 및 2FA 설정 | 2FA 정책 툴바, 2단계 로그인 토글, 주 2차 인증수단 4대 탭, 소셜 연동 계정 카드, 비상 복구코드 10개 관리 버튼 |
| **\`PG-USR-04\`** | 비밀번호 보안 관리 | 접이식 아코디언(서랍), 현재비번/새비번/확인 3단계 인풋(\`min-h-[44px]\`), 업데이트 액션 버튼 |

---

### 3. 검증 결과 (TDD & 정적 린트)
1. **TypeScript 정적 타입 검증 (\`tsc --noEmit\`)**:
   - \`tsc --noEmit\` 실행 결과: **오류 0건 (Exit Code 0, 100% Pass)**
2. **단위 검증 (\`scripts/verify_phase1_tokens.ts\`)**:
   - 3대 공통 쉘 및 와이어프레임 서비스 목록 25개 검증: **통과**
   - tokens.ts 4모드 테마 적응형 클래스 및 신규 토큰 3종(\`buttonSecondary\`, \`tabInactive\`, \`tabActive\`): **통과**
   - 44px 모바일 터치 타깃 및 포커스 링 검증: **통과** (소요시간: 371ms)
3. **서비스 헬스체크 (\`scripts/service_health_check.ts\`)**:
   - Full-Stack Server (\`http://localhost:3000\`), DB 브릿지, 복합 인덱스 7종, 작업그래프 API 모두 **정상 가동 (HTTP 200 OK)**

---

### 4. 후속 실행 프롬프트 제안
Phase 1 대상 화면(PG-USR-02~04)의 토큰 대입 및 4모드 검증이 완료되었으므로, AGENTS.md v2.2 규율에 따라 **\`#태스크정리 [0031-01]\`** 단계로 진입하여 코드리뷰 문서 발행 및 Git Data API 커밋 생성을 진행합니다.

\`\`\`bash
#태스크정리 [0031-01] Phase 1 와이어프레임 tokens.ts 대입 리뷰 문서 발행 및 GitHub 커밋 푸시
\`\`\``;

const traceRecord = {
  trace_id: 'TRACE-0031-01-01-04',
  session_id: 'SESSION-0031',
  task_id: 'TASK-0031-01',
  loop_id: 'LOOP-0031-01',
  step_index: turnNumber,
  agent_name: 'gemini',
  model_name: 'models/gemini-1.5-flash',
  operator_account: 'jkok2j2m',
  agent_account: 'jkok2j2m@gmail.com',
  user_email: 'jkok2j2m@gmail.com',
  user_prompt: userPrompt,
  agent_response: agentResponse,
  response_summary: responseSummary,
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
  created_at: new Date().toISOString()
};

if (!store.traces) store.traces = [];
// 기존 동일 trace_id 있으면 갱신, 없으면 추가
const existingTraceIdx = store.traces.findIndex((t: any) => t.trace_id === traceRecord.trace_id);
if (existingTraceIdx >= 0) {
  store.traces[existingTraceIdx] = traceRecord;
} else {
  store.traces.push(traceRecord);
}

// 태스크 정보 갱신
if (!store.tasks) store.tasks = [];
let task = store.tasks.find((t: any) => t.task_id === 'TASK-0031-01');
if (task) {
  task.status = '구현완료';
  task.updated_at = new Date().toISOString();
} else {
  store.tasks.push({
    task_id: 'TASK-0031-01',
    session_id: 'SESSION-0031',
    task_name: 'Phase 1 사용자 와이어프레임(PG-USR-02~04) tokens.ts 전면 대입 및 4모드 디자인 시스템 고도화',
    status: '구현완료',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}

// 루프 정보 갱신
if (!store.loops) store.loops = [];
let loop = store.loops.find((l: any) => l.loop_id === 'LOOP-0031-01');
if (loop) {
  loop.status = '완료';
  loop.updated_at = new Date().toISOString();
} else {
  store.loops.push({
    loop_id: 'LOOP-0031-01',
    task_id: 'TASK-0031-01',
    session_id: 'SESSION-0031',
    loop_name: 'Phase 1 대상 3대 화면(PG-USR-02~04) tokens.ts 순차 대입 및 4모드 고대비 단위 검증',
    iteration: 1,
    status: '완료',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}

fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), 'utf-8');
console.log('✅ 로컬 스토어 턴 4 영속화 완료!');

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
    '${traceRecord.trace_id}', '${traceRecord.session_id}', '${traceRecord.task_id}', '${traceRecord.loop_id}', ${traceRecord.step_index},
    '${traceRecord.agent_name}', '${traceRecord.model_name}',
    '${traceRecord.operator_account}', '${traceRecord.agent_account}', '${traceRecord.user_email}',
    ${escapeSql(traceRecord.user_prompt)}, ${escapeSql(traceRecord.agent_response)}, ${escapeSql(traceRecord.response_summary)},
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
  res.on('end', () => console.log('✅ 원격 DB 턴 4 적재 완료:', b.slice(0, 100)));
});
req.on('error', e => console.log('⚠️ 원격 DB 비동기 에러 (로컬 안전 보존):', e.message));
req.write(payload);
req.end();
