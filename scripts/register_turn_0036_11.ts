import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

async function main() {
  const store = HarnessRepository.getLocalStore();

  const userPrompt = `#태스크정리 : [0036-04] 서비스화면리뷰 UI/UX 개선 태스크 정리\n#태스크승급 까지 일괄 처리해줘\n\n#태스크시작 [0036-05] 30대 표준 원자/분자 컴포넌트 및 인터랙티브 디자인시스템 쇼케이스(DS-SHOWCASE) 전면 고도화 계획 수립\n\n일괄처리`;
  const agentResponse = fs.readFileSync('scripts/turn_0036_11_response.md', 'utf8');
  const responseSummary = '#태스크정리 & #태스크승급 [0036-04] 완결 및 #태스크시작 [0036-05] 쇼케이스 고도화 계획 수립';

  const turn0036_11 = {
    trace_id: 'TRACE-0036-04-00-11',
    session_id: 'SESSION-0036',
    task_id: 'TASK-0036-04',
    loop_id: 'LOOP-0036-04',
    step_index: 11,
    turn_num: '11',
    turn_number: 11,
    turn_identifier: '[0036-11]',
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
  store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0036-04-00-11');
  store.traces.push({
    ...turn0036_11,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) {
    store.conversation_turns = [];
  }
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0036' && (t.turn_number === 11 || t.turn_identifier === '[0036-11]')));
  store.conversation_turns.push(turn0036_11);

  // 2. TASK-0036-04 상태 '완료' 승급
  if (store.sessions?.[0]?.doc_payload?.tasks) {
    const t04 = store.sessions[0].doc_payload.tasks.find((t: any) => t.task_id === 'TASK-0036-04');
    if (t04) {
      t04.status = '완료';
    }
    const t05 = store.sessions[0].doc_payload.tasks.find((t: any) => t.task_id === 'TASK-0036-05');
    if (t05) {
      t05.status = '준비';
    } else {
      store.sessions[0].doc_payload.tasks.push({
        task_id: 'TASK-0036-05',
        task_name: '30대 표준 원자/분자 컴포넌트 및 인터랙티브 디자인시스템 쇼케이스(DS-SHOWCASE) 전면 고도화',
        status: '준비'
      });
    }
  }

  if (Array.isArray(store.tasks)) {
    const t04Idx = store.tasks.findIndex((t: any) => t.task_id === 'TASK-0036-04');
    if (t04Idx >= 0) {
      store.tasks[t04Idx].status_cd = '완료';
      store.tasks[t04Idx].ended_at = new Date().toISOString();
      await HarnessRepository.upsertTask(store.tasks[t04Idx]);
    }
    const t05Task = {
      task_id: 'TASK-0036-05',
      session_id: 'SESSION-0036',
      task_name: '30대 표준 원자/분자 컴포넌트 및 인터랙티브 디자인시스템 쇼케이스(DS-SHOWCASE) 전면 고도화',
      status_cd: '준비',
      work_group: 'purePDFrend',
      started_at: new Date().toISOString(),
      ended_at: null,
      doc_payload: {
        scope: '30대 표준 원자/분자 컴포넌트 풀 확장, 인터랙티브 상태/옵션 제어기, 4모드 테마 실시간 바인딩, 컴포넌트별 구현코드 토글, 사용화면 ID 링크 점프, 요소 검색창',
        branch: 'task/0036_01_ribbon_inline_and_phase5_api_Gemini',
        issue_number: 107,
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
    const t05Idx = store.tasks.findIndex((t: any) => t.task_id === 'TASK-0036-05');
    if (t05Idx >= 0) {
      store.tasks[t05Idx] = { ...store.tasks[t05Idx], ...t05Task };
    } else {
      store.tasks.unshift(t05Task);
    }
    await HarnessRepository.upsertTask(t05Task);
  }

  HarnessRepository.saveLocalStore(store);
  console.log('✅ data/local_agent_store.json (traces & conversation_turns & tasks) [0036-11] 동기화 완료');

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
      'TRACE-0036-04-00-11', 'SESSION-0036', 'TASK-0036-04', 'LOOP-0036-04', 11, 'gemini', 'models/gemini-1.5-flash',
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
