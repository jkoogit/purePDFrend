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
  console.log(`Open PRs   : ${openPulls.length}`);

  const devRef = await requestGitHub<any>('/git/ref/heads/dev');
  const devSha = devRef.body?.object?.sha;
  console.log(`dev SHA: ${devSha}`);

  console.log('\n================================================================');
  console.log('📦 [2단계] SESSION-0018 아카이빙 및 data/archives 저장');
  console.log('================================================================');

  const storePath = 'data/local_agent_store.json';
  const currentStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const nowIso = new Date().toISOString();
  const nowFileStr = nowIso.replace(/:/g, '-');
  const archivePath = path.join('data', 'archives', `local_agent_store_SESSION-0018_${nowFileStr}.json`);
  fs.writeFileSync(archivePath, JSON.stringify(currentStore, null, 2), 'utf8');
  console.log(`✅ SESSION-0018 아카이빙 완료: ${archivePath}`);

  console.log('\n================================================================');
  console.log('🐙 [3단계] GitHub Issue 등록 for SESSION-0019');
  console.log('================================================================');

  const issuePayload = {
    title: '[0019_01]_문서관리_라이브러리(PG-USR-05)_UIUX_고도화_8대필터_카드테이블반응형_다운로드주석연동',
    body: `## 📌 세션 정보
- **세션 ID**: \`SESSION-0019\`
- **세션명**: \`[0019] 문서관리 라이브러리(PG-USR-05) UI/UX 고도화, 8대 필터·카드/테이블 반응형 뷰 및 다운로드/주석 연동\`
- **작업자**: Gemini 3.8 Flash / jkok2j2m@gmail.com
- **기준 SHA**: \`${devSha}\`
- **대상 화면**: \`PG-USR-05\` (문서관리 라이브러리 \`/documents\`)

## 🎯 주요 작업 목표
1. **[필터 바]** 8대 상세 검색 필터 바 고도화 (문서구분, 문서명/등록자, 저자/출판사, ISBN, 처리상태, 보안등급, 날짜범위, 정렬순)
2. **[반응형 뷰]** 카드 뷰 vs 테이블 뷰 전환 및 정책 03-14(360~390px 스마트폰 화면에서 카드 뷰 자동전환, 가로 스크롤 원천 방지)
3. **[테이블 정책]** 정책 03-18 준수 (컬럼 경계 드래그 리사이징 바 Col-Resize 배치, 정렬 버튼과 컬럼 타이틀 터치 영역 분리)
4. **[문서 등록]** 신규 문서 등록 모달 (PDF/이미지 파일 Drag & Drop, 썸네일 자동 생성 미리보기, 메타데이터 입력 폼)
5. **[다운로드 모달]** 4종 다운로드 모달 (원본 PDF, 워터마크 적용본, 텍스트/Markdown 추출본, 주석 포함 PDF)
6. **[주석 연동]** 주석(.json/.xfdf) 불러오기/내보내기 팝업 연동 및 뷰어(PG-USR-06) 라우팅 연계
7. **[디자인 시스템]** 정책 03-13 준수 (slate-900/950 테마, sky-500/600 포인트, 최소 44px 터치 타겟, Zero-Pill 메타데이터 규율)`
  };

  const newIssue = await requestGitHub<any>('/issues', 'POST', issuePayload);
  const issueNumber = newIssue.body?.number;
  console.log(`✅ GitHub 이슈 등록 완료: #${issueNumber} (${newIssue.body?.html_url})`);

  console.log('\n================================================================');
  console.log('🌿 [4단계] 원격 작업 브랜치 생성: task/0019_01_문서관리라이브러리_Gemini');
  console.log('================================================================');

  const branchName = 'task/0019_01_문서관리라이브러리_Gemini';
  const branchRes = await requestGitHub<any>('/git/refs', 'POST', {
    ref: `refs/heads/${branchName}`,
    sha: devSha
  });
  console.log(`✅ 원격 브랜치 생성 상태: ${branchRes.status}`);

  console.log('\n================================================================');
  console.log('💾 [5단계] 하네스 스토어(local_agent_store.json) 및 PostgreSQL 동기화');
  console.log('================================================================');

  const session0019 = {
    session_id: 'SESSION-0019',
    session_name: '[0019] 문서관리 라이브러리(PG-USR-05) UI/UX 고도화, 8대 필터·카드/테이블 반응형 뷰 및 다운로드/주석 연동',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    status_cd: '진행중',
    started_at: nowIso,
    ended_at: null,
    doc_payload: {
      objective: '문서관리 라이브러리(PG-USR-05) UI/UX 고도화, 8대 상세 검색 필터 바, 카드 뷰 vs 테이블 뷰 전환 및 정책 03-14(모바일 카드 자동전환)/정책 03-18(컬럼 리사이징/정렬분리) 완벽 구현, 신규 문서 등록(PDF/이미지 DnD), 4종 다운로드 모달, 주석(.json/.xfdf) 불러오기/내보내기 및 뷰어(PG-USR-06) 연결',
      issue_number: issueNumber,
      branch: branchName,
      base_sha: devSha,
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com',
      reference_docs: [
        'docs/13.회고/13-14_SESSION-260930-0018_세션종합_KPT_회고록.md',
        'docs/05.설계/05-22_화면프로그램ID체계표_및_정보구조_IA_설계서.md',
        'docs/06.기획/06-04_차세대_서비스_백로그_기획서_클라우드스토리지_OCR과금_GitHub연계.md',
        'docs/03.정책/03-13_UIUX_통일성_및_모바일반응형_디자인시스템_운영정책.md',
        'docs/03.정책/03-14_모바일반응형_카드전환_및_가로스크롤_원천방지_디자인가이드.md',
        'docs/03.정책/03-18_목록헤더_너비조절_및_정렬버튼_분리_UI정책.md'
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

  const updatedSessions = [session0019, ...currentStore.sessions.filter((s: any) => s.session_id !== 'SESSION-0019')];
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
      '${session0019.session_id}',
      '${session0019.session_name.replace(/'/g, "''")}',
      '${session0019.work_group}',
      '${session0019.ai_agent}',
      '${session0019.ai_model}',
      '${session0019.status_cd}',
      '${session0019.started_at}',
      NULL,
      '${JSON.stringify(session0019.doc_payload).replace(/'/g, "''")}'::jsonb,
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

  console.log('🎉 [세션시작] SESSION-0019 초기화 및 거버넌스 등록 완결!');
}

main().catch(console.error);
