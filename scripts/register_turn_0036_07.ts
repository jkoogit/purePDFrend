import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

async function main() {
  const store = HarnessRepository.getLocalStore();

  const userPrompt = `#태스크정리 : [0036-03] PDF 순수 뷰어/가상스크롤/OCR 스튜디오 실서비스 tokens.ts 통합 및 렌더링 최적화 태스크 정리\n#태스크승급 까지 일괄 처리해줘`;
  const agentResponse = fs.readFileSync('scripts/turn_0036_07_response.md', 'utf8');
  const responseSummary = '[TASK-0036-03] 태스크 정리 및 승급 완료 보고 (PDF 순수 뷰어/가상스크롤/OCR 스튜디오 tokens.ts 통합 및 렌더링 최적화 완결)';

  const turn0036_07 = {
    trace_id: 'TRACE-0036-03-00-07',
    session_id: 'SESSION-0036',
    task_id: 'TASK-0036-03',
    loop_id: 'LOOP-0036-03',
    step_index: 7,
    turn_num: '7',
    turn_number: 7,
    turn_identifier: '[0036-07]',
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
  store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0036-03-00-07');
  store.traces.push({
    ...turn0036_07,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) {
    store.conversation_turns = [];
  }
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0036' && (t.turn_number === 7 || t.turn_identifier === '[0036-07]')));
  store.conversation_turns.push(turn0036_07);

  // 세션 내부 태스크 상태 현행화
  if (store.sessions?.[0]?.doc_payload?.tasks) {
    const tItem = store.sessions[0].doc_payload.tasks.find((t: any) => t.task_id === 'TASK-0036-03');
    if (tItem) {
      tItem.status = '완료';
    } else {
      store.sessions[0].doc_payload.tasks.push({
        task_id: 'TASK-0036-03',
        task_name: 'PDF 순수 뷰어/가상스크롤/OCR 스튜디오 실서비스 tokens.ts 통합 및 렌더링 최적화',
        status: '완료'
      });
    }
  }

  // 2. HarnessRepository 기반 TASK-0036-03 완료 상태 등록
  const task0036_03 = {
    task_id: 'TASK-0036-03',
    session_id: 'SESSION-0036',
    task_name: 'PDF 순수 뷰어/가상스크롤/OCR 스튜디오 실서비스 tokens.ts 통합 및 렌더링 최적화',
    status_cd: '완료',
    work_group: 'purePDFrend',
    started_at: '2026-10-25T16:20:00.000Z',
    ended_at: new Date().toISOString(),
    doc_payload: {
      scope: 'VirtualViewerStudio, OCRCorrectionStudio, PageThumbnailSidebar 실서비스 3대 뷰어 컴포넌트 tokens.ts 4모드 테마 전면 통합, 800쪽 대용량 가상스크롤 렌더링 최적화, PurePdfServicePortal 양방향 라우팅 연동',
      branch: 'task/0036_01_ribbon_inline_and_phase5_api_Gemini',
      issue_number: 106,
      backlog_ids: ['BACKLOG-0035-02'],
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com',
      review_doc: 'docs/10.리뷰/261025_060_실서비스_PDF_뷰어_및_OCR스튜디오_tokens_통합_코드리뷰.md',
      design_doc: 'docs/05.설계/05-35_실서비스_PDF_뷰어_및_OCR스튜디오_tokens_통합_설계서.md',
      roadmap_doc: 'docs/07.로드맵/07-02_화면별_디자인_토큰_적용현황_및_단계별_로드맵.md'
    },
    created_sys: 'agent-harness',
    created_by: 'jkok2j2m',
    updated_sys: 'agent-harness',
    updated_by: 'jkok2j2m',
    version: 3,
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com'
  };

  // store.tasks 에도 반영
  if (!Array.isArray(store.tasks)) {
    store.tasks = [];
  }
  const taskIdx = store.tasks.findIndex((t: any) => t.task_id === 'TASK-0036-03');
  if (taskIdx >= 0) {
    store.tasks[taskIdx] = { ...store.tasks[taskIdx], ...task0036_03 };
  } else {
    store.tasks.unshift(task0036_03);
  }

  HarnessRepository.saveLocalStore(store);
  console.log('✅ data/local_agent_store.json (traces & conversation_turns & tasks) [0036-07] 동기화 완료');

  const taskRes = await HarnessRepository.upsertTask(task0036_03);
  console.log('✅ HarnessRepository.upsertTask (완료) 완료:', taskRes);

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
      'TRACE-0036-03-00-07', 'SESSION-0036', 'TASK-0036-03', 'LOOP-0036-03', 7, 'gemini', 'models/gemini-1.5-flash',
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
