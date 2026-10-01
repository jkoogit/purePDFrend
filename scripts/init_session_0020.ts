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

  if (openIssues.length > 0 || openPulls.length > 0) {
    console.warn('⚠️ 미종료된 원격 Issue 또는 PR이 존재합니다. 확인 필요.');
  }

  console.log('\n================================================================');
  console.log('📦 [2단계] SESSION-0019 아카이빙 및 data/archives 저장');
  console.log('================================================================');

  const storePath = 'data/local_agent_store.json';
  const currentStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const nowIso = new Date().toISOString();
  const nowFileStr = nowIso.replace(/:/g, '-');
  const archivePath = path.join('data', 'archives', `local_agent_store_SESSION-0019_${nowFileStr}.json`);
  fs.writeFileSync(archivePath, JSON.stringify(currentStore, null, 2), 'utf8');
  console.log(`✅ SESSION-0019 아카이빙 완료: ${archivePath}`);

  console.log('\n================================================================');
  console.log('🐙 [3단계] GitHub Issue 등록 for SESSION-0020');
  console.log('================================================================');

  const issuePayload = {
    title: '[0020_01]_PG-USR-06_고성능_가상스크롤_PDF전용뷰어_연동_및_독서서지_툴바UI_고도화',
    body: `## 📌 세션 정보
- **세션 ID**: \`SESSION-0020\`
- **세션명**: \`[0020] PG-USR-06 고성능 가상 스크롤 PDF 전용 뷰어 연동 및 독서/서지 툴바 UI 고도화\`
- **작업자**: Gemini 3.8 Flash / jkok2j2m@gmail.com
- **기준 SHA**: \`${devSha}\`
- **대상 화면**: \`PG-USR-06\` (PDF 전용 뷰어 \`/viewer\`) & \`PG-USR-05\` (문서관리 연동)

## 🎯 주요 작업 목표
1. **[화면 전환 연동]** PG-USR-05 문서관리 라이브러리에서 도서/문서 클릭 시 PG-USR-06 PDF 전용 뷰어로 스무스 라우팅 및 선택 문서 로딩
2. **[고성능 가상 스크롤러]** 800쪽 이상 대용량 문서를 위한 60fps 가상 스크롤러(Virtualizer) 및 LRU 페이지 메모리 가드 연동
3. **[독서/서지 전용 툴바]** 줌(확대/축소/맞춤), 회전(좌/우 90°), 페이지 이동(슬라이더+직접입력), 검색(Searchable PDF 하이라이트)
4. **[독서 진행도 & 메타데이터 연동]** 독서 진행도(최근 읽은 쪽수, 진행률) 및 도서 서지정보 패널 연계
5. **[반응형 UX]** 모바일 및 데스크톱 환경에 최적화된 뷰어 레이아웃 및 디자인 시스템(정책 03-13, 03-14) 준수`
  };

  const newIssue = await requestGitHub<any>('/issues', 'POST', issuePayload);
  const issueNumber = newIssue.body?.number;
  console.log(`✅ GitHub 이슈 등록 완료: #${issueNumber} (${newIssue.body?.html_url})`);

  console.log('\n================================================================');
  console.log('🌿 [4단계] 원격 작업 브랜치 생성: task/0020_01_가상스크롤뷰어연동_툴바고도화_Gemini');
  console.log('================================================================');

  const branchName = 'task/0020_01_가상스크롤뷰어연동_툴바고도화_Gemini';
  const branchRes = await requestGitHub<any>('/git/refs', 'POST', {
    ref: `refs/heads/${branchName}`,
    sha: devSha
  });
  console.log(`✅ 원격 브랜치 생성 상태: ${branchRes.status}`);

  console.log('\n================================================================');
  console.log('💾 [5단계] 하네스 스토어(local_agent_store.json) 및 PostgreSQL 동기화');
  console.log('================================================================');

  const session0020 = {
    session_id: 'SESSION-0020',
    session_name: '[0020] PG-USR-06 고성능 가상 스크롤 PDF 전용 뷰어 연동 및 독서/서지 툴바 UI 고도화',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    status_cd: '진행중',
    started_at: nowIso,
    ended_at: null,
    doc_payload: {
      objective: 'PG-USR-05 문서관리 라이브러리에서 책/문서 클릭 시 PG-USR-06 PDF 전용 뷰어로 부드러운 화면 전환, 800쪽 이상 대용량 문서를 위한 60fps 가상 스크롤러(Virtualizer) 및 LRU 페이지 메모리 가드 연동, 전용 상단 툴바(줌, 회전, 쪽이동, Searchable PDF 검색), 독서진행도/서지정보 연계',
      issue_number: issueNumber,
      branch: branchName,
      base_sha: devSha,
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com',
      reference_docs: [
        'docs/13.회고/13-15_SESSION-261001-0019_세션종합_KPT_회고록.md',
        'docs/05.설계/05-22_화면프로그램ID체계표_및_정보구조_IA_설계서.md',
        'docs/10.리뷰/260924_026_800쪽_대용량_가상뷰어_메모리가드_및_로컬실행환경_보완_리뷰.md',
        'docs/05.설계/05-12_800쪽_대용량_가상화_뷰어_및_메모리가드_설계.md',
        'docs/03.정책/03-13_UIUX_통일성_및_모바일반응형_디자인시스템_운영정책.md',
        'docs/03.정책/03-14_모바일반응형_카드전환_및_가로스크롤_원천방지_디자인가이드.md'
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

  const updatedSessions = [session0020, ...currentStore.sessions.filter((s: any) => s.session_id !== 'SESSION-0020')];
  const newStore = {
    sessions: updatedSessions,
    tasks: currentStore.tasks,
    loops: currentStore.loops
  };

  fs.writeFileSync(storePath, JSON.stringify(newStore, null, 2), 'utf8');
  console.log('✅ local_agent_store.json 업데이트 완료');

  const insertSql = `
    INSERT INTO aiagent.harness_session_meta (
      session_id, session_name, work_group, ai_agent, ai_model,
      status_cd, started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      '${session0020.session_id}',
      '${session0020.session_name.replace(/'/g, "''")}',
      '${session0020.work_group}',
      '${session0020.ai_agent}',
      '${session0020.ai_model}',
      '${session0020.status_cd}',
      '${session0020.started_at}',
      NULL,
      '${JSON.stringify(session0020.doc_payload).replace(/'/g, "''")}'::jsonb,
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
    console.warn('⚠️ 원격 DB 등록 오류 (로컬 스토어 유지):', err);
  }

  console.log('\n🎉 [세션시작] SESSION-0020 초기화 및 거버넌스 등록 완결!');
}

main().catch(console.error);
