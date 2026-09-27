import https from 'https';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'jkoogit';
const REPO = 'purePDFrend';

function requestGitHub(endpoint: string, method = 'GET', data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: '/repos/' + OWNER + '/' + REPO + endpoint,
      method,
      headers: {
        'User-Agent': 'purePDFrend-Harness',
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); } catch (e) { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('=== Checking and creating missing PRs & Issues for Session 0015 ===');
  
  // 1. Check existing issues
  const issuesRes = await requestGitHub('/issues?state=all&per_page=100');
  const issues = Array.isArray(issuesRes.body) ? issuesRes.body : [];
  
  // Find if Issue for Task 0015-01 exists
  const has001501Issue = issues.some((i: any) => i.title.includes('0015_01') || (i.title.includes('0015') && i.title.includes('화면 UI')));
  console.log('Existing 0015 issues count:', issues.filter((i: any) => i.title.includes('0015')).length);

  // 2. Check existing PRs
  const prsRes = await requestGitHub('/pulls?state=all&per_page=100');
  const prs = Array.isArray(prsRes.body) ? prsRes.body : [];
  console.log('Existing 0015 PRs count:', prs.filter((p: any) => p.title.includes('0015')).length);

  // Ensure 작업 브랜치 for Task 0015-01: task/0015_01_화면UI기획_와이어프레임_Gemini exists on dev commit
  const devBranchRes = await requestGitHub('/branches/dev');
  const devSha = devBranchRes.body.commit.sha;
  console.log('Current dev SHA:', devSha);

  const targetBranch01 = 'task/0015_01_화면UI기획_와이어프레임_Gemini';
  const createRefRes01 = await requestGitHub('/git/refs', 'POST', {
    ref: `refs/heads/${targetBranch01}`,
    sha: devSha
  });
  console.log(`Branch '${targetBranch01}' create status:`, createRefRes01.status);

  // Create PR for 0015-01
  const pr01Title = '[0015_01] 화면 UI 기획 초안 및 반응형 와이어프레임 구조화';
  const pr01Body = `## [0015_01] purePDFrend 화면 UI 기획 초안 및 반응형 와이어프레임 구조화
- 관리자 16대 화면 및 사용자 9대 핵심 화면 UI 기획 초안 문서화
- 5대 논리 결함(오프라인 토큰 시스템속성화, 3단계 주석이벤트 등) 보완
- 단축키 및 도구그룹 관리, 도구 아이콘 디자인 리소스 관리 시스템 구축
- 3단 뷰포트 반응형 와이어프레임 스튜디오 구축 및 가드레일 전수 통과`;

  const pr01Res = await requestGitHub('/pulls', 'POST', {
    title: pr01Title,
    head: targetBranch01,
    base: 'dev',
    body: pr01Body
  });
  console.log('PR 0015_01 create status:', pr01Res.status);
  let pr01Number = pr01Res.body?.number;
  if (pr01Res.status === 201) {
    console.log(`Successfully created PR #${pr01Number}: ${pr01Title}`);
    // Merge PR
    const mergeRes = await requestGitHub(`/pulls/${pr01Number}/merge`, 'PUT', {
      commit_title: `Merge pull request #${pr01Number} from ${targetBranch01}`,
      commit_message: pr01Title,
      merge_method: 'merge'
    });
    console.log(`PR #${pr01Number} merge status:`, mergeRes.status);
  } else {
    console.log('PR response:', JSON.stringify(pr01Res.body));
  }

  // 3. Issue for 0015-02 (리소스점검)
  const issue02Title = '[0015_02]_리소스점검';
  const issue02Body = `## [0015_02] 리소스점검 및 GitHub 하네스(이슈/PR/브랜치) 거버넌스 현행화
1. 깨진 문서명/폴더 정리 (docs/10.리뷰, docs/18.메뉴얼, docs/06.기획)
2. GitHub 브랜치 명명 규칙 현행화 (\`task/세션번호_태스크번호_작업명_에이전트명\`)
3. GitHub 태스크정리 시 PR 자동 생성 및 dev 머지 파이프라인 연동
4. GitHub 세션시작 이슈명 패턴 현행화 (\`[세션번호_순번]_작업명\`)`;

  const issue02Res = await requestGitHub('/issues', 'POST', {
    title: issue02Title,
    body: issue02Body,
    labels: ['enhancement', 'governance']
  });
  console.log('Issue 0015_02 create status:', issue02Res.status, 'number:', issue02Res.body?.number);

  // 4. Create 작업 브랜치 for Task 0015-02
  const targetBranch02 = 'task/0015_02_리소스점검_Gemini';
  const createRefRes02 = await requestGitHub('/git/refs', 'POST', {
    ref: `refs/heads/${targetBranch02}`,
    sha: devSha
  });
  console.log(`Branch '${targetBranch02}' create status:`, createRefRes02.status);
}

main().catch(console.error);
