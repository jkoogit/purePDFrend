import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

async function main() {
  const store = HarnessRepository.getLocalStore();

  const userPrompt = `#태스크시작 서비스화면리뷰\n1. 기능이동(버튼이동) : 대상 [공통 top 영역]의 버튼 3개\n  > 타겟 [에이전트 시스템] 'AGENTS.md 준거 거버넌스 활성' 영역에 대체 표시정보 대체\n1.1 document.querySelector("#root > div > div > header > div > div.flex.items-center.gap-1\\\\.5.sm\\\\:gap-2\\\\.5.shrink-0 > div:nth-child(2)")\n1.2 document.querySelector("#btn-emergency-recovery-panel")\n1.3 document.querySelector("#btn-service-health-check")\n2. 테마 모드에 따라 버튼색 반영 : 주간, 야간, 여명\n   - document.querySelector("#btn-theme-toggle")\n3. 삭제\n3.1 위에 로그인/회원가입 기능과 중복 : document.querySelector("#root > div > main > div > div > div.space-y-5.text-xs > div.p-4.rounded-2xl.border.bg-white.border-slate-200.shadow-md.text-slate-900.flex.flex-col.sm\\\\:flex-row.items-center.justify-between.gap-3.shadow-lg")\n4. 텍스트 수정\n4.1 document.querySelector("#root > div > main > div > div > div.p-3\\\\.5.sm\\\\:p-4.rounded-2xl.border.bg-white.border-slate-200.shadow-md.text-slate-900.flex.flex-col.sm\\\\:flex-row.sm\\\\:items-center.justify-between.gap-3.transition-colors.duration-200.shadow-lg > div.flex.items-center.gap-3 > div:nth-child(2) > p")\n   - 서비스를 모르는 사람에게 설명하기위한 문구로 대체. 기술을 모르는 사람이 이해할 수 있도록 기능적인 표현을 배제하고 작성바람.\n5. 배경과 유사한 입력필드 좀더 식별되도록 개선\n5.1 document.querySelector("#root > div > main > div > div > div.space-y-5.text-xs > div:nth-child(4) > div.flex.flex-wrap.sm\\\\:flex-nowrap.gap-2\\\\.5.mt-1 > input")`;
  const agentResponse = fs.readFileSync('scripts/turn_0036_08_response.md', 'utf8');
  const responseSummary = '[TASK-0036-04] 서비스 화면 UI/UX 리뷰 및 공통 탑바/랜딩 고도화 계획 수립 보고';

  const turn0036_08 = {
    trace_id: 'TRACE-0036-04-00-08',
    session_id: 'SESSION-0036',
    task_id: 'TASK-0036-04',
    loop_id: 'LOOP-0036-04',
    step_index: 8,
    turn_num: '8',
    turn_number: 8,
    turn_identifier: '[0036-08]',
    operator_account: 'jkok2j2m',
    agent_account: 'jkok2j2m@gmail.com',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: userPrompt,
    agent_response: agentResponse,
    response_summary: responseSummary,
    status: 'SUCCESS',
    created_at: new Date().toISOString()
  };

  // 1. local_agent_store.json traces & conversation_turns 동기화
  if (!Array.isArray(store.traces)) {
    store.traces = [];
  }
  store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0036-04-00-08');
  store.traces.push({
    ...turn0036_08,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-pro',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) {
    store.conversation_turns = [];
  }
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0036' && (t.turn_number === 8 || t.turn_identifier === '[0036-08]')));
  store.conversation_turns.push(turn0036_08);

  // 세션 내부 태스크 목록에 TASK-0036-04 추가
  if (store.sessions?.[0]?.doc_payload?.tasks) {
    const tItem = store.sessions[0].doc_payload.tasks.find((t: any) => t.task_id === 'TASK-0036-04');
    if (!tItem) {
      store.sessions[0].doc_payload.tasks.push({
        task_id: 'TASK-0036-04',
        task_name: '서비스화면리뷰 UI/UX 개선 (공통 탑바 버튼 이동, 테마 토글 버튼색 반영, 중복 배너 삭제, 소개문구 개편, 검색창 식별성 강화)',
        status: '준비'
      });
    }
  }

  // 2. HarnessRepository 기반 TASK-0036-04 준비 상태 등록
  const task0036_04 = {
    task_id: 'TASK-0036-04',
    session_id: 'SESSION-0036',
    task_name: '서비스화면리뷰 UI/UX 개선 (공통 탑바 버튼 이동, 테마 토글 버튼색 반영, 중복 배너 삭제, 소개문구 개편, 검색창 식별성 강화)',
    status_cd: '준비',
    work_group: 'purePDFrend',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      scope: '공통 Top 헤더 3대 버튼(DB 인디케이터, DR 긴급관제, 정밀점검) 에이전트 시스템 이동, 테마 토글 버튼 주간/야간/여명 4모드 색상 반영, 서비스 포털 중복 로그인 배너 삭제, 친화적 서비스 소개 문구 개편, 공유문서 검색 입력창 식별성 강화',
      branch: 'task/0036_01_ribbon_inline_and_phase5_api_Gemini',
      issue_number: 106,
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com'
    },
    created_sys: 'agent-harness',
    created_by: 'jkok2j2m',
    updated_sys: 'agent-harness',
    updated_by: 'jkok2j2m',
    version: 1,
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com'
  };

  if (!Array.isArray(store.tasks)) {
    store.tasks = [];
  }
  const taskIdx = store.tasks.findIndex((t: any) => t.task_id === 'TASK-0036-04');
  if (taskIdx >= 0) {
    store.tasks[taskIdx] = { ...store.tasks[taskIdx], ...task0036_04 };
  } else {
    store.tasks.unshift(task0036_04);
  }

  HarnessRepository.saveLocalStore(store);
  console.log('✅ data/local_agent_store.json (traces & conversation_turns & tasks) [0036-08] 동기화 완료');

  const taskRes = await HarnessRepository.upsertTask(task0036_04);
  console.log('✅ HarnessRepository.upsertTask (준비) 완료:', taskRes);

  // 3. PostgreSQL aiagent.agent_conversation_trace 동기화
  function escapeSql(str: string | null | undefined): string {
    if (str === null || str === undefined) return 'NULL';
    return `'${String(str).replace(/'/g, "''")}'`;
  }

  const payload = JSON.stringify({
    database: 'purepdfrend_dev',
    sql: `INSERT INTO aiagent.agent_conversation_trace (
      trace_id, session_id, task_id, loop_id, step_index, agent_name, model_name,
      operator_account, agent_account, user_email,
      user_prompt, agent_response, response_summary, prompt_tokens, completion_tokens, total_tokens, created_at
    ) VALUES (
      'TRACE-0036-04-00-08', 'SESSION-0036', 'TASK-0036-04', 'LOOP-0036-04', 8, 'gemini', 'models/gemini-1.5-pro',
      'jkok2j2m', 'jkok2j2m@gmail.com', 'jkok2j2m@gmail.com',
      ${escapeSql(userPrompt)}, ${escapeSql(agentResponse)}, ${escapeSql(responseSummary)},
      0, 0, 0, now()
    ) ON CONFLICT (trace_id) DO UPDATE SET
      user_prompt = EXCLUDED.user_prompt,
      agent_response = EXCLUDED.agent_response,
      response_summary = EXCLUDED.response_summary;`
  });

  const req = https.request('https://ptype.pdfrend.com/api/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-JKADH-SECRET': 'jkadh-secure-secret-token-2026',
      'Authorization': 'Bearer jkadh-secure-secret-token-2026',
      'Content-Length': String(Buffer.byteLength(payload)),
    },
    rejectUnauthorized: false,
    timeout: 5000,
  }, (res) => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => console.log('원격 DB 턴 적재 결과:', b.slice(0, 100)));
  });
  req.on('error', e => console.log('원격 DB 비동기 에러 (로컬 정상):', e.message));
  req.write(payload);
  req.end();
}

main().catch(console.error);
