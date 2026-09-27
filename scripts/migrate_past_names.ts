import https from 'https';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'jkoogit';
const REPO = 'purePDFrend';

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN is missing');
  process.exit(1);
}

function requestGitHub<T = any>(
  endpoint: string,
  method = 'GET',
  data?: any
): Promise<{ status: number; body: T }> {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}${endpoint}`,
      method,
      headers: {
        'User-Agent': 'purePDFrend-Migration',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 500, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode || 500, body: body as any });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// 1. 이슈 한글화 및 본문 주석 매핑 딕셔너리
const ISSUE_RENAME_MAP: Record<number, string> = {
  25: '[0015_02]_리소스점검',
  24: '[0015_01]_화면_UI_기획초안_및_반응형_와이어프레임_구조화',
  23: '[0014_01]_PDF_메타데이터_주입기_및_암호화_보안_엔진_구현',
  22: '[0013_04]_퍼시스턴스_최종_동기화_및_하네스_정합성_검증',
  21: '[0013_03]_웹워커_백그라운드_컴파일_및_서비스_매뉴얼_작성',
  20: '[0013_02]_다국어_OCR_병렬_배치큐_및_프로그레스_UI_구현',
  19: '[0013_01]_다국어_OCR_워커풀_엔진_구현',
  18: '[0012_04]_하이브리드_Git_파이프라인_동기화',
  17: '[0012_03]_세션_DR_스냅샷_디둡_클린징_및_전역_UTF8_가드레일',
  16: '[0012_02]_인메모리_설정관리자_및_2웨이_BBox_인라인_교정기',
  15: '[0012_01]_투명텍스트_레이어_결합_Searchable_PDF_내보내기',
  14: '[0011_03]_PDF_페이지_레이아웃_편집기_및_무제한_실행취소_구현',
  13: '[0011_02]_800쪽_가상뷰어_메모리가드_및_로컬실행환경_보완',
  12: '[0011_01]_거버넌스_4대_식별자_포맷_및_기술문서체계_표준화',
  11: '[0010_02]_PDF_이미지_전처리_및_3대_OCR_엔진_어댑터_구현',
  10: '[0010_01]_스캔도서_양면분할_및_테두리트리밍_알고리즘_구현',
  9: '[0009_02]_복수계정_토큰정책_세션자원현행화_및_모델설정_구현',
  8: '[0009_01]_재해복구_관제실_UI_스냅샷_파일화_및_메타거버넌스_구축',
  7: '[0008_01]_비LLM_긴급Push_다차원_토큰쿼터_엔진_구축',
  6: '[0007_01]_PostgreSQL_aiagent_5대_메타원장테이블_마이그레이션',
  5: '[0006_01]_토큰소진방지_자가적응형_쿼터관리_및_DDD_리팩토링',
  4: '[0005_01]_상단메뉴_버전위치_정돈_및_대화턴_뷰어버튼명_표준화',
  3: '[0004_01]_DB테이블_인덱스개선_및_전수점검_가드레일_구축',
  2: '[0003_01]_GitHub_원격동기화_누락방지_자동푸시_파이프라인_구축',
  1: '[0001_01]_바이브코딩_환경구축_및_에이전트_관리설계'
};

// 2. PR 한글화 및 본문 주석 매핑 딕셔너리
const PR_RENAME_MAP: Record<number, string> = {
  26: '[0015_02]_리소스점검_및_하네스_거버넌스_현행화',
  22: '[0013_04]_퍼시스턴스_최종_동기화',
  21: '[0013_03]_웹워커_백그라운드_컴파일_파이프라인_구축_및_서비스_매뉴얼_작성',
  20: '[0013_02]_다국어_OCR_병렬_배치큐_및_프로그레스_UI',
  19: '[0013_02]_다국어_OCR_워커풀_엔진_및_세부_프로그레스바_UI',
  18: '[0012_04]_하이브리드_Git_파이프라인_동기화',
  17: '[0012_03]_세션_DR_스냅샷_디둡_클린징_및_전역_UTF8_가드레일',
  16: '[0012_02]_인메모리_설정관리자_및_2웨이_BBox_인라인_교정기',
  15: '[0012_01]_투명텍스트_레이어_결합_Searchable_PDF_내보내기',
  14: '[0011_03]_PDF_페이지_레이아웃_편집기_및_무제한_실행취소_구현',
  13: '[0011_02]_800쪽_가상뷰어_메모리가드_및_로컬실행환경_보완',
  12: '[0011_01]_거버넌스_4대_식별자_포맷_및_기술문서체계_표준화',
  11: '[0010_02]_PDF_이미지_전처리_및_3대_OCR_엔진_어댑터_구현',
  10: '[0010_01]_스캔도서_양면분할_및_테두리트리밍_알고리즘_구현',
  9: '[0009_02]_복수계정_토큰정책_세션자원현행화_및_모델설정_구현',
  8: '[0009_01]_재해복구_관제실_UI_스냅샷_파일화_및_메타거버넌스_구축',
  7: '[0008_01]_비LLM_긴급Push_다차원_토큰쿼터_엔진_구축',
  6: '[0007_01]_PostgreSQL_aiagent_5대_메타원장테이블_마이그레이션',
  5: '[0006_01]_토큰소진방지_자가적응형_쿼터관리_및_DDD_리팩토링',
  4: '[0005_01]_상단메뉴_버전위치_정돈_및_대화턴_뷰어버튼명_표준화',
  3: '[0004_01]_DB테이블_인덱스개선_및_전수점검_가드레일_구축',
  2: '[0003_01]_GitHub_원격동기화_누락방지_자동푸시_파이프라인_구축',
  1: '[0001_01]_바이브코딩_환경구축_및_에이전트_관리설계'
};

// 3. 브랜치명 변경 매핑 (구이름 -> 신규 한글화 표준 이름)
const BRANCH_RENAME_MAP: Record<string, string> = {
  'task/0013_0019_manual-and-worker-pipeline_Gemini': 'task/0013_03_웹워커_컴파일_및_매뉴얼작성_Gemini',
  'task/0012_0015_layout-editor-and-dr-fix_Gemini': 'task/0012_03_레이아웃편집기_및_재해복구_Gemini',
  'task/0011_0013_governance-id-and-docs_Gemini': 'task/0011_01_식별자포맷_및_문서표준화_Gemini',
  'task/0005_모바일반응형UX_gemini': 'task/0005_01_모바일반응형UX_Gemini',
  'task/0004_에이전트프로세스혁신_gemini': 'task/0004_01_에이전트프로세스혁신_Gemini',
  'task/user-model-token-policy_Gemini': 'task/0009_02_사용자모델_토큰정책_Gemini',
  'task/session-20260917-001-cleanup': 'task/0001_01_세션정리_Gemini',
  'task/pdf-ocr-correction-studio_Gemini': 'task/0010_01_PDF_OCR교정스튜디오_Gemini',
  'task/pdf-metadata-security_Gemini': 'task/0014_01_PDF메타데이터_보안엔진_Gemini',
  'task/모바일UX_IA개편_Gemini': 'task/0005_02_모바일UX_정보구조개편_Gemini',
  'task/서비스기획_UI설계_Gemini': 'task/0015_01_서비스기획_UI설계_Gemini',
  'task/사용량_계정관리개선_Gemini': 'task/0009_01_사용량_계정관리개선_Gemini',
  'task/메타거버넌스_쿼터시스템_Gemini': 'task/0008_01_메타거버넌스_쿼터시스템_Gemini',
  'task/AGENTS_v2_1통합거버넌스_규약제정_gemini': 'task/0002_01_AGENTS_통합거버넌스제정_Gemini',
  'task/바이브코딩환경구축-및-에이전트관리설계_gemini': 'task/0001_01_바이브코딩환경구축_Gemini',
  'task/0015_01_화면UI기획_와이어프레임_Gemini': 'task/0015_01_화면UI기획_와이어프레임_Gemini',
  'task/0015_02_리소스점검_Gemini': 'task/0015_02_리소스점검_Gemini'
};

async function migrateIssues() {
  console.log('--- 1. Migrating GitHub Issues ---');
  const res = await requestGitHub<any[]>('/issues?state=all&per_page=100');
  const issues = Array.isArray(res.body) ? res.body : [];

  for (const issue of issues) {
    if (issue.pull_request) continue; // PR 제외
    const num = issue.number;
    const oldTitle = issue.title;
    const newTitle = ISSUE_RENAME_MAP[num] || oldTitle;

    // 본문에 변경 전 명칭 기재
    let currentBody = issue.body || '';
    if (!currentBody.includes('**[이슈명 변경 이력]**')) {
      currentBody = `> **[이슈명 변경 이력]**\n> - 변경 전: \`${oldTitle}\`\n> - 변경 후: \`${newTitle}\`\n\n---\n\n` + currentBody;
    }

    const patchRes = await requestGitHub(`/issues/${num}`, 'PATCH', {
      title: newTitle,
      body: currentBody
    });

    console.log(`Issue #${num}: [${patchRes.status}] "${oldTitle}" -> "${newTitle}"`);
    await new Promise(r => setTimeout(r, 120));
  }
}

