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
  const traceId = 'TRACE-0028-01-00-04';
  const promptText = `#태스크처리
1. 에이전트시스템에서 표시하던 top 메뉴는 사용자서비스에서 제거하자. 
2. 두번째 div 영역이 사용자서비스 top 메뉴 영역이야.
3. 비회원은 공유된 특정 문서만 열람할 수 있으니 추천열람문서 정보는 삭제해줘
4. 타이틀 변경 : 공개열람문서조회 > 공유열람문서조회
5. 테마 설정은 회원가입 뒤로 배치해줘
6. 공유열람문서조회 6번 div 아래 배치해줘
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > header:nth-of-type(1) > div:nth-of-type(1)
CSS 1: {

}
CSS selector 2: div#root:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1)
CSS 2: {

}
CSS selector 3: div#root:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3)
CSS 3: {

}
CSS selector 4: div#root:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1)
CSS 4: {

}
CSS selector 5: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > header:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(3) > div:nth-of-type(2) > button#btn-theme-toggle:nth-of-type(1)
CSS 5: {

}
CSS selector 6: div#root:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(3)
CSS 6: {

}
[AIS_METADATA_SECTION_END]`;

  const responseMarkdown = `#[0028-04] [0028-01] 사용자서비스 Top 메뉴 독립화, 추천열람문서 삭제, 공유열람문서조회 하단 재배치 및 테마 설정 버튼 구현 보고

### 1. 주요 구현 및 수정 사항

#### (1) 에이전트 시스템 Top 메뉴(Navbar) 분리 및 사용자서비스 전용 Top 메뉴화
- **\`src/App.tsx\`**: \`activeSystem !== 'service'\` 조건부 렌더링을 적용하여 엔드유저 전용 사용자서비스(\`service\`) 진입 시 상단 에이전트/인프라 관리용 글로벌 Navbar를 표시하지 않고 완전히 제거.
- **\`src/ppdf/components/PurePdfServicePortal.tsx\`**: 사용자서비스 첫 화면의 두 번째 div 영역을 순수 사용자서비스 최상단 헤더(Top Bar)로 승격하여 독립적이고 깔끔한 서비스 포털 레이아웃 완성.

#### (2) 비회원 공유 문서 열람 정책 반영: 추천열람문서 정보 삭제
- 비회원은 전체 공개 문서가 아닌 공유 링크/고유번호를 전달받은 특정 문서만 열람할 수 있는 보안 정책에 따라, 기존의 '추천 열람 문서(DOC-32000, DOC-OCR-26 등)' 칩 목록 div를 완전히 삭제 처리.

#### (3) 타이틀 변경 및 공유열람문서조회 영역 재배치
- **타이틀 변경**: \`공개 열람 문서 조회\` ➔ \`공유 열람 문서 조회\`로 공식 변경.
- **배치 순서 조정**: 기존 상단 배너 위(1번)에 위치하던 조회 영역을, 6번 div인 **하단 서비스 정보 탭(공지사항/사용자 리뷰/단계별 이용 가이드) 바로 아래**이자 하단 정보 푸터 바로 위로 이동 배치 완료.

#### (4) 테마 설정 버튼: 회원가입 뒤로 배치
- 사용자서비스 Top 바 우측 게스트 인증 영역에서 \`회원가입\` 버튼 바로 뒤에 **4모드 테마 스위처(\`btn-portal-theme-toggle\`)**를 배치.
- 주간 / 야간 / 여명 / 시스템설정 4모드 드롭다운 팝오버를 탑재하여 사용자서비스 환경에서도 원클릭으로 테마를 전환하고 실시간 DOM에 동기화 반영.

### 2. 컴파일 및 정적 검증
- \`lint_applet\` (\`tsc --noEmit\`): 결함 없이 정상 통과.
- \`compile_applet\` (\`vite build\`): 100% 빌드 성공.

---

다음 단계로 코드리뷰 문서를 발행하고 원격 \`dev\` 브랜치에 신규 커밋을 생성하여 GitHub에 동기화할 수 있도록 정제된 후속 프롬프트를 제시합니다:

\`\`\`bash
#태스크정리 [0028-01] 사용자서비스 Top 메뉴 독립화 및 공유열람문서조회 재배치 코드리뷰 발행 및 원격 dev Git 동기화
\`\`\``;

  const responseSummary = '사용자서비스 Top 메뉴 독립화, 추천열람문서 삭제, 공유열람문서조회 하단 재배치 및 테마 설정 버튼 구현';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0028',
    task_id: 'TASK-0028-01',
    loop_id: 'LOOP-0028-01-00',
    step_index: 4,
    agent_name: 'purePDFrend-engineer',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseMarkdown,
    response_summary: responseSummary,
    prompt_tokens: 1100,
    completion_tokens: 1450,
    total_tokens: 2550,
    created_at: new Date().toISOString(),
  };

  // 1. Update local agent store
  try {
    const storeRaw = fs.readFileSync('data/local_agent_store.json', 'utf-8');
    const store = JSON.parse(storeRaw);
    if (!store.traces) store.traces = [];
    const otherTraces = (store.traces || []).filter((t: any) => t.trace_id !== traceId);
    store.traces = [...otherTraces, traceObj];
    fs.writeFileSync('data/local_agent_store.json', JSON.stringify(store, null, 2), 'utf-8');
    console.log('✅ Local agent store turn 0028-04 updated.');
  } catch (err) {
    console.error('Local store update error:', err);
  }

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

  try {
    const res = await executeSql(sqlTrace);
    console.log(`[Remote DB] Upsert result:`, res);
  } catch (err) {
    console.error(`[Remote DB] Trace upsert failed:`, err);
  }
}

main();
