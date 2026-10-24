import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const store = HarnessRepository.getLocalStore();

const userPrompt = `1. 브라우저에서 요소 위치를 추적하려면 어떤 정보가 필요할까?
1.1  element : 
<div class="hidden md:flex items-center gap-1.5 lg:gap-2 bg-slate-900/90 border border-slate-800/90 p-1 rounded-xl shadow-inner shrink-0"><button id="btn-system-switch-service" class="min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 select-none text-slate-300 hover:text-white hover:bg-slate-800/80" title="PDF 서비스: PDF 뷰어, 편집, 듀얼 OCR 및 주석 비즈니스 포털"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-box w-3.5 h-3.5 shrink-0 text-indigo-400" aria-hidden="true"><path d="M14 2v5a1 1 0 001 1h5"></path><path d="M14.692 22H18a2 2 0 002-2V8a2.4 2.4 0 00-.706-1.706l-3.588-3.588A2.4 2.4 0 0014 2H6a2 2 0 00-2 2v3.804"></path><path d="M2.264 13.752 7 16.5l4.737-2.748"></path><path d="M2.995 13.014A2 2 0 002 14.744v3.516a2 2 0 00.996 1.73l3 1.74a2 2 0 002.008 0l3-1.74A2 2 0 0012 18.26v-3.517a2 2 0 00-.995-1.73l-3-1.742a2 2 0 00-1.892-.064z"></path><path d="M7 16.5V22"></path></svg><span>PDF 서비스</span></button><button id="btn-system-switch-settings" class="min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 select-none bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md ring-1 ring-white/20" title="서비스설정: 25개 와이어프레임 및 단축키/폰트/약관 환경설정 스튜디오"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings w-3.5 h-3.5 shrink-0 text-white" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg><span>서비스설정</span></button><button id="btn-system-switch-harness" class="min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 select-none text-slate-300 hover:text-white hover:bg-slate-800/80" title="에이전트관리: 하네스 작업그래프, 토큰 쿼터, 3계층 무결성 감사 마스터 시스템"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot w-3.5 h-3.5 shrink-0 text-indigo-400" aria-hidden="true"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg><span>에이전트관리</span></button><div class="relative pl-1 border-l border-slate-800"><button id="btn-role-simulator-dropdown" class="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer" title="권한 시뮬레이터: 다양한 사용자 역할로 시스템 전환 검증"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-check w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true"><path d="m16 11 2 2 4-4"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg><span class="font-semibold text-emerald-400">마스터관리자</span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down w-3 h-3 text-slate-400" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button></div></div>
1.2 html 
<div class="hidden md:flex items-center gap-1.5 lg:gap-2 bg-slate-900/90 border border-slate-800/90 p-1 rounded-xl shadow-inner shrink-0"><button id="btn-system-switch-service" class="min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 select-none text-slate-300 hover:text-white hover:bg-slate-800/80" title="PDF 서비스: PDF 뷰어, 편집, 듀얼 OCR 및 주석 비즈니스 포털"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-box w-3.5 h-3.5 shrink-0 text-indigo-400" aria-hidden="true"><path d="M14 2v5a1 1 0 001 1h5"></path><path d="M14.692 22H18a2 2 0 002-2V8a2.4 2.4 0 00-.706-1.706l-3.588-3.588A2.4 2.4 0 0014 2H6a2 2 0 00-2 2v3.804"></path><path d="M2.264 13.752 7 16.5l4.737-2.748"></path><path d="M2.995 13.014A2 2 0 002 14.744v3.516a2 2 0 00.996 1.73l3 1.74a2 2 0 002.008 0l3-1.74A2 2 0 0012 18.26v-3.517a2 2 0 00-.995-1.73l-3-1.742a2 2 0 00-1.892-.064z"></path><path d="M7 16.5V22"></path></svg><span>PDF 서비스</span></button><button id="btn-system-switch-settings" class="min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 select-none bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md ring-1 ring-white/20" title="서비스설정: 25개 와이어프레임 및 단축키/폰트/약관 환경설정 스튜디오"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings w-3.5 h-3.5 shrink-0 text-white" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg><span>서비스설정</span></button><button id="btn-system-switch-harness" class="min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 select-none text-slate-300 hover:text-white hover:bg-slate-800/80" title="에이전트관리: 하네스 작업그래프, 토큰 쿼터, 3계층 무결성 감사 마스터 시스템"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot w-3.5 h-3.5 shrink-0 text-indigo-400" aria-hidden="true"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg><span>에이전트관리</span></button><div class="relative pl-1 border-l border-slate-800"><button id="btn-role-simulator-dropdown" class="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer" title="권한 시뮬레이터: 다양한 사용자 역할로 시스템 전환 검증"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-check w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true"><path d="m16 11 2 2 4-4"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg><span class="font-semibold text-emerald-400">마스터관리자</span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down w-3 h-3 text-slate-400" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button></div></div>
1.3 selector
#root > div > div > header > div.h-14.sm\\:h-16.px-3.sm\\:px-6.flex.items-center.justify-between.gap-2.sm\\:gap-4 > div.hidden.md\\:flex.items-center.gap-1\\.5.lg\\:gap-2.bg-slate-900\\/90.border.border-slate-800\\/90.p-1.rounded-xl.shadow-inner.shrink-0
1.4 jsPath
document.querySelector("#root > div > div > header > div.h-14.sm\\:h-16.px-3.sm\\:px-6.flex.items-center.justify-between.gap-2.sm\\:gap-4 > div.hidden.md\\:flex.items-center.gap-1\\.5.lg\\:gap-2.bg-slate-900\\/90.border.border-slate-800\\/90.p-1.rounded-xl.shadow-inner.shrink-0")
1.5 style
...
1.6 xPath
//*[@id="root"]/div/div/header/div[2]/div[2]
1.7 fullxPath
/html/body/div/div/div/header/div[2]/div[2]
2. 위 1번에서 선택한 영역은 삭제해줘리본 접이식 레이어 모듈로 전환했으니 불필요
3. 접이식 화면이동 레이어모듈 정리
3.1 불필요 안내 삭제 : 전체 서비스 화면 네비게이션
25개 와이어프레임
사용자 비즈니스 도구 9종, 관리자 거버넌스 16종, 쇼케이스 화면으로 즉시 이동합니다.
3.2 불필요 안내 텍스트 삭제 : 
대시보드, 뷰어, 변환, 서재, OCR, 오프라인 작업 등
보안, 프로그램DAG, 사용자, 권한, 감사로그, 알림, API키, 단축키 등

1번 선택지중 어떤 값이 정확한 요소추적에 도움이 될까? 가능하면 간단한 text 로`;

