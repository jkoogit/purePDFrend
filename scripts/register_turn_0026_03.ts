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
  const traceId = 'TRACE-0026-03-01-03';
  const promptText = `#태스크처리 [0026_01] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성`;

  const responseText = `#[0026-03] [01] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성 - 구현_및_검증

### 1. 통합 디자인시스템 정책 가이드 수립 완결
- **정책 문서 발행**: \`docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md\`
- **인덱스 현행화**: \`docs/03.정책/README_정책.md\`에 \`03-23\` 표준 정책 등재 완료
- **핵심 수립 내용**:
  1. **Color Palette System**: Slate 중립 서피스 60-30-10 배분 및 Success, Warning, Danger, Info Semantic 상태색 정의
  2. **Typography Scale**: Display, Heading, Body, Caption 및 고정폭 숫자(\`tabular-nums\`) 표준화
  3. **Spacing & 44px Touch Target**: 모바일 WCAG 및 터치 가이드라인 준수를 위한 \`min-h-[44px]\` 기준 확립
  4. **Z-Index Hierarchy**: \`z-0\`(캔버스)부터 \`z-60\`(토스트), \`z-[999]\`(인라인 교정 레이어)까지 7단계 계층화
  5. **4대 특이케이스 명문화**:
     - ① 밀도 이원화 (관리자 standard vs PDF 뷰어 compact 초슬림 집약형)
     - ② 캔버스 오버레이 계층 분리 및 마우스 이벤트 간섭 차단
     - ③ 모바일 Table-to-Card 변환 (\`0px\` 가로스크롤 원천 차단 가드레일)
     - ④ 복합키 Keycap (\`Ctrl+Shift+F\`) 및 규격화 ToolIcon (14/16/20px)

---

### 2. 기준 컴포넌트 풀 (src/shared/components/ui/) 독립 개발
외부 서드파티 라이브러리 의존성 없이 React/Tailwind 기반 독립적인 원자/분자 컴포넌트 8종 개발 완료:
- \`Button.tsx\`: \`primary\`, \`secondary\`, \`outline\`, \`ghost\`, \`danger\`, \`success\` 6대 variant, \`sm\`/\`md\`/\`lg\` 3대 크기, 44px 모바일 터치타깃 지원, \`isLoading\` 로딩 스피너 애니메이션 지원
- \`Input.tsx\`: 라벨, 에러 피드백, 힌트, 전/후면 아이콘, 일관된 포커스 링(\`ring-blue-500/30\`)
- \`Textarea.tsx\`: 다중 행 편집, 리사이즈, 라벨 및 글자 수 카운터 지원
- \`Card.tsx\`: \`Card\`, \`CardHeader\`, \`CardTitle\`, \`CardDescription\`, \`CardContent\`, \`CardFooter\` 서브 컴포넌트 분리 및 \`interactive\` 호버 지원
- \`Badge.tsx\`: 6대 Semantic 색상 매핑 및 dot 인디케이터 지원
- \`Modal.tsx\`: ESC 키보드 이벤트 닫기, 백드롭 블러 및 외부 클릭 닫기, 반응형 다이얼로그 래퍼
- \`KeyCap.tsx\`: \`Ctrl+Shift+F\` 등 복합 기능키 자동 파싱 및 입체 키캡 렌더링
- \`ToolIcon.tsx\`: 14px(\`sm\`), 16px(\`md\`), 20px(\`lg\`) 3단계 규격화 아이콘 버튼 및 활성 링 지원
- \`index.ts\` 및 \`src/shared/index.ts\`: 모듈 통합 export 체계 구축

---

### 3. 점진적 교체 1단계 적용 (시스템서비스 PG-ADM-01~04)
1. **PG-ADM-01 (보안관리, \`AdminSecurityView.tsx\`)**:
   - CIDR 화이트리스트 및 긴급 블랙리스트 영역을 신규 \`Card\`, \`Input\`, \`Button\`, \`Badge\` 컴포넌트로 전면 재구성
   - 2FA 및 해외 IP 차단, 세션 타임아웃 슬라이더 레이아웃 일관성 확보
2. **PG-ADM-02 (프로그램관리, \`AdminProgramsView.tsx\`)**:
   - 신규 프로그램 등록 및 수정 폼을 전용 \`Modal\` 컴포넌트로 이관
   - 검색/필터 바 및 다중 권한 배지를 신규 \`Badge\` 및 \`Input\`으로 전환
   - 모바일 환경에서 \`Card\` 컴포넌트로의 자동 전환 및 0px 가로스크롤 가드레일 준수
3. **PG-ADM-03 (사용자관리, \`AdminUsersView.tsx\`)**:
   - 아바타 및 회원 상태를 신규 \`Badge\`로 표준화
   - 사용자 상세조회 팝업을 신규 \`Modal\` 컴포넌트로 전환하고 스토리지/권한 설정 카드 분리
4. **PG-ADM-04 (약관관리, \`AdminTermsView.tsx\`)**:
   - 약관 목록 카드를 신규 \`Card\` 컴포넌트로 통합
   - 위지윅/마크다운 에디터를 신규 \`Textarea\` 및 \`Button\`으로 전환하고 약관 상세 팝업을 \`Modal\`로 일원화

---

### 4. 단위 테스트 및 정적 무결성 검증
- **단위 테스트**: \`tests/design_system_ui.test.ts\` 작성 및 실행
  - Button 렌더링 및 44px 터치타깃 플래그 검증: **✅ PASS**
  - Badge Semantic 상태 매핑(success, danger, dot) 검증: **✅ PASS**
  - KeyCap 복합 기능키 문자열 및 배열 파싱 검증: **✅ PASS**
  - ToolIcon 14/16/20px 3단계 규격 및 액션 검증: **✅ PASS**
- **정적 린트 검증**: \`npm run lint\` (\`tsc --noEmit\`) ➔ **0 errors (100% 통과)**
- **컴파일 빌드 검증**: \`compile_applet\` (\`vite build\`) ➔ **빌드 성공 (100% 무결성)**

---

### 5. 후속 태스크 정리 안내
코드리뷰 문서 발행 및 하네스/GitHub 커밋 푸시를 위해 다음 단계(#태스크정리)를 진행합니다.

\`\`\`text
#태스크정리 [0026_01] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성
\`\`\``;

  const responseSummary = 'TASK-0026-01 태스크처리: 통합 디자인시스템 정책 03-23 수립, 기준 컴포넌트 풀 8종 개발, PG-ADM-01~04 1단계 점진적 대입, 단위 테스트 및 린트/컴파일 100% 완결';

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0026',
    task_id: 'TASK-0026-01',
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
    prompt_tokens: 1850,
    completion_tokens: 1420,
    total_tokens: 3270,
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
