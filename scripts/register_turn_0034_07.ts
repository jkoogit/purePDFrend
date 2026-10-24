import fs from 'fs';
import path from 'path';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';
import { reconcileSessionTraces } from './reconcile_session_traces';

const store = HarnessRepository.getLocalStore();

const userPrompt = `#세션프롬프트 [0034] Phase 4 관리자 2단계 핵심화면(PG-ADM-05~08) 실제 REST API 연동 및 관리자 전 화면 tokens.ts 전면 완결 후속 세션 제안`;
const agentResponse = fs.readFileSync(path.resolve('scripts/turn_0034_07_response.md'), 'utf-8');
const responseSummary = 'SESSION-0034 세션정리 결과 확인 및 차기 세션(SESSION-0035) 시작 프롬프트 제안 보고 (세션 완료 확인, 이슈 #99 종결, dev/stg/main SHA d1d66875 100% 일치, 회고록 13-27 및 로드맵 v1.5.0 현행화, 잔여 백로그 3건 이관, 차기 세션 시작 프롬프트 코드블록 제시)';

const turn0034_07 = {
  trace_id: 'TRACE-0034-01-00-07',
  session_id: 'SESSION-0034',
  task_id: 'TASK-0034-01',
  loop_id: 'LOOP-0034-01',
  step_index: 7,
  turn_num: '7',
  turn_number: 7,
  turn_identifier: '[0034-07]',
  operator_account: 'jkok2j2m',
  agent_account: 'jkok2j2m@gmail.com',
  user_email: 'jkok2j2m@gmail.com',
  user_prompt: userPrompt,
  agent_response: agentResponse,
  response_summary: responseSummary,
  status: 'SUCCESS',
  created_at: new Date().toISOString()
};

// store.traces 동기화
if (!Array.isArray(store.traces)) {
  store.traces = [];
}
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0034-01-00-07');
store.traces.push({
  ...turn0034_07,
  agent_name: 'gemini',
  model_name: 'models/gemini-1.5-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

// store.conversation_turns 동기화
if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0034' && (t.turn_number === 7 || t.turn_identifier === '[0034-07]')));
store.conversation_turns.push(turn0034_07);

HarnessRepository.saveLocalStore(store);
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0034-07] 동기화 완료');

async function main() {
  const recon = await reconcileSessionTraces();
  console.log(`✅ [0034-07] 세션 대화턴 전수 Reconcile 완료: ${recon.syncedCount}건 동기화됨.`);
}

main().catch(err => {
  console.error('Reconcile error:', err);
});
