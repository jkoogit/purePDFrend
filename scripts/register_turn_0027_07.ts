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
  const traceId = 'TRACE-0027-02-00-01';
  const taskId = 'TASK-0027-02';
  const sessionId = 'SESSION-0027';

  const promptText = `#태스크시작 [0027-02] 통합 디자인 토큰 tokens.ts 추출 및 와이어프레임 디자인시스템 쇼케이스 구축`;

  const responseText = `#[0027-07] [0027-02] 통합 디자인 토큰 tokens.ts 추출 및 와이어프레임 디자인시스템 쇼케이스 구축 - 계획수립 보고

### [00] 태스크 분석 및 실행 계획 보고

#### 1. 도메인 분석 및 아키텍처 영향도 평가
- **대상 세션/태스크**: \`SESSION-0027\` / \`TASK-0027-02\`
- **영향 영역**:
  1. **디자인 시스템 토큰 계층 (\`src/styles/tokens.ts\`)**:
     - 브랜드(Brand), 슬레이트 그레이(Slate Gray), 상태(Semantic) 3단계 색상 팔레트 상수 정의
     - 타이포그래피(Display, Body, Tabular Mono) 및 4pt 그리드(간격, 라운딩, 그림자) 단일 진실 공급원(SSOT) 구축
     - 44px 모바일 최소 터치 타깃 가드레일 상수화
  2. **와이어프레임 스튜디오 내 쇼케이스 탭 (\`WireframeStudio.tsx\`, \`DesignSystemShowcase.tsx\`)**:
     - 와이어프레임 스튜디오 상단 도메인 바에 \`[🎨 디자인시스템 쇼케이스]\` 탭 신설
     - 실시간 다크/라이트 테마와 연동되어 토큰 팔레트와 8대 Primitive UI(\`Button\`, \`Input\`, \`Textarea\`, \`Card\`, \`Badge\`, \`Modal\`, \`KeyCap\`, \`ToolIcon\`) 실물을 직접 조작·검증할 수 있는 인터랙티브 갤러리 뷰 구축
  3. **원자 컴포넌트 풀 정비 (\`src/shared/components/ui/\`)**:
     - 8종 컴포넌트가 \`tokens.ts\`의 엄격한 스타일 토큰을 공유하도록 인터페이스 정비
  4. **TDD 단위 검증 (\`tests/tokens_and_showcase.test.ts\`)**:
     - 토큰 상수 무결성, 44px 터치타깃 기준 만족, 쇼케이스 렌더링 무결성 정적/단위 테스트

#### 2. 구체적 작업 항목 (작업별 번호 항목)
1. **[작업 1 - 설계/문서] 설계 문서 선반영**:
   - \`docs/05.설계/05-28_통합_디자인_토큰_및_컴포넌트_쇼케이스_상세설계서.md\` 작성
2. **[작업 2 - 프론트엔드] 단일 진실 공급원 \`src/styles/tokens.ts\` 신설**:
   - Brand, Slate Gray, Semantic 3단계 색상, 3스케일 타이포, 4pt 메트릭스 및 터치 가드레일 정의
3. **[작업 3 - 프론트엔드] 인터랙티브 \`DesignSystemShowcase.tsx\` 구현**:
   - 색상 팔레트 swatch 카드, 타이포그래피 스케일 미리보기, 44px 터치 타깃 검증기
   - 8종 원자 컴포넌트(버튼 6종, 인풋, 배지, 모달 팝업, 키캡, 툴아이콘) 라이브 인터랙션 데모
4. **[작업 4 - 프론트엔드] \`WireframeStudio.tsx\` 쇼케이스 탭 통합**:
   - \`[📱 사용자 (9)]\`, \`[🛠 관리자 (16)]\`, \`[🎨 디자인시스템 쇼케이스]\` 3단 스위처 완성
5. **[작업 5 - 단위 검증] TDD 단위 테스트 작성 및 정적 린트/컴파일 검증**:
   - \`tests/tokens_and_showcase.test.ts\` 작성 및 \`compile_applet\`, \`lint_applet\` 무결성 확인

#### 3. 사전 확인 및 작업 범위(Scope) 점검
- **태스크 작업 대상**:
  - 본 태스크는 **Phase 1(토큰 추출) 및 쇼케이스 탭 신설**에 집중하여 사용자가 디자인시스템 실물을 즉시 눈으로 확인할 수 있도록 구현합니다.
- **범위 제외 항목 (후속 태스크 및 백로그 연계)**:
  - 14개 관리자 및 9개 사용자 와이어프레임의 내부 레이아웃을 \`AdminShell\`/\`UserShell\`로 전면 교체하는 작업(Phase 2)은 본 태스크 완료 후 후속 태스크(\`TASK-0027-03\`)로 진행합니다.
  - PDF 뷰어/BBox 실제 서비스 바인딩(Phase 3)은 차기 세션(\`SESSION-0028\`)으로 이관합니다.
  - *"태스크 작업 범위를 벗어난 23개 화면 전면 쉘 교체는 본 태스크 완료 후 다음 태스크로 진행할까요?"* (승인 시 본 계획대로 진행)

#### 4. 루프 분석 (Loop Analysis)
- **타당성 검토**: 8종 Primitive UI의 토큰 바인딩 및 쇼케이스 렌더링은 단위 기능별 루프로 처리 가능.
- **목표 및 데이터 분석**: \`tokens.ts\`의 토큰 객체를 각 컴포넌트의 Tailwind 클래스로 매핑.
- **평가 기준**: WCAG 44px 터치 충족, TypeScript 타입 0 에러, Vite 빌드 성공.

승인 시 다음 프롬프트로 실제 코드 구현(#태스크처리)을 전개합니다.

\`\`\`bash
#태스크처리 [0027-02] 통합 디자인 토큰 tokens.ts 추출 및 와이어프레임 디자인시스템 쇼케이스 구축
\`\`\``;

  const summary = 'TASK-0027-02 계획수립: src/styles/tokens.ts 신설, WireframeStudio 디자인시스템 쇼케이스 탭 신설, 8종 컴포넌트 갤러리 구현 계획 보고';

  // 1. Update local_agent_store.json with task and turn trace
  const storePath = 'data/local_agent_store.json';
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

    // Register TASK-0027-02
    store.tasks = store.tasks || [];
    const existingTaskIdx = store.tasks.findIndex((t: any) => t.task_id === taskId);
    const taskData = {
      task_id: taskId,
      session_id: sessionId,
      task_name: '[0027-02] 통합 디자인 토큰 tokens.ts 추출 및 와이어프레임 디자인시스템 쇼케이스 구축',
      status_cd: '진행중',
      priority: 'HIGH',
      assigned_agent: 'gemini',
      git_branch: 'task/0027_01_글로벌헤더_테마스위치_관리자API_jkoogit',
      started_at: new Date().toISOString(),
      ended_at: null,
      doc_payload: {
        plan_items: [
          '1. 설계 문서 선반영 (05-28_통합_디자인_토큰_및_컴포넌트_쇼케이스_상세설계서.md)',
          '2. src/styles/tokens.ts 신설 (Brand, Slate Gray, Semantic 3단계 색상 및 4pt 그리드/44px 터치)',
          '3. DesignSystemShowcase.tsx 인터랙티브 쇼케이스 구현',
          '4. WireframeStudio.tsx 상단 탭에 쇼케이스 탭 신설',
          '5. 단위 테스트 및 정적 린트/컴파일 검증'
        ],
        backlogs: [
          'BACKLOG-0027-01: 23개 와이어프레임 화면 AdminShell / UserShell 전면 교체 (Phase 2)',
          'BACKLOG-0027-02: PDF MVP 핵심 서비스 화면 바인딩 (Phase 3)'
        ]
      },
      created_sys: 'agent-harness',
      created_by: 'jkoogit',
      updated_sys: 'agent-harness',
      updated_by: 'jkoogit',
      version: 1,
      status: 'PROCESSING'
    };

    if (existingTaskIdx >= 0) {
      store.tasks[existingTaskIdx] = { ...store.tasks[existingTaskIdx], ...taskData };
    } else {
      store.tasks.unshift(taskData);
    }

    // Register Turn Trace
    const newTrace = {
      trace_id: traceId,
      session_id: sessionId,
      task_id: taskId,
      loop_id: null,
      step_index: 7,
      agent_name: 'gemini',
      model_name: 'models/gemini-3.8-flash',
      operator_account: 'jkoogit',
      agent_account: 'jkoogit@gmail.com',
      user_email: 'jkoogit@gmail.com',
      user_prompt: promptText,
      agent_response: responseText,
      response_summary: summary,
      prompt_tokens: 1820,
      completion_tokens: 1150,
      total_tokens: 2970,
      created_at: new Date().toISOString(),
    };
    store.turns = store.turns || [];
    store.turns.push(newTrace);

    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('✅ Local store updated with task & trace:', taskId, traceId);
  }

  // 2. Insert into remote DB (task and trace)
  try {
    const taskSql = `
      INSERT INTO aiagent.harness_task_meta (
        task_id, session_id, task_name, status_cd, priority, assigned_agent,
        git_branch, started_at, doc_payload, version, created_sys, created_by, updated_sys, updated_by
      ) VALUES (
        ${escapeSql(taskId)}, ${escapeSql(sessionId)},
        '[0027-02] 통합 디자인 토큰 tokens.ts 추출 및 와이어프레임 디자인시스템 쇼케이스 구축',
        '진행중', 'HIGH', 'gemini',
        'task/0027_01_글로벌헤더_테마스위치_관리자API_jkoogit',
        NOW(),
        '{"plan_items": ["1. 설계 문서 선반영", "2. tokens.ts 신설", "3. DesignSystemShowcase.tsx 구현", "4. WireframeStudio 쇼케이스 탭 통합", "5. 단위 검증"]}',
        1, 'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit'
      )
      ON CONFLICT (task_id) DO UPDATE SET
        status_cd = EXCLUDED.status_cd,
        task_name = EXCLUDED.task_name,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = NOW();
    `;
    await executeSql(taskSql);
    console.log('✅ Remote DB task upserted:', taskId);

    const traceSql = `
      INSERT INTO aiagent.agent_conversation_trace (
        trace_id, session_id, task_id, loop_id, step_index,
        agent_name, model_name, operator_account, agent_account, user_email,
        user_prompt, agent_response, response_summary,
        prompt_tokens, completion_tokens, total_tokens, created_at
      ) VALUES (
        ${escapeSql(traceId)}, ${escapeSql(sessionId)}, ${escapeSql(taskId)}, NULL, 7,
        'gemini', 'models/gemini-3.8-flash', 'jkoogit', 'jkoogit@gmail.com', 'jkoogit@gmail.com',
        ${escapeSql(promptText)}, ${escapeSql(responseText)}, ${escapeSql(summary)},
        1820, 1150, 2970, NOW()
      )
      ON CONFLICT (trace_id) DO UPDATE SET
        agent_response = EXCLUDED.agent_response,
        response_summary = EXCLUDED.response_summary;
    `;
    await executeSql(traceSql);
    console.log('✅ Remote DB trace upserted:', traceId);
  } catch (err: any) {
    console.error('⚠️ Remote DB warning (fallback to local):', err.message);
  }
}

main().catch(console.error);
