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

async function main() {
  console.log('=== [0015] 세션 시작 및 연계 이슈/하네스 동기화 ===');

  // 1. GitHub Issue 생성
  const issuePayload = {
    title: '[0015_03]_전수_목록_화면_헤더_너비_조절_및_UI_정책_적용_긴급백업_복구',
    body: `## 📌 세션 및 연계 작업 정보
- **세션 ID**: \`SESSION-0015\`
- **세션명**: \`[0015]0015_토큰소진_연계작업_UI정책_및_긴급백업복구\`
- **작업자**: Gemini 3.7 Flash / jkoogit (jkok2j2m 토큰소진 이관 연계)
- **작업 브랜치**: \`task/0015_02_리소스점검_Gemini\`

## 🎯 세션 및 태스크 주요 작업 목표
1. **[작업 1 / TASK-0015-03]**: 소진 작업 이어서 진행
   - 전수 목록 화면 헤더 너비 조절 및 정렬 버튼 분리
   - 타이틀 가운데 정렬 UI 정책 일괄 적용
   - UI 정책 문서 발행 (\`docs/03.정책/\`)
2. **[작업 2]**: 비-LLM 긴급 소스 백업 기능 복구
   - \`EmergencyRecoveryPanel\` 화면 미노출 원인 확인
   - 네비게이션바/설정 화면 또는 긴급 액션 툴바에 직결 마운트 및 복구
3. **[작업 3]**: 와이어프레임 분석 및 설계 정합성 검토
   - 관리자 16개 / 사용자 9개 화면 와이어프레임 기획서(\`docs/17.참고/260927_01_화면UI기획-초안.md\`) 및 \`WireframeStudio\` 분석`
  };

  const newIssue = await requestGitHub<any>('/issues', 'POST', issuePayload);
  console.log(`✅ GitHub 이슈 생성 완료: #${newIssue.body?.number} (${newIssue.body?.title})`);

  // 2. 하네스 스토어(data/local_agent_store.json) 갱신
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const sessionObj = {
    session_id: 'SESSION-0015',
    session_name: '[0015]0015_토큰소진_연계작업_UI정책_및_긴급백업복구',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.7-flash',
    status_cd: '진행중',
    started_at: '2026-09-27T03:09:12.200Z',
    ended_at: null,
    doc_payload: {
      objective: '토큰소진 연계작업(전수 목록 UI정책 일괄적용), 비-LLM 긴급소스 백업 복구, 와이어프레임 분석',
      issue_number: newIssue.body?.number || 27,
      branch: 'task/0015_02_리소스점검_Gemini',
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com',
      linked_operator: 'jkok2j2m'
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 2,
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com'
  };

  const existingIdx = store.sessions.findIndex((s: any) => s.session_id === 'SESSION-0015');
  if (existingIdx >= 0) {
    store.sessions[existingIdx] = sessionObj;
  } else {
    store.sessions.push(sessionObj);
  }

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ data/local_agent_store.json 세션 동기화 완료');

  // 3. Remote DB 동기화
  const sessionSql = `
    INSERT INTO aiagent.harness_session_meta (
      session_id, session_name, work_group, ai_agent, ai_model,
      status_cd, started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      '${sessionObj.session_id}', '${sessionObj.session_name}', '${sessionObj.work_group}', '${sessionObj.ai_agent}', '${sessionObj.ai_model}',
      '${sessionObj.status_cd}', '${sessionObj.started_at}', ${sessionObj.ended_at ? `'${sessionObj.ended_at}'` : 'NULL'}, '${JSON.stringify(sessionObj.doc_payload)}'::jsonb,
      'agent-harness', 'system', 'agent-harness', 'system', ${sessionObj.version}
    ) ON CONFLICT (session_id) DO UPDATE SET
      session_name = EXCLUDED.session_name,
      ai_model = EXCLUDED.ai_model,
      status_cd = EXCLUDED.status_cd,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now();
  `;
  await executeSql(sessionSql);
  console.log('✅ 원격 DB 세션 메타 동기화 완료');
}

main().catch(console.error);
