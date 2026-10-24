import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import { reconcileSessionTraces } from './reconcile_session_traces';

const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const nowIso = new Date().toISOString();
const traceId = 'TRACE-0033-02-00-10';
const promptText = `#세션프롬프트 화면별 디자인 토큰(tokens.ts) 적용 현황 점검 및 처리 계속`;
const responseSummary = 'SESSION-0033 세션프롬프트 완료: 세션정리 작업결과(이슈/PR 0건, dev/stg/main b6d4f2e9 일치, 회고 13-26 발행, 백로그 3건 이관) 확인 및 차기 SESSION-0034(Phase 4 관리자 2단계 PG-ADM-05~08 실제 REST API 연동 및 관리자 전 화면 tokens.ts 전면 완결) 세션시작 프롬프트 제안';

const agentResponse = fs.readFileSync(path.join(process.cwd(), 'scripts', 'turn_0033_10_response.md'), 'utf8');

const turn0033_10 = {
  trace_id: traceId,
  session_id: 'SESSION-0033',
  task_id: 'TASK-0033-02',
  loop_id: 'LOOP-0033-02',
  step_index: 10,
  turn_num: '10',
  turn_number: 10,
  turn_identifier: '[0033-10]',
  operator_account: 'jkok2j2m',
  agent_account: 'jkok2j2m@gmail.com',
  user_email: 'jkok2j2m@gmail.com',
  user_prompt: promptText,
  agent_response: agentResponse,
  response_summary: responseSummary,
  status: 'SUCCESS',
  created_at: nowIso,
  agent_name: 'gemini',
  model_name: 'models/gemini-1.5-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
};

if (!Array.isArray(store.traces)) store.traces = [];
store.traces = store.traces.filter((t: any) => t.trace_id !== traceId);
store.traces.push(turn0033_10);

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('Turn 10 registered in local store.');

reconcileSessionTraces().then((res) => {
  console.log('Reconciliation result:', res);
  process.exit(0);
}).catch((err) => {
  console.error('Reconciliation failed:', err);
  process.exit(1);
});
