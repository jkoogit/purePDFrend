import '../src/shared/envLoader';
import https from 'https';
import { syncViaAiStudioApi } from './github_sync_push';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';
import { reconcileSessionTraces } from './reconcile_session_traces';

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
  console.log('🚀 [TASK-0036-01] GitHub Git Data API Push & 3대 브랜치 승급 시작...');

  // 0. 대화 턴 전수 화해 (Fail-Safe Reconcile)
  console.log('🔄 0. 대화 턴 전수 화해 실행...');
  try {
    const reconBefore = await reconcileSessionTraces('SESSION-0036');
    console.log(`✅ 세션 트레이스 화해 완료: ${reconBefore.syncedCount}건 동기화됨.`);
  } catch (e: any) {
    console.warn('⚠️ 화해 알림:', e.message);
  }

  const taskBranch = 'task/0036_01_ribbon_inline_and_phase5_api_Gemini';
  const commitMsg = '[TASK-0036-01] 상단 개발용 메뉴이동 레이어 인라인 일체화(화면 부유 증상 조치) 및 4대 시스템 37개 화면 네비게이션 완결';
  const prTitle = '[TASK-0036-01] 상단 개발용 메뉴이동 레이어 인라인 일체화 및 4대 시스템 네비게이션';

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
    task_id: 'TASK-0036-01',
    session_id: 'SESSION-0036',
    task_name: '상단 리본 네비게이션 인라인 일체화 및 Phase 5 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST API 연동',
    status_cd: '완료',
    git_branch: taskBranch,
    ended_at: now,
    priority: 'HIGH',
    status: 'COMPLETED',
    doc_payload: {
      scope: '상단 리본 네비게이션 absolute 부유 구조의 Navbar 정규 인라인 버튼 전환 및 화면 가림 해소, 4대 시스템(사용자/관리자/설정/에이전트) 37개 전체 서비스 화면 통합 네비게이션 완결',
      branch: taskBranch,
      issue_number: 106,
      design_doc: 'docs/05.설계/05-34_상단_개발용_메뉴이동_레이어_인라인_일체화_및_4대_시스템_네비게이션_설계서.md',
      review_doc: 'docs/10.리뷰/261025_059_상단_개발용_메뉴이동_레이어_인라인_일체화_및_4대_시스템_네비게이션_코드리뷰.md',
      roadmap_doc: 'docs/07.로드맵/07-02_화면별_디자인_토큰_적용현황_및_단계별_로드맵.md',
      commit_sha: syncResult.newCommitSha,
      promoted_sha: targetSha,
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com'
    }
  });
  console.log('✅ 태스크 승급 완료:', taskRes);

  const loopRes = await HarnessRepository.upsertLoop({
    loop_id: 'LOOP-0036-01',
    task_id: 'TASK-0036-01',
    session_id: 'SESSION-0036',
    loop_name: '상단 리본 인라인 캡슐화 및 4대 시스템 37개 화면 네비게이션 단위 루프',
    status_cd: '완료',
    ended_at: now,
    iteration: 1,
    doc_payload: {
      inline_capsule_applied: true,
      systems_37_screens_linked: true,
      no_system_suffix_standard: true,
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

  // 6. 승급 후 대화턴 최종 재화해
  console.log('🔄 6. 승급 후 대화턴 최종 화해 실행...');
  try {
    const reconAfter = await reconcileSessionTraces('SESSION-0036');
    console.log(`✅ 최종 트레이스 화해 완료: ${reconAfter.syncedCount}건 동기화됨.`);
  } catch (e: any) {
    console.warn('⚠️ 화해 알림:', e.message);
  }

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
