import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

async function main() {
  const store = HarnessRepository.getLocalStore();
  if (!Array.isArray(store.tasks)) {
    store.tasks = [];
  }

  const existingIdx = store.tasks.findIndex((t: any) => t.task_id === 'TASK-0035-01');
  const taskData = {
    task_id: 'TASK-0035-01',
    session_id: 'SESSION-0035',
    task_name: '서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화',
    status_cd: '완료',
    git_branch: 'task/0035_01_admin_p5_api_pdf_viewer_Gemini',
    started_at: '2026-10-24T06:55:00.000Z',
    ended_at: new Date().toISOString(),
    priority: 'HIGH',
    status: 'COMPLETED',
    assigned_agent: 'gemini',
    doc_payload: {
      scope: '서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화',
      branch: 'task/0035_01_admin_p5_api_pdf_viewer_Gemini',
      issue_number: 100,
      backlog_ids: ['BACKLOG-0035-01'],
      design_doc: 'docs/05.설계/05-32_서비스화면_중심_디자인시스템_토큰_통합_및_네비게이션_단일화_설계서.md',
      review_doc: 'docs/10.리뷰/261024_057_서비스화면_중심_디자인시스템_토큰_통합_및_네비게이션_단일화_코드리뷰.md',
      commit_sha: '74463000ff8c3f38c95a0f7bef09c034f6829c7c',
      promoted_sha: '97502b76f91e48ce84a2597e92e52c2550d30365',
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com'
    }
  };

  if (existingIdx >= 0) {
    store.tasks[existingIdx] = { ...store.tasks[existingIdx], ...taskData };
  } else {
    store.tasks.unshift(taskData);
  }

  HarnessRepository.saveLocalStore(store);
  console.log('✅ store.tasks TASK-0035-01 완료 저장 완료');

  const res = await HarnessRepository.upsertTask(taskData);
  console.log('✅ Remote DB upsertTask 완료:', res);
}

main().catch(console.error);
