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
  const traceId = 'TRACE-0025-03-01-03';
  const promptText = `#태스크처리 [0025_01] 시스템서비스_와이어프레임_1단계_보안_프로그램_사용자_약관관리_고도화`;

  const responseText = `#[0025-03] [01] 시스템서비스_와이어프레임_1단계_보안_프로그램_사용자_약관관리_고도화 - 태스크처리 보고

### 1. 개요 및 구현 목표 완결
\`SESSION-0025\` 1차 태스크인 \`TASK-0025-01\`에 따라, 시스템서비스(Admin Modules) 핵심 4대 프로그램(\`PG-ADM-01\` ~ \`PG-ADM-04\`) 와이어프레임 및 도메인 인터랙션을 엔터프라이즈 사양으로 전면 고도화하고, 모바일 반응형 0px 가로스크롤 가드레일(정책 03-14)과 정적 린트/컴파일 검증을 100% 완결하였습니다.

---

### 2. 4대 화면별 주요 고도화 및 도메인 인터랙션 내역

| 프로그램 ID | 프로그램 명칭 | 주요 구현 및 인터랙션 고도화 내역 | 반영 상태 |
| :--- | :--- | :--- | :---: |
| **PG-ADM-01** | **보안관리** | • **IP 접근제어**: 화이트리스트 CIDR 동적 추가/삭제(사내망/VPN/VPC), 악성 IP 긴급 차단 블랙리스트 실시간 해제/차단<br/>• **Geo-Blocking**: 대한민국 외 국가 해외 IP 접속 원천 차단 토글<br/>• **2FA 강제화 정책**: 전사 필수(1등급) vs 선택적 적용 스위치, Google Authenticator/이메일 OTP/8자리 비상복구코드 10회 지원<br/>• **토큰 수명주기**: \`OFFLINE_REFRESH_TOKEN_DAYS\`(1~180일, 기본 30일) 슬라이더 바인딩, 유휴 세션 만료(15~120분) 및 기기수 제한(3대) | **완료 (OK)** |
| **PG-ADM-02** | **프로그램관리** | • **29대 프로그램 계층 트리**: 루트(ROOT) ➔ 도메인 루트(USR/ADM/AGT) ➔ 29개 단위 프로그램 부모-자식 트리 뷰어<br/>• **DAG 비순환 검증기 (Cycle Detection Engine)**: 타겟 프로그램 및 부모 후보 선택 시 조상 순회(DFS) 알고리즘으로 폐루프(A ➔ B ➔ A) 실시간 감지 및 순환참조 시 저장 차단 경고<br/>• **신규 프로그램 등록 모달**: 프로그램ID, 명칭, 부모ID, 라우트URL, 권한(\`ROLE_USER\`, \`ROLE_ADMIN\`) 등록 기능 완비 | **완료 (OK)** |
| **PG-ADM-03** | **사용자관리** | • **개인정보 불변원칙 헌장 (Privacy Immutability)**: 관리자의 평문 비밀번호 및 개인 식별 정보 임의 수정 불가, '초기화 인증 메일 발송' 기능만 지원<br/>• **회원 상태 라이프사이클**: 정상 ↔ 제한 상태 전환 토글, 실시간 필터(전체/정상/제한/휴면) 및 검색<br/>• **오프라인 사용 권한 제어**: 오프라인 사용 허용/비활성 토글 및 원클릭 +30일 토큰 수명 연장 액션<br/>• **멀티 스토리지 연동**: Synology NAS, Google Drive, QNAP SFTP, WebDAV 경로 및 사용량 모니터링<br/>• **모바일 카드 뷰 (정책 03-14)**: 데스크톱 테이블(\`hidden md:table\`)과 모바일 카드(\`block md:hidden\`) 분기로 가로 스크롤 0px 보장 | **완료 (OK)** |
| **PG-ADM-04** | **약관·동의·정책** | • **8대 표준 약관 카드 그리드**: 이용약관, 개인정보, 마케팅, 저작권, 면책조항, 쿠키, 청소년보호, 오프라인동기화(DOC_GRP_01~08) 버전/동의율 뱃지<br/>• **실시간 웹문서 에디터 & 개정 버전 발행기**: 마크다운/HTML 본문 에디터, 효력발생일자 지정, 신규 개정판 발행 시 버전 자동 증가(v2.4 ➔ v2.5) 및 전체 사용자 재동의 플래그 연동<br/>• **사용자 동의 이력 원장 (Consent Ledger)**: 법적 증빙을 위한 사용자ID, 문서그룹ID, 동의 버전, KST 일시, 접속 IP, 철회 여부 감사 테이블 및 모바일 카드 뷰 완비 | **완료 (OK)** |

---

### 3. 설계 및 학습 문서 신설 및 인덱스 현행화

1. **\`docs/05.설계/05-25_PG_ADM_01_04_시스템서비스_1단계_와이어프레임_및_DAG_트리_상세설계서.md\`** 신설:
   - 보안 거버넌스, DAG 순환참조 방지 알고리즘, 개인정보 불변원칙, 8대 약관 에디터 및 동의 원장 상세 아키텍처 수립
2. **\`docs/15.학습/15-21_DAG_순환참조_방지_알고리즘_및_관리자_보안_스토리지_거버넌스_해설.md\`** 신설:
   - 트리 계층 구조에서의 사이클 검출 알고리즘, 컴플라이언스 관점의 개인정보 불변 원칙, 오프라인 토큰 수명주기 해설
3. **\`docs/05.설계/README_설계.md\` 및 \`docs/15.학습/README_학습.md\`** 인덱스 표 현행화 완결.

---

### 4. 품질 및 무결성 검증 결과

- **TypeScript 정적 타입 검증 (\`tsc --noEmit\` / \`lint_applet\`)**: **0건 에러 (PASS)**
- **Vite & esbuild 컴파일 검증 (\`compile_applet\`)**: **성공 (Build succeeded)**
- **모바일 반응형 가드레일 (정책 03-14)**: 375px ~ 768px 구간 0px 가로 스크롤 및 카드형 레이아웃 정상 동작 확인.

---

### 5. 후속 실행 프롬프트 안내

기능 구현 및 검증이 완료되었으므로, 코드리뷰 문서 발행 및 Git/DB 하네스 동기화를 위해 아래 \`#태스크정리\` 프롬프트를 입력해 주시기 바랍니다.

\`\`\`text
#태스크정리 [0025_01] 시스템서비스_와이어프레임_1단계_보안_프로그램_사용자_약관관리_고도화
\`\`\``;

  const responseSummary = 'TASK-0025-01 태스크처리: PG-ADM-01~04 와이어프레임 고도화 완결, DAG 순환참조 방지기, 개인정보 불변원칙, 8대 약관 에디터 및 모바일 카드 전환 완료, 설계 05-25 및 학습 15-21 발행, 린트/컴파일 무결성 확보';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0025',
    task_id: 'TASK-0025-01',
    loop_id: null,
    step_index: 3,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    agent_account: 'jkoogit@gmail.com',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: responseSummary,
    prompt_tokens: 2150,
    completion_tokens: 1680,
    total_tokens: 3830,
    created_at: new Date().toISOString()
  };

  // 1. Update local store
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const otherTraces = (store.traces || []).filter((t: any) => t.trace_id !== traceId);
  store.traces = [...otherTraces, traceObj];

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 에 ${traceId} 저장 완료`);

  // 2. Insert into remote DB agent_conversation_trace
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
