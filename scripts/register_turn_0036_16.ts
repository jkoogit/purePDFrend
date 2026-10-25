import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

async function main() {
  const store = HarnessRepository.getLocalStore();

  const userPrompt = `#태스크정리 : [0036-05] 30대 표준 원자/분자 컴포넌트 및 인터랙티브 디자인시스템 쇼케이스(DS-SHOWCASE) 전면 고도화 태스크 정리
#태스크승급 까지 일괄 처리해줘`;

  const agentResponse = fs.readFileSync('scripts/turn_0036_16_response.md', 'utf8');
  const responseSummary = '[0036-05] 30대 표준 원자/분자 컴포넌트 및 인터랙티브 디자인시스템 쇼케이스(DS-SHOWCASE) 태스크정리 및 태스크승급 완결 보고';

  const turn0036_16 = {
    trace_id: 'TRACE-0036-05-00-16',
    session_id: 'SESSION-0036',
    task_id: 'TASK-0036-05',
    loop_id: 'LOOP-0036-05',
    step_index: 16,
    turn_num: '16',
    turn_number: 16,
    turn_identifier: '[0036-16]',
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
  store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0036-05-00-16');
  store.traces.push({
    ...turn0036_16,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) {
    store.conversation_turns = [];
  }
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0036' && (t.turn_number === 16 || t.turn_identifier === '[0036-16]')));
  store.conversation_turns.push(turn0036_16);

  HarnessRepository.saveLocalStore(store);
  console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0036-16] 동기화 완료');

  // 2. PostgreSQL aiagent.agent_conversation_trace 동기화
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
      'TRACE-0036-05-00-16', 'SESSION-0036', 'TASK-0036-05', 'LOOP-0036-05', 16, 'gemini', 'models/gemini-1.5-flash',
      'jkok2j2m', 'jkok2j2m@gmail.com', 'jkok2j2m@gmail.com',
      ${escapeSql(userPrompt)}, ${escapeSql(agentResponse)}, ${escapeSql(responseSummary)},
      0, 0, 0, now()
    ) ON CONFLICT (trace_id) DO UPDATE SET
      user_prompt = EXCLUDED.user_prompt,
      agent_response = EXCLUDED.agent_response,
      response_summary = EXCLUDED.response_summary;`
  });

  const options = {
    hostname: 'purepdfrend.com',
    port: 443,
    path: '/api/db/query',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'x-backend-token': process.env.BACKEND_API_TOKEN || 'purepdfrend-secure-token-2026'
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('✅ 원격 DB aiagent.agent_conversation_trace 적재 응답 status:', res.statusCode);
      console.log('body:', body.substring(0, 200));
    });
  });

  req.on('error', (e) => {
    console.warn('⚠️ 원격 DB 적재 요청 실패 (로컬 스토어 안전 보존):', e.message);
  });

  req.write(payload);
  req.end();
}

main().catch(err => {
  console.error('❌ 스크립트 실행 중 예외:', err);
});