async function migratePRs() {
  console.log('\n--- 2. Migrating GitHub Pull Requests ---');
  const res = await requestGitHub<any[]>('/pulls?state=all&per_page=100');
  const prs = Array.isArray(res.body) ? res.body : [];

  for (const pr of prs) {
    const num = pr.number;
    const oldTitle = pr.title;
    const newTitle = PR_RENAME_MAP[num] || oldTitle;

    let currentBody = pr.body || '';
    if (!currentBody.includes('**[PR명 변경 이력]**')) {
      currentBody = `> **[PR명 변경 이력]**\n> - 변경 전: \`${oldTitle}\`\n> - 변경 후: \`${newTitle}\`\n\n---\n\n` + currentBody;
    }

    const patchRes = await requestGitHub(`/pulls/${num}`, 'PATCH', {
      title: newTitle,
      body: currentBody
    });

    console.log(`PR #${num}: [${patchRes.status}] "${oldTitle}" -> "${newTitle}"`);
    await new Promise(r => setTimeout(r, 120));
  }
}

async function migrateBranches() {
  console.log('\n--- 3. Migrating GitHub Branches ---');
  const res = await requestGitHub<any[]>('/branches?per_page=100');
  const branches = Array.isArray(res.body) ? res.body : [];

  for (const b of branches) {
    const oldBranch = b.name;
    const sha = b.commit.sha;

    if (!BRANCH_RENAME_MAP[oldBranch]) continue;
    const newBranch = BRANCH_RENAME_MAP[oldBranch];

    if (oldBranch === newBranch) {
      console.log(`Branch '${oldBranch}' is already up-to-date.`);
      continue;
    }

    // 신규 브랜치 Ref 생성
    console.log(`Creating branch '${newBranch}' at commit ${sha}...`);
    const createRes = await requestGitHub('/git/refs', 'POST', {
      ref: `refs/heads/${newBranch}`,
      sha
    });

    if (createRes.status === 201 || createRes.status === 422) {
      console.log(`   ✅ Created/Verified '${newBranch}'`);
      // 구 브랜치 삭제
      const delRes = await requestGitHub(`/git/refs/heads/${encodeURIComponent(oldBranch)}`, 'DELETE');
      console.log(`   🗑️ Deleted old branch '${oldBranch}': [${delRes.status}]`);
    } else {
      console.error(`   ❌ Failed to create '${newBranch}':`, createRes.body);
    }

    await new Promise(r => setTimeout(r, 150));
  }
}

async function main() {
  console.log('=== [purePDFrend] 과거 이슈, PR, 브랜치 전수 현행화 작업 시작 ===\n');
  await migrateIssues();
  await migratePRs();
  await migrateBranches();
  console.log('\n=== 모든 과거 이슈, PR, 브랜치 전수 현행화 완료! ===');
}

main().catch(console.error);
