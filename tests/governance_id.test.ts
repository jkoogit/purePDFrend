/**
 * @file tests/governance_id.test.ts
 * @description 거버넌스 4대 식별자(세션, 태스크, 루프, 대화턴) ID 채번 규칙 TDD 단위 검증
 */

import { GovernanceIdGenerator } from '../src/aiagent/domain/governance/GovernanceIdGenerator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

console.log('=== [TDD] 거버넌스 4대 식별자 표준 채번 엔진 단위 테스트 ===\n');

const fixedDate = new Date('2026-09-24T12:00:00Z');

// 1. 세션 ID 생성
const sessionId1 = GovernanceIdGenerator.generateSessionId(11, fixedDate);
assert(sessionId1 === 'SESSION-260924-0011', `1. 세션 ID 숫자 입력 포맷: ${sessionId1}`);

const sessionId2 = GovernanceIdGenerator.generateSessionId('0012', fixedDate);
assert(sessionId2 === 'SESSION-260924-0012', `2. 세션 ID 문자열 입력 포맷: ${sessionId2}`);

// 2. 태스크 ID 생성
const taskId1 = GovernanceIdGenerator.generateTaskId(11, 13, fixedDate);
assert(taskId1 === 'TASK-260924-0011-13', `3. 태스크 ID 표준 포맷: ${taskId1}`);

const taskId2 = GovernanceIdGenerator.generateTaskId('0011', '01', fixedDate);
assert(taskId2 === 'TASK-260924-0011-01', `4. 태스크 ID 문자열 포맷: ${taskId2}`);

// 3. 루프 ID 생성
const loopId1 = GovernanceIdGenerator.generateLoopId(11, 13, 1, fixedDate);
assert(loopId1 === 'LOOP-260924-0011-13-001', `5. 루프 ID 표준 포맷: ${loopId1}`);

const loopId2 = GovernanceIdGenerator.generateLoopId('0011', '01', '042', fixedDate);
assert(loopId2 === 'LOOP-260924-0011-01-042', `6. 루프 ID 문자열 포맷: ${loopId2}`);

// 4. 대화턴 ID 생성
const traceId1 = GovernanceIdGenerator.generateTraceId(11, 1);
assert(traceId1 === 'TRACE-0011-0001', `7. 대화턴 ID 표준 포맷: ${traceId1}`);

const traceId2 = GovernanceIdGenerator.generateTraceId('SESSION-260924-0011', 14);
assert(traceId2 === 'TRACE-0011-0014', `8. 대화턴 ID 세션문자열 포맷: ${traceId2}`);

// 5. 세션번호 추출 헬퍼
assert(GovernanceIdGenerator.extractSessionNumber('SESSION-260924-0011') === '0011', '9. 세션 ID에서 세션번호 추출 1');
assert(GovernanceIdGenerator.extractSessionNumber('SESSION-20260923-008') === '0008', '10. 세션 ID에서 세션번호 추출 2');
assert(GovernanceIdGenerator.extractSessionNumber('11') === '0011', '11. 단순 숫자에서 세션번호 추출');

console.log('\n===============================================================');
console.log('🎉 [PASS] 거버넌스 4대 식별자 채번 단위 테스트 11종 100% 통과!');
console.log('===============================================================\n');
