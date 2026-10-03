/**
 * @file tests/turn_trace_and_pull.test.ts
 * @description 대화 턴 전수 영속화, No-LLM 요약 추출 및 원격 dev 자동 Pull TDD 단위 테스트
 */

import { TurnTraceService } from '../src/aiagent/domain/token-quota/services/TurnTraceService';
import { pullRemoteDev } from '../scripts/pull_remote_dev.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

console.log('=== [TDD] 대화 턴 전수 영속화 및 No-LLM 요약 추출 단위 테스트 ===\n');

// 1. Heading 요약 추출 테스트
const markdownWithHeading = `# [0022_01] 계정 전환 및 샌드박스 초기화 시 원격 dev 소스 자동 Pull & 브랜치 정돈 거버넌스 수립
여기는 본문 내용입니다.
| 구분 | 내용 |
| --- | --- |
| 1 | 테스트 |`;

const summary1 = TurnTraceService.extractResponseSummary(markdownWithHeading);
assert(
  summary1 === '[0022_01] 계정 전환 및 샌드박스 초기화 시 원격 dev 소스 자동 Pull & 브랜치 정돈 거버넌스 수립',
  `1. Markdown heading(#) 추출 검증: ${summary1}`
);

// 2. Heading이 없을 때 일반 텍스트 라인 추출 테스트
const markdownWithoutHeading = `
> 인용문 블록
---
안녕하세요! 이번 세션에서 PDF 뷰어와 주석 도구 연동 기능을 검증하겠습니다.
추가 상세 설명...`;

const summary2 = TurnTraceService.extractResponseSummary(markdownWithoutHeading);
assert(
  summary2.includes('안녕하세요! 이번 세션에서 PDF 뷰어와 주석 도구 연동 기능을 검증하겠습니다.'),
  `2. 일반 텍스트 라인 추출 검증: ${summary2}`
);

// 3. task_id 정규화 및 TASK-FREE 폴백 검증
const taskId1 = TurnTraceService.normalizeTaskId(null, null);
assert(taskId1 === 'TASK-FREE', `3. Null task_id 폴백: ${taskId1}`);

const taskId2 = TurnTraceService.normalizeTaskId('', '');
assert(taskId2 === 'TASK-FREE', `4. Empty task_id 폴백: ${taskId2}`);

const taskId3 = TurnTraceService.normalizeTaskId(undefined, 'TASK-0022-01');
assert(taskId3 === 'TASK-0022-01', `5. Active task_id 계승: ${taskId3}`);

const taskId4 = TurnTraceService.normalizeTaskId('TASK-CUSTOM-99', 'TASK-0022-01');
assert(taskId4 === 'TASK-CUSTOM-99', `6. 명시적 task_id 우선: ${taskId4}`);

// 4. buildTraceRecord의 100% 무손실 보존 검증
const samplePrompt = '사용자 전체 프롬프트: 표와 코드가 포함됨\n```ts\nconst a = 10;\n```';
const sampleResponse = '# 응답 제목\n응답 내용 전문...';

const record = TurnTraceService.buildTraceRecord({
  session_id: 'SESSION-0022',
  task_id: null,
  step_index: 2,
  user_prompt: samplePrompt,
  agent_response: sampleResponse,
  prompt_tokens: 1500,
  completion_tokens: 800,
});

assert(record.session_id === 'SESSION-0022', `7. session_id 보존: ${record.session_id}`);
assert(record.task_id === 'TASK-FREE', `8. task_id 자유대화 매핑: ${record.task_id}`);
assert(record.step_index === 2, `9. step_index 순번: ${record.step_index}`);
assert(record.user_prompt === samplePrompt, `10. user_prompt 100% 전문 일치`);
assert(record.agent_response === sampleResponse, `11. agent_response 100% 전문 일치`);
assert(record.response_summary === '응답 제목', `12. No-LLM 요약 추출: ${record.response_summary}`);
assert(record.total_tokens === 2300, `13. 토큰 합계 계산: ${record.total_tokens}`);

// 5. pullRemoteDev 함수 export 검증
assert(typeof pullRemoteDev === 'function', `14. pullRemoteDev 함수 import 가능`);

console.log('\n🎉 전수 14개 단위 테스트 검증 100% 통과 (PASS)!');
