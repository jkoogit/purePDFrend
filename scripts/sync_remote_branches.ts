import '../src/shared/envLoader';
import https from 'https';
import { runComprehensiveServiceCheck } from './service_health_check';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function requestGitHub<T = any>(
  endpoint: string,
  method = 'GET',
  data?: any
): Promise<{ status: number; body: T }> {
  return new Promise((resolve, reject) => {
    if (!GITHUB_TOKEN) {
      return reject(new Error('GITHUB_TOKEN is not set in environment variables.'));
    }
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`, {
      method,
      headers: {
        'User-Agent': 'purePDFrend-sync-agent',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        } : {}),
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          const parsed = text ? JSON.parse(text) : {};
          resolve({ status: res.statusCode || 200, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode || 200, body: text as any });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function getBranchCommitSha(branch: string): Promise<string> {
  const res = await requestGitHub(`/git/ref/heads/${encodeURIComponent(branch)}`);
  if (res.status !== 200) {
    throw new Error(`Failed to get ref for ${branch}: status ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.object.sha;
}

async function updateBranchRef(branch: string, sha: string, force = true) {
  const res = await requestGitHub(`/git/refs/heads/${encodeURIComponent(branch)}`, 'PATCH', {
    sha,
    force,
  });
  if (res.status !== 200) {
    // If ref does not exist yet, try creating it
    if (res.status === 404 || res.status === 422) {
      const createRes = await requestGitHub('/git/refs', 'POST', {
        ref: `refs/heads/${branch}`,
        sha,
      });
      return createRes;
    }
    throw new Error(`Failed to update ${branch} to ${sha}: ${JSON.stringify(res.body)}`);
  }
  return res;
}

async function main() {
  console.log('=== [purePDFrend] GitHub Remote Branch Synchronization ===\n');

  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN이 환경변수에 설정되어 있지 않습니다.');
    console.error('   AI Studio 설정(Settings -> Secrets)에서 GITHUB_TOKEN을 등록해주세요.');
    process.exit(1);
  }

  // Pre-flight check
  console.log('0. 서비스 전수점검 4단계 무결성 검증...');
  const { allPassed } = await runComprehensiveServiceCheck();
  if (!allPassed) {
    console.warn('⚠️  경고: 서비스 점검 중 일부 확인 필요 항목이 있으나 동기화를 계속 진행합니다.');
  } else {
    console.log('✅ 서비스 전수점검 통과!\n');
  }

  // 1. Fetch main commit sha
  console.log('1. 원격 main 브랜치 최신 커밋 확인 중...');
  const mainSha = await getBranchCommitSha('main');
  console.log(`   원격 main 최신 SHA: ${mainSha}`);

  // 2. Sync to dev branch
  console.log(`2. dev 브랜치를 main(${mainSha.slice(0, 8)})과 동기화 중...`);
  await updateBranchRef('dev', mainSha, true);
  console.log('   ✅ dev 브랜치 반영 완료');

  // 3. Sync to stg branch
  console.log(`3. stg 브랜치를 main(${mainSha.slice(0, 8)})과 동기화 중...`);
  await updateBranchRef('stg', mainSha, true);
  console.log('   ✅ stg 브랜치 반영 완료');

  // 4. Sync to task branch
  const taskBranch = 'task/모바일UX_IA개편_Gemini';
  console.log(`4. 작업 브랜치 '${taskBranch}'를 최신 SHA(${mainSha.slice(0, 8)})로 동기화 중...`);
  await updateBranchRef(taskBranch, mainSha, true);
  console.log(`   ✅ ${taskBranch} 브랜치 반영 완료`);

  // 5. Verify all branches
  console.log('\n5. 동기화 최종 검증:');
  const [devSha, stgSha, taskSha, finalMainSha] = await Promise.all([
    getBranchCommitSha('dev'),
    getBranchCommitSha('stg'),
    getBranchCommitSha(taskBranch),
    getBranchCommitSha('main'),
  ]);

  console.log(`   - main  : ${finalMainSha}`);
  console.log(`   - dev   : ${devSha}`);
  console.log(`   - stg   : ${stgSha}`);
  console.log(`   - task  : ${taskSha}`);

  if (devSha === mainSha && stgSha === mainSha && taskSha === mainSha) {
    console.log('\n🎉 [완료] main, dev, stg, 작업 브랜치가 100% 동일한 최신 커밋으로 동기화되었습니다!');
  } else {
    console.warn('\n⚠️ 일부 브랜치의 SHA가 상이합니다. 확인이 필요합니다.');
  }
}

main().catch((err) => {
  console.error('동기화 실패:', err);
  process.exit(1);
});
