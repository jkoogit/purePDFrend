import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';
import path from 'path';

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

async function main() {
  console.log('================================================================');
  console.log('🔍 [1단계] GitHub 원격 레포지토리 이슈 및 PR 점검');
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
  console.log(`3대 브랜치 일치 여부: ${isBranchesSynced ? '✅ 일치' : 'ℹ️ 차이 확인됨'}`);

  console.log('\n================================================================');
  console.log('🎫 [3단계] 원격 GitHub Issue 등록');
  console.log('================================================================');

  const issueTitle = '[0021_01] PG-USR-05 문서관리 라이브러리 및 PG-USR-06 가상뷰어 종합 리뷰';
  const issueBody = `## 📌 세션 정보
- **세션 ID**: \`SESSION-0021\`
- **세션명**: \`[0021] PG-USR-05 문서관리 라이브러리 리뷰 마무리 및 PG-USR-06 가상뷰어 화면 종합 리뷰\`
- **작업자**: Gemini 3.8 Flash / jkoogit (jkoogit@gmail.com)
- **작업 그룹**: \`purePDFrend\`
- **기준 브랜치**: \`dev\` (${devSha})

## 🎯 핵심 작업 목표
1. **PG-USR-05 문서관리 라이브러리 최종 사용성 및 화면 리뷰 마무리**:
   - 8대 상세 검색 필터 바, 모바일 도서 카테고리 접힘 배너 상시노출, 카드 뷰 vs 테이블 뷰 전환
   - 자르기/표준화 옵션처리 편집레이어 네비게이션 일체형 배치, 4종 다운로드 및 주석 연동 최종 점검
2. **PG-USR-06 고성능 가상 뷰어 화면 종합 리뷰 및 UX 인터랙션 검증**:
   - 800쪽 대용량 60fps 가상 윈도잉 캔버스 및 LRU 20페이지 메모리가드 동작 검토
   - 초슬림 2단 통폐합 툴바 및 Xodo 스타일 ToolStylePopover 속성 팔레트 화면 리뷰
   - 북마크/목차/주석 3대 탭 디자인 일관성(목차 TOC 영문 배제 및 폰트/언더라인 일치) 검토
   - 검색창 좌측 - 선택목록/도구 우측(ml-auto) 정렬 표준화 상태 검증
   - 주석 선택목록 레이어 팝업 카드 및 OCR 위/아래(▲/▼) 순차 탐색·즉시 현행화(⚡) 동작 리뷰`;

  const newIssueRes = await requestGitHub<any>('/issues', 'POST', {
    title: issueTitle,
    body: issueBody
  });

  const issueNumber = newIssueRes.body?.number;
  console.log(`✅ 신규 GitHub 이슈 등록 완료: #${issueNumber} (${newIssueRes.body?.html_url})`);

  console.log('\n================================================================');
  console.log('🌱 [4단계] 원격 dev 브랜치 기준 작업 브랜치 생성');
  console.log('================================================================');

  const branchName = 'task/0021_01_문서관리_가상뷰어_화면리뷰_Gemini';
  const targetSha = devSha || 'b5d87a170fe6ecdb311dd9f3878138c616a23120';
  
  let branchCreated = false;
  const createRefRes = await requestGitHub<any>('/git/refs', 'POST', {
    ref: `refs/heads/${branchName}`,
    sha: targetSha
  });

  if (createRefRes.status === 201) {
    console.log(`✅ 원격 작업 브랜치 [${branchName}] 생성 성공 (SHA: ${targetSha})`);
    branchCreated = true;
  } else if (createRefRes.status === 422) {
    console.log(`ℹ️ 브랜치 [${branchName}]가 이미 존재합니다. 참조 업데이트 시도...`);
    const updateRefRes = await requestGitHub<any>(`/git/refs/heads/${encodeURIComponent(branchName)}`, 'PATCH', {
      sha: targetSha,
      force: true
    });
    console.log(`✅ 원격 작업 브랜치 [${branchName}] 업데이트 결과 (${updateRefRes.status})`);
    branchCreated = true;
  } else {
    console.warn(`⚠️ 브랜치 생성 응답 상태: ${createRefRes.status}`, createRefRes.body);
  }

  console.log('\n================================================================');
  console.log('💾 [5단계] 하네스 스토어 (data/local_agent_store.json) 및 DB 동기화');
  console.log('================================================================');

  const storePath = 'data/local_agent_store.json';
  let store: any = { sessions: [], tasks: [], loops: [] };
  if (fs.existsSync(storePath)) {
    try {
      store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    } catch (e) {
      console.warn('기존 store 파싱 실패, 새로 초기화');
    }
  }

  // 기존 세션들을 아카이브 보존하고, 신규 세션 0021 활성화
  const session0021 = {
    session_id: 'SESSION-0021',
    session_name: '[0021] PG-USR-05 문서관리 라이브러리 리뷰 마무리 및 PG-USR-06 가상뷰어 화면 종합 리뷰',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    status_cd: '진행중',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      objective: 'PG-USR-05 문서관리 라이브러리 최종 사용성 리뷰 마무리 및 PG-USR-06 가상뷰어 화면 종합 리뷰 및 UX 인터랙션 검증',
      issue_number: issueNumber,
      branch: branchName,
      base_sha: targetSha,
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com',
      linked_from_session: 'SESSION-0020'
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 1,
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com'
  };

  // 기존 0021 세션이 있다면 교체, 없으면 맨 앞에 추가
  const otherSessions = (store.sessions || []).filter((s: any) => s.session_id !== 'SESSION-0021');
  store.sessions = [session0021, ...otherSessions];

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 현행화 완료 (SESSION-0021 등록됨)`);

  // DB에 SESSION-0021 반영
  try {
    const insertSql = `
      INSERT INTO aiagent.harness_session_meta (
        session_id, session_name, work_group, ai_agent, ai_model,
        status_cd, started_at, ended_at, doc_payload,
        created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        '${session0021.session_id}', '${session0021.session_name}', '${session0021.work_group}', '${session0021.ai_agent}', '${session0021.ai_model}',
        '${session0021.status_cd}', '${session0021.started_at}', NULL, '${JSON.stringify(session0021.doc_payload)}'::jsonb,
        'agent-harness', 'system', 'agent-harness', 'system', 1
      ) ON CONFLICT (session_id) DO UPDATE SET
        session_name = EXCLUDED.session_name,
        status_cd = EXCLUDED.status_cd,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = now();
    `;
    const dbRes = await executeSql(insertSql);
    console.log('✅ 원격 DB aiagent.harness_session_meta 동기화 완료:', dbRes?.error ? dbRes.error : '성공');
  } catch (err: any) {
    console.warn('⚠️ 원격 DB 동기화 예외 (로컬 폴백 정상 유지됨):', err.message);
  }

  console.log('\n================================================================');
  console.log('🎉 SESSION-0021 세션 시작 하네스 준비 완결!');
  console.log(`- 이슈 번호: #${issueNumber}`);
  console.log(`- 작업 브랜치: ${branchName} (기준 커밋: ${targetSha})`);
  console.log('================================================================');
}

main().catch(console.error);
