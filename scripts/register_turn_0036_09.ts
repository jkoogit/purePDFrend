import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

async function main() {
  const store = HarnessRepository.getLocalStore();

  const userPrompt = `#태스크처리 [0036-04] 서비스화면리뷰 UI/UX 개선 (버튼 3종 에이전트 시스템 이동, 테마 토글 버튼색 반영, 중복 로그인 배너 삭제, 친화적 소개문구 개편, 검색창 식별성 강화)\n* 문구 : 편리하게 PDF 문서를 열고, 글자를 추출하며, 안전하게 편집하고 공유할 수 있는 스마트 전자문서 서비스입니다.`;
  const agentResponse = fs.readFileSync('scripts/turn_0036_09_response.md', 'utf8');
  const responseSummary = '[TASK-0036-04] 서비스화면리뷰 5대 UI/UX 개선 완결 보고 (거버넌스 버튼 이관, 테마색 반영, 중복배너 삭제, 소개문구 개편, 검색창 강화)';

  const turn0036_09 = {
    trace_id: 'TRACE-0036-04-00-09',
    session_id: 'SESSION-0036',
    task_id: 'TASK-0036-04',
    loop_id: 'LOOP-0036-04',
    step_index: 9,
    turn_num: '9',
    turn_number: 9,
    turn_identifier: '[0036-09]',
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
  store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0036-04-00-09');
  store.traces.push({
    ...turn0036_09,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) {
    store.conversation_turns = [];
  }
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0036' && (t.turn_number === 9 || t.turn_identifier === '[0036-09]')));
  store.conversation_turns.push(turn0036_09);

  // 세션 내부 태스크 목록에 TASK-0036-04 상태 진행중/완료대기 현행화
  if (store.sessions?.[0]?.doc_payload?.tasks) {
    const tItem = store.sessions[0].doc_payload.tasks.find((t: any) => t.task_id === 'TASK-0036-04');
    if (tItem) {
      tItem.status = '진행중';
    } else {
      store.sessions[0].doc_payload.tasks.push({
        task_id: 'TASK-0036-04',
        task_name: '서비스화면리뷰 UI/UX 개선 (공통 탑바 버튼 이동, 테마 토글 버튼색 반영, 중복 배너 삭제, 소개문구 개편, 검색창 식별성 강화)',
        status: '진행중'
      });
    }
  }

  // 2. HarnessRepository 기반 TASK-0036-04 진행중 상태 등록
  const task0036_04 = {
    task_id: 'TASK-0036-04',
    session_id: 'SESSION-0036',
    task_name: '서비스화면리뷰 UI/UX 개선 (공통 탑바 버튼 이동, 테마 토글 버튼색 반영, 중복 배너 삭제, 소개문구 개편, 검색창 식별성 강화)',
    status_cd: '진행중',
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
    version: 2,
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
  console.log('✅ data/local_agent_store.json (traces & conversation_turns & tasks) [0036-09] 동기화 완료');

  const taskRes = await HarnessRepository.upsertTask(task0036_04);
  console.log('✅ HarnessRepository.upsertTask (진행중) 완료:', taskRes);

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
      'TRACE-0036-04-00-09', 'SESSION-0036', 'TASK-0036-04', 'LOOP-0036-04', 9, 'gemini', 'models/gemini-1.5-flash',
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
