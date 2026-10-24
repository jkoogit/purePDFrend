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
  const traceId = 'TRACE-0029-01-00-03';
  const promptText = `#태스크처리 [0029-01] top 영역 가운데 와이어프레임 서비스목록 표시, 3대 공통 쉘 구축 및 tokens.ts 디자인 토큰 전면 대입 구현`;

  const responseText = `#[0029-03] [0029-01] top 영역 가운데 와이어프레임 서비스목록 표시, 3대 공통 쉘 구축 및 tokens.ts 디자인 토큰 전면 대입 구현 완료

### 1. 설계 및 아키텍처 문서 선반영
- **신규 상세설계서 작성 완료**: \`docs/05.설계/05-30_3대_공통쉘_아키텍처_및_와이어프레임_서비스목록_상세설계서.md\`
  * 24개 와이어프레임 서비스 화면(사용자 9개 + 관리자 15개) 및 디자인시스템 쇼케이스(총 25개) 분류 체계 정의
  * 상단 중앙 와이어프레임 퀵 점프 내비게이션 및 3대 공통 쉘(UserShell, AdminShell, StudioShell) 아키텍처 규격 수립
  * \`tokens.ts\` 디자인 토큰 단일 진실 공급원 및 4모드 테마(light, dark, dawn, system) 실시간 바인딩 전략 명시

### 2. top 영역 가운데 와이어프레임 서비스목록 (25개) 퀵 점프 네비게이션 구축
- **글로벌 헤더 (\`src/shared/components/Navbar.tsx\`)**:
  * 상단 1단 바 중앙(Center) 영역에 시스템 전환 스위처, 역할 시뮬레이터와 함께 **[와이어프레임 목록 (25개)]** 퀵 점프 드롭다운 배치
  * 사용자 서비스 9개(\`PG-USR-01\` ~ \`PG-USR-09\`), 관리자 서비스 15개(\`PG-ADM-01\` ~ \`PG-ADM-16\`), 디자인시스템 쇼케이스를 계층형 카테고리로 제공
  * 항목 선택 시 서비스설정(\`settings\`) 화면으로 즉각 전환되며, 타겟 와이어프레임 탭 및 프로그램으로 1클릭 포커스 점프(\`purepdfrend-navigate-wireframe\` 이벤트 연동)
- **스튜디오 상단 바 (\`src/ppdf/views/wireframes/shells/StudioShell.tsx\`)**:
  * 스튜디오 헤더 중앙에도 동일한 25개 서비스 화면 퀵 점프 셀렉터를 배치하여 어느 화면에서나 신속한 화면 전환 지원

### 3. 3대 공통 쉘(Shell) 컴포넌트 아키텍처 구축 (\`src/ppdf/views/wireframes/shells/\`)
1. **\`UserShell.tsx\` (사용자 9개 서비스 전용 공통 쉘)**:
   - 4모드 적응형 \`PdfrendLogo\` 및 브레드크럼(홈 > 사용자 서비스 > 프로그램명) 기본 탑재
   - PG-USR-01 ~ PG-USR-09 가로 슬라이더 서브탭 네비게이션 및 모바일 뷰포트 상태 인디케이터 제공
   - 모바일 Break-to-Card 컨테이너 및 최소 44px 터치 가드레일 보장
2. **\`AdminShell.tsx\` (관리자 15개 서비스 전용 공통 쉘)**:
   - 4모드 적응형 \`PdfrendLogo\` 및 브레드크럼(시스템설정 > 관리자 서비스 > 프로그램명) 기본 탑재
   - 5대 카테고리(보안·약관, 사용자·권한, 프로그램·메뉴, 운영·로그·API, 고객·글꼴·도구) 필터 칩 및 인라인 검색창 제공
   - 15개 관리자 프로그램 가로 슬라이더 네비게이션 일체화
3. **\`StudioShell.tsx\` (와이어프레임 스튜디오 최상위 공통 쉘)**:
   - 3대 도메인 탭(🎨 디자인시스템 쇼케이스, 📱 사용자 서비스 9개, 🛠 관리자 서비스 15개) 스위처
   - 3단 뷰포트 시뮬레이터(PC 100%, Tablet 768px, Mobile 390px) 래퍼 탑재
   - 중앙 와이어프레임 25개 서비스목록 퀵 점프 팝오버 기본 탑재

### 4. tokens.ts 디자인 토큰 전면 대입 및 4모드 테마 실시간 바인딩
- **\`src/styles/tokens.ts\` 확장**:
  * \`getThemeAdaptiveClasses(theme)\` 헬퍼 함수 신설: \`light\`, \`dark\`, \`dawn\` 모드별 최적화된 컨테이너, 패널, 카드, 테두리, 텍스트 클래스 일원화
  * \`tokenClassMap\` 기반의 zero-pill 둥글기(\`rounded-xl\`, \`rounded-2xl\`), 고대비 포커스링(\`focusRing\`), 44px 터치타깃(\`touchButton\`) 표준화
- **미처리 화면 전면 대입**:
  * **PG-USR-03 (홈화면 대시보드 & 7대 PDF 도구)**: 도구 카드 7종에 \`tokenClassMap.card\` 및 테마 적응형 스타일 전면 적용
  * **PG-USR-04 (마이페이지/사용자관리)**: 프로필 조절, 인라인 인풋, 2FA 탭 영역에 tokens 시맨틱 스타일 적용
  * **PG-USR-05 (문서관리 라이브러리)**: 8대 상세필터 및 모달에 tokens 둥글기 및 섀도우 규격 일체화

### 5. TDD 단위 테스트 및 정적 분석 무결성 검증
- **신규 단위 테스트 구축**: \`tests/wireframe_shells_and_tokens.test.ts\`
  * 3대 공통 쉘, 25개 와이어프레임 레지스트리, 5대 관리자 카테고리 검증: **5개 테스트 100% 통과 (1.48s)**
  * 기존 4모드 테마 및 시스템 스위처 테스트(\`tests/theme_and_system_switcher.test.ts\`): **100% 통과**
- **정적 린트 및 빌드 컴파일**:
  * \`npm run lint\` (\`tsc --noEmit\`): **0 Error / 0 Warning 완벽 통과**
  * \`npm run build\` (\`compile_applet\`): **정상 컴파일 성공**

\`\`\`bash
#태스크정리 [0029-01] top 영역 가운데 와이어프레임 서비스목록 표시, 3대 공통 쉘 구축 및 tokens.ts 디자인 토큰 전면 대입 리뷰문서 발행 및 하네스 동기화
\`\`\``;

  const responseSummary = 'TASK-0029-01 구현 완료: 05-30 상세설계서 작성, Top 중앙 와이어프레임 서비스목록(25개) 퀵 점프 구현, 3대 공통 쉘(UserShell, AdminShell, StudioShell) 구축, tokens.ts 디자인 토큰 전면 대입, 단위 테스트 5건 및 컴파일 100% 통과';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0029',
    task_id: 'TASK-0029-01',
    loop_id: 'LOOP-0029-01',
    step_index: 3,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: responseSummary,
    prompt_tokens: 1650,
    completion_tokens: 1100,
    total_tokens: 2750,
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
