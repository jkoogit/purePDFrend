import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';
import path from 'path';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DB_BRIDGE_URL = process.env.REMOTE_DB_BRIDGE_URL || 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = process.env.REMOTE_DB_BRIDGE_SECRET || 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

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

function executeSql(sql: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ database: TARGET_DATABASE, sql });
    const req = https.request(DB_BRIDGE_URL + '/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-JKADH-SECRET': DB_BRIDGE_SECRET,
        'Authorization': 'Bearer ' + DB_BRIDGE_SECRET,
        'Content-Length': Buffer.byteLength(payload),
      },
      rejectUnauthorized: false,
      timeout: 20000,
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve({ error: body }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('================================================================');
  console.log('🔍 [1단계] 원격 저장소 상태 점검 (Issues, PRs, Branches)');
  console.log('================================================================');

  const issuesRes = await requestGitHub<any[]>('/issues?state=open');
  const pullsRes = await requestGitHub<any[]>('/pulls?state=open');
  const openIssues = (issuesRes.body || []).filter((i: any) => !i.pull_request);
  const openPulls = pullsRes.body || [];

  console.log(`Open Issues: ${openIssues.length}`);
  openIssues.forEach((i: any) => console.log(` - Issue #${i.number}: ${i.title}`));
  console.log(`Open PRs   : ${openPulls.length}`);
  openPulls.forEach((p: any) => console.log(` - PR #${p.number}: ${p.title}`));

  const devRef = await requestGitHub<any>('/git/ref/heads/dev');
  const stgRef = await requestGitHub<any>('/git/ref/heads/stg');
  const mainRef = await requestGitHub<any>('/git/ref/heads/main');

  const devSha = devRef.body?.object?.sha;
  const stgSha = stgRef.body?.object?.sha;
  const mainSha = mainRef.body?.object?.sha;

  console.log(`dev  SHA: ${devSha}`);
  console.log(`stg  SHA: ${stgSha}`);
  console.log(`main SHA: ${mainSha}`);
  console.log(`Branches synced: ${mainSha === devSha && devSha === stgSha}`);

  console.log('\n================================================================');
  console.log('📦 [2단계] 이전 스토어 아카이빙 및 data/archives 저장');
  console.log('================================================================');

  const storePath = 'data/local_agent_store.json';
  const currentStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const nowIso = new Date().toISOString();
  const nowFileStr = nowIso.replace(/:/g, '-');
  const archivePath = path.join('data', 'archives', `local_agent_store_SESSION-0020_${nowFileStr}.json`);
  fs.writeFileSync(archivePath, JSON.stringify(currentStore, null, 2), 'utf8');
  console.log(`✅ 아카이빙 완료: ${archivePath}`);

  console.log('\n================================================================');
  console.log('🐙 [3단계] GitHub Issue 등록 for SESSION-0023');
  console.log('================================================================');

  const issuePayload = {
    title: '[0023_01]_PG-USR-03_홈_대시보드_헤더_간소화_및_7대_PDF_도구_퀵_액션_연동',
    body: `## 📌 세션 정보
- **세션 ID**: \`SESSION-0023\`
- **세션명**: \`[0023] PG-USR-03 홈 대시보드 헤더 간소화 및 7대 PDF 도구 퀵 액션 연동\`
- **작업자**: Gemini 3.8 Flash / jkok2j2m@gmail.com
- **기준 SHA**: \`${devSha}\`
- **대상 화면**: \`PG-USR-03\` (사용자 홈 대시보드 \`/\`)

## 🎯 주요 작업 목표
1. **[헤더 영역 간소화]** 상단 헤더 영역의 불필요한 중복 요소 및 고밀도 배너 정돈, 슬림하고 정갈한 현대적 홈 레이아웃 구축
2. **[7대 PDF 도구 퀵 액션 연동]** 
   - 뷰어/읽기 (\`/viewer\`, PG-USR-06)
   - OCR 텍스트 추출/교정 (\`/ocr-correction\`, PG-USR-07)
   - 페이지 레이아웃/순서 편집 (\`/editor\`, PG-USR-08)
   - PDF 암호화 및 보안 정책 (\`/security\`, PG-USR-09)
   - 메타데이터 및 도서 서지 등록 (\`/metadata\`, PG-USR-10)
   - Searchable PDF 컴파일/내보내기 (\`/export\`, PG-USR-11)
   - 문서관리 라이브러리 (\`/documents\`, PG-USR-05)
3. **[원클릭 파일 업로드 & DnD 연계]** 홈 대시보드에서 PDF/이미지 드래그앤드롭 시 해당 도구로 즉시 인라인 전환 또는 파일 자동 전달
4. **[최근 작업 문서 & 독서 진행률 카드]** 사용자가 최근 열람/수정한 문서 및 독서 진행률을 한눈에 확인하고 즉시 이어보기 지원
5. **[반응형 UX & 통일 디자인 시스템]** 모바일 및 데스크톱 환경에서 완벽한 가로스크롤 방지(정책 03-14) 및 디자인 통일성(정책 03-13) 준수`
  };

  const newIssue = await requestGitHub<any>('/issues', 'POST', issuePayload);
  const issueNumber = newIssue.body?.number;
  console.log(`✅ GitHub 이슈 등록 완료: #${issueNumber} (${newIssue.body?.html_url})`);

  console.log('\n================================================================');
  console.log('🌿 [4단계] 원격 작업 브랜치 생성: task/0023_01_홈대시보드_7대도구연동_Gemini');
  console.log('================================================================');

  const branchName = 'task/0023_01_홈대시보드_7대도구연동_Gemini';
  const branchRes = await requestGitHub<any>('/git/refs', 'POST', {
    ref: `refs/heads/${branchName}`,
    sha: devSha
  });
  console.log(`✅ 원격 브랜치 생성 상태: ${branchRes.status}`);

  console.log('\n================================================================');
  console.log('💾 [5단계] 하네스 스토어(local_agent_store.json) 및 PostgreSQL 동기화');
  console.log('================================================================');

  const session0023 = {
    session_id: 'SESSION-0023',
    session_name: '[0023] PG-USR-03 홈 대시보드 헤더 간소화 및 7대 PDF 도구 퀵 액션 연동',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    status_cd: '진행중',
    started_at: nowIso,
    ended_at: null,
    doc_payload: {
      objective: 'PG-USR-03 홈 대시보드 헤더 간소화, 7대 PDF 핵심 도구 퀵 액션 카드 및 다이렉트 화면 전환 연계, 드래그앤드롭 파일 즉시 도구 연동, 최근 작업 문서 이어보기, 반응형 모바일/데스크톱 최적화',
      issue_number: issueNumber,
      branch: branchName,
      base_sha: devSha,
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com',
      reference_docs: [
        'docs/06.기획/06-03_PG_USR_03_홈대시보드_헤더간소화_및_7대PDF도구_전용작업화면_기획서.md',
        'docs/05.설계/05-22_화면프로그램ID체계표_및_정보구조_IA_설계서.md',
        'docs/03.정책/03-13_UIUX_통일성_및_모바일반응형_디자인시스템_운영정책.md',
        'docs/03.정책/03-14_모바일반응형_카드전환_및_가로스크롤_원천방지_디자인가이드.md',
        'docs/17.참고/261010_xodo분석/xodo_screen_review_analysis.md'
      ]
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 1,
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com'
  };

  const updatedSessions = [session0023, ...currentStore.sessions.filter((s: any) => s.session_id !== 'SESSION-0023')];
  // 새 세션 시작 시 이전 세션의 태스크 및 루프 잔여물을 배제하고 깔끔히 빈 배열로 초기화
  const newStore = {
    sessions: updatedSessions,
    tasks: [],
    loops: []
  };

  fs.writeFileSync(storePath, JSON.stringify(newStore, null, 2), 'utf8');
  console.log('✅ local_agent_store.json 업데이트 완료 (새 세션을 위한 tasks=[], loops=[] 초기화 적용)');

  const insertSql = `
    INSERT INTO aiagent.harness_session_meta (
      session_id, session_name, work_group, ai_agent, ai_model,
      status_cd, started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      '${session0023.session_id}',
      '${session0023.session_name.replace(/'/g, "''")}',
      '${session0023.work_group}',
      '${session0023.ai_agent}',
      '${session0023.ai_model}',
      '${session0023.status_cd}',
      '${session0023.started_at}',
      NULL,
      '${JSON.stringify(session0023.doc_payload).replace(/'/g, "''")}'::jsonb,
      'agent-harness', 'system', 'agent-harness', 'system', 1
    ) ON CONFLICT (session_id) DO UPDATE SET
      session_name = EXCLUDED.session_name,
      status_cd = EXCLUDED.status_cd,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now();
  `;

  try {
    const dbRes = await executeSql(insertSql);
    console.log('✅ 원격 DB aiagent.harness_session_meta 등록 완료:', dbRes);
  } catch (err) {
    console.warn('⚠️ 원격 DB 등록 안내 (로컬 스토어 안전 보장):', err);
  }

  console.log('\n🎉 [세션시작] SESSION-0023 초기화 및 거버넌스 등록 완결!');
}

main().catch(console.error);
