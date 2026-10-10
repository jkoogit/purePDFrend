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
  const traceId = 'TRACE-0027-01-00-01';
  const promptText = `[0027] 상단_글로벌_헤더_테마_스위치_인터페이스_구축_및_관리자_실제_API_연동_1단계

#세션시작 [0027] 상단_글로벌_헤더_테마_스위치_인터페이스_구축_및_관리자_실제_API_연동_1단계
- 작업자: jkoogit (jkoogit@gmail.com)
- 직전 세션 회고: docs/13.회고/13-20_SESSION-261008-0026_세션종합_KPT_회고록.md
- 주요 과업:
  1. 상단 글로벌 네비게이션(Navbar)에 Sun/Moon 원클릭 다크/라이트 테마 토글 버튼 추가 및 와이어프레임 바로가기 연동
  2. 관리자 시스템서비스 PG-ADM-01(보안 IP 관리) 및 PG-ADM-03(사용자 관리) 실제 백엔드 Express 라우트/PostgreSQL 테이블 연동 1단계
  3. 44px 터치 가드레일 및 모바일 반응형 Break-to-Card 완결성 유지`;

  const responseText = `#[0027-01] [0027] 상단_글로벌_헤더_테마_스위치_인터페이스_구축_및_관리자_실제_API_연동_1단계 - 세션시작 보고

### 1. 세션명 현행화
- **세션명**: \`[0027] 상단_글로벌_헤더_테마_스위치_인터페이스_구축_및_관리자_실제_API_연동_1단계\`
- **세션 식별자**: \`SESSION-0027\`
- **작업 그룹**: \`purePDFrend\`
- **담당 작업자**: \`jkoogit (jkoogit@gmail.com)\`

### 2. 원격 dev 자동 Pull (Auto-Pull) 결과
- **동기화 스크립트**: \`scripts/pull_remote_dev.ts\` 정상 실행
- **원격 dev 기준 커밋 SHA**: \`70bfc99a25a0f4b22238647620aa72e751f1c510\`
- **네이티브 Git / Git Data API 무손실 동기화**: 100% 무손실 검증 완결 (로컬 작업공간 및 원격 dev 완벽 일치)

### 3. 원격 저장소 이슈 및 PR 점검 결과
- **현재 열린 이슈 수**: **0건** (직전 세션 #73, #75 등 전수 정상 종결 확인)
- **현재 열린 PR 수**: **0건** (전수 머지 및 종결 확인)

### 4. 3대 원격 브랜치 커밋 SHA 일치 검증
- \`main\` SHA: \`70bfc99a25a0f4b22238647620aa72e751f1c510\`
- \`stg\`  SHA: \`70bfc99a25a0f4b22238647620aa72e751f1c510\`
- \`dev\`  SHA: \`70bfc99a25a0f4b22238647620aa72e751f1c510\`
- **브랜치 일치 상태**: **✅ 100% 일치 (Synchronized, 클린 상태)**

### 5. 신규 세션 이슈 등록 및 원격 작업 브랜치 생성
- **신규 GitHub 이슈 등록**: **#77** (\`[0027_01] 상단 글로벌 헤더 테마 스위치 인터페이스 구축 및 관리자 실제 API 연동 1단계\`)
- **원격 작업 브랜치 생성**: \`refs/heads/task/0027_01_글로벌헤더_테마스위치_관리자API_jkoogit\` (기준 SHA: \`70bfc99a25a0f4b22238647620aa72e751f1c510\`)

### 6. 하네스 스토어 및 원격 DB 동기화
- **로컬 하네스 스토어**: \`data/local_agent_store.json\` 내 \`SESSION-0027\` 등록 완료 (상태: \`진행중\`)
- **원격 PostgreSQL DB**: \`aiagent.harness_session_meta\` 테이블에 \`SESSION-0027\` 무손실 등록 완료

### 7. 세션 대상 3대 과업 및 후속 태스크 안내
1. **[상단 글로벌 네비게이션 테마 스위치 & 와이어프레임 바로가기 연동]**:
   - Navbar에 Sun/Moon 원클릭 다크/라이트 테마 토글 버튼 추가 및 실시간 HTML root \`dark\` 클래스 동기화
   - 와이어프레임(PG-USR 1~7, PG-ADM 1~16) 모달/뷰어 바로가기 팝오버 및 퀵액션 바인딩
   - 44px 터치 가드레일 및 반응형 밀도 최적화
2. **[관리자 시스템서비스 실제 백엔드 API 연동 1단계]**:
   - PG-ADM-01 (보안 IP 관리): Express \`/api/admin/security/ips\` 엔드포인트 연동 (조회, 등록, 삭제) 및 로컬 스토어 백업
   - PG-ADM-03 (사용자 관리): Express \`/api/admin/users\` 엔드포인트 연동 및 PostgreSQL \`aiagent\` 사용자 테이블 연동
3. **[모바일 반응형 Break-to-Card 완결성 및 TDD 검증]**:
   - 모바일 환경 가로 스크롤 원천 차단 및 카드 전환 무결성 검증

\`\`\`bash
#태스크시작 [0027-01] 상단 글로벌 헤더 테마 스위치 인터페이스 구축 및 관리자 실제 API 연동 1단계 계획수립
\`\`\``;

  const responseSummary = 'SESSION-0027 세션시작: 원격 dev 자동Pull(70bfc99), 이슈 #77 등록, 작업 브랜치 task/0027_01_글로벌헤더_테마스위치_관리자API_jkoogit 생성, 하네스 스토어 및 DB 동기화 완료';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0027',
    task_id: 'TASK-0027-01',
    loop_id: null,
    step_index: 1,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: responseSummary,
    prompt_tokens: 1680,
    completion_tokens: 890,
    total_tokens: 2570,
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
