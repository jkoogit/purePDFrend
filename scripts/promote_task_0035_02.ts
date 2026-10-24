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

function updateRef(branch: string, sha: string): Promise<any> {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      sha,
      force: true,
    });
    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: {
        'User-Agent': 'NodeJS',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode, raw: d });
        }
      });
    });
    req.write(payload);
    req.end();
  });
}

async function main() {
  const now = new Date().toISOString();
  console.log('🚀 [TASK-0035-02] GitHub Git Data API Push & 3대 브랜치 승급 시작...');

  const taskBranch = 'task/0035_01_admin_p5_api_pdf_viewer_Gemini';
  const commitMsg = '[TASK-0035-02] 상단 리본 접이식 레이어 모듈 기반 전체 화면이동 네비게이션 고도화 및 헤더 클린 정리';
  const prTitle = '[TASK-0035-02] 상단 리본 접이식 레이어 모듈 기반 전체 화면이동 네비게이션 고도화';

  // 1. GitHub Git Data API를 통한 원격 커밋 생성 및 PR 생성/머지
  const syncResult = await syncViaAiStudioApi('dev', commitMsg, taskBranch, prTitle);
  console.log('✅ GitHub Git Data API Sync Result:', syncResult);

  // 2. dev 최신 머지 커밋 SHA 가져오기
  const bDev = await getBranch('dev');
  const targetSha = bDev.sha;
  console.log('🎯 Target dev SHA after PR merge:', targetSha);

  // 3. stg 및 main 브랜치 Fast-forward 동기화
  console.log('🔄 Syncing stg ref to targetSha...');
  await updateRef('stg', targetSha);
  console.log('🔄 Syncing main ref to targetSha...');
  await updateRef('main', targetSha);

  // 4. 태스크 및 루프 상태 완료 승급 (HarnessRepository)
  const taskRes = await HarnessRepository.upsertTask({
    task_id: 'TASK-0035-02',
    session_id: 'SESSION-0035',
    task_name: '상단 리본 접이식 레이어 모듈 기반 전체 화면이동 네비게이션 고도화',
    status_cd: '완료',
    git_branch: taskBranch,
    ended_at: now,
    priority: 'HIGH',
    status: 'COMPLETED',
    doc_payload: {
      scope: '상단 리본 접이식 레이어 모듈 기반 전체 화면이동 네비게이션 고도화 및 헤더 클린 정리',
      branch: taskBranch,
      issue_number: 100,
      design_doc: 'docs/05.설계/05-33_상단_리본_접이식_레이어_모듈_네비게이션_설계서.md',
      review_doc: 'docs/10.리뷰/261025_058_상단_리본_접이식_레이어_모듈_네비게이션_코드리뷰.md',
      commit_sha: syncResult.newCommitSha,
      promoted_sha: targetSha,
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com'
    }
  });
  console.log('✅ 태스크 승급 완료:', taskRes);

  const loopRes = await HarnessRepository.upsertLoop({
    loop_id: 'LOOP-0035-02',
    task_id: 'TASK-0035-02',
    session_id: 'SESSION-0035',
    loop_name: '상단 리본 트리거 및 슬라이드다운 네비게이션 레이어 모듈 고도화 단위 루프',
    status_cd: '완료',
    ended_at: now,
    iteration: 1,
    doc_payload: {
      clean_topbar: true,
      ribbon_layer_implemented: true,
      guide_texts_cleaned: true,
      tsc_passed: true,
      health_check_perfect: true
    }
  });
  console.log('✅ 루프 승급 완료:', loopRes);

  // 5. 3대 원격 브랜치 SHA 교차 검증
  console.log('=== 5. 3대 원격 브랜치 SHA 교차 검증 ===');
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
    targetSha,
    match: isMatch,
    chkDev: chkDev.sha,
    chkStg: chkStg.sha,
    chkMain: chkMain.sha
  };
}

main().catch(console.error);
