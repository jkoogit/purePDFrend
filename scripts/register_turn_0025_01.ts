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
  const traceId = 'TRACE-0025-01-00-01';
  const promptText = `#세션시작 [0025] 시스템서비스_와이어프레임_1단계_보안_프로그램_사용자_약관관리_고도화

## 1. 세션 개요 및 배경
- **세션 ID**: SESSION-0025
- **대상 백로그**: BACKLOG-0025-01 (우선순위: HIGH)
- **작업 목적**: 
  1. 사용자서비스 와이어프레임(PG-USR-01~09) 정돈 완결에 이어, 시스템서비스(PG-ADM-01~16) 와이어프레임 1단계 고도화 착수
  2. PG-ADM-01(보안관리): IP접근제어, 2FA 강제화, 세션만료, 오프라인 토큰기간 설정 UI 정돈
  3. PG-ADM-02(프로그램관리): 화면 프로그램 계층 부모-자식 트리 및 DAG 순환참조 방지 시각화
  4. PG-ADM-03(사용자관리): 회원상태, 오프라인 사용허용, 스토리지(NAS/FTP/Drive), 개인정보 불변원칙 UI/UX 보강
  5. PG-ADM-04(약관·동의·정책): 웹문서 기반 8대 약관 에디터, 문서그룹ID 기반 버전 발행, 동의이력 관리 화면 고도화
  6. 모바일 반응형 0px 가로스크롤 가드레일(정책 03-14) 적용 및 린트/컴파일 무결성 검증

## 2. 작업 컨텍스트 및 시스템 환경
- **작업세션계정**: jkoogit@gmail.com (Operator: jkoogit)
- **AI Agent 모델**: models/gemini-3.8-flash (Tier 2 Standard) / gemini-1.5-pro (Tier 1 Architecture)
- **세션 토큰 리셋 기준**: 한국 표준시(KST) 매일 16:00 (PST 00:00)
- **작업 브랜치**: dev 최신 커밋(f1958772d42e) 기준 task/0025_01_시스템서비스_PG_ADM_Gemini 생성 예정

## 3. 핵심 참고 문서
- docs/05.설계/05-22_화면프로그램ID체계표_및_정보구조_IA_설계서.md (PG-ADM-01~16 체계표)
- docs/05.설계/05-21_오프라인_인증토큰_문서검증_및_커스텀툴바_상세설계서.md (보안/토큰 정책)
- docs/03.정책/03-14_모바일반응형_카드전환_및_가로스크롤_원천방지_디자인가이드.md (반응형 표준)
- docs/10.리뷰/261005_041_인코딩점검_오프라인작업정리_6대필터_모바일반응형카드전환_코드리뷰.md (직전 리뷰 10-41)
- docs/13.회고/13-18_SESSION-261005-0024_세션종합_KPT_회고록.md (직전 세션 회고록)
- AGENTS.md v2.3 (턴 추적 및 영속화 거버넌스 헌장)`;

  const responseText = `#[0025-01] 시스템서비스_와이어프레임_1단계_보안_프로그램_사용자_약관관리_고도화 - 세션시작 보고

### 1. 세션명 현행화
- 세션명: \`[0025] 시스템서비스_와이어프레임_1단계_보안_프로그램_사용자_약관관리_고도화\`

### 2. 원격 dev 자동 Pull (Auto-Pull) 결과
- 기준 최신 커밋 SHA: \`f1958772d42e906fd5ecd9edbe87fe37e80223c3\`
- 네이티브 Git 1초 무손실 동기화 및 원격 트리(SHA: \`353f12dc7b77d64e5209c34778bf629235d6b77d\`) 검증 완료

### 3. 원격 이슈 및 PR 점검
- 현재 열린 이슈 수: **0건** (모두 정상 종결)
- 현재 열린 PR 수: **0건** (모두 정상 종결)

### 4. 3대 원격 브랜치 커밋 SHA 일치 검증
- \`main\` SHA: \`f1958772d42e906fd5ecd9edbe87fe37e80223c3\`
- \`stg\`  SHA: \`f1958772d42e906fd5ecd9edbe87fe37e80223c3\`
- \`dev\`  SHA: \`f1958772d42e906fd5ecd9edbe87fe37e80223c3\`
- 3대 브랜치 일치 상태: **✅ 100% 일치 (Synced)**

### 5. 신규 세션 이슈 등록 및 원격 작업 브랜치 생성
- 신규 GitHub 이슈 등록: **#69** (\`[0025_01] 시스템서비스 와이어프레임 1단계 (PG-ADM-01~04 보안/프로그램/사용자/약관) 고도화 및 DAG 트리 시각화\`)
- 원격 작업 브랜치 생성: \`refs/heads/task/0025_01_시스템서비스_PG_ADM_Gemini\` (기준 SHA: \`f1958772d42e906fd5ecd9edbe87fe37e80223c3\`)

### 6. 하네스 스토어 및 원격 DB 동기화
- 로컬 하네스 스토어: \`data/local_agent_store.json\` 내 \`SESSION-0025\` 신규 등록 완료
- 원격 PostgreSQL DB: \`aiagent.harness_session_meta\`에 \`SESSION-0025\` 무손실 등록 완료

### 7. 후속 태스크 계획 및 프롬프트 안내
시스템서비스 1단계(PG-ADM-01 보안, PG-ADM-02 프로그램, PG-ADM-03 사용자, PG-ADM-04 약관관리) 와이어프레임 분석 및 설계를 위한 후속 태스크(#태스크시작)를 진행합니다.`;

  const responseSummary = 'SESSION-0025 세션시작: 원격 dev 자동Pull(f1958772), 이슈 #69 등록, 작업 브랜치 task/0025_01_시스템서비스_PG_ADM_Gemini 생성, 하네스 스토어 및 DB 동기화 완료';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0025',
    task_id: 'TASK-0025-01',
    loop_id: null,
    step_index: 1,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: responseSummary,
    prompt_tokens: 1650,
    completion_tokens: 920,
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
