import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

async function main() {
  const store = HarnessRepository.getLocalStore();

  const userPrompt = `1. DS-SHOWCASE 디자인시스템 - 테마 적용안된것 적용해줘 (토큰요소는 설정에 따라 표시)
1.1 전환 전/후 비교 삭제
1.2 메뉴바로가기 로 해소기능 삭제 : document.querySelector("#root > div > main > div > div > div.p-4.rounded-2xl.border.bg-slate-900.border-slate-800.shadow-xl.text-slate-100.shadow-xl.flex.flex-col.lg\\\\:flex-row.lg\\\\:items-center.justify-between.gap-4")
1.3 장황하게 설명하지 말고 기능만 심플하게 정리해줘 - document.querySelector("#root > div > main > div > div > div.mx-auto.transition-all.duration-300.w-full > div > div.bg-gradient-to-r.from-blue-950\\\\/50.via-slate-900.to-indigo-950\\\\/50.border.border-blue-900\\\\/40.rounded-2xl.p-6.shadow-xl.relative.overflow-hidden.select-text > div.relative.z-10.flex.flex-col.md\\\\:flex-row.md\\\\:items-center.justify-between.gap-4")
1.4 COMP-08 실시간 필터목록 (Filter List) 는 선택목록 요소를 기반으로 목록을 내리면 항목이 표시되도록 하자. 지금 구조는 평시에 항목이 노출되는데 화면이 늘어진다. 
1.5 설정 영역 뒤에 고정 앵커 아이콘을 배치하고 스크롤에도 설정영역이 표시되도록 고정해줘
1.6 COMP-17 메시지 넓이에 따라 텍스트 줄바꿈 허용
1.7 COMP-20 경우에 따라 아바타 수정 아이콘 표시상태 필요
1.8 COMP-19 트리 계층구조 적용 필요. 하위폴더 위치 이동기능 보완. 핸들을 드래그하면  타겟 위치 앵커표시하여 드룹시 이동처리. 보기모드 계층, 플렛 표시, 추가 삭제 기능 보완
1.9 COMP-22 슬라이드드래그휠 - 휠이벤트 적용시 첫요소, 마지막요소에 도달하면 스크로이벤트 동작. 도달하기 전까지는 스크롤 이벤트 전파방지.`;

  const agentResponse = fs.readFileSync('scripts/turn_0036_14_response.md', 'utf8');
  const responseSummary = 'DS-SHOWCASE 디자인시스템 테마 연동, 헤더·쉘 간소화 및 컴포넌트 5종 고도화 완료';

  const turn0036_14 = {
    trace_id: 'TRACE-0036-05-00-14',
    session_id: 'SESSION-0036',
    task_id: 'TASK-0036-05',
    loop_id: 'LOOP-0036-05',
    step_index: 14,
    turn_num: '14',
    turn_number: 14,
    turn_identifier: '[0036-14]',
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
  store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0036-05-00-14');
  store.traces.push({
    ...turn0036_14,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) {
    store.conversation_turns = [];
  }
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0036' && (t.turn_number === 14 || t.turn_identifier === '[0036-14]')));
  store.conversation_turns.push(turn0036_14);

  HarnessRepository.saveLocalStore(store);
  console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0036-14] 동기화 완료');

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
      'TRACE-0036-05-00-14', 'SESSION-0036', 'TASK-0036-05', 'LOOP-0036-05', 14, 'gemini', 'models/gemini-1.5-flash',
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
