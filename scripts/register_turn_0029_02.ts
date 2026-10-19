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
  const traceId = 'TRACE-0029-01-00-02';
  const promptText = `#태스크시작 [0029-01] top 영역 가운데 와이어프레임에 해당하는 서비스목록 표시 및 tokens.ts 디자인 토큰 전면 대입 계획 수립 및 쉘 구조 설계`;

  const responseText = `#[0029-02] [00] top 영역 가운데 와이어프레임 서비스목록 표시 및 tokens.ts 디자인 토큰 전면 대입 계획 수립 및 쉘 구조 설계 (READ-ONLY)

### 1. 도메인 분석 및 아키텍처 영향도 평가
- **식별된 계층 구조**:
  - \`세션\`: SESSION-0029 (top 영역 가운데 와이어프레임 목록 표시, tokens.ts 디자인 토큰 전면 대입)
  - \`태스크\`: TASK-0029-01 (READ-ONLY 계획 수립 및 아키텍처/쉘 구조 설계)
  - \`루프\`: LOOP-0029-01 (25개 와이어프레임 대상 순회 및 토큰 바인딩 검증 루프 타당성 분석)
- **영향도 평가**:
  1. **상단 글로벌 네비게이션 (\`Navbar.tsx\` & \`WireframeStudio.tsx\`)**:
     - 상단 헤더 중앙(Center) 영역에 현재 3대 시스템 스위처와 함께, '와이어프레임 서비스 목록(25개 화면: 사용자 9개, 관리자 16개)'을 즉시 탐색·점프할 수 있는 드롭다운/퀵 셀렉터 연동 필요.
     - 사용자 모드(\`service\`), 설정 모드(\`settings\`), 하네스 모드(\`harness\`) 간 전환 시에도 일관된 내비게이션 접근성 제공.
  2. **3대 공통 쉘(Shell) 아키텍처 (\`AdminShell\`, \`UserShell\`, \`StudioShell\`)**:
     - 25개 와이어프레임 화면의 개별 레이아웃 파편화(배경색, 패딩, 테두리, 카드 규격 등)를 해소하기 위해 공통 쉘 컴포넌트를 설계 및 구축.
     - 4모드 적응형 \`PdfrendLogo\`, 글로벌 테마 스위처, 권한 스위처, 브레드크럼, 모바일 Break-to-Card 컨테이너를 기본 탑재.
  3. **디자인 토큰 (\`src/styles/tokens.ts\`) 전면 대입**:
     - PG-USR-03(홈 대시보드 & 7대 핵심도구), PG-USR-04(마이페이지 & BBox 인라인 교정), PG-USR-05(문서 라이브러리 & 레이아웃 편집기)를 포함한 전 화면의 하드코딩 색상 및 인라인 스타일을 tokens.ts CSS 변수/유틸리티 클래스로 전환.

---

### 2. 구체적 작업 계획 (작업별 번호 항목)

| 번호 | 작업 항목 | 대상 도메인/서비스 | 작업 성격 |
| :---: | :--- | :--- | :--- |
| **1** | **Top 영역 중앙 와이어프레임 서비스 목록 퀵 점프 내비게이션 설계 및 배치**<br>- 25개 와이어프레임(사용자 9개 + 관리자 16개) 분류별 계층 드롭다운/셀렉트 UI 구현<br>- 선택 시 해당 와이어프레임으로 즉각 포커스 및 탭 전환 연동 | \`src/shared/components/Navbar.tsx\`<br>\`src/ppdf/views/wireframes/WireframeStudio.tsx\` | 서비스 (UI/UX) |
| **2** | **3대 공통 쉘(Shell) 컴포넌트 아키텍처 구축**<br>- \`AdminShell\`: 관리자 16개 화면 공통 헤더/사이드바/본문 래퍼<br>- \`UserShell\`: 사용자 9개 화면 공통 헤더/서브탭/모바일 반응형 래퍼<br>- \`StudioShell\`: 와이어프레임 전체 및 쇼케이스 통합 쉘<br>- 4모드 로고 및 글로벌 테마/권한 스위치 기본 탑재 | \`src/ppdf/views/wireframes/shells/\` 신설<br>- \`AdminShell.tsx\`<br>- \`UserShell.tsx\`<br>- \`StudioShell.tsx\` | 서비스 (아키텍처) |
| **3** | **tokens.ts 디자인 토큰 전면 대입 현황 검토 및 미처리 화면 대입 조치**<br>- PG-USR-03 (홈 대시보드 & 7대 PDF 핵심도구 퀵그리드)<br>- PG-USR-04 (마이페이지/사용자관리 & BBox 캔버스)<br>- PG-USR-05 (문서관리/라이브러리 & 레이아웃 편집기)<br>- 4대 테마(주간/야간/여명/시스템) 실시간 토큰 바인딩 보장 | \`src/ppdf/views/wireframes/UserWireframes.tsx\`<br>\`src/ppdf/views/wireframes/AdminWireframes.tsx\` | 서비스 (디자인시스템) |
| **4** | **회귀 방지 단위 테스트 작성 및 정적 린트/컴파일 검증**<br>- 쉘 컴포넌트 렌더링, 상단 와이어프레임 목록 점프, 테마 바인딩 테스트<br>- \`npm run lint\` 및 \`npm run build\` 무결성 검증 | \`tests/wireframe_shells_and_tokens.test.ts\` | 품질/테스트 (TDD) |

---

### 3. 루프 분석 (Loop Feasibility Analysis)
- **루프 적용 대상**: 25개 와이어프레임 화면의 디자인 토큰 전수 점검 및 미처리 스타일 교체
- **루프 목표**: 사용자 9개 + 관리자 16개 화면의 하드코딩 색상(\`bg-slate-*\`, \`text-slate-*\`, \`border-*\`) 전수 스캔 및 tokens.ts 시맨틱 토큰 매핑
- **조건 및 범위**: 컴포넌트 파손 없이 4개 테마(light, dark, dawn, system)에서 시각적 일관성 확보
- **평가 기준**: 정적 컴파일 오류 0건, 단위 테스트 100% 통과, 뷰포트 390px/768px/100% 정상 렌더링

---

### 4. 사전 확인 질문 및 범위 점검
- 태스크 작업 범위를 벗어난 비정형 요청은 확인되지 않았으며, 명시된 세션 목표(공통 쉘 구축, Top 중앙 와이어프레임 서비스 목록 표시, tokens.ts 미처리 화면 전면 대입)에 100% 부합합니다.
- 위 계획대로 진행을 승인하시겠습니까? 승인 시 아래 후속 실행 프롬프트로 바로 구현에 착수합니다.

\`\`\`bash
#태스크처리 [0029-01] top 영역 가운데 와이어프레임 서비스목록 표시, 3대 공통 쉘 구축 및 tokens.ts 디자인 토큰 전면 대입 구현
\`\`\``;

  const responseSummary = 'TASK-0029-01 READ-ONLY 계획 수립: Top 중앙 와이어프레임 목록 표시, 3대 공통 쉘(AdminShell/UserShell/StudioShell) 아키텍처 설계, tokens.ts 디자인 토큰 전면 대입 계획 보고';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0029',
    task_id: 'TASK-0029-01',
    loop_id: 'LOOP-0029-01',
    step_index: 2,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: responseSummary,
    prompt_tokens: 1250,
    completion_tokens: 950,
    total_tokens: 2200,
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
