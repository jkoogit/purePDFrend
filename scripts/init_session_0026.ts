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
  console.log('🎫 [3단계] SESSION-0026 신규 GitHub 이슈 등록');
  console.log('================================================================');

  const issueTitle = '[0026_01] 통합 디자인시스템 기준요소 정의 및 단계적 화면 재구성';
  const issueBody = `## 📌 세션 정보
- **세션 ID**: \`SESSION-0026\`
- **세션명**: \`[0026] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성\`
- **작업자**: Gemini 3.8 Flash / jkoogit (jkoogit@gmail.com)
- **작업 그룹**: \`purePDFrend\`
- **기준 브랜치**: \`dev\` (${devSha})

## 🎯 핵심 작업 목표
1. **[통합 디자인시스템 정책 수립]**:
   - moabogo 디자인 패턴을 벤치마킹한 통합 디자인 정책 수립 (\`docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md\`)
   - Color Palette(Primary, Slate, Semantic), Typography Scale, Spacing(44px 터치타깃), Z-Index Scale 정의
   - 4대 특이케이스(밀도 이원화 compact/viewer, 캔버스 오버레이 z-index, 모바일 Table-to-Card, 복합키 Keycap/ToolIcon) 명문화
2. **[기준 컴포넌트 풀 구축]**:
   - \`src/shared/components/ui/\` 내 원자/분자 기준 컴포넌트 독립 개발
   - Button(다양한 변형 및 44px 터치), Input/Textarea, Card, Badge, Modal/Dialog, KeyCap, ToolIcon 개발 및 단위 검증
3. **[점진적 교체 1단계]**:
   - 비즈니스 로직 영향도가 적은 관리자 시스템서비스(PG-ADM-01~04 등)부터 기준 컴포넌트 순차 대입 및 모바일 반응형 검증`;

  const newIssueRes = await requestGitHub('/issues', 'POST', {
    title: issueTitle,
    body: issueBody
  });
  const issueNumber = newIssueRes.body?.number;
  console.log(`✅ 신규 GitHub 이슈 등록 완료: #${issueNumber} (${newIssueRes.body?.html_url})`);

  console.log('\n================================================================');
  console.log('🌱 [4단계] 원격 dev 브랜치 기준 작업 브랜치 생성');
  console.log('================================================================');

  const branchName = 'task/0026_01_통합디자인시스템_jkoogit';
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
  console.log('💾 [5단계] 하네스 스토어 (data/local_agent_store.json) 및 DB SESSION-0026 등록');
  console.log('================================================================');

  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const session0026 = {
    session_id: 'SESSION-0026',
    session_name: '[0026] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    status_cd: '진행중',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      objective: '통합 디자인시스템 기준요소 정의 및 단계적 화면 재구성 (정책 수립, 기준 컴포넌트 풀 구축, PG-ADM-01~04 점진적 교체 1단계)',
      issue_number: issueNumber,
      branch: branchName,
      base_sha: targetSha,
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com',
      linked_from_session: 'SESSION-0025',
      reference_docs: [
        'docs/13.회고/13-19_SESSION-261006-0025_세션종합_KPT_회고록.md',
        'docs/03.정책/03-14_모바일반응형_카드전환_및_가로스크롤_원천방지_디자인가이드.md',
        'docs/03.정책/03-22_오프라인_동기화_및_충돌머지_거버넌스_운영정책.md',
        'docs/05.설계/05-25_PG_ADM_01_04_시스템서비스_1단계_와이어프레임_및_DAG_트리_상세설계서.md',
        'docs/05.설계/05-26_PG_ADM_05_16_시스템서비스_2단계_와이어프레임_상세설계서.md',
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

  const otherSessions = (store.sessions || []).filter((s: any) => s.session_id !== 'SESSION-0026');
  store.sessions = [session0026, ...otherSessions];

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 현행화 완료 (SESSION-0026 등록됨)`);

  // DB에 SESSION-0026 반영
  try {
    const insertS26Sql = `
      INSERT INTO aiagent.harness_session_meta (
        session_id, session_name, work_group, ai_agent, ai_model,
        status_cd, started_at, ended_at, doc_payload,
        created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        ${escapeSql(session0026.session_id)}, ${escapeSql(session0026.session_name)}, ${escapeSql(session0026.work_group)}, ${escapeSql(session0026.ai_agent)}, ${escapeSql(session0026.ai_model)},
        '진행중', ${escapeSql(session0026.started_at)}, NULL, ${escapeSql(JSON.stringify(session0026.doc_payload))}::jsonb,
        'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 1
      ) ON CONFLICT (session_id) DO UPDATE SET
        session_name = EXCLUDED.session_name,
        status_cd = EXCLUDED.status_cd,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = now();
    `;
    const resS26 = await executeSql(insertS26Sql);
    console.log('✅ 원격 DB aiagent.harness_session_meta (SESSION-0026) 등록 결과:', resS26?.success ? '성공' : resS26?.error);
  } catch (err: any) {
    console.warn('⚠️ 원격 DB 동기화 예외 (로컬 폴백 정상 유지됨):', err.message);
  }

  console.log('\n================================================================');
  console.log('🎉 SESSION-0026 세션 초기화 완료!');
  console.log('================================================================');
}

main().catch(console.error);