const agentResponse = fs.readFileSync('scripts/turn_0035_08_response.md', 'utf8');
const responseSummary = '브라우저 요소 추적 정보 가이드(1.4 jsPath 및 1.1 element 추천), Navbar 중앙 시스템전환/역할시뮬레이터 영역 완전 삭제, WireframeRibbonLayer 불필요 안내 텍스트 및 보조 설명 삭제, tsc 0건, 4단계 헬스체크 100점 만점 통과';

const turn0035_08 = {
  trace_id: 'TRACE-0035-02-00-08',
  session_id: 'SESSION-0035',
  task_id: 'TASK-0035-02',
  loop_id: 'LOOP-0035-02',
  step_index: 8,
  turn_num: '8',
  turn_number: 8,
  turn_identifier: '[0035-08]',
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
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0035-02-00-08');
store.traces.push({
  ...turn0035_08,
  agent_name: 'gemini',
  model_name: 'models/gemini-1.5-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0035' && (t.turn_number === 8 || t.turn_identifier === '[0035-08]')));
store.conversation_turns.push(turn0035_08);

HarnessRepository.saveLocalStore(store);
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0035-08] 동기화 완료');

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
    'TRACE-0035-02-00-08', 'SESSION-0035', 'TASK-0035-02', 'LOOP-0035-02', 8, 'gemini', 'models/gemini-1.5-flash',
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
