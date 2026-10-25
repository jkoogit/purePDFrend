import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

async function main() {
  const store = HarnessRepository.getLocalStore();

  const userPrompt = `쇼케이스 항목 점검해줘

1.1 COMP-11 필터선택 칩 : 선택 해제시 체크아이콘 비활성으로 표시(선택여부에 따른 크기가 변경되지 않도록)
1.2 COMP-14 탭 네비게이션 (Tab Navigation) 으로 되어 있는데 내용은 건수 표기 (Zero-Pill 규율 준수)? 
1.3 COMP-15 건수뱃지(COMP-14 의 내용?) 인데 내용은 4대 시맨틱 상태 뱃지?
1.4 COMP-17 오프라인 인디케이터 바 (Offline Bar) : 표시된게 아바타, 이메일, 권한, 설명 이게 요소와 맞는건가?
1.5 COMP-19 카테고리 트리 (드래그 앵커 & 인라인 수정) : 내용은 탭 아냐? 트리는 아니잖아?
1.6 COMP-20 프로필 아바타 (수정 옵션) : 내용에 슬라이드드래그휠?

전체적으로 점검해줘 잘못 매핑된 요소들이 많아. 
그리고, 
A. 요소별 테마별(주간,야간,여명) 표시, 화면모드(PC태블릿, 모바일) 별 표시 조건에 따른 모드 표시
B. 각 요소별 상태에 따른 동작 표시`;

  const agentResponse = fs.readFileSync('scripts/turn_0036_13_response.md', 'utf8');
  const responseSummary = '쇼케이스 컴포넌트 30종 전수 매핑 정상화 및 테마·화면조건·상태 인터랙션 고도화 완료';

  const turn0036_13 = {
    trace_id: 'TRACE-0036-05-00-13',
    session_id: 'SESSION-0036',
    task_id: 'TASK-0036-05',
    loop_id: 'LOOP-0036-05',
    step_index: 13,
    turn_num: '13',
    turn_number: 13,
    turn_identifier: '[0036-13]',
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
  store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0036-05-00-13');
  store.traces.push({
    ...turn0036_13,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) {
    store.conversation_turns = [];
  }
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0036' && (t.turn_number === 13 || t.turn_identifier === '[0036-13]')));
  store.conversation_turns.push(turn0036_13);

  HarnessRepository.saveLocalStore(store);
  console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0036-13] 동기화 완료');

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
      'TRACE-0036-05-00-13', 'SESSION-0036', 'TASK-0036-05', 'LOOP-0036-05', 13, 'gemini', 'models/gemini-1.5-flash',
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
