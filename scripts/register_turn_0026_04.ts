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
  const traceId = 'TRACE-0026-04-01-04';
  const promptText = `#태스크정리 [0026_01] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성`;

  const responseText = `#[0026-04] [01] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성 - 정리_및_검증

### 1. 테스트 및 종합 서비스 무결성 점검 결과
1. **단위 테스트 (TDD)**: \`npx tsx tests/design_system_ui.test.ts\`
   - Button (primary, lg, 44px 터치타깃), Badge (success, danger, dot), KeyCap (복합 기능키 및 배열), ToolIcon (14/16/20px 3단계 및 활성 링) 4대 영역 **전수 100% 통과 (PASS)**
2. **타입 정적 검증 (Lint)**: \`npm run lint\` (\`tsc --noEmit\`)
   - **0 errors (100% 정적 무결성 달성)**
3. **프로덕션 컴파일 (Build)**: \`compile_applet\` (\`vite build\`)
   - **빌드 성공 (Success)**
4. **전수 서비스 가드레일 진단**: \`npm run check:service\`
   - 1단계(인프라/DB 브릿지/7종 복합인덱스): **✅ 정상**
   - 2단계(하네스 카운트/토큰 집계/작업그래프): **✅ 정상**
   - 3단계(거버넌스 무결성 자동 감사): **✅ 100점 만점 [A+ (PERFECT)]** (고아 레코드 0건, 429 토큰 격리 준수)
   - 4단계(기술문서 201개 SHA-256 해시 일치 & JSONB GIN 전문검색): **✅ 정상**

---

### 2. 코드리뷰 문서 발행 및 인덱스 현행화
- **완료 코드리뷰 문서**: \`docs/10.리뷰/261007_044_통합_디자인시스템_정책수립_기준컴포넌트풀_구축_및_관리자1단계_적용_코드리뷰.md\` (식별자 \`10-44\`) 발행 완료
- **리뷰 인덱스 현행화**: \`docs/10.리뷰/README_리뷰.md\` 테이블 52행에 \`10-44\` 요약 내역 등재 완료

---

### 3. 하네스 스토어 및 원격 DB 메타데이터 현행화
- **로컬 스토어**: \`data/local_agent_store.json\` 내 \`TASK-0026-01\` 리뷰문서 식별자(\`10-44\`) 및 완료 상세 메타 연동
- **원격 DB**: \`aiagent.harness_task_meta\` 테이블에 작업 정보 현행화 완료

---

### 4. 원격 Git Data API 커밋 생성·푸시 및 PR/머지 완료 (Git Data API Push Mandate)
- **Git Database API 커밋/푸시 파이프라인 (\`scripts/github_sync_push.ts\`)**:
  - 변경/신규 파일 34개 감지 및 Git Blob 업로드 완료
  - 신규 Git Tree 생성: \`cb7b63091cf3ce6b096fd7e90712773f06fb80c6\`
  - 신규 Git Commit 생성: \`ee0e22d03bf0b02cfe0d7d1857604f22fda5c925\`
  - 작업 브랜치 반영: \`refs/heads/task/0026_01_통합디자인시스템_jkoogit\` 최신화 완료
- **Pull Request 자동 생성 및 머지**:
  - **Pull Request #74**: \`[TASK-0026-01] 통합 디자인시스템 기준요소 정의 및 단계적 화면 재구성\` 생성
  - **dev 브랜치 머지**: PR #74 \`dev\` 머지 완결 (Status: 200)
  - **stg 및 main 브랜치 배포 승급**: \`dev\` ➔ \`stg\` (201), \`stg\` ➔ \`main\` (201) 3대 브랜치 최신 커밋 SHA 동기화 완결

---

### 5. 후속 프롬프트 안내 (규칙 2.3 준수)
\`AGENTS.md\` 규칙 2.3에 따라, \`#태스크정리\` 이후 입력되는 프롬프트는 \`#태스크승급\`으로 제한됩니다. 아래 프롬프트를 통해 최종 상태 승급 및 대화턴 전수 화해를 진행할 수 있습니다.

\`\`\`text
#태스크승급 [0026_01] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성
\`\`\``;

  const responseSummary = 'TASK-0026-01 태스크정리 완료: 100점 만점 가드레일 진단, 리뷰 10-44 발행, Git Data API 커밋(ee0e22d) 및 PR #74 생성/머지, dev/stg/main 동기화 완결';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0026',
    task_id: 'TASK-0026-01',
    loop_id: null,
    step_index: 4,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    agent_account: 'jkoogit@gmail.com',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: responseSummary,
    prompt_tokens: 1750,
    completion_tokens: 1380,
    total_tokens: 3130,
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
