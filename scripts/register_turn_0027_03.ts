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
  const traceId = 'TRACE-0027-01-00-03';
  const promptText = `#태스크처리 [0027-01] 상단 글로벌 헤더 테마 스위치 인터페이스 구축 및 관리자 실제 API 연동 1단계`;

  const responseText = `#[0027-03] [0027-01] 상단 글로벌 헤더 테마 스위치 인터페이스 구축 및 관리자 실제 API 연동 1단계 - 처리 완료 보고

### 1. 설계 및 요구사항 문서 선반영
- **설계 문서 작성**: \`docs/05.설계/05-27_상단_글로벌_헤더_테마_스위처_및_관리자_API_1단계_설계서.md\` 선반영 완료
  - 테마 스위처 상태 머신 및 DOM 클래스(\`dark\` / \`light\`) 동기화 규격 수립
  - PG-ADM-01(보안 IP 관리) 및 PG-ADM-03(사용자 계정 관리) REST API 엔드포인트 및 듀얼 영속화 규격 확정

### 2. 상단 글로벌 네비게이션 테마 스위처 및 퀵액션 구현 (\`Navbar.tsx\`)
- **Sun / Moon 테마 토글 버튼**:
  - \`#btn-theme-toggle\` 버튼 추가 (데스크톱 컴팩트 32px 및 hover 애니메이션)
  - \`localStorage\` (\`purepdfrend_theme\`) 및 \`document.documentElement\` 실시간 클래스 바인딩
  - 모바일 햄버거 드로어 푸터에 44px 터치 높이의 \`#btn-mobile-drawer-theme-toggle\` 추가
- **와이어프레임 퀵액션 바로가기**:
  - \`#btn-quick-wireframes\` 버튼 추가 (어디서나 원클릭으로 16개 관리자·9개 사용자 와이어프레임 뷰어 전환)

### 3. PG-ADM-01 보안 IP 관리 REST API 및 UI 연동
- **Express 백엔드 엔드포인트 (\`server.ts\`)**:
  - \`GET /api/admin/security/ips\`: 화이트리스트 CIDR 대역 및 긴급 차단 블랙리스트 목록 조회
  - \`POST /api/admin/security/ips\`: 신규 CIDR / IP 즉시 등록
  - \`DELETE /api/admin/security/ips\`: 대상 IP 차단 해제 또는 삭제
  - \`POST /api/admin/security/config\`: 2단계 인증 강제화 및 오프라인 토큰 수명 동기화
- **프론트엔드 연동 (\`AdminSecurityView.tsx\`)**:
  - Mock 정적 데이터를 실제 백엔드 API 호출로 전환 (조회, 추가, 삭제, 실시간 상태 피드백)

### 4. PG-ADM-03 사용자 계정 관리 REST API 및 UI 연동
- **Express 백엔드 엔드포인트 (\`server.ts\`)**:
  - \`GET /api/admin/users\`: PostgreSQL \`aiagent.agent_user_account\` 연계 및 시스템 사용자 조회
  - \`POST /api/admin/users\`: 신규 회원 계정 및 역할 등록
  - \`PATCH /api/admin/users/:id\`: 다중 역할(\`roles\`), 회원 상태(\`정상\`, \`제한\`, \`휴면\`) 실시간 업데이트
  - \`DELETE /api/admin/users/:id\`: 계정 삭제
- **프론트엔드 연동 (\`AdminUsersView.tsx\`)**:
  - 실제 API 기반 회원 목록 로드 및 신규 등록 모달, 다중 역할 체크박스, 회원 상태 원클릭 변경, 계정 삭제 완결
  - 모바일 Break-to-Card 레이아웃 완결성 유지 (가로 스크롤 완전 차단)

### 5. TDD 단위 테스트, 정적 린트 및 번들 컴파일 검증
- **TDD 단위 테스트 (\`tests/admin_api_and_theme.test.ts\`)**:
  - 5대 핵심 테스트 케이스 **100% 통과** (실행 시간: 273ms)
- **정적 린트 (\`lint_applet\`)**: \`tsc --noEmit\` 에러 0건 통과
- **컴파일 번들링 (\`compile_applet\`)**: Vite 프로덕션 빌드 성공

### 6. 학습 문서 발행
- **학습 문서 작성**: \`docs/15.학습/15-23_글로벌_헤더_테마_스위처_및_관리자_실제_API_연동_패턴_해설.md\` 발행 완료

\`\`\`bash
#태스크정리 [0027-01] 상단 글로벌 헤더 테마 스위치 인터페이스 구축 및 관리자 실제 API 연동 1단계
\`\`\``;

  const responseSummary = 'TASK-0027-01 처리완료: 글로벌 헤더 Sun/Moon 테마 스위처 및 PG-ADM-01, PG-ADM-03 실제 REST API 연동 및 TDD 5대 테스트 100% 통과';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0027',
    task_id: 'TASK-0027-01',
    loop_id: null,
    step_index: 3,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: responseSummary,
    prompt_tokens: 1820,
    completion_tokens: 1050,
    total_tokens: 2870,
    created_at: new Date().toISOString()
  };

  // 1. Update local store
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // Update task status
  const task0027_01 = (store.tasks || []).find((t: any) => t.task_id === 'TASK-0027-01') || {
    task_id: 'TASK-0027-01',
    session_id: 'SESSION-0027',
    task_name: '[0027-01] 상단 글로벌 헤더 테마 스위치 인터페이스 구축 및 관리자 실제 API 연동 1단계',
    version: 1
  };
  task0027_01.status_cd = '처리';
  task0027_01.updated_at = new Date().toISOString();

  const otherTasks = (store.tasks || []).filter((t: any) => t.task_id !== 'TASK-0027-01');
  store.tasks = [task0027_01, ...otherTasks];

  const otherTraces = (store.traces || []).filter((t: any) => t.trace_id !== traceId);
  store.traces = [...otherTraces, traceObj];
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 에 ${traceId} 저장 완료`);

  // 2. Insert to DB
  const sqlTrace = `
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

  const sqlTask = `
    UPDATE aiagent.harness_task_meta
    SET status_cd = '처리', updated_at = now()
    WHERE task_id = 'TASK-0027-01';
  `;

  await executeSql(sqlTask);
  const res = await executeSql(sqlTrace);
  console.log('✅ DB aiagent.agent_conversation_trace 저장 결과:', res?.success ? '성공' : res?.error);
}

main().catch(console.error);
