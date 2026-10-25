import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

async function main() {
  const store = HarnessRepository.getLocalStore();

  const userPrompt = `#태스크처리 [0036-03] PDF 순수 뷰어/가상스크롤/OCR 스튜디오 실서비스 tokens.ts 통합 및 렌더링 최적화`;
  const agentResponse = fs.readFileSync('scripts/turn_0036_06_response.md', 'utf8');
  const responseSummary = '[0036-03] PDF 순수 뷰어/가상스크롤/OCR 스튜디오 실서비스 tokens.ts 통합 및 렌더링 최적화 태스크처리 완료 보고';

  const turn0036_06 = {
    trace_id: 'TRACE-0036-03-00-06',
    session_id: 'SESSION-0036',
    task_id: 'TASK-0036-03',
    loop_id: 'LOOP-0036-03',
    step_index: 6,
    turn_num: '6',
    turn_number: 6,
    turn_identifier: '[0036-06]',
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
  store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0036-03-00-06');
  store.traces.push({
    ...turn0036_06,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) {
    store.conversation_turns = [];
  }
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0036' && (t.turn_number === 6 || t.turn_identifier === '[0036-06]')));
  store.conversation_turns.push(turn0036_06);

  HarnessRepository.saveLocalStore(store);
  console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0036-06] 동기화 완료');

  // 2. HarnessRepository 기반 TASK-0036-03 처리완료 상태 등록
  const task0036_03 = {
    task_id: 'TASK-0036-03',
    session_id: 'SESSION-0036',
    task_name: 'PDF 순수 뷰어/가상스크롤/OCR 스튜디오 실서비스 tokens.ts 통합 및 렌더링 최적화',
    status_cd: '처리완료',
    work_group: 'purePDFrend',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      scope: 'VirtualViewerStudio, OCRCorrectionStudio, PageThumbnailSidebar 실서비스 3대 뷰어 컴포넌트 tokens.ts 4모드 테마 전면 통합, 800쪽 대용량 가상스크롤 렌더링 최적화, PurePdfServicePortal 양방향 라우팅 연동',
      branch: 'task/0036_01_ribbon_inline_and_phase5_api_Gemini',
      issue_number: 106,
      backlog_ids: ['BACKLOG-0035-02'],
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

  const taskRes = await HarnessRepository.upsertTask(task0036_03);
  console.log('✅ HarnessRepository.upsertTask 완료:', taskRes);

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
      'TRACE-0036-03-00-06', 'SESSION-0036', 'TASK-0036-03', 'LOOP-0036-03', 6, 'gemini', 'models/gemini-1.5-flash',
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
