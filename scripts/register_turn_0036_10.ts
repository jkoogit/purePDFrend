import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

async function main() {
  const store = HarnessRepository.getLocalStore();

  const userPrompt = `1. 메뉴바로가기 리뷰\n1.1 로고 클릭 화면과 첫화면 (랜딩) PG-USR-01 화면이 다른게 맞아? 로고 클릭화면이 렌딩화면으로 연결되어야 해. \n1.2 첫화면 (랜딩) PG-USR-01 이거는 와이어프레임 소스같아 보이는데, 와이어프레임은 서비스화면으로 재구성하고 와이어프레임은 확인하고 버리려고해. 메뉴바로가기는 와이어프레임 말고 서비스화면으로 이동하는게 맞아. \n1.3  두 화면의 소스가 다른가? 소스구조도 함께 설명해줘 - 서비스 화면의 메뉴별 소스파일, 와이어프레임 용으로 만든 메뉴별 소스파일 구조가 파악이 되어야 의사결정에 도움이 될 것 같아. \n2. 디자인시스템 쇼케이스 개선 : 아래 내용으로 정의된 화면이 DS-SHOWCASE 말고 더 있나? \n2.1 화면을 구성하는 토큰요소를 추가해줘(표준원자컴포넌트 유형) : top 레이어, body레이어, footer레이어, 화면타이틀영역, 입력필드, 검색입력필드, 선택목록, 실시간필터목록, 선택형직접입력콤보박스(아이콘 선택기능 옵션),  필터선택칩, 라디오버튼, 체크박스, 토글스위치, 건수뱃지, 상태뱃지, 카테고리트리(수정UI옵션-핸들드래그로 위치이동 시 타겟 엥커표시), 프로필아바타(수정옵션), 수평진행상태스테퍼, 탭네비게이션, 슬라이드드래그휠(이벤트전파차단, 첫번째와 마지막 요소를지나는 휠이벤트는 화면스크롤 처리), 롱프레스 툴팁 & 클립보드 원클릭 복사, ? 안내팝업레이어, 모바일바텀시트모달, 모바일하단네비게이션바, 오프라인인디케이터바, 인라인 시맨틱 피드백 배너, Bento 플랫 카드 컨테이너, 반응형 라벨·금액 분리 표시, 플로팅 빠른등록 레이어 도크, 플로팅 상태 피드백 토스트 레이어\n2.2 토큰요소 구현 코드 토글표시\n2.3 요소별 필요한 옵션, 상태 별 관리\n2.4 요소별 테마 대응 스타일 별 관리\n2.5 요소 하단에 사용화면 ID 표시 : 선택시 해당화면의 첫번째 요소로 이동\n2.6 화면내 요소 검색기능 화면타이틀 밑에 표시\n2.7 디자인 토큰 규격 유지 : 표준 색상 시스템, 4모드 테마 시스템 및 여명(Dawn) 블루 팔레트, 4pt 그리드 스페이싱 시스템, 모서리 둥글기 (Zero-Pill 규율)\n2.8 토큰요소의 텍스트는 모두 선택가능하도록 하자. \n3. 버튼명 수정\n3.1 로그인 / 권한시뮬 > 로그인 : document.querySelector("#btn-portal-open-login > span")\n4. 가로넓이 초과시 반응형 처리 : 라벨, 버튼명 등 요소의 텍스트를 줄바꿈하지 말고, 요소간 줄바꿈으로 처리되어야 함.\n4.1 document.querySelector("#root > div > main > div > div > div.p-3\\\\.5.sm\\\\:p-4.rounded-2xl.border.bg-white.border-slate-200.shadow-md.text-slate-900.flex.flex-col.sm\\\\:flex-row.sm\\\\:items-center.justify-between.gap-3.transition-colors.duration-200.shadow-lg > div.flex.items-center.gap-2.flex-wrap.justify-end > div > button.min-h-\\\\[38px\\\\].px-3\\\\.5.py-1\\\\.5.rounded-xl.text-xs.bg-white.hover\\\\:bg-slate-50.text-slate-700.border-slate-300.hover\\\\:border-slate-400.transition-colors.flex.items-center.gap-1\\\\.5.cursor-pointer")`;
  const agentResponse = fs.readFileSync('scripts/turn_0036_10_response.md', 'utf8');
  const responseSummary = '서비스화면 소스구조 분석 보고 및 즉각 UI 개선 / 디자인시스템 쇼케이스 로드맵 제안';

  const turn0036_10 = {
    trace_id: 'TRACE-0036-04-00-10',
    session_id: 'SESSION-0036',
    task_id: 'TASK-0036-04',
    loop_id: 'LOOP-0036-04',
    step_index: 10,
    turn_num: '10',
    turn_number: 10,
    turn_identifier: '[0036-10]',
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
  store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0036-04-00-10');
  store.traces.push({
    ...turn0036_10,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) {
    store.conversation_turns = [];
  }
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0036' && (t.turn_number === 10 || t.turn_identifier === '[0036-10]')));
  store.conversation_turns.push(turn0036_10);

  HarnessRepository.saveLocalStore(store);
  console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0036-10] 동기화 완료');

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
      'TRACE-0036-04-00-10', 'SESSION-0036', 'TASK-0036-04', 'LOOP-0036-04', 10, 'gemini', 'models/gemini-1.5-flash',
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
