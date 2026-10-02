import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import https from 'https';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

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
  console.log('📦 [1단계] SESSION-0020 아카이브 파일 생성 및 백업');
  console.log('================================================================');

  const storePath = 'data/local_agent_store.json';
  const currentStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // 1. SESSION-0020 전용 스토어 아카이브 생성
  const session0020 = currentStore.sessions.find((s: any) => s.session_id === 'SESSION-0020');
  const tasks0020 = currentStore.tasks.filter((t: any) => t.session_id === 'SESSION-0020' || t.task_id.startsWith('TASK-0020'));
  const loops0020 = (currentStore.loops || []).filter((l: any) => l.session_id === 'SESSION-0020' || l.loop_id?.startsWith('LOOP-0020'));

  const archive0020 = {
    archive_date: new Date().toISOString(),
    session: session0020,
    tasks: tasks0020,
    loops: loops0020,
    full_sessions_snapshot: currentStore.sessions
  };

  const archivePath = 'data/archives/local_agent_store_SESSION-0020_2026-10-02T12-44-42.369Z.json';
  fs.writeFileSync(archivePath, JSON.stringify(archive0020, null, 2), 'utf8');
  console.log(`✅ SESSION-0020 아카이브 생성 완료: ${archivePath}`);

  // 2. data/snapshots 에도 SNAP-SESSION-0020 파일 생성
  const snapshotPath = 'data/snapshots/SNAP-SESSION-0020.json';
  fs.writeFileSync(snapshotPath, JSON.stringify(archive0020, null, 2), 'utf8');
  console.log(`✅ SESSION-0020 스냅샷 생성 완료: ${snapshotPath}`);

  console.log('\n================================================================');
  console.log('📋 [2단계] SESSION-0021 하네스 스토어에 #백로그 등록');
  console.log('================================================================');

  const backlogItem = {
    backlog_id: 'BACKLOG-0021-01',
    session_id: 'SESSION-0021',
    title: '계정 전환 및 신규 세션 시작 시 원격 dev 소스 자동 풀(Pull) & 브랜치 정돈 거버넌스 가이드라인 수립',
    category: '거버넌스/프로세스',
    status: '등록',
    priority: 'HIGH',
    created_at: new Date().toISOString(),
    content: [
      '같은 계정에서 신규세션 새채팅으로 시작 (브랜치전환 무난)',
      '다른 계정에서 신규세션 새채팅으로 시작 (브랜치전환 주의: 신규 샌드박스 컨테이너 환경에서 로컬 파일이 구 스냅샷이므로, #세션시작 시 원격 dev 최신 트리를 즉시 로컬로 자동 Pull하고 아카이빙을 선행하여 작업 정보 뭉개짐 원천 차단)',
      '세션 종료 시 퀵작업으로 docs/03.정책 및 AGENTS.md에 절차 보완 및 표준 체크리스트 반영'
    ]
  };

  // SESSION-0021 doc_payload에 백로그 항목 추가
  const updatedSessions = currentStore.sessions.map((s: any) => {
    if (s.session_id === 'SESSION-0021') {
      const existingBacklogs = s.doc_payload?.backlog_items || [];
      return {
        ...s,
        doc_payload: {
          ...s.doc_payload,
          backlog_items: [...existingBacklogs.filter((b: any) => b.backlog_id !== backlogItem.backlog_id), backlogItem]
        },
        updated_at: new Date().toISOString()
      };
    }
    return s;
  });

  currentStore.sessions = updatedSessions;
  fs.writeFileSync(storePath, JSON.stringify(currentStore, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 에 백로그 등록 완료: ${backlogItem.backlog_id}`);

  console.log('\n================================================================');
  console.log('🌐 [3단계] 원격 DB aiagent.harness_session_meta 동기화');
  console.log('================================================================');

  const session0021 = updatedSessions.find((s: any) => s.session_id === 'SESSION-0021');
  const updateSql = `
    UPDATE aiagent.harness_session_meta
    SET doc_payload = '${JSON.stringify(session0021.doc_payload).replace(/'/g, "''")}'::jsonb,
        updated_at = now()
    WHERE session_id = 'SESSION-0021';
  `;
  const dbRes = await executeSql(updateSql);
  console.log('✅ 원격 DB 백로그 반영 결과:', dbRes?.error ? dbRes.error : '성공');

  // DB에 SESSION-0020 완료 상태 보장
  if (session0020) {
    const update0020Sql = `
      UPDATE aiagent.harness_session_meta
      SET status_cd = '완료',
          ended_at = COALESCE(ended_at, now()),
          updated_at = now()
      WHERE session_id = 'SESSION-0020';
    `;
    await executeSql(update0020Sql);
    console.log('✅ 원격 DB SESSION-0020 완료 상태 최종 보장');
  }

  console.log('\n🎉 백업 및 백로그 등록 완료!');
}

main().catch(console.error);
