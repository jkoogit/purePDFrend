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
  const traceId = 'TRACE-0029-01-00-01';
  const promptText = `#세션시작 [0029] top 영역가운데 와이어프레임 목록 표시, tokens.ts 디자인 토큰 전면 대입 현황 검토 및 미처리 화면 대입조치

[작업 세션 환경 및 컨텍스트]
- 작업계정: jkoogit (jkoogit@gmail.com)
- 직전완료세션: SESSION-0028 (회고록: docs/13.회고/13-22_SESSION-261011-0028_세션종합_KPT_회고록.md)
- 원격 동기화 기준 커밋: dev = stg = main (343fafe2a9595d507128586e76abedc0f3e7c39e)
- 선행 자동 실행: npx tsx scripts/pull_remote_dev.ts
- 핵심 대상 과업: 참고
  1. 23개 와이어프레임 화면의 개별 레이아웃 파편화를 해소하는 3대 공통 쉘(AdminShell, UserShell, StudioShell) 컴포넌트 구축
  2. 공통 쉘 내 BrandLogo(4모드 적응형) 및 상단 글로벌 테마/권한 스위치 기본 탑재
  3. PG-USR-03(가상화 뷰어), PG-USR-04(BBox 캔버스), PG-USR-05(레이아웃 편집기)에 tokens.ts 디자인 토큰 전면 대입`;

  const responseText = `#[0029-01] [0029] top 영역가운데 와이어프레임 목록 표시, tokens.ts 디자인 토큰 전면 대입 현황 검토 및 미처리 화면 대입조치 - 세션시작 보고

### 1. 세션명 현행화
- **세션명**: \`[0029] top 영역가운데 와이어프레임 목록 표시, tokens.ts 디자인 토큰 전면 대입 현황 검토 및 미처리 화면 대입조치\`
- **세션 식별자**: \`SESSION-0029\`
- **작업 그룹**: \`purePDFrend\`
- **담당 작업자**: \`jkoogit (jkoogit@gmail.com)\`

### 2. 원격 dev 자동 Pull (Auto-Pull) 결과
- **동기화 스크립트**: \`scripts/pull_remote_dev.ts\` 선행 실행 완결
- **원격 dev 기준 커밋 SHA**: \`343fafe2a9595d507128586e76abedc0f3e7c39e\`
- **네이티브 Git / Git Data API 무손실 동기화**: 100% 무손실 검증 완결 (로컬 작업공간 및 원격 dev 완벽 일치)

### 3. 원격 저장소 이슈 및 PR 점검 결과
- **현재 열린 이슈 수**: **0건** (직전 세션 #84 등 전수 정상 종료 확인)
- **현재 열린 PR 수**: **0건** (전수 머지 및 종결 확인)

### 4. 3대 원격 브랜치 커밋 SHA 일치 검증
- \`main\` SHA: \`343fafe2a9595d507128586e76abedc0f3e7c39e\`
- \`stg\`  SHA: \`343fafe2a9595d507128586e76abedc0f3e7c39e\`
- \`dev\`  SHA: \`343fafe2a9595d507128586e76abedc0f3e7c39e\`
- **브랜치 일치 상태**: **✅ 100% 일치 (Synchronized, 클린 상태)**

### 5. 신규 세션 이슈 등록 및 원격 작업 브랜치 생성
- **신규 GitHub 이슈 등록**: **#88** (\`[0029_01] top 영역가운데 와이어프레임 목록 표시, tokens.ts 디자인 토큰 전면 대입 현황 검토 및 미처리 화면 대입조치\`)
- **원격 작업 브랜치 생성**: \`refs/heads/task/0029_01_top_wireframe_list_tokens_apply_jkoogit\` (기준 SHA: \`343fafe2a9595d507128586e76abedc0f3e7c39e\`)

### 6. 하네스 스토어 및 원격 DB 동기화
- **로컬 하네스 스토어**: \`data/local_agent_store.json\` 내 \`SESSION-0029\` 등록 완료 (상태: \`진행중\`)
- **원격 PostgreSQL DB**: \`aiagent.harness_session_meta\` 테이블에 \`SESSION-0029\` 무손실 등록 완료

### 7. 세션 대상 핵심 과업 및 작업 계획
1. **[공통 쉘(Shell) 컴포넌트 아키텍처 구축]**:
   - 23개 와이어프레임 화면의 개별 레이아웃 파편화를 해소하는 3대 공통 쉘(\`AdminShell\`, \`UserShell\`, \`StudioShell\`) 컴포넌트 구축
   - 공통 쉘 내 \`PdfrendLogo\`(4모드 적응형) 및 상단 글로벌 테마/권한 스위치 기본 탑재
2. **[상단 네비게이션 및 와이어프레임 바로가기 개선]**:
   - Top 글로벌 헤더 가운데 영역에 와이어프레임 화면 목록 퀵 점프 셀렉트/내비게이션 배치 (23개 화면 분류별 바로가기)
3. **[디자인 토큰 전면 대입 현황 검토 및 미처리 화면 대입 조치]**:
   - \`src/styles/tokens.ts\` 기반 컬러, 타이포그래피, 간격, 둥글기 전면 적용 검토
   - 미처리된 화면(PG-USR-03 가상화 뷰어, PG-USR-04 BBox 캔버스, PG-USR-05 레이아웃 편집기 등) 전면 대입
4. **[TDD 단위 테스트 및 린트/컴파일 무결성 검증]**:
   - 공통 쉘 및 와이어프레임 내비게이션, 토큰 바인딩 단위 테스트 보강 및 정적 검증 100% 통과

\`\`\`bash
#태스크시작 [0029-01] top 영역 가운데 와이어프레임 목록 표시 및 tokens.ts 디자인 토큰 전면 대입 계획 수립 및 쉘 구조 설계
\`\`\``;

  const responseSummary = 'SESSION-0029 세션시작: 원격 dev 자동Pull(343fafe), 이슈 #88 등록, 작업 브랜치 task/0029_01_top_wireframe_list_tokens_apply_jkoogit 생성, 하네스 스토어 및 DB 동기화 완료';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0029',
    task_id: 'TASK-0029-01',
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
    completion_tokens: 760,
    total_tokens: 2300,
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
