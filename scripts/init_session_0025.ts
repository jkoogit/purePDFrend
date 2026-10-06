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
  console.log('🎫 [3단계] SESSION-0025 신규 GitHub 이슈 등록');
  console.log('================================================================');

  const issueTitle = '[0025_01] 시스템서비스 와이어프레임 1단계 (PG-ADM-01~04 보안/프로그램/사용자/약관) 고도화 및 DAG 트리 시각화';
  const issueBody = `## 📌 세션 정보
- **세션 ID**: \`SESSION-0025\`
- **세션명**: \`[0025] 시스템서비스_와이어프레임_1단계_보안_프로그램_사용자_약관관리_고도화\`
- **작업자**: Gemini 3.8 Flash / jkoogit (jkoogit@gmail.com)
- **작업 그룹**: \`purePDFrend\`
- **기준 브랜치**: \`dev\` (${devSha})

## 🎯 핵심 작업 목표
1. **[PG-ADM-01 보안관리]**:
   - IP 접근제어(화이트리스트/블랙리스트), 2FA 강제화 여부 설정
   - 관리자 세션 만료 시간 및 오프라인 인증 토큰 유효기간(최대 30일) 상세 설정 UI 정돈
2. **[PG-ADM-02 프로그램관리]**:
   - 화면 프로그램 부모-자식 계층구조 트리 뷰어
   - DAG 순환참조 방지 유효성 검증 및 시각화, 모달/상세 패널 연동
3. **[PG-ADM-03 사용자관리]**:
   - 회원 상태(활성/정지/휴면/대기) 관리, 오프라인 사용 권한 토글
   - 스토리지 연결(Local NAS, FTP/SFTP, Google Drive, WebDAV) 관리
   - 개인정보 불변원칙(주민번호/비밀번호 평문 저장 불가 등) 거버넌스 가이드라인 반영
4. **[PG-ADM-04 약관·동의·정책]**:
   - 웹문서 기반 8대 표준 약관 에디터 (이용약관, 개인정보처리방침, 위치기반, 마케팅, 오프라인동기화 등)
   - 문서그룹ID 기반 버전 발행(v1.0, v1.1...), 효력발생일 지정, 사용자 동의 이력 추적
5. **[반응형 및 가드레일]**:
   - 모바일 반응형 0px 가로스크롤 가드레일(정책 03-14) 준수 및 TypeScript 정적 무결성 확보`;

  const newIssueRes = await requestGitHub('/issues', 'POST', {
    title: issueTitle,
    body: issueBody
  });
  const issueNumber = newIssueRes.body?.number;
  console.log(`✅ 신규 GitHub 이슈 등록 완료: #${issueNumber} (${newIssueRes.body?.html_url})`);

  console.log('\n================================================================');
  console.log('🌱 [4단계] 원격 dev 브랜치 기준 작업 브랜치 생성');
  console.log('================================================================');

  const branchName = 'task/0025_01_시스템서비스_PG_ADM_Gemini';
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
  console.log('💾 [5단계] 하네스 스토어 (data/local_agent_store.json) 및 DB SESSION-0025 등록');
  console.log('================================================================');

  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const session0025 = {
    session_id: 'SESSION-0025',
    session_name: '[0025] 시스템서비스_와이어프레임_1단계_보안_프로그램_사용자_약관관리_고도화',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    status_cd: '진행중',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      objective: '시스템서비스 와이어프레임 1단계 (PG-ADM-01~04 보안/프로그램/사용자/약관) 고도화 및 DAG 트리 시각화',
      issue_number: issueNumber,
      branch: branchName,
      base_sha: targetSha,
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com',
      linked_from_session: 'SESSION-0024',
      reference_docs: [
        'docs/05.설계/05-22_화면프로그램ID체계표_및_정보구조_IA_설계서.md',
        'docs/05.설계/05-21_오프라인_인증토큰_문서검증_및_커스텀툴바_상세설계서.md',
        'docs/03.정책/03-14_모바일반응형_카드전환_및_가로스크롤_원천방지_디자인가이드.md',
        'docs/10.리뷰/261005_041_인코딩점검_오프라인작업정리_6대필터_모바일반응형카드전환_코드리뷰.md',
        'docs/13.회고/13-18_SESSION-261005-0024_세션종합_KPT_회고록.md',
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

  const otherSessions = (store.sessions || []).filter((s: any) => s.session_id !== 'SESSION-0025');
  store.sessions = [session0025, ...otherSessions];

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 현행화 완료 (SESSION-0025 등록됨)`);

  // DB에 SESSION-0025 반영
  try {
    const insertS25Sql = `
      INSERT INTO aiagent.harness_session_meta (
        session_id, session_name, work_group, ai_agent, ai_model,
        status_cd, started_at, ended_at, doc_payload,
        created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        ${escapeSql(session0025.session_id)}, ${escapeSql(session0025.session_name)}, ${escapeSql(session0025.work_group)}, ${escapeSql(session0025.ai_agent)}, ${escapeSql(session0025.ai_model)},
        '진행중', ${escapeSql(session0025.started_at)}, NULL, ${escapeSql(JSON.stringify(session0025.doc_payload))}::jsonb,
        'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 1
      ) ON CONFLICT (session_id) DO UPDATE SET
        session_name = EXCLUDED.session_name,
        status_cd = EXCLUDED.status_cd,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = now();
    `;
    const resS25 = await executeSql(insertS25Sql);
    console.log('✅ 원격 DB aiagent.harness_session_meta (SESSION-0025) 등록 결과:', resS25?.success ? '성공' : resS25?.error);
  } catch (err: any) {
    console.warn('⚠️ 원격 DB 동기화 예외 (로컬 폴백 정상 유지됨):', err.message);
  }

  console.log('\n================================================================');
  console.log('🎉 SESSION-0025 세션 초기화 완료!');
  console.log('================================================================');
}

main().catch(console.error);
