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
  console.log(`3대 브랜치 일치 여부: ${isBranchesSynced ? '✅ 100% 일치' : 'ℹ️ 차이 확인됨'}`);

  console.log('\n================================================================');
  console.log('🎫 [3단계] SESSION-0024 신규 GitHub 이슈 등록');
  console.log('================================================================');

  const issueTitle = '[0024_01] PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토 및 충돌 정리 프로세스 수립';
  const issueBody = `## 📌 세션 정보
- **세션 ID**: \`SESSION-0024\`
- **세션명**: \`[0024] PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토 및 충돌 정리 프로세스 수립\`
- **작업자**: Gemini 3.8 Flash / jkoogit (jkoogit@gmail.com)
- **작업 그룹**: \`purePDFrend\`
- **기준 브랜치**: \`dev\` (${devSha})

## 🎯 핵심 작업 목표
1. **[보정조치] 이전세션 폴더 및 문서 인코딩 깨짐 보정**:
   - docs 폴더 및 기존 기술문서/회고록 중 깨진 파일명 및 본문 인코딩 전수 점검 및 UTF-8 보정
2. **[컨텐츠 재검토] PG-USR-08 오프라인모드 및 충돌머지 화면 분석**:
   - 오프라인 동기화 큐, 로컬 IndexedDB 캐시 상태, 충돌 발생 시 3-Way 머지 뷰어 분석
3. **[프로세스 수립] 충돌 정리 프로세스 수립**:
   - 오프라인 작업 후 온라인 재연결 시 발생하는 버전 충돌/낙관적 락 충돌 해소 절차 설계 및 정책화`;

  const newIssueRes = await requestGitHub('/issues', 'POST', {
    title: issueTitle,
    body: issueBody
  });
  const issueNumber = newIssueRes.body?.number;
  console.log(`✅ 신규 GitHub 이슈 등록 완료: #${issueNumber} (${newIssueRes.body?.html_url})`);

  console.log('\n================================================================');
  console.log('🌱 [4단계] 원격 dev 브랜치 기준 작업 브랜치 생성');
  console.log('================================================================');

  const branchName = 'task/0024_01_오프라인충돌머지_Gemini';
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
  console.log('💾 [5단계] 하네스 스토어 (data/local_agent_store.json) 및 DB SESSION-0024 등록');
  console.log('================================================================');

  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const session0024 = {
    session_id: 'SESSION-0024',
    session_name: '[0024] PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토 및 충돌 정리 프로세스 수립',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    status_cd: '진행중',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      objective: 'PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토, 이전세션 폴더 및 문서 인코딩 깨짐 보정 조치, 충돌 정리 프로세스 수립',
      issue_number: issueNumber,
      branch: branchName,
      base_sha: targetSha,
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com',
      linked_from_session: 'SESSION-0023',
      reference_docs: [
        'docs/04.기획/04-03_사용자화면_UIUX_상세기획서.md',
        'docs/05.설계/05-01_전체_아키텍처_및_가상화_설계.md',
        'docs/10.리뷰/261004_039_슬라이드화살표제거_협업설정버튼정돈_주석문서영역_전체화면_몰입형독서_코드리뷰.md',
        'docs/13.회고/13-17_SESSION-261004-0023_세션종합_KPT_회고록.md',
        'AGENTS.md v2.3'
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

  const otherSessions = (store.sessions || []).filter((s: any) => s.session_id !== 'SESSION-0024');
  store.sessions = [session0024, ...otherSessions];

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 현행화 완료 (SESSION-0024 등록됨)`);

  // DB에 SESSION-0024 반영
  try {
    const insertS24Sql = `
      INSERT INTO aiagent.harness_session_meta (
        session_id, session_name, work_group, ai_agent, ai_model,
        status_cd, started_at, ended_at, doc_payload,
        created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        ${escapeSql(session0024.session_id)}, ${escapeSql(session0024.session_name)}, ${escapeSql(session0024.work_group)}, ${escapeSql(session0024.ai_agent)}, ${escapeSql(session0024.ai_model)},
        '진행중', ${escapeSql(session0024.started_at)}, NULL, ${escapeSql(JSON.stringify(session0024.doc_payload))}::jsonb,
        'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 1
      ) ON CONFLICT (session_id) DO UPDATE SET
        session_name = EXCLUDED.session_name,
        status_cd = EXCLUDED.status_cd,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = now();
    `;
    const resS24 = await executeSql(insertS24Sql);
    console.log('✅ 원격 DB aiagent.harness_session_meta (SESSION-0024) 등록 결과:', resS24?.success ? '성공' : resS24?.error);
  } catch (err: any) {
    console.warn('⚠️ 원격 DB 동기화 예외 (로컬 폴백 정상 유지됨):', err.message);
  }

  console.log('\n================================================================');
  console.log('🎉 SESSION-0024 세션 초기화 완료!');
  console.log('================================================================');
}

main().catch(console.error);
