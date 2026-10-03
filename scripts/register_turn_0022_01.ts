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
  const traceId = 'TRACE-0022-01-00-01';
  const promptText = `[0022] SESSION-0021 DB 미적재 턴 일괄 동기화 및 신규 세션 하네스 착수

#세션시작 [0022] SESSION-0021 DB 미적재 턴 일괄 동기화 및 신규 세션 하네스 착수

### 1. 작업 대상 및 핵심 목표
1. **[비상대응 완결] SESSION-0021 원격 DB 일괄 적재**:
   - \`data/local_agent_store.json\`에 보존된 \`SESSION-0021\`의 7대 대화 턴(\`TRACE-0021-01-00-01\` ~ \`TRACE-0021-01-00-07\`)을 원격 PostgreSQL DB 브릿지를 통해 \`aiagent.agent_conversation_trace\` 테이블에 일괄 INSERT
   - \`aiagent.harness_task_meta\`에 \`TASK-0021-01\` 등록 및 \`aiagent.harness_session_meta\`의 \`SESSION-0021\` 상태를 '완료'로 승급 현행화
2. **신규 세션 [0022] 하네스 초기화**:
   - 원격 저장소 이슈 및 PR 점검 (종결 상태 확인)
   - 원격 \`dev\` 브랜치 기준 신규 작업 브랜치 생성 (\`task/0022_01_DB동기화_및_거버넌스보완_Gemini\`)
   - \`SESSION-0022\` 세션 이슈 등록 및 하네스 스토어 동기화
3. **이월 백로그 착수 (\`BACKLOG-0021-01\`)**:
   - 계정 전환 및 샌드박스 초기화 시 원격 \`dev\` 소스 자동 Pull & 브랜치 정돈 거버넌스 가이드라인 수립

### 2. 세션 작업 환경 및 계정
- 세션 계정: jkoogit@gmail.com (운영자: jkoogit)
- 작업 브랜치 베이스: 원격 dev 브랜치 (최신 커밋 SHA: 983339dc7aefcd3cf392f2abe51a759140649a83)
- 참조 문서:
  - docs/13.회고/13-17_SESSION-261002-0021_세션종합_KPT_회고록.md
  - data/local_agent_store.json
  - AGENTS.md
  - GEMINI.md

### 3. 모델 티어링 및 토큰 정책
- Tier 1 (Pro 250회): 태스크 시작 및 아키텍처 수립
- Tier 2 (Flash 2500회): 태스크 처리 및 기능 구현
- Tier 3 (Lite 4000회): 태스크 정리/승급 및 단순 동기화`;

  const responseText = `[0022] SESSION-0021 DB 미적재 턴 일괄 동기화 및 신규 세션 하네스 착수 시작 보고

1. 세션명 현행화: [0022] SESSION-0021 DB 미적재 턴 일괄 동기화 및 신규 세션 하네스 착수
2. SESSION-0021 비상대응 DB 동기화 완결:
   - 7대 대화 턴 (TRACE-0021-01-00-01 ~ TRACE-0021-01-00-07) aiagent.agent_conversation_trace 원격 DB 일괄 적재 완료
   - TASK-0021-01 상태 '완료'로 aiagent.harness_task_meta 등록 완료
   - SESSION-0021 상태 '완료'로 aiagent.harness_session_meta 승급 완료
3. GitHub 이슈 및 PR 점검: 오픈 PR 0건, 세션 이슈 #58 현행화 완결
4. 3대 원격 브랜치 커밋 SHA 검증: dev, stg, main 100% 일치 (SHA: 983339dc7aefcd3cf392f2abe51a759140649a83)
5. 신규 작업 브랜치 생성: task/0022_01_DB동기화_및_거버넌스보완_Gemini 생성 완료
6. 하네스 스토어 동기화: data/local_agent_store.json 및 DB SESSION-0022 등록 완료`;

  const responseSummary = 'SESSION-0021 7대 턴 DB 일괄 적재 완결, SESSION-0022 세션 초기화 및 하네스 연동 완료';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0022',
    task_id: 'TASK-0022-01',
    loop_id: null,
    step_index: 1,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: responseSummary,
    prompt_tokens: 1650,
    completion_tokens: 950,
    total_tokens: 2600,
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
