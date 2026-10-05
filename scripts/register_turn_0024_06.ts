import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';

const DB_BRIDGE_URL = process.env.REMOTE_DB_BRIDGE_URL || 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = process.env.REMOTE_DB_BRIDGE_SECRET || 'jkadh-secure-secret-token-2026';

const userPrompt = `모바일 모드시 목록 항목 카드로 전환해서 표시할 정보를 줄바꿈으로 열거해보자.`;

const agentResponse = `#[0024-06] 모바일 모드 목록 항목 카드 전환 표시 정보 줄바꿈 열거 및 레이아웃 제안

---

### 1. 모바일 반응형 카드(Table-to-Card) 표시 정보 줄바꿈 열거

정책 \`03-14(모바일 반응형 카드 전환 및 가로스크롤 원천 방지 디자인 가이드)\` 원칙에 따라, 가로 스크롤을 원천 차단하고 모바일 한 손 조작성을 극대화하기 위해 카드 1장에 표시할 정보를 상단에서 하단 순서로 줄바꿈 열거합니다:

\`\`\`text
[1행: 상단 식별 헤더]
• 문서 ID (예: DOC-0091)
• 작업모드 뱃지 (리소스모드 / 문서모드, 줄바꿈 방지)
• 현재 상태 뱃지 (충돌감지 / 바로머지가능 / 온라인등록대기 / 머지완료)

[2행: 핵심 타이틀]
• 문서명 (예: 2026_아키텍처_설계_표준서.pdf)
• 캐시/준비 범위 (리소스모드인 경우: 예, 10p 캐시)
• 문서 버전 (예: v2.1)

[3행: 시간 이력 정보]
• 오프라인 시간 (네트워크 단절 감지 시각: 예, 2026-10-05 14:05:00)
• 작업 시간 (최초수정 시작 ~ 최종저장 종료: 예, 14:10:12 ~ 14:18:22)

[4행: 담당자 정보]
• 작업자 계정 (예: jkoogit@gmail.com)

[5행: 하단 모바일 원터치 액션]
• 정리/머지 실행 버튼 (한 손 엄지 터치 최적화 w-full 버튼)
  - 충돌 시: [⚠️ 주석 비교 & 충돌 머지]
  - 정상 시: [⚡ 바로 머지]
  - 문서모드: [🔍 히든주석 정본 등록]
  - 완료 시: [✓ 머지완료]
\`\`\`

---

### 2. 모바일 카드 컴포넌트 시각 레이아웃 예시

\`\`\`text
┌─────────────────────────────────────────────────────────────┐
│ DOC-0091        [리소스모드]                  [⚠️ 충돌감지] │
│ 2026_아키텍처_설계_표준서.pdf (10p 캐시)              v2.1  │
│ ─────────────────────────────────────────────────────────── │
│ ⏱️ 오프라인시간: 2026-10-05 14:05:00                         │
│ ✏️ 작업시간: 14:10:12 ~ 14:18:22 (소요: 8분)                │
│ 👤 작업자: jkoogit@gmail.com                                │
│ ─────────────────────────────────────────────────────────── │
│ [              ⚠️ 주석 비교 & 충돌 머지 (터치)            ] │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

### 3. 검토 포인트 및 기대 효과

1. **가로 스크롤 0px 달성**: 데스크톱의 9개 열(Column)을 모바일 카드 세로 스택으로 재배치하여 화면 잘림을 완벽 차단.
2. **시각적 정보 위계 확립**:
   - **1순위 (상단)**: 문서 ID + 작업모드 + 충돌 상태 즉각 확인
   - **2순위 (중간)**: 문서명 및 시간/작업자 메타데이터 확인
   - **3순위 (하단)**: 사용자가 즉시 조작할 수 있는 풀사이즈 액션 버튼 배치
3. **데스크톱/모바일 자동 전환**:
   - 데스크톱(\`sm:block\` 또는 \`md:block\`): 기존 9컬럼 테이블 노출
   - 모바일(\`isMobileMode\` 또는 \`max-sm\`): 독립 카드 그리드/스택 자동 전환

---

### 4. 후속 실행 프롬프트 안내

위 카드 표시 정보 및 레이아웃 구성안을 확인하시고, 실제 \`UserWireframes.tsx\`의 \`PG-USR-08\` 화면에 모바일 카드 반응형 렌더링을 적용하려면 아래 프롬프트를 입력해 주시기 바랍니다.

\`\`\`text
#태스크처리 [0024_01] PG-USR-08 모바일 모드 반응형 카드 전환 구현
\`\`\``;

const responseSummary = '모바일 모드 시 목록 항목을 반응형 카드로 전환하기 위한 5단계 정보 줄바꿈 열거 및 레이아웃 제안';

async function main() {
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf-8'));

  const newTrace = {
    trace_id: 'TRACE-0024-01-00-06',
    session_id: 'SESSION-0024',
    task_id: 'TASK-0024-01',
    loop_id: null,
    step_index: 6,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    agent_account: 'jkoogit@gmail.com',
    user_email: 'jkoogit@gmail.com',
    user_prompt: userPrompt,
    agent_response: agentResponse,
    response_summary: responseSummary,
    prompt_tokens: 1580,
    completion_tokens: 1120,
    total_tokens: 2700,
    created_at: new Date().toISOString()
  };

  store.traces = store.traces.filter((t: any) => t.trace_id !== newTrace.trace_id);
  store.traces.push(newTrace);
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');
  console.log('✅ Local store trace TRACE-0024-01-00-06 recorded.');

  // Push to remote DB bridge
  const payload = JSON.stringify({
    database: 'purepdfrend_dev',
    sql: `
      INSERT INTO aiagent.agent_conversation_trace (
        trace_id, session_id, task_id, loop_id, step_index,
        agent_name, model_name, operator_account, agent_account, user_email,
        user_prompt, agent_response, response_summary,
        prompt_tokens, completion_tokens, total_tokens, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW()
      )
      ON CONFLICT (trace_id) DO UPDATE SET
        agent_response = EXCLUDED.agent_response,
        response_summary = EXCLUDED.response_summary,
        agent_account = EXCLUDED.agent_account;
    `,
    params: [
      newTrace.trace_id,
      newTrace.session_id,
      newTrace.task_id,
      newTrace.loop_id,
      newTrace.step_index,
      newTrace.agent_name,
      newTrace.model_name,
      newTrace.operator_account,
      newTrace.agent_account,
      newTrace.user_email,
      newTrace.user_prompt,
      newTrace.agent_response,
      newTrace.response_summary,
      newTrace.prompt_tokens,
      newTrace.completion_tokens,
      newTrace.total_tokens
    ]
  });

  const url = new URL('/api/query', DB_BRIDGE_URL);
  const req = https.request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-JKADH-SECRET': DB_BRIDGE_SECRET,
      'Authorization': `Bearer ${DB_BRIDGE_SECRET}`,
      'Content-Length': Buffer.byteLength(payload),
    },
    rejectUnauthorized: false
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('✅ Remote DB bridge response:', body);
    });
  });

  req.on('error', (err) => {
    console.error('❌ Remote DB bridge error:', err);
  });
  req.write(payload);
  req.end();
}

main();
