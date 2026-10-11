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
  console.log('🎫 [3단계] SESSION-0028 신규 GitHub 이슈 등록');
  console.log('================================================================');

  const issueTitle = '[0028_01] 와이어프레임 보완 및 4모드 테마, 첫화면 서비스 권한별 시스템 전환 구축';
  const issueBody = `## 📌 세션 정보
- **세션 ID**: \`SESSION-0028\`
- **세션명**: \`[0028] 와이어프레임_보완_및_4모드_테마_첫화면_서비스_권한별_시스템전환_구축\`
- **작업자**: Gemini 3.8 Flash / jkoogit (jkoogit@gmail.com)
- **작업 그룹**: \`purePDFrend\`
- **기준 브랜치**: \`dev\` (${devSha})

## 🎯 핵심 작업 목표
1. **[와이어프레임 화면리뷰 보완]**:
   - 23개 와이어프레임 화면의 디자인 토큰(tokens.ts) 및 8대 Primitive UI 전수 점검 및 미비점 보완
   - 터치 가드레일(최소 44px) 및 모바일 Break-to-Card 반응형 레이아웃 정합성 유지
2. **[4모드 테마 시스템 구성]**:
   - 주간(라이트) / 야간(다크) / 여명(블루/새벽, Dawn) / 시스템설정(OS prefers-color-scheme 자동감지)
   - 테마 토글/선택 컴포넌트 고도화 및 CSS 변수/토큰 실시간 바인딩
3. **[서비스 구현 준비 & 권한별 시스템 전환 인터페이스]**:
   - 앱 첫 로딩 화면을 엔드유저 '서비스 화면(PDF 대시보드/뷰어/변환 포털)'으로 기본 표시
   - 사용자 권한별 시스템 전환 인터페이스(버튼) 구축:
     * 일반 사용자: PDF 비즈니스 서비스
     * 서비스 설정 권한: '서비스설정(서비스 설정 시스템)' 전환 인터페이스
     * 마스터/관리자 권한: '에이전트관리(마스터 시스템)' 전환 인터페이스
4. **[TDD 단위 테스트, 린트/컴파일 무결성 검증]**:
   - 회귀 방지 단위 테스트 작성 및 정적 분석 100% 통과`;

  const newIssueRes = await requestGitHub('/issues', 'POST', {
    title: issueTitle,
    body: issueBody
  });
  const issueNumber = newIssueRes.body?.number;
  console.log(`✅ 신규 GitHub 이슈 등록 완료: #${issueNumber} (${newIssueRes.body?.html_url})`);

  console.log('\n================================================================');
  console.log('🌱 [4단계] 원격 dev 브랜치 기준 작업 브랜치 생성');
  console.log('================================================================');

  const branchName = 'task/0028_01_와이어프레임보완_4모드테마_시스템전환_jkoogit';
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
  console.log('💾 [5단계] 하네스 스토어 (data/local_agent_store.json) 및 DB SESSION-0028 등록');
  console.log('================================================================');

  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const session0028 = {
    session_id: 'SESSION-0028',
    session_name: '[0028] 와이어프레임_보완_및_4모드_테마_첫화면_서비스_권한별_시스템전환_구축',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    status_cd: '진행중',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      objective: '와이어프레임 보완 및 4모드 테마, 첫화면 서비스 권한별 시스템 전환 구축',
      issue_number: issueNumber,
      branch: branchName,
      base_sha: targetSha,
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com',
      linked_from_session: 'SESSION-0027',
      reference_docs: [
        'docs/13.회고/13-21_SESSION-261011-0027_세션종합_KPT_회고록.md',
        'docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md',
        'docs/03.정책/03-13_UIUX_통일성_및_모바일반응형_디자인시스템_운영정책.md',
        'docs/05.설계/05-25_PG_ADM_01_04_시스템서비스_1단계_와이어프레임_및_DAG_트리_상세설계서.md',
        'docs/05.설계/05-26_시스템서비스_2단계_게시판_고객_글꼴_단축키_와이어프레임_상세설계서.md',
        'docs/10.리뷰/261010_047_통합_디자인_토큰_추출_및_쇼케이스_구축_코드리뷰.md',
        'src/styles/tokens.ts',
        'AGENTS.md v2.2',
        'GEMINI.md v1.0.0'
      ],
      tasks: [
        {
          task_id: 'TASK-0028-01',
          task_name: '와이어프레임 보완 및 4모드 테마, 첫화면 서비스 권한별 시스템 전환 계획 수립 및 환경 준비',
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

  const otherSessions = (store.sessions || []).filter((s: any) => s.session_id !== 'SESSION-0028');
  store.sessions = [session0028, ...otherSessions];

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 현행화 완료 (SESSION-0028 등록됨)`);

  // DB에 SESSION-0028 반영
  try {
    const insertS28Sql = `
      INSERT INTO aiagent.harness_session_meta (
        session_id, session_name, work_group, ai_agent, ai_model,
        status_cd, started_at, ended_at, doc_payload,
        created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        ${escapeSql(session0028.session_id)}, ${escapeSql(session0028.session_name)}, ${escapeSql(session0028.work_group)}, ${escapeSql(session0028.ai_agent)}, ${escapeSql(session0028.ai_model)},
        '진행중', ${escapeSql(session0028.started_at)}, NULL, ${escapeSql(JSON.stringify(session0028.doc_payload))}::jsonb,
        'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 1
      ) ON CONFLICT (session_id) DO UPDATE SET
        session_name = EXCLUDED.session_name,
        status_cd = EXCLUDED.status_cd,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = now();
    `;
    const resS28 = await executeSql(insertS28Sql);
    console.log('✅ 원격 DB aiagent.harness_session_meta (SESSION-0028) 등록 결과:', resS28?.success ? '성공' : resS28?.error);
  } catch (err: any) {
    console.warn('⚠️ 원격 DB 동기화 예외 (로컬 폴백 정상 유지됨):', err.message);
  }

  console.log('\n================================================================');
  console.log('🎉 SESSION-0028 세션 초기화 완료!');
  console.log('================================================================');
}

main().catch(console.error);
