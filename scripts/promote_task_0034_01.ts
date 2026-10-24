import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

async function main() {
  console.log('🚀 [TASK-0034-01] 태스크 상태 완료 승급 시작...');

  const result = await HarnessRepository.upsertTask({
    task_id: 'TASK-0034-01',
    session_id: 'SESSION-0034',
    task_name: 'Phase 4 관리자 2단계 핵심화면(PG-ADM-05~08) 실제 REST API 연동 및 관리자 전 화면 tokens.ts 전면 완결',
    status_cd: '완료',
    git_branch: 'task/0034_01_admin_p4_api_tokens_Gemini',
    started_at: '2026-10-24T05:15:31.944Z',
    ended_at: new Date().toISOString(),
    doc_payload: {
      scope: 'Phase 4 관리자 2단계 핵심화면(PG-ADM-05~08) 실제 REST API 연동 및 관리자 잔여화면(PG-ADM-09~16) tokens.ts 전면 대입',
      branch: 'task/0034_01_admin_p4_api_tokens_Gemini',
      issue_number: 99,
      backlog_ids: [
        'BACKLOG-0033-01',
        'BACKLOG-0033-02'
      ],
      reviewDoc: 'docs/10.리뷰/261024_056_Phase4_관리자_2단계_API_연동_및_관리자_tokens_전면완결_코드리뷰.md',
      commitSha: 'a1e21a7d',
      status: '완료',
      promotedSha: 'a1e21a7dd7b485ad7a57842edf61932d556ed0f6',
      promotedAt: new Date().toISOString()
    },
    priority: 'HIGH',
    status: 'COMPLETED',
    assigned_agent: 'gemini'
  });

  console.log('✅ 태스크 승급 결과:', JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error('❌ 태스크 승급 실패:', err);
  process.exit(1);
});
