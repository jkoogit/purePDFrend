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
  const traceId = 'TRACE-0026-02-01-02';
  const promptText = `#태스크시작 [0026-01] 통합 디자인시스템 정책 수립 및 기준 컴포넌트 풀 아키텍처 분석`;

  const responseText = `#[0026-02] [01] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성 - 분석_및_계획

### 1. 도메인 분석 및 아키텍처 영향도 평가

1. **통합 디자인시스템 (moabogo 패턴 벤치마킹) 도메인 분석**:
   - **Color Palette**:
     - Canvas/Background: Neutral Slate (\`slate-950\`, \`slate-900\`, \`slate-800\`) 기반 다크 캔버스와 밝은 테마 지원 토큰
     - Primary/Brand: \`blue-600\` ~ \`indigo-600\` (강조 및 활성 탭, 주요 CTA)
     - Semantic Status: Success (\`emerald-500\`), Warning (\`amber-500\`), Danger (\`rose-500\`), Info (\`sky-500\`)
   - **Typography Scale**:
     - Display/Hero (20px~32px), Heading (16px~18px), Body (13px~15px), Caption/Metadata (11px~12px)
     - 숫자 및 테이블 데이터는 고정폭 숫자(\`tabular-nums\`) 표준 적용
   - **Spacing & 44px 터치타깃**:
     - 모바일 WCAG 및 애플/구글 터치 가이드라인 준수를 위해 모든 인터랙티브 컨트롤(버튼, 인풋, 선택기)은 모바일 환경에서 최소 높이 \`44px\`(또는 \`py-2.5 px-4\`, \`min-h-[44px]\`) 터치 영역 보장
   - **Z-Index Scale 계층화**:
     - Base Canvas (\`z-0\`), Surface/Card (\`z-10\`), Sticky Bar/Sub-toolbar (\`z-20\`), Header/Nav (\`z-30\`), Overlay/Dropdown (\`z-40\`), Modal/Dialog (\`z-50\`), Toast/Alert (\`z-60\`)
   - **4대 특이케이스 명문화**:
     - ① **밀도 이원화 (Density Dualism)**: 일반 관리자/설정 폼(\`standard\`, 44px 터치 중심)과 PDF 뷰어/작업 도구상자(\`compact\`, 초슬림 28~32px 집약형)의 시각적 밀도 분리
     - ② **캔버스 오버레이 계층**: 캔버스 위 드로잉/선택 영역/플로팅 툴바 간 z-index 충돌 방지
     - ③ **모바일 Table-to-Card 변환**: 가로스크롤 원천 차단(\`0px\` 오버플로 가드레일) 및 \`block md:table\` 반응형 카드 전환
     - ④ **복합키 Keycap 및 규격화 ToolIcon**: Ctrl+Shift 복합 기능키 키캡 컴포넌트와 14/16/20px 일관 규격 도구아이콘 분리

2. **기준 컴포넌트 풀 (src/shared/components/ui/) 아키텍처**:
   - 원자/분자 단위의 독립적이고 재사용 가능한 컴포넌트 풀 구축:
     - \`Button\`: variant (\`primary\`, \`secondary\`, \`outline\`, \`ghost\`, \`danger\`), size (\`sm\`, \`md\`, \`lg\`), 모바일 44px 터치타깃 자동 지원
     - \`Input\` & \`Textarea\`: 일관된 포커스 링, 에러 상태, 44px 터치타깃, 자동 리사이즈 지원
     - \`Card\`: 표준 elevation, hairline border, Header/Content/Footer 서브컴포넌트
     - \`Badge\`: Semantic 색상 매핑 및 subtle 텍스트 스타일
     - \`Modal\`: ESC 키 닫기, 백드롭 클릭, 포커스 트랩, z-50 표준 모달 래퍼
     - \`KeyCap\`: 단축키(Ctrl, Shift, Alt, ⌘ 등) 가독성 높은 키캡 배지
     - \`ToolIcon\`: 규격화된 아이콘 래퍼 및 툴팁/액션 지원
   - **기존 코드 영향도**: 컴포넌트 라이브러리 추가 방식으로 기존 뷰어/PDF 로직과 100% 비침습적(Non-invasive) 결합 보장

3. **점진적 교체 1단계 대상 도메인 (PG-ADM-01 ~ PG-ADM-04)**:
   - PG-ADM-01 (보안관리): IP 화이트/블랙리스트 입력폼 및 배지, 2FA 토글 버튼을 신규 컴포넌트로 전환
   - PG-ADM-02 (프로그램관리): DAG 트리 제어 버튼, 프로그램 등록 모달을 신규 Button/Modal/Input으로 교체
   - PG-ADM-03 (사용자관리): 회원 상태 배지, 스토리지 카드, 사용자 필터를 신규 Card/Badge/Input으로 교체
   - PG-ADM-04 (약관관리): 8대 약관 에디터, 버전 배지, 텍스트 입력창을 신규 Textarea/Card/Badge로 교체

---

### 2. 세션 / 태스크 / 루프 식별

- **세션 ID**: \`SESSION-0026\`
- **태스크 ID**: \`TASK-0026-01\`
- **태스크명**: \`통합 디자인시스템 기준요소 정의 및 단계적 화면 재구성\`
- **작업 브랜치**: \`task/0026_01_통합디자인시스템_jkoogit\` (기준 SHA: \`c536e6005f2c7076b8abfda4d5cbac8f95a18153\`)
- **루프 식별 및 분석**:
  - 목표: 정책 수립 ➔ 컴포넌트 풀 독립 개발 ➔ PG-ADM-01~04 1단계 교체 ➔ 단위 테스트 및 컴파일 검증
  - 본 태스크는 순차적이고 체계적인 아키텍처 작업으로, 무한 피드백 루프가 불필요하며 사전 정의된 계획에 따른 단일 마이크로 턴(#태스크처리)으로 완결하는 것이 최적임.

---

### 3. 구체적인 작업 계획 (작업별 번호 항목)

1. **[작업 1 - 서비스/정책] moabogo 패턴 벤치마킹 통합 디자인 정책 문서 수립**
   - 대상: \`docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md\`
   - 내용: 색상 팔레트, 타이포그래피, 간격/44px 터치타깃, Z-Index 스케일 및 4대 특이케이스(밀도 이원화, 캔버스 오버레이, Table-to-Card, 복합키 Keycap/ToolIcon) 명문화
2. **[작업 2 - 서비스/컴포넌트] src/shared/components/ui/ 기준 컴포넌트 풀 독립 개발**
   - 대상: \`src/shared/components/ui/\`
   - 컴포넌트: \`Button.tsx\`, \`Input.tsx\`, \`Textarea.tsx\`, \`Card.tsx\`, \`Badge.tsx\`, \`Modal.tsx\`, \`KeyCap.tsx\`, \`ToolIcon.tsx\` 및 \`index.ts\`
3. **[작업 3 - 서비스/적용] 시스템서비스 PG-ADM-01 ~ PG-ADM-04 1단계 점진적 대입**
   - 대상: \`src/ppdf/views/wireframes/admin/AdminSecurityView.tsx\`, \`AdminProgramsView.tsx\`, \`AdminUsersView.tsx\`, \`AdminTermsView.tsx\`
   - 내용: 신규 기준 컴포넌트 적용 및 모바일 0px 가로스크롤 가드레일 크로스체크
4. **[작업 4 - 테스트] 기준 컴포넌트 풀 단위 검증 테스트 작성**
   - 대상: \`tests/design_system_ui.test.ts\`
   - 내용: Button 터치타깃 및 variant, Input 포커스/에러, KeyCap 복합키 조합, Badge semantic 매핑 등 단위 테스트 100% 검증
5. **[작업 5 - 검증] 린트(lint_applet) 및 컴파일(compile_applet) 정적 무결성 검증**
   - 전체 코드베이스 빌드 및 린트 오류 0건 확인

---

### 4. 사전 확인 질문 및 피드백 대기

> **사전 확인 안내**:  
> 위 1~5번 계획 중 이번 \`TASK-0026-01\` 작업 범위를 벗어나 백로그로 분기하거나 제외할 작업 항목이 있으신가요?  
> *"태스크 작업 범위를 벗어난 요청이 확인됩니다. 함께 진행할까요? 백로그로 등록하고 이번 태스크에서 제외할 작업 번호를 입력해주세요. 제외하고 태스크 작업을 진행합니다."*  
> 별도 제외 항목이 없으시다면, 아래 승인 프롬프트를 통해 즉시 실제 구현(#태스크처리)을 전개하겠습니다.

---

### 5. 후속 실행 프롬프트 안내

\`\`\`text
#태스크처리 [0026_01] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성
\`\`\``;

  const responseSummary = 'TASK-0026-01 태스크시작: 통합 디자인시스템 정책 수립, 기준 컴포넌트 풀 8종 구축, PG-ADM-01~04 1단계 대입 계획 수립 및 READ-ONLY 대기';

  const taskObj = {
    task_id: 'TASK-0026-01',
    session_id: 'SESSION-0026',
    task_name: '통합 디자인시스템 기준요소 정의 및 단계적 화면 재구성',
    status_cd: '진행중',
    priority: 'HIGH',
    assigned_agent: 'gemini',
    git_branch: 'task/0026_01_통합디자인시스템_jkoogit',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      objective: '통합 디자인시스템 정책 수립(정책 03-23), src/shared/components/ui/ 기준 컴포넌트 풀 구축, PG-ADM-01~04 점진적 1단계 대입 및 단위 테스트 검증',
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com',
      agent_account: 'jkoogit@gmail.com'
    },
    created_sys: 'agent-harness',
    created_by: 'jkoogit',
    updated_sys: 'agent-harness',
    updated_by: 'jkoogit',
    version: 1
  };

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0026',
    task_id: 'TASK-0026-01',
    loop_id: null,
    step_index: 2,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    agent_account: 'jkoogit@gmail.com',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: responseSummary,
    prompt_tokens: 1720,
    completion_tokens: 1180,
    total_tokens: 2900,
    created_at: new Date().toISOString()
  };

  // 1. Update local store
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const otherTasks = (store.tasks || []).filter((t: any) => t.task_id !== taskObj.task_id);
  store.tasks = [taskObj, ...otherTasks];

  const otherTraces = (store.traces || []).filter((t: any) => t.trace_id !== traceId);
  store.traces = [...otherTraces, traceObj];

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 에 TASK-0026-01 및 ${traceId} 저장 완료`);

  // 2. Insert into remote DB harness_task_meta
  const taskSql = `
    INSERT INTO aiagent.harness_task_meta (
      task_id, session_id, task_name, status_cd, git_branch,
      started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      ${escapeSql(taskObj.task_id)}, ${escapeSql(taskObj.session_id)}, ${escapeSql(taskObj.task_name)}, ${escapeSql(taskObj.status_cd)}, ${escapeSql(taskObj.git_branch)},
      ${escapeSql(taskObj.started_at)}, ${escapeSql(taskObj.ended_at)}, ${escapeSql(JSON.stringify(taskObj.doc_payload))}::jsonb,
      'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 1
    ) ON CONFLICT (task_id) DO UPDATE SET
      task_name = EXCLUDED.task_name,
      status_cd = EXCLUDED.status_cd,
      git_branch = EXCLUDED.git_branch,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now();
  `;
  const taskRes = await executeSql(taskSql);
  console.log('✅ DB aiagent.harness_task_meta 등록 결과:', taskRes?.success ? '성공' : taskRes?.error);

  // 3. Insert into remote DB agent_conversation_trace
  const traceSql = `
    INSERT INTO aiagent.agent_conversation_trace (
      trace_id, session_id, task_id, loop_id, step_index,
      agent_name, model_name, operator_account, agent_account, user_email,
      user_prompt, agent_response, response_summary,
      prompt_tokens, completion_tokens, total_tokens,
      created_sys, created_at, created_by, updated_sys, updated_at, updated_by, version
    ) VALUES (
      ${escapeSql(traceObj.trace_id)}, ${escapeSql(traceObj.session_id)}, ${escapeSql(traceObj.task_id)}, ${escapeSql(traceObj.loop_id)}, ${traceObj.step_index},
      ${escapeSql(traceObj.agent_name)}, ${escapeSql(traceObj.model_name)}, ${escapeSql(traceObj.operator_account)}, ${escapeSql(traceObj.agent_account)}, ${escapeSql(traceObj.user_email)},
      ${escapeSql(traceObj.user_prompt)}, ${escapeSql(traceObj.agent_response)}, ${escapeSql(traceObj.response_summary)},
      ${traceObj.prompt_tokens}, ${traceObj.completion_tokens}, ${traceObj.total_tokens},
      'agent-harness', ${escapeSql(traceObj.created_at)}, 'jkoogit', 'agent-harness', now(), 'jkoogit', 1
    ) ON CONFLICT (trace_id) DO UPDATE SET
      user_prompt = EXCLUDED.user_prompt,
      agent_response = EXCLUDED.agent_response,
      response_summary = EXCLUDED.response_summary,
      operator_account = EXCLUDED.operator_account,
      agent_account = EXCLUDED.agent_account,
      user_email = EXCLUDED.user_email,
      total_tokens = EXCLUDED.total_tokens,
      updated_at = now();
  `;
  const traceRes = await executeSql(traceSql);
  console.log('✅ DB aiagent.agent_conversation_trace 저장 결과:', traceRes?.success ? '성공' : traceRes?.error);
}

main().catch(console.error);
