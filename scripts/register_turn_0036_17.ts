import '../src/shared/envLoader';
import fs from 'fs';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';
import { reconcileSessionTraces } from './reconcile_session_traces';

async function main() {
  const store = HarnessRepository.getLocalStore();

  const userPrompt = `#세션정리 : [0036] 상단 리본 네비게이션 인라인 일체화 및 30대 표준 컴포넌트 쇼케이스 완결 세션 마감
#세션프롬프트 - 화면리뷰 계속
 까지 일괄 처리해줘`;

  const agentResponse = fs.readFileSync('scripts/turn_0036_17_response.md', 'utf8');
  const responseSummary = '[0036] 상단 리본 네비게이션 인라인 일체화 및 30대 표준 컴포넌트 쇼케이스 완결 세션정리 및 신규 세션 프롬프트 보고';

  const turn0036_17 = {
    trace_id: 'TRACE-0036-05-00-17',
    session_id: 'SESSION-0036',
    task_id: 'TASK-0036-05',
    loop_id: 'LOOP-0036-05',
    step_index: 17,
    turn_num: '17',
    turn_number: 17,
    turn_identifier: '[0036-17]',
    operator_account: 'jkok2j2m',
    agent_account: 'jkok2j2m@gmail.com',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: userPrompt,
    agent_response: agentResponse,
    response_summary: responseSummary,
    status: 'SUCCESS',
    created_at: new Date().toISOString()
  };

  if (!Array.isArray(store.traces)) {
    store.traces = [];
  }
  store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0036-05-00-17');
  store.traces.push({
    ...turn0036_17,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) {
    store.conversation_turns = [];
  }
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0036' && (t.turn_number === 17 || t.turn_identifier === '[0036-17]')));
  store.conversation_turns.push(turn0036_17);

  HarnessRepository.saveLocalStore(store);
  console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0036-17] 동기화 완료');

  const reconRes = await reconcileSessionTraces('SESSION-0036');
  console.log('✅ 원격 DB 화해 결과:', reconRes);
}

main().catch(console.error);
