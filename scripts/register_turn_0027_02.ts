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
  const traceId = 'TRACE-0027-01-00-02';
  const promptText = `#태스크시작 [0027-01] 상단 글로벌 헤더 테마 스위치 인터페이스 구축 및 관리자 실제 API 연동 1단계 계획수립`;

  const responseText = `#[0027-02] [0027-01] 상단 글로벌 헤더 테마 스위치 인터페이스 구축 및 관리자 실제 API 연동 1단계 계획수립

### [00] 태스크 분석 및 실행 계획 보고

#### 1. 도메인 분석 및 아키텍처 영향도 평가
- **대상 세션/태스크**: \`SESSION-0027\` / \`TASK-0027-01\`
- **영향 영역**:
  1. **프론트엔드 공통 레이아웃 (\`src/shared/components/Navbar.tsx\`, \`src/App.tsx\`)**:
     - Sun/Moon 원클릭 다크/라이트 테마 토글 버튼 탑재 (\`localStorage\` 영속화 및 \`document.documentElement.classList\` 즉시 연동)
     - 헤더 내 와이어프레임(PG-USR 1~7, PG-ADM 1~16) 모달/뷰어 즉시 접근 퀵액션 바인딩
     - 44px 최소 터치 타깃 가드레일 및 모바일 반응형 햄버거 드로어 내 테마 스위처 연동
  2. **백엔드 서버 API (\`server.ts\`)**:
     - **PG-ADM-01 (보안 IP 관리)**: \`/api/admin/security/ips\` GET, POST, DELETE 엔드포인트 구축 (화이트리스트/블랙리스트 CRUD 및 로컬/DB 듀얼 영속화)
     - **PG-ADM-03 (사용자 관리)**: \`/api/admin/users\` GET, POST, PATCH, DELETE 엔드포인트 구축 (\`aiagent.agent_user_account\` 연동 및 오프라인/권한 수정)
  3. **관리자 와이어프레임 뷰 (\`AdminSecurityView.tsx\`, \`AdminUsersView.tsx\`)**:
     - Mock 정적 데이터를 실제 백엔드 API 호출 및 실시간 상태 동기화로 전환
     - 로딩/에러/성공 피드백 및 모바일 Break-to-Card 레이아웃 완결성 확보
  4. **단위 및 회귀 테스트 (\`tests/admin_api_and_theme.test.ts\`)**:
     - 테마 토글 로직, 보안 IP API, 사용자 관리 API, 디자인시스템 적합성 전수 검증

#### 2. 구체적 작업 항목 (작업별 번호 항목)
1. **[작업 1 - 프론트엔드] 상단 글로벌 네비게이션 테마 스위처 인터페이스 구현**:
   - \`Navbar.tsx\` 데스크톱 및 모바일 드로어에 Sun/Moon 다크/라이트 테마 스위치 버튼 추가
   - 시스템 기본 테마 감지(\`prefers-color-scheme\`) 및 사용자 설정 \`localStorage\` 저장/불러오기
   - 와이어프레임 바로가기 퀵액션 버튼 및 도메인 탭 연동
2. **[작업 2 - 백엔드] PG-ADM-01 보안 IP 관리 REST API 구현**:
   - \`server.ts\` 내 \`GET /api/admin/security/ips\`, \`POST /api/admin/security/ips\`, \`DELETE /api/admin/security/ips/:id\` 구축
   - 화이트리스트 CIDR 및 긴급 차단 블랙리스트 데이터 관리
3. **[작업 3 - 백엔드] PG-ADM-03 사용자 계정 관리 REST API 구현**:
   - \`server.ts\` 내 \`GET /api/admin/users\`, \`POST /api/admin/users\`, \`PATCH /api/admin/users/:id\`, \`DELETE /api/admin/users/:id\` 구축
   - \`aiagent.agent_user_account\` 테이블 및 로컬 스토어 연동, 다중 역할(\`ROLE_ADMIN\`, \`ROLE_EDITOR\` 등) 및 오프라인 토큰 잔여일 수정
4. **[작업 4 - 프론트엔드] PG-ADM-01, PG-ADM-03 실제 API 연동 및 상태 바인딩**:
   - \`AdminSecurityView.tsx\`에서 실제 API 호출로 IP 목록 로드, 추가, 삭제 반영
   - \`AdminUsersView.tsx\`에서 실제 API 호출로 사용자 목록 로드, 권한 토글, 상태 변경 반영
   - 모바일 Break-to-Card 뷰에서 44px 터치 가드레일 및 레이아웃 무결성 유지
5. **[작업 5 - 단위 검증] 종합 테스트 작성 및 린트/컴파일 검증**:
   - \`tests/admin_api_and_theme.test.ts\` 작성 및 구동
   - \`compile_applet\` 및 \`lint_applet\` 무결성 확인

#### 3. 사전 확인 및 범위 점검
- **태스크 작업 범위 확인**:
  - 본 태스크는 상단 글로벌 헤더 테마 스위치 및 관리자 시스템서비스 1단계(PG-ADM-01, PG-ADM-03)의 실제 API 연동에 집중합니다.
  - 나머지 시스템서비스(PG-ADM-02 메뉴/권한, PG-ADM-04 로그/감사, 2단계 PG-ADM-05~16)의 실제 DB 연동은 후속 태스크(TASK-0027-02 등)로 순차 배정하여 짧은 호흡의 마이크로 턴으로 완결합니다.
- **루프 분석**:
  - API 엔드포인트 구현 및 프론트엔드 바인딩 과정은 TDD 단위 테스트 루프로 검증 가능합니다.

승인 시 다음 프롬프트로 실제 코드 수정 및 API 구현(#태스크처리)을 전개합니다.

\`\`\`bash
#태스크처리 [0027-01] 상단 글로벌 헤더 테마 스위치 인터페이스 구축 및 관리자 실제 API 연동 1단계
\`\`\``;

  const responseSummary = 'TASK-0027-01 계획수립: 상단 글로벌 헤더 Sun/Moon 테마 스위치 및 PG-ADM-01, PG-ADM-03 실제 백엔드 API 연동 5단계 작업 계획 수립';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0027',
    task_id: 'TASK-0027-01',
    loop_id: null,
    step_index: 2,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: responseSummary,
    prompt_tokens: 1540,
    completion_tokens: 920,
    total_tokens: 2460,
    created_at: new Date().toISOString()
  };

  // 1. Update local store
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // Ensure task is recorded in tasks
  const task0027_01 = {
    task_id: 'TASK-0027-01',
    session_id: 'SESSION-0027',
    task_name: '[0027-01] 상단 글로벌 헤더 테마 스위치 인터페이스 구축 및 관리자 실제 API 연동 1단계',
    status_cd: '시작',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      plan_items: [
        '1. 상단 글로벌 네비게이션 테마 스위처 인터페이스 구현',
        '2. PG-ADM-01 보안 IP 관리 REST API 구현',
        '3. PG-ADM-03 사용자 계정 관리 REST API 구현',
        '4. PG-ADM-01, PG-ADM-03 실제 API 연동 및 상태 바인딩',
        '5. 종합 테스트 작성 및 린트/컴파일 검증'
      ],
      backlogs: []
    },
    created_sys: 'agent-harness',
    created_by: 'jkoogit',
    updated_sys: 'agent-harness',
    updated_by: 'jkoogit',
    version: 1
  };

  const otherTasks = (store.tasks || []).filter((t: any) => t.task_id !== 'TASK-0027-01');
  store.tasks = [task0027_01, ...otherTasks];

  const otherTraces = (store.traces || []).filter((t: any) => t.trace_id !== traceId);
  store.traces = [...otherTraces, traceObj];
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 에 ${traceId} 및 TASK-0027-01 저장 완료`);

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
    INSERT INTO aiagent.harness_task_meta (
      task_id, session_id, task_name, status_cd, started_at, ended_at,
      doc_payload, created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      ${escapeSql(task0027_01.task_id)}, ${escapeSql(task0027_01.session_id)}, ${escapeSql(task0027_01.task_name)},
      '시작', ${escapeSql(task0027_01.started_at)}, NULL,
      ${escapeSql(JSON.stringify(task0027_01.doc_payload))}::jsonb,
      'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 1
    ) ON CONFLICT (task_id) DO UPDATE SET
      task_name = EXCLUDED.task_name,
      status_cd = EXCLUDED.status_cd,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now();
  `;

  await executeSql(sqlTask);
  const res = await executeSql(sqlTrace);
  console.log('✅ DB aiagent.agent_conversation_trace 저장 결과:', res?.success ? '성공' : res?.error);
}

main().catch(console.error);
