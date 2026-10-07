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
  const traceId = 'TRACE-0026-01-00-01';
  const promptText = `[0026] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성

#세션시작 [0026] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성
- 대상 작업:
  1. [정책 수립] moabogo 디자인 패턴을 벤치마킹한 통합 디자인 정책 문서 수립 (docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md)
     - Color Palette(Primary, Slate, Semantic 상태색), Typography Scale, Spacing(44px 터치타깃), Z-Index Scale 정의
     - 4대 특이케이스(밀도 이원화 compact/viewer, 캔버스 오버레이 z-index, 모바일 Table-to-Card, 복합키 Keycap/ToolIcon) 명문화
  2. [기준 컴포넌트 풀 구축] src/shared/components/ui/ (또는 design-system/) 내 원자/분자 기준 컴포넌트 독립 개발
     - Button(다양한 변형 및 44px 터치), Input/Textarea, Card, Badge, Modal/Dialog, KeyCap, ToolIcon 개발 및 단위 검증
  3. [점진적 교체 1단계] 비즈니스 로직 영향도가 적은 관리자 시스템서비스(PG-ADM-01~04 등)부터 기준 컴포넌트 순차 대입 및 모바일 반응형 검증
- 참고 문서:
  * docs/13.회고/13-19_SESSION-261006-0025_세션종합_KPT_회고록.md
  * docs/03.정책/03-14_모바일반응형_카드전환_및_가로스크롤_원천방지_디자인가이드.md
  * docs/03.정책/03-22_오프라인_동기화_및_충돌머지_거버넌스_운영정책.md
  * docs/05.설계/05-25_PG_ADM_01_04_시스템서비스_1단계_와이어프레임_및_DAG_트리_상세설계서.md
  * docs/05.설계/05-26_PG_ADM_05_16_시스템서비스_2단계_와이어프레임_상세설계서.md
  * AGENTS.md v2.3
- 작업 세션 계정 및 환경:
  * Operator: jkoogit (jkoogit@gmail.com)
  * Agent Model: models/gemini-3.8-flash (Tier 2 Standard)
  * Quota Status: 일일 2,500회 가용 (리셋 완료, 잔여 충분)`;

  const responseText = `#[0026-01] [0026] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성 - 세션시작 보고

### 1. 세션명 현행화
- 세션명: \`[0026] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성\`
- 세션 식별자: \`SESSION-0026\`
- 작업 그룹: \`purePDFrend\`

### 2. 원격 dev 자동 Pull (Auto-Pull) 결과
- 기준 최신 커밋 SHA: \`c536e6005f2c7076b8abfda4d5cbac8f95a18153\`
- 네이티브 Git 1초 무손실 동기화 및 원격 루트 트리(SHA: \`e076f636b6df3f72ae2b7579255d434319db9f92\`) 100% 무손실 검증 완결

### 3. 원격 이슈 및 PR 점검 결과
- 현재 열린 이슈 수: **0건** (전수 정상 종결 확인)
- 현재 열린 PR 수: **0건** (전수 정상 머지/종결 확인)

### 4. 3대 원격 브랜치 커밋 SHA 일치 검증
- \`main\` SHA: \`c536e6005f2c7076b8abfda4d5cbac8f95a18153\`
- \`stg\`  SHA: \`c536e6005f2c7076b8abfda4d5cbac8f95a18153\`
- \`dev\`  SHA: \`c536e6005f2c7076b8abfda4d5cbac8f95a18153\`
- 3대 브랜치 일치 상태: **✅ 100% 일치 (Synchronized)**

### 5. 신규 세션 이슈 등록 및 원격 작업 브랜치 생성
- 신규 GitHub 이슈 등록: **#73** (\`[0026_01] 통합 디자인시스템 기준요소 정의 및 단계적 화면 재구성\`)
- 원격 작업 브랜치 생성: \`refs/heads/task/0026_01_통합디자인시스템_jkoogit\` (기준 SHA: \`c536e6005f2c7076b8abfda4d5cbac8f95a18153\`)

### 6. 하네스 스토어 및 원격 DB 동기화
- 로컬 하네스 스토어: \`data/local_agent_store.json\` 내 \`SESSION-0026\` 등록 완료 (상태: \`진행중\`)
- 원격 PostgreSQL DB: \`aiagent.harness_session_meta\` 테이블에 \`SESSION-0026\` 무손실 등록 완료

### 7. 후속 계획 및 태스크 진행 안내
세션 대상 작업 3대 과제:
1. **[정책 수립]**: moabogo 디자인 패턴 벤치마킹 통합 디자인 정책 문서 수립 (\`docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md\`)
2. **[기준 컴포넌트 풀 구축]**: \`src/shared/components/ui/\` 원자/분자 기준 컴포넌트 독립 개발 (\`Button\`, \`Input\`, \`Textarea\`, \`Card\`, \`Badge\`, \`Modal\`, \`KeyCap\`, \`ToolIcon\`) 및 단위 테스트
3. **[점진적 교체 1단계]**: 비즈니스 영향도가 낮은 시스템서비스 관리자 화면(PG-ADM-01~04)부터 신규 기준 컴포넌트 순차 대입 및 모바일 반응형 검증

\`\`\`bash
#태스크시작 [0026-01] 통합 디자인시스템 정책 수립 및 기준 컴포넌트 풀 아키텍처 분석
\`\`\``;

  const responseSummary = 'SESSION-0026 세션시작: 원격 dev 자동Pull(c536e60), 이슈 #73 등록, 작업 브랜치 task/0026_01_통합디자인시스템_jkoogit 생성, 하네스 스토어 및 DB 동기화 완료';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0026',
    task_id: 'TASK-0026-01',
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
    completion_tokens: 880,
    total_tokens: 2530,
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
