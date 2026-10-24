import '../src/shared/envLoader';
import https from 'https';
import { syncViaAiStudioApi } from './github_sync_push';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function getBranch(branch: string): Promise<any> {
  return new Promise((resolve) => {
    https.get(`https://api.github.com/repos/${OWNER}/${REPO}/branches/${branch}`, {
      headers: {
        'User-Agent': 'NodeJS',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          resolve({ branch, sha: json.commit?.sha || json.message });
        } catch (e) {
          resolve({ branch, error: d });
        }
      });
    });
  });
}

async function main() {
  const now = new Date().toISOString();
  console.log('🚀 [TASK-0035-01] GitHub Git Data API Push & 3대 브랜치 승급 시작...');

  const taskBranch = 'task/0035_01_admin_p5_api_pdf_viewer_Gemini';
  const commitMsg = '[TASK-0035-01] 서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화';
  const prTitle = '[TASK-0035-01] 서비스 화면 중심 디자인 시스템 토큰 통합 및 네비게이션 단일화';

  // 1. GitHub Git Data API를 통한 원격 커밋 생성 및 dev/stg/main 동기화 승급
  const syncResult = await syncViaAiStudioApi('dev', commitMsg, taskBranch, prTitle);
  console.log('✅ GitHub Git Data API Sync Result:', syncResult);

  // 2. 태스크 및 루프 상태 완료 승급 (HarnessRepository)
  const taskRes = await HarnessRepository.upsertTask({
    task_id: 'TASK-0035-01',
    session_id: 'SESSION-0035',
    task_name: '서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화',
    status_cd: '완료',
    git_branch: taskBranch,
    ended_at: now,
    priority: 'HIGH',
    status: 'COMPLETED',
    doc_payload: {
      scope: '서비스 화면 중심 디자인 시스템(tokens.ts) 일관성 완결 및 네비게이션 중복 정리·Top 단일화',
      branch: taskBranch,
      issue_number: 100,
      backlog_ids: ['BACKLOG-0035-01'],
      design_doc: 'docs/05.설계/05-32_서비스화면_중심_디자인시스템_토큰_통합_및_네비게이션_단일화_설계서.md',
      review_doc: 'docs/10.리뷰/261024_057_서비스화면_중심_디자인시스템_토큰_통합_및_네비게이션_단일화_코드리뷰.md',
      commit_sha: syncResult.newCommitSha,
      promoted_sha: syncResult.newCommitSha,
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com'
    }
  });
  console.log('✅ 태스크 승급 완료:', taskRes);

  const loopRes = await HarnessRepository.upsertLoop({
    loop_id: 'LOOP-0035-01',
    task_id: 'TASK-0035-01',
    session_id: 'SESSION-0035',
    loop_name: '서비스 화면 디자인 토큰 일관성 확보 및 상단 네비게이션 단일화 단위 루프',
    status_cd: '완료',
    ended_at: now,
    iteration: 1,
    doc_payload: {
      clean_header: true,
      tokens_applied: true,
      tsc_passed: true,
      health_check_perfect: true
    }
  });
  console.log('✅ 루프 승급 완료:', loopRes);

  // 3. 3대 원격 브랜치 SHA 교차 검증
  console.log('=== 3. 3대 원격 브랜치 SHA 교차 검증 ===');
  const [chkDev, chkStg, chkMain] = await Promise.all([
    getBranch('dev'),
    getBranch('stg'),
    getBranch('main')
  ]);
  console.log('Dev Branch SHA :', chkDev.sha);
  console.log('Stg Branch SHA :', chkStg.sha);
  console.log('Main Branch SHA:', chkMain.sha);
  const isMatch = chkDev.sha === chkStg.sha && chkStg.sha === chkMain.sha;
  console.log('🎉 3대 브랜치 100% 일치 여부:', isMatch);

  return {
    success: true,
    newCommitSha: syncResult.newCommitSha,
    match: isMatch,
    chkDev: chkDev.sha,
    chkStg: chkStg.sha,
    chkMain: chkMain.sha
  };
}

main().catch(console.error);
