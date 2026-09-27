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
  console.log('📦 [1단계] SESSION-0015 아카이빙 및 data/archives 저장');
  console.log('================================================================');

  const storePath = 'data/local_agent_store.json';
  const currentStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // 1. SESSION-0015 아카이브 파일 생성
  const nowStr = new Date().toISOString().replace(/:/g, '-');
  const archiveFileName = `local_agent_store_SESSION-0015_${nowStr}.json`;
  const archivePath = path.join('data', 'archives', archiveFileName);

  // 0015 데이터 복제 및 마감 상태 기록
  const session0015Store = {
    ...currentStore,
    sessions: currentStore.sessions.map((s: any) => {
      if (s.session_id === 'SESSION-0015') {
        return {
          ...s,
          session_name: '[0015]purePDFrend 서비스 목적·구조·시나리오 및 화면 UI 기획 수립 (토큰소진 이관)',
          status_cd: '이관완료',
          ended_at: new Date().toISOString(),
          doc_payload: {
            ...s.doc_payload,
            transferred_to: 'SESSION-0016',
            transferred_reason: '토큰 소진으로 인한 신규 세션 0016 분기 및 소스 이관'
          }
        };
      }
      return s;
    }),
    tasks: currentStore.tasks.filter((t: any) => t.session_id === 'SESSION-0015' || t.task_id.startsWith('TASK-0015')),
    loops: currentStore.loops.filter((l: any) => l.session_id === 'SESSION-0015' || l.loop_id.startsWith('LOOP-0015'))
  };

  fs.writeFileSync(archivePath, JSON.stringify(session0015Store, null, 2), 'utf8');
  console.log(`✅ SESSION-0015 아카이빙 완료: ${archivePath}`);

  // DB의 SESSION-0015 상태를 '이관완료'로 업데이트
  const update0015Sql = `
    UPDATE aiagent.harness_session_meta
    SET status_cd = '이관완료',
        ended_at = now(),
        doc_payload = doc_payload || '{"transferred_to":"SESSION-0016","reason":"토큰소진 이관"}'::jsonb,
        updated_at = now()
    WHERE session_id = 'SESSION-0015';
  `;
  await executeSql(update0015Sql);
  console.log('✅ 원격 DB SESSION-0015 상태 [이관완료] 업데이트 완료');

  console.log('\n================================================================');
  console.log('🚀 [2단계] SESSION-0016 신규 세션 생성 및 하네스 원장 초기화');
  console.log('================================================================');

  const session0016 = {
    session_id: 'SESSION-0016',
    session_name: '[0016]0015_토큰소진_연계작업_UI정책_및_긴급백업복구',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.7-flash',
    status_cd: '진행중',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      objective: '0015 토큰소진 연계작업(전수 목록 UI정책 일괄적용), 비-LLM 긴급소스 백업 복구, 와이어프레임 분석',
      issue_number: 28,
      branch: 'task/0015_02_리소스점검_Gemini',
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com',
      linked_from_session: 'SESSION-0015',
      linked_operator: 'jkok2j2m'
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 1,
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com'
  };

  // local_agent_store.json을 SESSION-0016 단일 활성 세션으로 초기화
  const newStore = {
    sessions: [session0016],
    tasks: [],
    loops: []
  };

  fs.writeFileSync(storePath, JSON.stringify(newStore, null, 2), 'utf8');
  console.log('✅ data/local_agent_store.json -> SESSION-0016 단일 세션으로 현행화 완료');

  // 원격 DB에 SESSION-0016 신규 등록
  const insert0016Sql = `
    INSERT INTO aiagent.harness_session_meta (
      session_id, session_name, work_group, ai_agent, ai_model,
      status_cd, started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      '${session0016.session_id}', '${session0016.session_name}', '${session0016.work_group}', '${session0016.ai_agent}', '${session0016.ai_model}',
      '${session0016.status_cd}', '${session0016.started_at}', NULL, '${JSON.stringify(session0016.doc_payload)}'::jsonb,
      'agent-harness', 'system', 'agent-harness', 'system', 1
    ) ON CONFLICT (session_id) DO UPDATE SET
      session_name = EXCLUDED.session_name,
      status_cd = EXCLUDED.status_cd,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now();
  `;
  await executeSql(insert0016Sql);
  console.log('✅ 원격 DB SESSION-0016 등록 완료');

  console.log('\n================================================================');
  console.log('🐙 [3단계] GitHub Issue #28 제목 및 내용 현행화');
  console.log('================================================================');

  const issueUpdatePayload = {
    title: '[0016_01]_전수_목록_화면_헤더_너비_조절_및_UI_정책_적용_긴급백업_복구',
    body: `## 📌 세션 및 연계 작업 정보
- **세션 ID**: \`SESSION-0016\`
- **세션명**: \`[0016]0015_토큰소진_연계작업_UI정책_및_긴급백업복구\`
- **작업자**: Gemini 3.7 Flash / jkoogit (jkok2j2m 세션 0015 토큰소진 이관 연계)
- **이전 세션**: \`SESSION-0015\` (아카이빙 완료)
- **작업 브랜치**: \`task/0015_02_리소스점검_Gemini\`

## 🎯 세션 및 태스크 주요 작업 목표
1. **[TASK-0016-01]**: 소진 작업(전수 목록 화면 UI 정책 일괄 적용, 긴급 백업 복구, 와이어프레임 분석)
   - 전수 목록 화면 헤더 너비 조절 및 정렬 버튼 분리
   - 타이틀 가운데 정렬 UI 정책 일괄 적용 및 정책 문서 발행
   - 비-LLM 긴급 소스 백업 UI 마운트 및 복구
   - 와이어프레임 분석 및 설계 정합성 검토`
  };

  const issueUpdateRes = await requestGitHub<any>('/issues/28', 'PATCH', issueUpdatePayload);
  console.log(`✅ GitHub 이슈 #28 제목/내용 현행화 완료 (${issueUpdateRes.status})`);
}

main().catch(console.error);
