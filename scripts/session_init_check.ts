import '../src/shared/envLoader';
import https from 'https';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function requestGitHub<T = any>(endpoint: string, method = 'GET', data?: any): Promise<{ status: number; body: T }> {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`, {
      method,
      headers: {
        'User-Agent': 'purePDFrend-agent',
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

async function run() {
  console.log('--- 1. Checking open issues and PRs ---');
  const issuesRes = await requestGitHub<any[]>('/issues?state=open');
  const pullsRes = await requestGitHub<any[]>('/pulls?state=open');

  const openIssues = (issuesRes.body || []).filter((i: any) => !i.pull_request);
  const openPulls = pullsRes.body || [];

  console.log(`Open Issues: ${openIssues.length}`);
  openIssues.forEach((i: any) => console.log(` - Issue #${i.number}: ${i.title}`));
  console.log(`Open PRs: ${openPulls.length}`);
  openPulls.forEach((p: any) => console.log(` - PR #${p.number}: ${p.title}`));

  console.log('\n--- 2. Checking branch SHAs ---');
  const mainRef = await requestGitHub<any>('/git/ref/heads/main');
  const devRef = await requestGitHub<any>('/git/ref/heads/dev');
  const stgRef = await requestGitHub<any>('/git/ref/heads/stg');

  const mainSha = mainRef.body?.object?.sha;
  const devSha = devRef.body?.object?.sha;
  const stgSha = stgRef.body?.object?.sha;

  console.log(`main SHA: ${mainSha}`);
  console.log(`dev  SHA: ${devSha}`);
  console.log(`stg  SHA: ${stgSha}`);
  console.log(`Branches synced: ${mainSha === devSha && devSha === stgSha}`);

  // Create issue for session 0012
  console.log('\n--- 3. Creating session 0012 issue ---');
  const issuePayload = {
    title: '[SESSION-260924-0012] PDF 페이지 레이아웃 편집기 및 Searchable PDF 내보내기 구현',
    body: `## 📌 세션 정보
- **세션 ID**: \`SESSION-260924-0012\`
- **세션명**: \`[0012]PDF 페이지 레이아웃 편집기 및 투명 텍스트 레이어 임베딩 Searchable PDF 내보내기 구현\`
- **작업자**: Gemini 3.7 Flash / jkoogit
- **기준 SHA**: \`${mainSha}\`

## 🎯 주요 작업 목표
1. **[TASK-01]** PDF 페이지 레이아웃 편집기 (회전 90/180/270, 삭제, 드래그앤드롭 재정렬)
2. **[TASK-02]** 투명 텍스트 레이어 임베딩 Searchable PDF 내보내기 파이프라인
3. **[TASK-03]** 2-Way BBox 캔버스 인라인 텍스트 교정기(OCRCorrectionStudio) UI/UX 완성
4. **[TASK-04]** 다중 페이지 OCR 처리 시 배치 진행률 및 SessionResourceManager 쿼터 연동 피드백
5. **[추가작업]** 세션 스냅샷 중복 생성 방지, 유실 데이터 분리, DR 복구 시 이력 취합/클린징 및 REST API 반영
6. **[추가작업]** 긴급 Push 프로세스 정돈 및 개발환경별 UTF-8 인코딩 깨짐 영구 방어`
  };

  const newIssue = await requestGitHub<any>('/issues', 'POST', issuePayload);
  console.log(`New Issue Created: #${newIssue.body?.number} (${newIssue.body?.html_url})`);

  // Create work branch on remote
  console.log('\n--- 4. Creating remote work branch ---');
  const branchName = 'task/0012_0015_layout-editor-and-dr-fix_Gemini';
  const createRefRes = await requestGitHub<any>('/git/refs', 'POST', {
    ref: `refs/heads/${branchName}`,
    sha: devSha
  });
  console.log(`Branch ${branchName} creation status: ${createRefRes.status}`);
}

run().catch(console.error);
