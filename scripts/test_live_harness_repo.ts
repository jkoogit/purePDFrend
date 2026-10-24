import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

async function testLive() {
  console.log('🧪 Testing HarnessRepository Live UPSERT...');

  const taskRes = await HarnessRepository.upsertTask({
    task_id: 'TASK-0033-02',
    session_id: 'SESSION-0033',
    task_name: '[0033-02] 하네스 태스크/세션 UPSERT 스키마 헬퍼 함수 표준화 및 도메인 레포지토리 리팩토링',
    status_cd: '진행중',
    git_branch: 'task/0033_02_harness_repo_refactor_Gemini',
    priority: 'HIGH',
    doc_payload: {
      plan_items: [
        '1. 하네스 메타 엔티티 타입 표준화 (src/aiagent/domain/harness/types.ts)',
        '2. 하네스 도메인 레포지토리 구현 (src/aiagent/domain/harness/HarnessRepository.ts)',
        '3. Express 서버 REST API 확장 (POST /api/agent/sessions, tasks, loops in server.ts)',
        '4. TDD 단위 테스트 및 무결성 검증 (tests/harness_repository_schema.test.ts)',
        '5. 아키텍처 학습 문서 발행 (docs/15.학습/15-25...)'
      ],
      completed_items: [
        '1. src/aiagent/domain/harness/types.ts 표준화 완료',
        '2. src/aiagent/domain/harness/HarnessRepository.ts 구현 완료',
        '3. server.ts POST /api/agent/sessions, tasks, loops 라우트 장착 완료',
        '4. tests/harness_repository_schema.test.ts 8개 전수 테스트 통과'
      ]
    }
  });
  console.log('Task UPSERT Result:', taskRes);

  const loopRes = await HarnessRepository.upsertLoop({
    loop_id: 'LOOP-0033-02',
    task_id: 'TASK-0033-02',
    session_id: 'SESSION-0033',
    loop_name: '하네스 3대 메타 DDL 정규화 및 리포지토리 듀얼 영속화 단위 루프',
    status_cd: '진행중',
    iteration: 1,
    doc_payload: {
      tested_entities: ['session', 'task', 'loop'],
      sql_schema_compliant: true
    }
  });
  console.log('Loop UPSERT Result:', loopRes);
}

testLive().catch(console.error);
