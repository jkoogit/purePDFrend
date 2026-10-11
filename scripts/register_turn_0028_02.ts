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
  const traceId = 'TRACE-0028-01-00-02';
  const promptText = `#태스크시작 [0028-01] 와이어프레임 보완 및 4모드 테마, 첫화면 서비스 권한별 시스템 전환 계획 수립 및 환경 분석`;

  const responseText = `#[0028-02] [0028-01] 와이어프레임 보완 및 4모드 테마, 첫화면 서비스 권한별 시스템 전환 계획 수립 및 환경 분석

### [00] 태스크 분석 및 실행 계획 보고

#### 1. 도메인 분석 및 아키텍처 영향도 평가
- **대상 세션/태스크**: \`SESSION-0028\` / \`TASK-0028-01\`
- **영향 영역**:
  1. **[서비스 영역] 23개 와이어프레임 화면리뷰 보완 및 디자인 시스템 정합성 (\`src/ppdf/views/wireframes/\`, \`src/styles/tokens.ts\`)**:
     - 사용자 9개 뷰 및 관리자 16개 뷰(총 25개)의 8대 Primitive UI(\`Badge\`, \`Button\`, \`Card\`, \`Input\`, \`KeyCap\`, \`Modal\`, \`Textarea\`, \`ToolIcon\`) 적용 상태 전수 점검
     - 하드코딩된 인라인 색상/여백/곡률을 \`tokens.ts\` 디자인 토큰으로 통일 및 Zero-pill 규율 준수
     - 모바일 Break-to-Card 레이아웃 및 44px 터치 가드레일 전수 보정
  2. **[디자인 시스템] 4모드 테마 시스템 아키텍처 구축 (\`src/styles/tokens.ts\`, \`src/shared/components/Navbar.tsx\`)**:
     - 4대 테마 모드 정의: 주간(\`light\`), 야간(\`dark\`), 여명(\`dawn\` - Midnight Blue/Dawn 감성 고대비), 시스템설정(\`system\` - OS \`prefers-color-scheme\` 미디어 쿼리 리스너 연동)
     - \`ThemeContext\` 또는 글로벌 테마 관리 훅/스토어 구성 및 \`localStorage\` 영속화
     - HTML root class/data-theme 속성 및 CSS 변수 체계 바인딩 (\`tokens.ts\` 4모드 색상 팔레트 확장)
     - 상단 헤더(\`Navbar.tsx\`) 테마 전환 UI를 단순 2단계 토글에서 4모드 셀렉터/퀵사이클 버튼으로 고도화
  3. **[어플리케이션 진입점 & 권한 체계] 첫 화면 엔드유저 서비스 기본 표시 및 권한별 시스템 전환 (\`src/App.tsx\`, \`src/shared/components/Navbar.tsx\`)**:
     - 앱 기동 시 기본 뷰를 하네스 거버넌스(마스터 화면)가 아닌 엔드유저 **'PDF 비즈니스 서비스 포털(\`PurePdfServicePortal\`)'**로 즉시 렌더링
     - 상단 글로벌 헤더에 현재 사용자 권한/역할(\`userRole\`: \`ROLE_USER\`, \`ROLE_OPERATOR\`, \`ROLE_ADMIN\` 등)에 따른 **시스템 전환 인터페이스(스위처 버튼)** 구축:
       * **일반 사용자 (\`ROLE_USER\`)**: 'PDF 서비스' 화면 기본 제공 (권한 제한 시 설정/마스터 버튼 비노출 또는 잠금 안내)
       * **서비스 설정 권한 (\`ROLE_OPERATOR\` / 서비스설정자)**: **'서비스설정'** (와이어프레임 스튜디오 & 서비스 환경설정) 원클릭 전환 버튼 노출
       * **마스터/관리자 권한 (\`ROLE_ADMIN\` / \`ROLE_SUPER_ADMIN\` / 개발자)**: **'에이전트관리'** (작업그래프/태스크/토큰쿼터/지식창고 마스터 시스템) 원클릭 전환 버튼 노출
     - 사용자 역할 전환 시뮬레이션(스위처 드롭다운)을 제공하여 개발 및 시연 환경에서 모든 역할별 뷰 전환 즉시 검증 가능하도록 설계
  4. **[품질 보증] TDD 단위 테스트 및 정적 분석 검증**:
     - 4모드 테마 전환, 시스템 자동감지 리스너, 권한별 시스템 전환 인터페이스에 대한 신규 테스트(\`tests/theme_and_system_switcher.test.ts\`) 작성 및 린트/컴파일 검증

#### 2. 구체적 작업 항목 (작업별 번호 항목)
1. **[작업 1 - 디자인 시스템] 4모드 테마 토큰 및 CSS 체계 확장 (\`src/styles/tokens.ts\`)** [서비스/공통]
   - \`light\`, \`dark\`, \`dawn\`, \`system\` 테마 정의 및 색상 팔레트/CSS 변수 매핑 구성
   - \`ThemeMode\` (\`'light' | 'dark' | 'dawn' | 'system'\`) 타입 및 테마 헬퍼 함수 정의
2. **[작업 2 - 프론트엔드] 상단 헤더 4모드 테마 스위처 컴포넌트 고도화 (\`src/shared/components/Navbar.tsx\`)** [서비스/공통]
   - 4모드 전환 인터페이스(아이콘 칩 / 팝오버 셀렉터) 구현
   - OS 시스템 테마 변경 이벤트(\`matchMedia\`) 실시간 리스너 등록
   - 44px 터치 가드레일 및 모바일 반응형 드로어 동기화
3. **[작업 3 - 아키텍처/엔트리] 첫 화면 서비스 포털 기본 표시 및 권한별 시스템 전환 구축 (\`src/App.tsx\`)** [서비스/에이전트]
   - 초기 진입 모드를 엔드유저 \`PurePdfServicePortal\`(PDF 서비스)로 기본 설정
   - 현재 활성 시스템 모드 (\`'service' | 'settings' | 'harness'\`) 및 사용자 권한(\`UserRole\`) 상태 관리
   - 상단 헤더에 권한 기반 시스템 전환 바(스위처 버튼 3종: [📄 PDF 서비스], [⚙️ 서비스설정], [🤖 에이전트관리]) 연동
   - 역할 변경 시뮬레이터(Role Switcher) 제공으로 각 권한별 UI 가시성 및 접근 제어 즉시 검증
4. **[작업 4 - 와이어프레임 보완] 23개(25개) 와이어프레임 화면리뷰 보완 및 토큰 바인딩** [서비스]
   - \`WireframeStudio.tsx\`, \`UserWireframes.tsx\`, \`AdminWireframes.tsx\` 내 미비된 Primitive UI 및 테마 색상 정합성 전수 보완
   - 여명(\`dawn\`) 테마 및 라이트/다크 테마 환경에서의 시각적 대비 및 가독성 점검
5. **[작업 5 - 단위 검증] 종합 단위 테스트 작성 및 무결성 검증** [공통]
   - \`tests/theme_and_system_switcher.test.ts\` 작성
   - \`lint_applet\` 및 \`compile_applet\` 무결성 검증

#### 3. 루프 분석 (Loop Feasibility Analysis)
- **대상**: 25개 와이어프레임 화면 디자인 토큰 전수 점검 및 8대 Primitive UI 매핑 검증
- **문제 목표**: 각 와이어프레임 컴포넌트 내 하드코딩 스타일을 디자인 토큰 및 4모드 테마 클래스로 일괄 정규화
- **입력/출력 변수**:
  - 입력: 각 와이어프레임 뷰 모듈 경로 및 UI 컴포넌트 목록
  - 출력: 디자인 토큰 매핑률 100%, 린트/컴파일 오류 0건
- **평가 기준**: Jest/Vitest 테스트 통과, 정적 린트 및 번들 컴파일 무결성 달성

#### 4. 사전 확인 질문 및 범위 점검
- **범위 확인**:
  - 본 태스크는 4모드 테마 구축, 엔드유저 첫화면 기본 배치, 권한별 3대 시스템(PDF서비스/서비스설정/에이전트관리) 전환 인터페이스 구축, 와이어프레임 전수 보완에 집중합니다.
  - 별도 백로그(예: 클라우드 S3 실제 파일 업로드, 외부 결제 연동 등)는 이번 태스크 범위에서 제외하고 기존 백로그로 유지합니다.

위 계획에 동의하시면 아래 후속 프롬프트를 입력해 주시기 바랍니다. 승인 즉시 **#태스크처리** 단계로 진입하여 안전하게 구현을 전개하겠습니다.

\`\`\`bash
#태스크처리 [0028-01] 와이어프레임 보완 및 4모드 테마, 첫화면 서비스 권한별 시스템 전환 구현
\`\`\``;

  const responseSummary = 'TASK-0028-01 계획수립: 4모드 테마(라이트/다크/여명/시스템), 첫 화면 서비스 포털 기본 표시, 권한별 시스템 전환(서비스/설정/에이전트) 5단계 실행 계획 보고';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0028',
    task_id: 'TASK-0028-01',
    loop_id: null,
    step_index: 2,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: responseSummary,
    prompt_tokens: 1580,
    completion_tokens: 1120,
    total_tokens: 2700,
    created_at: new Date().toISOString()
  };

  // 1. Update local store
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const task0028_01 = {
    task_id: 'TASK-0028-01',
    session_id: 'SESSION-0028',
    task_name: '[0028-01] 와이어프레임 보완 및 4모드 테마, 첫화면 서비스 권한별 시스템 전환 계획 수립 및 환경 분석',
    status_cd: '시작',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      plan_items: [
        '1. 4모드 테마 토큰 및 CSS 체계 확장 (src/styles/tokens.ts)',
        '2. 상단 헤더 4모드 테마 스위처 컴포넌트 고도화 (src/shared/components/Navbar.tsx)',
        '3. 첫 화면 서비스 포털 기본 표시 및 권한별 시스템 전환 구축 (src/App.tsx)',
        '4. 23개(25개) 와이어프레임 화면리뷰 보완 및 토큰 바인딩',
        '5. 종합 단위 테스트 작성 및 무결성 검증'
      ],
      backlogs: []
    },
    created_sys: 'agent-harness',
    created_by: 'jkoogit',
    updated_sys: 'agent-harness',
    updated_by: 'jkoogit',
    version: 1
  };

  const otherTasks = (store.tasks || []).filter((t: any) => t.task_id !== 'TASK-0028-01');
  store.tasks = [task0028_01, ...otherTasks];

  const otherTraces = (store.traces || []).filter((t: any) => t.trace_id !== traceId);
  store.traces = [...otherTraces, traceObj];
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 에 ${traceId} 및 TASK-0028-01 저장 완료`);

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
      ${escapeSql(task0028_01.task_id)}, ${escapeSql(task0028_01.session_id)}, ${escapeSql(task0028_01.task_name)},
      '시작', ${escapeSql(task0028_01.started_at)}, NULL,
      ${escapeSql(JSON.stringify(task0028_01.doc_payload))}::jsonb,
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
