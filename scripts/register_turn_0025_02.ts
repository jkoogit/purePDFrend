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
  const traceId = 'TRACE-0025-02-01-02';
  const promptText = `#태스크시작 [0025-01] 시스템서비스_와이어프레임_1단계_보안_프로그램_사용자_약관관리_분석_및_설계`;

  const responseText = `#[0025-02] [01] 시스템서비스_와이어프레임_1단계_보안_프로그램_사용자_약관관리_분석_및_계획

### 1. 도메인 분석 및 아키텍처 영향도 평가

1. **대상 도메인 심층 분석 (PG-ADM-01 ~ PG-ADM-04)**:
   - **PG-ADM-01 (보안관리)**:
     - IP 접근제어: 허용 IP(화이트리스트) 및 차단 IP(블랙리스트) CIDR 목록 동적 관리, 국가별 해외 IP 접근 차단(Geo-Blocking) 토글
     - 2FA 강제화 정책: 전사 관리자 및 일반 사용자 대상 소셜 OTP / 이메일 2FA 필수 강제 적용 정책 스위치
     - 세션 및 토큰 수명주기: 관리자 유휴 세션 만료 시간(15분/30분/60분/120분), 오프라인 리프레시 토큰 유효기간(\`OFFLINE_REFRESH_TOKEN_DAYS\`, 기본 30일, 1~180일) 슬라이더 연동
   - **PG-ADM-02 (프로그램관리)**:
     - 3대 도메인(사용자 9개, 관리자 16개, 에이전트 4개) 29개 화면 프로그램 계층 부모-자식 트리 뷰어
     - **DAG(Directed Acyclic Graph) 순환참조 방지 시각화**: 자기 자신 또는 자식 노드를 부모로 지정하는 순환 종속성을 실시간 감지하여 차단하는 가드레일 시각화
     - 신규 프로그램 등록/수정 모달 UI: 프로그램 ID, 프로그램명, 라우트 경로, 권한 요건(\`ROLE_ADMIN\`, \`ROLE_USER\`), 부모 프로그램 선택
   - **PG-ADM-03 (사용자관리)**:
     - 회원 상태 라이프사이클: 정상(Active), 정지(Suspended), 휴면(Dormant), 탈퇴대기(Pending) 상태 필터 및 일괄/개별 전환
     - 오프라인 사용 권한 제어: 사용자별 오프라인 작업 허용 여부 토글, 디바이스 인증 토큰 만료일 표시
     - 멀티 스토리지 연동 현황: Local NAS(Synology, QNAP), FTP/SFTP, Google Drive, WebDAV 연결 상태 가시화
     - **개인정보 불변원칙 UI/UX 가드레일**: 관리자라 하더라도 사용자 개인정보(비밀번호 평문, 주민등록번호, 연락처, 프로필 사진)를 임의 위변조할 수 없도록 마스킹 처리 및 비밀번호는 '초기화 링크 발송'으로만 제어하는 헌장 준수 안내
   - **PG-ADM-04 (약관·동의·정책)**:
     - 웹문서 기반 8대 표준 약관: 이용약관, 개인정보 수집·이용, 마케팅 수신동의, 저작권 안내, 면책조항, 쿠키 정책, 청소년 보호정책, 오프라인 동기화 정책
     - 문서그룹ID(\`DOC_GRP_01\` ~ \`08\`) 기반 버전 배포: 실시간 마크다운/HTML 웹문서 에디터, 개정 번호(v1.0, v1.1...), 효력 발생일자 지정, 신규 개정판 발행 인터랙션
     - 사용자별 동의 이력 원장(Audit Ledger): 사용자ID, 동의한 약관 버전, 동의 일시, IP, 철회 여부 추적 목록 뷰어
2. **모바일 반응형 가드레일 (정책 03-14)**:
   - 375px~768px 모바일 뷰에서 0px 가로스크롤 원천 방지 및 테이블의 카드형 뷰(\`block md:table\`) 완벽 전환
3. **아키텍처 영향도**:
   - \`src/ppdf/views/wireframes/AdminWireframes.tsx\` UI/UX 고도화
   - \`docs/05.설계/\` 및 \`docs/03.정책/\` 기준 정합성 100% 준수

---

### 2. 세션 / 태스크 / 루프 식별

- **세션 ID**: \`SESSION-0025\`
- **태스크 ID**: \`TASK-0025-01\`
- **태스크명**: \`시스템서비스 와이어프레임 1단계 (PG-ADM-01~04) 고도화 및 DAG 트리 시각화\`
- **작업 브랜치**: \`task/0025_01_시스템서비스_PG_ADM_Gemini\` (기준 SHA: \`f1958772d42e906fd5ecd9edbe87fe37e80223c3\`)
- **루프 식별 및 분석**:
  - 목표: PG-ADM-01~04 4대 관리자 화면 와이어프레임 및 DAG 트리 시각화
  - 본 업무는 정형화된 컴포넌트 4종 및 반응형 인터랙션 고도화 작업으로, 무한 반복 탐색이나 모델 학습 루프가 불필요하므로 단일 마이크로 턴 단위(#태스크처리)로 처리하는 것이 가장 안전하고 적절함.

---

### 3. 구체적인 작업 계획 (작업별 번호 항목)

1. **[작업 1 - 서비스] PG-ADM-01 보안관리 화면 고도화**
   - 대상: \`src/ppdf/views/wireframes/AdminWireframes.tsx\`
   - IP 접근제어(화이트리스트/블랙리스트 CIDR 목록), 2FA 강제화 토글, 유휴 세션 만료 시간, 오프라인 토큰 기간 슬라이더 및 시스템 속성 연동
2. **[작업 2 - 서비스] PG-ADM-02 프로그램관리 화면 고도화**
   - 대상: \`src/ppdf/views/wireframes/AdminWireframes.tsx\`
   - 3대 도메인 29개 프로그램 계층 부모-자식 트리 뷰어, DAG 순환참조 방지 실시간 검증 및 시각화, 신규 프로그램 등록/수정 모달 UI
3. **[작업 3 - 서비스] PG-ADM-03 사용자관리 화면 고도화**
   - 대상: \`src/ppdf/views/wireframes/AdminWireframes.tsx\`
   - 회원 상태(정상/정지/휴면/대기) 필터 및 액션, 오프라인 사용 허용 토글, 멀티 스토리지(NAS/FTP/Drive) 연동 현황, 개인정보 불변원칙 배너 및 모바일 반응형 카드 전환
4. **[작업 4 - 서비스] PG-ADM-04 약관·동의·정책 화면 고도화**
   - 대상: \`src/ppdf/views/wireframes/AdminWireframes.tsx\`
   - 8대 표준 약관 카드 및 웹 에디터, 버전 발행(v1.0~v2.4), 효력발생일 지정, 사용자 동의 이력 감사 원장 테이블/카드 뷰
5. **[작업 5 - 검증] 반응형 0px 가로스크롤 및 컴파일 정적 무결성 검증**
   - 대상: 전체 프로젝트 정적 빌드(\`compile_applet\`) 및 모바일 가로스크롤 0px 가드레일 준수 확인

---

### 4. 사전 확인 질문 및 피드백 대기

> **사전 확인 안내**:  
> 위 1~5번 계획 중 이번 \`TASK-0025-01\` 작업 범위를 벗어나 백로그로 분기하거나 제외할 작업 항목이 있으신가요?  
> *"태스크 작업 범위를 벗어난 요청이 확인됩니다. 함께 진행할까요? 백로그로 등록하고 이번 태스크에서 제외할 작업 번호를 입력해주세요. 제외하고 태스크 작업을 진행합니다."*  
> 별도 제외 항목이 없으시다면, 아래 승인 프롬프트를 통해 즉시 실제 구현(#태스크처리)을 전개하겠습니다.

---

### 5. 후속 실행 프롬프트 안내

\`\`\`text
#태스크처리 [0025_01] 시스템서비스_와이어프레임_1단계_보안_프로그램_사용자_약관관리_고도화
\`\`\``;

  const responseSummary = 'TASK-0025-01 태스크시작: PG-ADM-01~04 4대 관리자 화면 분석 및 작업계획 수립, DAG 순환검증 트리 설계, READ-ONLY 대기';

  const taskObj = {
    task_id: 'TASK-0025-01',
    session_id: 'SESSION-0025',
    task_name: '시스템서비스 와이어프레임 1단계 (PG-ADM-01~04) 고도화 및 DAG 트리 시각화',
    status_cd: '진행중',
    priority: 'HIGH',
    assigned_agent: 'gemini',
    git_branch: 'task/0025_01_시스템서비스_PG_ADM_Gemini',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      objective: 'PG-ADM-01(보안관리), PG-ADM-02(프로그램관리 DAG), PG-ADM-03(사용자관리/스토리지), PG-ADM-04(약관·동의·정책) 와이어프레임 고도화 및 반응형 최적화',
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
    session_id: 'SESSION-0025',
    task_id: 'TASK-0025-01',
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
    completion_tokens: 1150,
    total_tokens: 2870,
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
  console.log(`✅ data/local_agent_store.json 에 TASK-0025-01 및 ${traceId} 저장 완료`);

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
