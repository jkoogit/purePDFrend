import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
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

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('================================================================');
  console.log('🔍 [1단계] GitHub 이슈 및 PR 점검');
  console.log('================================================================');

  const issuesRes = await requestGitHub<any[]>('/issues?state=open');
  const pullsRes = await requestGitHub<any[]>('/pulls?state=open');
  const openIssues = (issuesRes.body || []).filter((i: any) => !i.pull_request);
  const openPulls = pullsRes.body || [];

  console.log(`현재 열린 이슈 수: ${openIssues.length}`);
  openIssues.forEach((i: any) => console.log(` - 이슈 #${i.number}: ${i.title}`));
  console.log(`현재 열린 PR 수: ${openPulls.length}`);
  openPulls.forEach((p: any) => console.log(` - PR #${p.number}: ${p.title}`));

  console.log('\n================================================================');
  console.log('🌿 [2단계] 원격 브랜치 커밋 SHA 일치 점검 (main, stg, dev)');
  console.log('================================================================');

  const mainRef = await requestGitHub<any>('/git/ref/heads/main');
  const devRef = await requestGitHub<any>('/git/ref/heads/dev');
  const stgRef = await requestGitHub<any>('/git/ref/heads/stg');

  const mainSha = mainRef.body?.object?.sha;
  const devSha = devRef.body?.object?.sha;
  const stgSha = stgRef.body?.object?.sha;

  console.log(`- main SHA: ${mainSha}`);
  console.log(`- stg  SHA: ${stgSha}`);
  console.log(`- dev  SHA: ${devSha}`);

  const isBranchesSynced = (mainSha === devSha && devSha === stgSha);
  console.log(`3대 브랜치 일치 여부: ${isBranchesSynced ? '✅ 100% 일치' : 'ℹ️ 차이 확인됨 (dev: ' + devSha + ')'}`);

  console.log('\n================================================================');
  console.log('🎫 [3단계] SESSION-0029 신규 GitHub 이슈 등록');
  console.log('================================================================');

  const issueTitle = '[0029_01] top 영역가운데 와이어프레임 목록 표시, tokens.ts 디자인 토큰 전면 대입 현황 검토 및 미처리 화면 대입조치';
  const issueBody = `## 📌 세션 정보
- **세션 ID**: \`SESSION-0029\`
- **세션명**: \`[0029] top 영역가운데 와이어프레임 목록 표시, tokens.ts 디자인 토큰 전면 대입 현황 검토 및 미처리 화면 대입조치\`
- **작업자**: Gemini 3.8 Flash / jkoogit (jkoogit@gmail.com)
- **작업 그룹**: \`purePDFrend\`
- **기준 브랜치**: \`dev\` (${devSha})

## 🎯 핵심 작업 목표
1. **[공통 쉘(Shell) 컴포넌트 아키텍처 구축]**:
   - 23개 와이어프레임 화면의 개별 레이아웃 파편화를 해소하는 3대 공통 쉘(AdminShell, UserShell, StudioShell) 컴포넌트 구축
   - 공통 쉘 내 BrandLogo(4모드 적응형) 및 상단 글로벌 테마/권한 스위치 기본 탑재
2. **[상단 네비게이션 및 와이어프레임 바로가기 개선]**:
   - Top 글로벌 헤더 가운데 영역에 와이어프레임 화면 목록 퀵 점프 드롭다운/내비게이션 배치
3. **[디자인 토큰 전면 대입 현황 검토 및 미처리 화면 대입 조치]**:
   - tokens.ts 기반 컬러, 타이포그래피, 간격, 둥글기 전면 적용 검토
   - 미처리된 화면(PG-USR-03 가상화 뷰어, PG-USR-04 BBox 캔버스, PG-USR-05 레이아웃 편집기 등) 전면 대입
4. **[TDD 단위 테스트, 린트/컴파일 무결성 검증]**:
   - 단위 테스트 보강 및 정적 린트/컴파일 무결성 100% 검증`;

  const newIssueRes = await requestGitHub('/issues', 'POST', {
    title: issueTitle,
    body: issueBody
  });
  const issueNumber = newIssueRes.body?.number;
  console.log(`✅ 신규 GitHub 이슈 등록 완료: #${issueNumber} (${newIssueRes.body?.html_url})`);

  console.log('\n================================================================');
  console.log('🌱 [4단계] 원격 dev 브랜치 기준 작업 브랜치 생성');
  console.log('================================================================');

  const branchName = 'task/0029_01_top_wireframe_list_tokens_apply_jkoogit';
  const targetSha = devSha;

  const createRefRes = await requestGitHub<any>('/git/refs', 'POST', {
    ref: `refs/heads/${branchName}`,
    sha: targetSha
  });

  if (createRefRes.status === 201) {
    console.log(`✅ 원격 작업 브랜치 [${branchName}] 생성 성공 (SHA: ${targetSha})`);
  } else if (createRefRes.status === 422) {
    console.log(`ℹ️ 브랜치 [${branchName}]가 이미 존재합니다. 참조 업데이트 시도...`);
    const updateRefRes = await requestGitHub<any>(`/git/refs/heads/${encodeURIComponent(branchName)}`, 'PATCH', {
      sha: targetSha,
      force: true
    });
    console.log(`✅ 원격 작업 브랜치 [${branchName}] 업데이트 결과 (${updateRefRes.status})`);
  } else {
    console.warn(`⚠️ 브랜치 생성 응답 상태: ${createRefRes.status}`, createRefRes.body);
  }

  console.log('\n================================================================');
  console.log('💾 [5단계] 하네스 스토어 (data/local_agent_store.json) 및 DB SESSION-0029 등록');
  console.log('================================================================');

  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const session0029 = {
    session_id: 'SESSION-0029',
    session_name: '[0029] top 영역가운데 와이어프레임 목록 표시, tokens.ts 디자인 토큰 전면 대입 현황 검토 및 미처리 화면 대입조치',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    status_cd: '진행중',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      objective: 'top 영역가운데 와이어프레임 목록 표시, tokens.ts 디자인 토큰 전면 대입 현황 검토 및 미처리 화면 대입조치',
      issue_number: issueNumber,
      branch: branchName,
      base_sha: targetSha,
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com',
      linked_from_session: 'SESSION-0028',
      reference_docs: [
        'docs/13.회고/13-22_SESSION-261011-0028_세션종합_KPT_회고록.md',
        'docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md',
        'docs/03.정책/03-13_UIUX_통일성_및_모바일반응형_디자인시스템_운영정책.md',
        'docs/05.설계/05-27_상단_글로벌_헤더_테마_스위처_및_관리자_API_1단계_설계서.md',
        'docs/05.설계/05-29_4모드_테마_시스템_및_권한별_시스템전환_상세설계서.md',
        'docs/10.리뷰/261011_048_테마별_PDFrend_로고_적응형_브랜딩_및_4모드_시스템_전환_코드리뷰.md',
        'src/styles/tokens.ts',
        'AGENTS.md v2.2',
        'GEMINI.md v1.0.0'
      ],
      tasks: [
        {
          task_id: 'TASK-0029-01',
          task_name: 'top 영역 가운데 와이어프레임 목록 표시 및 tokens.ts 디자인 토큰 전면 대입 계획 수립 및 쉘 구조 설계',
          status: '준비'
        }
      ]
    },
    created_sys: 'agent-harness',
    created_by: 'jkoogit',
    updated_sys: 'agent-harness',
    updated_by: 'jkoogit',
    version: 1,
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com'
  };

  const otherSessions = (store.sessions || []).filter((s: any) => s.session_id !== 'SESSION-0029');
  store.sessions = [session0029, ...otherSessions];

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 현행화 완료 (SESSION-0029 등록됨)`);

  // DB에 SESSION-0029 반영
  try {
    const insertS29Sql = `
      INSERT INTO aiagent.harness_session_meta (
        session_id, session_name, work_group, ai_agent, ai_model,
        status_cd, started_at, ended_at, doc_payload,
        created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        ${escapeSql(session0029.session_id)}, ${escapeSql(session0029.session_name)}, ${escapeSql(session0029.work_group)}, ${escapeSql(session0029.ai_agent)}, ${escapeSql(session0029.ai_model)},
        '진행중', ${escapeSql(session0029.started_at)}, NULL, ${escapeSql(JSON.stringify(session0029.doc_payload))}::jsonb,
        'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 1
      ) ON CONFLICT (session_id) DO UPDATE SET
        session_name = EXCLUDED.session_name,
        status_cd = EXCLUDED.status_cd,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = now();
    `;
    const resS29 = await executeSql(insertS29Sql);
    console.log('✅ 원격 DB aiagent.harness_session_meta (SESSION-0029) 등록 결과:', resS29?.success ? '성공' : resS29?.error);
  } catch (err: any) {
    console.warn('⚠️ 원격 DB 동기화 예외 (로컬 폴백 정상 유지됨):', err.message);
  }

  console.log('\n================================================================');
  console.log('🎉 SESSION-0029 세션 초기화 완료!');
  console.log('================================================================');
}

main().catch(console.error);
