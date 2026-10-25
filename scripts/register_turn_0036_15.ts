import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

async function main() {
  const store = HarnessRepository.getLocalStore();

  const userPrompt = `1. 미해결
1.1 1 테마 연동	테마 미적용 해소 및 토큰 동적 표시  - 화면전체 테마적용 (단, 토큰요소 결과영역은 설정에 따른 적용)
1.2 1.4	COMP-08	실시간 필터목록 접힘형 드롭다운 전환 - 유지하고 필요한 요건의 선택목록을 추가하자
1.3 필터선택목록 추가 : 기본 입력필드에 입력초기화 X 아이콘과 선택목록 펼침 아이콘 표시. 선택목록을 펼치면 목록이 표시되고, 입력필드에 입력한 텍스트를 기준으로 실시간 필터링된 목록 표시
1.4 트리 토큰요소 결과는 개선 필요 - 항목을 카드형태로 표시하면 트리의 깊이감이 단절됨. 카테고리트리 우측상단에 보기모드 아이콘 배치, 등록, 삭제 버튼 배치. 트리보기모드, 평문보기모드(폴더구조를 path로 표시) 전환처리. 등록시 선택한 항목의 레벨로 바로아래 입력항목 추가(수정 버튼을 등록 버튼으로 표시). 삭제버튼 클릭시 수정버튼을 삭제버튼으로 표시
1.5 1.5	고정 툴바	설정 영역 스크롤 고정 및 앵커 아이콘 배치 - 아이콘만 표시하고 해제시 스크롤에 밀려나도록 처리
1.6 1.6	COMP-17	메시지 가변 폭에 따른 자동 줄바꿈 허용 - 줄바꿈 여전히 안되서 텍스트가 영역을 튕겨나가네
1.7 1.7	COMP-20	프로필 아바타 수정 아이콘 표시 모드 분기 - 프로필 아이콘에 수정아이콘 표시하는 상태유형 추가
1.8 1.9	COMP-22	슬라이드 드래그휠 경계 기반 스크롤 전파 격리 - 휠 이벤트 전파 격리가 안되네`;

  const agentResponse = fs.readFileSync('scripts/turn_0036_15_response.md', 'utf8');
  const responseSummary = 'DS-SHOWCASE 화면전체 테마 연동, 필터선택목록 신설, 트리 깊이감 복원 및 드래그휠 스크롤 격리 완결';

  const turn0036_15 = {
    trace_id: 'TRACE-0036-05-00-15',
    session_id: 'SESSION-0036',
    task_id: 'TASK-0036-05',
    loop_id: 'LOOP-0036-05',
    step_index: 15,
    turn_num: '15',
    turn_number: 15,
    turn_identifier: '[0036-15]',
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
  store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0036-05-00-15');
  store.traces.push({
    ...turn0036_15,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) {
    store.conversation_turns = [];
  }
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0036' && (t.turn_number === 15 || t.turn_identifier === '[0036-15]')));
  store.conversation_turns.push(turn0036_15);

  HarnessRepository.saveLocalStore(store);
  console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0036-15] 동기화 완료');

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
      'TRACE-0036-05-00-15', 'SESSION-0036', 'TASK-0036-05', 'LOOP-0036-05', 15, 'gemini', 'models/gemini-1.5-flash',
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
