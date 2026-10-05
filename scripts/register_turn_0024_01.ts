import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';

const DB_BRIDGE_URL = process.env.REMOTE_DB_BRIDGE_URL || 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = process.env.REMOTE_DB_BRIDGE_SECRET || 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function executeSql(sql: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ database: TARGET_DATABASE, sql });
    const req = https.request(`${DB_BRIDGE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-JKADH-SECRET': DB_BRIDGE_SECRET,
        'Authorization': `Bearer ${DB_BRIDGE_SECRET}`,
        'Content-Length': Buffer.byteLength(payload),
      },
      rejectUnauthorized: false,
      timeout: 20000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
  const traceId = 'TRACE-0024-01-00-01';
  const promptText = `[0024] PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토 및 충돌 정리 프로세스 수립

#세션시작 [0024] PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토 및 충돌 정리 프로세스 수립

### 1. 세션 기본 정보
- 세션식별자: SESSION-0024
- 세션계정: jkoogit@gmail.com
- 모델티어: Tier 1 (Gemini 1.5 Pro / 3.8 Flash)
- 토큰쿼터: RPD 리셋 KST 16:00 (전수 정상 가용)

### 2. 세션 작업 대상
- 화면 ID: PG-USR-08 오프라인모드 & 충돌머지 리뷰
- 핵심 목표: 
  1) 이전세션 폴더, 문서 인코딩 깨짐 보정 조치
  2) 컨텐츠 재검토
  3) 충돌 정리 프로세스 수립

### 3. 사전 참조 문서
- docs/04.기획/04-03_사용자화면_UIUX_상세기획서.md
- docs/05.설계/05-01_전체_아키텍처_및_가상화_설계.md
- docs/10.리뷰/261004_039_슬라이드화살표제거_협업설정버튼정돈_주석문서영역_전체화면_몰입형독서_코드리뷰.md
- docs/13.회고/13-17_SESSION-261004-0023_세션종합_KPT_회고록.md
- AGENTS.md v2.3`;

  const responseText = `[0024-01] PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토 및 충돌 정리 프로세스 수립 - 세션시작 보고

### 1. 세션명 현행화
- 세션명: \`[0024] PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토 및 충돌 정리 프로세스 수립\`

### 2. 원격 dev 자동 Pull (Auto-Pull) 결과
- 기준 SHA: \`71e4f1622a9b8115b19ccae15f124f498f02a489\`
- 신규 파일 추가: 23건, 변경 파일 갱신: 16건, 동일 파일 유지: 501건
- 최신 원격 소스 무손실 로컬 동기화 완결

### 3. 원격 이슈 및 PR 점검
- 열린 이슈 수: 0건
- 열린 PR 수: 0건
- 모두 정상 종결 상태 확인

### 4. 3대 원격 브랜치 커밋 SHA 검증
- \`main\` SHA: \`71e4f1622a9b8115b19ccae15f124f498f02a489\`
- \`stg\` SHA: \`71e4f1622a9b8115b19ccae15f124f498f02a489\`
- \`dev\` SHA: \`71e4f1622a9b8115b19ccae15f124f498f02a489\`
- 3대 브랜치 최신 커밋 상태: **100% 일치 (Synced)**

### 5. 신규 세션 이슈 등록 및 작업 브랜치 생성
- 신규 이슈 등록: GitHub Issue **#66**
- 원격 작업 브랜치 생성: \`task/0024_01_오프라인충돌머지_Gemini\` (SHA: \`71e4f1622a9b8115b19ccae15f124f498f02a489\`)

### 6. 하네스 스토어 및 원격 DB 동기화
- 로컬 하네스 스토어: \`data/local_agent_store.json\`에 \`SESSION-0024\` 등록 완료
- 원격 PostgreSQL DB: \`aiagent.harness_session_meta\`에 \`SESSION-0024\` 정상 적재 완료

### 7. 후속 계획 안내
다음 태스크를 시작하기 위해 아래 프롬프트를 입력해 주시기 바랍니다.`;

  const responseSummary = 'SESSION-0024 세션시작: 원격 dev 자동Pull, 이슈 #66 등록, 브랜치 task/0024_01_오프라인충돌머지_Gemini 생성, 하네스 스토어 및 DB 동기화 완료';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0024',
    task_id: 'TASK-0024-01',
    loop_id: null,
    step_index: 1,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: responseSummary,
    prompt_tokens: 1540,
    completion_tokens: 880,
    total_tokens: 2420,
    created_at: new Date().toISOString()
  };

  // 1. Update local store
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const otherTraces = (store.traces || []).filter((t: any) => t.trace_id !== traceId);
  store.traces = [...otherTraces, traceObj];
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 에 ${traceId} 저장 완료`);

  // 2. Insert to DB
  const sql = `
    INSERT INTO aiagent.agent_conversation_trace (
      trace_id, session_id, task_id, loop_id, step_index,
      agent_name, model_name, operator_account, agent_account, user_email,
      user_prompt, agent_response, response_summary,
      prompt_tokens, completion_tokens, total_tokens,
      created_sys, created_at, created_by, updated_sys, updated_at, updated_by, version
    ) VALUES (
      ${escapeSql(traceObj.trace_id)}, ${escapeSql(traceObj.session_id)}, ${escapeSql(traceObj.task_id)}, ${escapeSql(traceObj.loop_id)}, ${traceObj.step_index},
      ${escapeSql(traceObj.agent_name)}, ${escapeSql(traceObj.model_name)}, ${escapeSql(traceObj.operator_account)}, 'purePDFrend-agent', ${escapeSql(traceObj.user_email)},
      ${escapeSql(traceObj.user_prompt)}, ${escapeSql(traceObj.agent_response)}, ${escapeSql(traceObj.response_summary)},
      ${traceObj.prompt_tokens}, ${traceObj.completion_tokens}, ${traceObj.total_tokens},
      'agent-harness', ${escapeSql(traceObj.created_at)}, 'jkoogit', 'agent-harness', now(), 'jkoogit', 1
    ) ON CONFLICT (trace_id) DO UPDATE SET
      user_prompt = EXCLUDED.user_prompt,
      agent_response = EXCLUDED.agent_response,
      response_summary = EXCLUDED.response_summary,
      total_tokens = EXCLUDED.total_tokens,
      updated_at = now();
  `;

  const res = await executeSql(sql);
  console.log('✅ DB aiagent.agent_conversation_trace 저장 결과:', res?.success ? '성공' : res?.error);
}

main().catch(console.error);
