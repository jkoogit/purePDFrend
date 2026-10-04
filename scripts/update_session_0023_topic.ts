import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import https from 'https';

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
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode || 200, body: JSON.parse(body) }); } catch (e) { resolve({ status: res.statusCode || 200, body: body as any }); }
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
  console.log('🔄 [AGENTS.md 규칙 2.1-9 준수] /data/agent_history 백업 및 local_agent_store.json 세션 변경 현행화');

  const historyDir = path.join(process.cwd(), 'data', 'agent_history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
    console.log('📁 /data/agent_history 폴더 생성 완료');
  }

  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const currentStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // 1. Determine backup filename [세션번호]_local_agent_store_[파일번호].json
  const existingFiles = fs.readdirSync(historyDir).filter(f => f.startsWith('SESSION-0023_local_agent_store_'));
  const fileNum = String(existingFiles.length + 1).padStart(2, '0');
  const backupFileName = `SESSION-0023_local_agent_store_${fileNum}.json`;
  const backupFilePath = path.join(historyDir, backupFileName);
  fs.writeFileSync(backupFilePath, JSON.stringify(currentStore, null, 2), 'utf8');
  console.log(`✅ /data/agent_history 백업 완료: ${backupFilePath}`);

  // 2. Prepare new session info
  const newSessionName = '[0023] PG-USR-07 문서공유 및 협업작업뷰 리뷰';
  const newBranchName = 'task/0023_01_문서공유_협업작업뷰_Gemini';
  const nowIso = new Date().toISOString();

  // 3. Update GitHub Issue #61 title & body
  const issueUpdateRes = await requestGitHub('/issues/61', 'PATCH', {
    title: '[0023_01]_PG-USR-07_문서공유_및_협업작업뷰_리뷰',
    body: `## 📌 세션 정보
- **세션 ID**: \`SESSION-0023\`
- **세션명**: \`${newSessionName}\`
- **작업자**: Gemini 3.8 Flash / jkok2j2m@gmail.com
- **기준 SHA**: \`2b9f6da61feb267e83de4e90e5f8b6ea48bea4d8\`
- **대상 화면**: \`PG-USR-07\` (문서공유 및 협업작업뷰 \`/viewer/:id/share\`)

## 🎯 주요 작업 목표
1. **[PG-USR-07 문서공유 및 협업작업뷰 전수 분석 및 리뷰]**:
   - 공유 권한(읽기/열람자 쓰기/관리자) 제어 매트릭스
   - 공유 링크 생성, 비밀번호 보호 및 유효기간 만료 정책
   - 실시간 동시접속자 목록 및 아바타 상태 뱃지
   - 실시간 주석 협업 이벤트 피드(WebSocket/Polling 연계 모델)
2. **[UI/UX 통일성 및 디자인 가이드라인 점검]**:
   - 정책 03-13(통일 디자인시스템), 정책 03-14(모바일 가로스크롤 원천방지)
   - Xodo 벤치마킹 주석 뷰어(\`PG-USR-06\`)와의 자연스러운 전환 연동
3. **[아키텍처 영향도 평가 및 백로그 등록]**:
   - 실시간 협업 도메인 인터페이스 및 권한 RBAC 포트 점검`
  });
  console.log('✅ GitHub Issue #61 수정 상태:', issueUpdateRes.status);

  // 4. Create new branch if not exists
  const devRef = await requestGitHub<any>('/git/ref/heads/dev');
  const devSha = devRef.body?.object?.sha || '2b9f6da61feb267e83de4e90e5f8b6ea48bea4d8';
  const branchRes = await requestGitHub('/git/refs', 'POST', {
    ref: `refs/heads/${newBranchName}`,
    sha: devSha
  });
  console.log(`✅ 원격 브랜치 생성 상태 (${newBranchName}):`, branchRes.status);

  // 5. Update local_agent_store.json
  const session0023 = {
    session_id: 'SESSION-0023',
    session_name: newSessionName,
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    status_cd: '진행중',
    started_at: currentStore.sessions?.[0]?.started_at || nowIso,
    ended_at: null,
    doc_payload: {
      objective: 'PG-USR-07 문서공유 및 협업작업뷰 상세 리뷰, 공유권한(읽기/열람자쓰기/관리자) 통제, 유효기간, 실시간 동시접속자 목록 및 실시간 주석 이벤트 피드 연계 아키텍처 점검',
      issue_number: 61,
      branch: newBranchName,
      base_sha: devSha,
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com',
      reference_docs: [
        'docs/05.설계/05-22_화면프로그램ID체계표_및_정보구조_IA_설계서.md',
        'docs/06.기획/06-01_모바일반응형_UIUX_오브젝트_표준기획서.md',
        'docs/03.정책/03-13_UIUX_통일성_및_모바일반응형_디자인시스템_운영정책.md',
        'docs/03.정책/03-14_모바일반응형_카드전환_및_가로스크롤_원천방지_디자인가이드.md',
        'docs/17.참고/261010_xodo분석/xodo_screen_review_analysis.md'
      ]
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 2,
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com'
  };

  const updatedSessions = [
    session0023,
    ...(currentStore.sessions || []).filter((s: any) => s.session_id !== 'SESSION-0023')
  ];

  const newStore = {
    sessions: updatedSessions,
    tasks: [],
    loops: []
  };

  fs.writeFileSync(storePath, JSON.stringify(newStore, null, 2), 'utf8');
  console.log('✅ local_agent_store.json 세션 정보 현행화 완료 (tasks=[], loops=[] 유지)');

  // 6. Sync to PostgreSQL aiagent.harness_session_meta
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
      'agent-harness', 'system', 'agent-harness', 'system', 2
    ) ON CONFLICT (session_id) DO UPDATE SET
      session_name = EXCLUDED.session_name,
      status_cd = EXCLUDED.status_cd,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now();
  `;

  try {
    const dbRes = await executeSql(insertSql);
    console.log('✅ PostgreSQL aiagent.harness_session_meta 업데이트 완료:', dbRes);
  } catch (e) {
    console.warn('⚠️ DB 동기화 오류 (로컬 스토어 유지):', e);
  }

  console.log('🎉 세션 현행화 및 agent_history 백업 완결!');
}

main().catch(console.error);
