import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import { reconcileSessionTraces } from './reconcile_session_traces';

async function main() {
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const promptText = `#세션프롬프트 
- 세션0036 마감 결과 확인
- 화면구조 리뷰
- 요소 배치확인(다른 요소보다 앞에 표시되어 화면에 떠있는 증상 조치)`;

  const responseSummary = 'SESSION-0035 마감 결과 종합 확인(이슈 #100 closed, dev=stg=main a1e25e80 100% 일치, 100점 만점 헬스체크), 화면구조 리뷰 및 상단 리본 트리거(#btn-top-ribbon-trigger) absolute top-0 z-50 화면 부유 결함 원인 분석 및 Navbar 인라인 정규 버튼 일체화 조치 방안 제시, 차기 세션(0036) 시작 프롬프트 제안';

  const respPath = path.join(process.cwd(), 'scripts', 'turn_0035_11_response.md');
  const agentResponse = fs.readFileSync(respPath, 'utf8');

  const nowIso = new Date().toISOString();
  const traceId = 'TRACE-0035-02-00-11';

  const turn0035_11 = {
    trace_id: traceId,
    session_id: 'SESSION-0035',
    task_id: 'TASK-0035-02',
    loop_id: 'LOOP-0035-02',
    step_index: 11,
    turn_num: '11',
    turn_number: 11,
    turn_identifier: '[0035-11]',
    operator_account: 'jkok2j2m',
    agent_account: 'jkok2j2m@gmail.com',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: promptText,
    agent_response: agentResponse,
    response_summary: responseSummary,
    status: 'SUCCESS',
    created_at: nowIso
  };

  if (!Array.isArray(store.traces)) store.traces = [];
  store.traces = store.traces.filter((t: any) => t.trace_id !== traceId);
  store.traces.push({
    ...turn0035_11,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) store.conversation_turns = [];
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0035' && (t.turn_number === 11 || t.turn_identifier === '[0035-11]')));
  store.conversation_turns.push(turn0035_11);

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('Turn 11 saved to local store.');

  const r = await reconcileSessionTraces();
  console.log('Reconciled traces:', r);
}

main().catch(console.error);
