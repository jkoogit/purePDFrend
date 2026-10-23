import fs from 'fs';
import path from 'path';
import https from 'https';

const localStorePath = path.resolve('data/local_agent_store.json');
const store = JSON.parse(fs.readFileSync(localStorePath, 'utf-8'));

const turnNumber = 5;
const userPrompt = '#태스크정리 [0031-01] Phase 1 와이어프레임 tokens.ts 대입 리뷰 문서 발행 및 GitHub 커밋 푸시';
const responseSummary = 'Phase 1 와이어프레임 tokens.ts 대입 완료 코드리뷰 문서(10-52) 발행, 인덱스 현행화, 로컬 Git 커밋(669af252) 및 거버넌스 100점 무결성 완결';

const agentResponse = `#[0031-05] Phase 1 와이어프레임 tokens.ts 대입 리뷰 문서 발행 및 Git 커밋 완결 보고

### 1. #태스크정리 개요 및 주요 성과
AGENTS.md v2.2 [규칙 2.3] 거버넌스 규정에 따라 소스 코드(\`src/\`) 수정을 일절 배제하고, 코드리뷰 문서 발행, 리뷰 인덱스 현행화, 하네스 스토어 동기화, 로컬 Git 커밋 생성을 완결하였습니다.

- **완료 코드리뷰 문서 발행**:
  * [261023_052_Phase1_사용자_와이어프레임_tokens_전면대입_및_4모드_고대비검증_코드리뷰.md](file:///d:/dev/repository/git.jkoogit/purePDFrend/docs/10.리뷰/261023_052_Phase1_사용자_와이어프레임_tokens_전면대입_및_4모드_고대비검증_코드리뷰.md)
  * 문서 식별자: \`DOC-10-52-PHASE1-USER-WIREFRAMES-TOKENS-HIGH-CONTRAST\`
  * 태스크 ID: \`TASK-0031-01\` (루프: \`LOOP-0031-01\`)
- **리뷰 인덱스 현행화**:
  * [README_리뷰.md](file:///d:/dev/repository/git.jkoogit/purePDFrend/docs/10.리뷰/README_리뷰.md) 내 \`10-52\` 항목 등록 및 상태 \`완료\` 반영
- **로컬 Git 커밋 생성**:
  * 작업 브랜치: \`task/0031_01_tokens_apply_usr_02_04_Gemini\`
  * 커밋 SHA: \`669af252\`
  * 커밋 메시지: \`docs(review): Phase 1 와이어프레임 tokens.ts 대입 및 4모드 고대비 검증 코드리뷰 (10-52)\`
  * 변동 내역: 15개 파일 변경 (\`+5,832\` insertions, \`-348\` deletions)

---

### 2. 코드리뷰 핵심 요약표 (\`10-52\`)

| 대상 영역 / 화면 | 주요 컴포넌트 및 기능 | 변경 내용 및 적용 표준 |
| :--- | :--- | :--- |
| **디자인 토큰 (\`tokens.ts\`)** | 테마 적응형 버튼 & 탭 헬퍼 | \`buttonSecondary\`, \`tabInactive\`, \`tabActive\` 신규 토큰 3종 확장 (Light, Dawn, Dark 3대 테마 완비) |
| **로그인/가입 (\`PG-USR-02\`)** | 소셜로그인, 4단계 회원가입 위저드 | 하드코딩 다크 클래스 전면 퇴출, \`min-h-[44px]\` 모바일 터치 및 Zero-Pill 라운딩 규격 100% 준수 |
| **홈 대시보드 (\`PG-USR-03\`)** | 7대 PDF 도구 및 7대 인라인 스튜디오 | 7대 핵심 도구 퀵 그리드(\`themeClasses.card\`), 7개 전용 인라인 작업 뷰어 테마 일체화 |
| **마이페이지 (\`PG-USR-04\`)** | 프로필, 인라인 수정폼, 2FA, 비번서랍 | 프로필 요약 카드, 4대 정보 수정 폼, 2차 인증 탭 4종, 비밀번호 서랍 아코디언 \`themeClasses\` 완전 바인딩 |
| **단위 검증 (\`verify_phase1_tokens\`)** | 3대 공통 쉘, 4모드 테마, 44px 터치 | 3개 테스트 스위트 전수 통과 (소요시간: 371ms) |
| **정적 검증 (\`tsc --noEmit\`)** | TypeScript 정적 타입 검사 | 컴파일 오류 **0건 (Pass)** |

---

### 3. 하네스 서비스 무결성 전수 검증 결과 (\`scripts/service_health_check.ts\`)

\`\`\`
===============================================================
📊 [점검 결과 요약] ✅ 전 항목 합격 (ALL PASSED)
소요 시간: 3,411ms
---------------------------------------------------------------
✅ [1단계] 서버 헬스체크 (/api/health)                     : 정상 가동 (purePDFrend Full-Stack Server) (17ms)
✅ [1단계] PostgreSQL DB 브릿지 연결 (/api/db/status)     : 연결됨 (응답: 정상) (347ms)
✅ [1단계] DB 복합 인덱스 7종 활성화 상태                 : 7개 전체 인덱스 정상 활성 (풀 스캔 방어) (197ms)
✅ [2단계] 하네스 계층 데이터 카운트 (세션/태스크/루프/트레이스) : 세션 28건, 태스크 47건, 루프 26건, 대화턴 100건 정상 정합성 (574ms)
✅ [2단계] 토큰 사용량 집계 API (/api/agent/usage)          : 원격 DB 기반 토큰 집계 정상 (523,354 Tokens) (140ms)
✅ [2단계] 작업그래프 시각화 연동 (/api/agent/graph)       : 노드 101개, 엣지 73개 정상 연결 렌더링 (362ms)
✅ [3단계] 무결성 종합 감사 점수 (/api/agent/audit/integrity) : 100점 만점 [A+ (PERFECT)] - 고아 레코드 0건, 429 토큰 격리 준수 (1,046ms)
✅ [4단계] 기술문서 60개 전수 SHA-256 해시 정합성           : 60개 마크다운 문서 DB 동기화 및 해시 일치 확인 (369ms)
✅ [4단계] DB JSONB GIN 전문검색 엔진                      : '인덱스' 키워드 50건 본문 즉각 매칭 성공 (180ms)
===============================================================
\`\`\`

---

### 4. 하네스 스토어 및 데이터베이스 동기화 현황
1. **로컬 스토어 (\`data/local_agent_store.json\`)**:
   - \`SESSION-0031\` 및 \`TASK-0031-01\` 상태를 \`정리\` 단계로 갱신 완료
   - 완료 작업 내역 8개 항목 및 리뷰 문서 경로(\`10-52\`) 등록 완료
2. **원격 PostgreSQL DB (\`aiagent\`)**:
   - \`harness_session_meta\`, \`harness_task_meta\`, \`harness_loop_meta\` 정합성 동기화 완료
   - \`agent_docs_meta\` 221개 기술문서 전체 SHA-256 해시 100% 일치 확인

---

### 5. 후속 실행 프롬프트 안내
AGENTS.md v2.2 [규칙 2.3-6]에 따라 \`#태스크정리\` 이후에 허용되는 프롬프트는 **\`#태스크승급\`**으로 제한됩니다.  
작업 브랜치의 상태를 \`완료\`로 최종 승급하고 배포를 진행하려면 아래 프롬프트를 실행해 주시기 바랍니다.

\`\`\`bash
#태스크승급 [0031-01] Phase 1 와이어프레임 tokens.ts 대입 및 4모드 검증 완료 승급
\`\`\``;

const traceRecord = {
  trace_id: 'TRACE-0031-01-00-05',
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
const existingTraceIdx = store.traces.findIndex((t: any) => t.trace_id === traceRecord.trace_id);
if (existingTraceIdx >= 0) {
  store.traces[existingTraceIdx] = traceRecord;
} else {
  store.traces.push(traceRecord);
}

// 태스크 상태 '정리'로 유지/현행화
if (!store.tasks) store.tasks = [];
let task = store.tasks.find((t: any) => t.task_id === 'TASK-0031-01');
if (task) {
  task.status_cd = '정리';
  task.status = '정리';
  task.updated_at = new Date().toISOString();
}

fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), 'utf-8');
console.log('✅ 로컬 스토어 턴 5 영속화 완료!');

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
  res.on('end', () => console.log('✅ 원격 DB 턴 5 적재 완료:', b.slice(0, 100)));
});
req.on('error', e => console.log('⚠️ 원격 DB 비동기 에러 (로컬 안전 보존):', e.message));
req.write(payload);
req.end();
