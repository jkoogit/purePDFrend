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
  const traceId = 'TRACE-0028-01-00-01';
  const promptText = `[0028] 와이어프레임_보완_및_4모드_테마_첫화면_서비스_권한별_시스템전환_구축

#세션시작 [0028] 와이어프레임_보완_및_4모드_테마_첫화면_서비스_권한별_시스템전환_구축
- 작업 세션 계정: jkoogit (jkoogit@gmail.com)
- 대상 브랜치: dev (원격 Auto-Pull 동기화 선행)
- 핵심 작업 범위:
  1) 와이어프레임 화면리뷰 보완: 23개 화면 디자인 토큰(tokens.ts) 및 8대 Primitive UI 전수 점검 및 미비점 보완
  2) 4모드 테마 시스템 구성: 주간(라이트) / 야간(다크) / 여명(블루/새벽) / 시스템설정(OS prefers-color-scheme 자동감지)
  3) 서비스 구현 준비:
     - 첫 화면을 엔드유저 '서비스 화면(PDF 대시보드/뷰어/변환 포털)'으로 기본 표시
     - 사용자 권한에 따른 시스템 전환 인터페이스(버튼) 구현:
       * 일반 사용자: PDF 비즈니스 서비스
       * 서비스 설정 권한: '서비스설정(서비스 설정 시스템)' 전환 인터페이스(버튼)
       * 마스터/관리자 권한: '에이전트관리(마스터 시스템)' 전환 인터페이스(버튼)
- 참고 문서:
  * docs/13.회고/13-21_SESSION-261011-0027_세션종합_KPT_회고록.md
  * docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md
  * docs/03.정책/03-13_화면_설계철학_및_정보구조_원칙.md
  * docs/05.설계/05-28_통합_디자인_토큰_및_컴포넌트_쇼케이스_상세설계서.md
  * docs/05.설계/05-25_PG_ADM_01_04_시스템서비스_1단계_와이어프레임_및_DAG_트리_상세설계서.md
  * docs/05.설계/05-26_시스템서비스_2단계_게시판_고객_글꼴_단축키_와이어프레임_상세설계서.md
  * docs/10.리뷰/261010_047_통합_디자인_토큰_추출_및_쇼케이스_구축_코드리뷰.md
  * src/styles/tokens.ts
  * AGENTS.md v2.2, GEMINI.md v1.0.0
- 거버넌스 준수: 3-Tier 모델 라우팅 준수 (Tier 1 Pro 기획, Tier 2 Flash TDD 구현, Tier 3 Lite 정리/승급), READ-ONLY #태스크시작 계획 승인 후 #태스크처리 진행`;

  const responseText = `#[0028-01] [0028] 와이어프레임_보완_및_4모드_테마_첫화면_서비스_권한별_시스템전환_구축 - 세션시작 보고

### 1. 세션명 현행화
- **세션명**: \`[0028] 와이어프레임_보완_및_4모드_테마_첫화면_서비스_권한별_시스템전환_구축\`
- **세션 식별자**: \`SESSION-0028\`
- **작업 그룹**: \`purePDFrend\`
- **담당 작업자**: \`jkoogit (jkoogit@gmail.com)\`

### 2. 원격 dev 자동 Pull (Auto-Pull) 결과
- **동기화 스크립트**: \`scripts/pull_remote_dev.ts\` 실행 완료
- **원격 dev 기준 커밋 SHA**: \`3fb1d6ffcbab87fa920ddac4784694dfae499b86\`
- **네이티브 Git / Git Data API 무손실 동기화**: 100% 무손실 검증 완결 (로컬 작업공간 및 원격 dev 완벽 일치)

### 3. 원격 저장소 이슈 및 PR 점검 결과
- **현재 열린 이슈 수**: **0건** (직전 세션 이슈 전수 정상 종료 확인)
- **현재 열린 PR 수**: **0건** (전수 머지 및 종결 확인)

### 4. 3대 원격 브랜치 커밋 SHA 일치 검증
- \`main\` SHA: \`3fb1d6ffcbab87fa920ddac4784694dfae499b86\`
- \`stg\`  SHA: \`3fb1d6ffcbab87fa920ddac4784694dfae499b86\`
- \`dev\`  SHA: \`3fb1d6ffcbab87fa920ddac4784694dfae499b86\`
- **브랜치 일치 상태**: **✅ 100% 일치 (Synchronized, 클린 상태)**

### 5. 신규 세션 이슈 등록 및 원격 작업 브랜치 생성
- **신규 GitHub 이슈 등록**: **#84** (\`[0028_01] 와이어프레임 보완 및 4모드 테마, 첫화면 서비스 권한별 시스템 전환 구축\`)
- **원격 작업 브랜치 생성**: \`refs/heads/task/0028_01_와이어프레임보완_4모드테마_시스템전환_jkoogit\` (기준 SHA: \`3fb1d6ffcbab87fa920ddac4784694dfae499b86\`)

### 6. 하네스 스토어 및 원격 DB 동기화
- **로컬 하네스 스토어**: \`data/local_agent_store.json\` 내 \`SESSION-0028\` 등록 완료 (상태: \`진행중\`)
- **원격 PostgreSQL DB**: \`aiagent.harness_session_meta\` 테이블에 \`SESSION-0028\` 무손실 등록 완료

### 7. 세션 대상 3대 핵심 과업 및 작업 계획
1. **[와이어프레임 화면리뷰 보완]**:
   - 23개 와이어프레임 화면의 디자인 토큰(\`src/styles/tokens.ts\`) 및 8대 Primitive UI(\`Badge\`, \`Button\`, \`Card\`, \`Input\`, \`KeyCap\`, \`Modal\`, \`Textarea\`, \`ToolIcon\`) 전수 점검
   - 터치 가드레일(최소 44px) 및 모바일 Break-to-Card 반응형 레이아웃 정합성 유지
2. **[4모드 테마 시스템 구성]**:
   - 주간(라이트 \`light\`) / 야간(다크 \`dark\`) / 여명(블루/새벽 \`dawn\`) / 시스템설정(OS \`prefers-color-scheme\` 자동감지)
   - 테마 토글 및 선택 컴포넌트 고도화, CSS 변수/토큰 실시간 바인딩
3. **[서비스 구현 준비 & 권한별 시스템 전환 인터페이스]**:
   - 앱 첫 로딩 화면을 엔드유저 **'서비스 화면(PDF 대시보드/뷰어/변환 포털)'**으로 기본 표시
   - 사용자 권한별 시스템 전환 인터페이스(헤더 내 퀵 스위처 버튼):
     * 일반 사용자: PDF 비즈니스 서비스 (\`PurePdfServicePortal\`)
     * 서비스 설정 권한: **'서비스설정'** (와이어프레임/설정 시스템) 전환 인터페이스
     * 마스터/관리자 권한: **'에이전트관리'** (마스터 거버넌스 시스템) 전환 인터페이스

\`\`\`bash
#태스크시작 [0028-01] 와이어프레임 보완 및 4모드 테마, 첫화면 서비스 권한별 시스템 전환 계획 수립 및 환경 분석
\`\`\``;

  const responseSummary = 'SESSION-0028 세션시작: 원격 dev 자동Pull(3fb1d6f), 이슈 #84 등록, 작업 브랜치 task/0028_01_와이어프레임보완_4모드테마_시스템전환_jkoogit 생성, 하네스 스토어 및 DB 동기화 완료';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0028',
    task_id: 'TASK-0028-01',
    loop_id: null,
    step_index: 1,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: responseSummary,
    prompt_tokens: 1720,
    completion_tokens: 880,
    total_tokens: 2600,
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
