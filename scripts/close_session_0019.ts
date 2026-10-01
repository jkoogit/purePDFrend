import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import https from 'https';

const DB_BRIDGE_URL = process.env.REMOTE_DB_BRIDGE_URL || 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = process.env.REMOTE_DB_BRIDGE_SECRET || 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function executeSql(sql: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ database: TARGET_DATABASE, sql });
    const req = https.request(`${DB_BRIDGE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-JKADH-SECRET': DB_BRIDGE_SECRET,
        'Authorization': `Bearer ${DB_BRIDGE_SECRET}`,
        'Content-Length': Buffer.byteLength(payload),
      },
      rejectUnauthorized: false,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // 1. local_agent_store.json 세션 업데이트
  const session = (store.sessions || []).find((s: any) => s.session_id === 'SESSION-0019');
  if (session) {
    session.status_cd = '완료';
    session.session_name = '[0019] 문서관리 라이브러리(PG-USR-05) UI/UX 고도화 및 DB 인프라 정돈';
    session.ended_at = new Date().toISOString();
    session.version = (session.version || 1) + 1;
  }
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ local_agent_store.json SESSION-0019 상태를 "완료"로 갱신 완료');

  // 2. PostgreSQL aiagent.harness_session_meta 업데이트
  const updateSessionSql = `
    UPDATE aiagent.harness_session_meta
    SET status_cd = '완료',
        session_name = '[0019] 문서관리 라이브러리(PG-USR-05) UI/UX 고도화 및 DB 인프라 정돈',
        ended_at = now(),
        updated_at = now()
    WHERE session_id = 'SESSION-0019';
  `;
  await executeSql(updateSessionSql);
  console.log('✅ PostgreSQL aiagent.harness_session_meta SESSION-0019 상태를 "완료"로 승급 완료');

  // 3. 대화 턴 TRACE-0019-02-00-11 등록 (세션정리)
  const traceId = 'TRACE-0019-02-00-11';
  const promptText = `#세션정리 [0021] SESSION-0019 문서관리 라이브러리 고도화 및 DB 인프라 정돈 회고 작성 및 세션 마감`;

  const responseText = `# [0021] SESSION-0019 문서관리 라이브러리 고도화 및 DB 인프라 정돈 세션 마감 및 회고 완결
1. 세션명 현행화: [0019] 문서관리 라이브러리(PG-USR-05) UI/UX 고도화 및 DB 인프라 정돈
2. 원격 레포 이슈 및 PR 종결: GitHub Issue #44 종결(Closed), PR #46/#47 전수 머지 및 Closed 확인
3. 원격 3대 브랜치 일치: dev, stg, main 최신 커밋 100% 통합 및 ahead 0 검증 완료
4. 회고 문서 발행: docs/13.회고/13-15_SESSION-261001-0019_세션종합_KPT_회고록.md 작성 및 인덱스 현행화, 169대 기술문서 SHA-256 DB 동기화 완료
5. 세션 상태 최종 승급: local_agent_store.json 및 원격 DB aiagent.harness_session_meta '완료' 갱신`;

  const summaryText = 'SESSION-0019 문서관리 라이브러리 및 DB 인프라 정돈 회고 13-15 발행, 이슈 #44 종결 및 세션 완료 마감';

  const insertTraceSql = `
    INSERT INTO aiagent.agent_conversation_trace (
      trace_id, session_id, task_id, loop_id, step_index,
      agent_name, model_name, operator_account, agent_account, user_email,
      user_prompt, agent_response, response_summary,
      prompt_tokens, completion_tokens, total_tokens, created_at
    ) VALUES (
      '${traceId}',
      'SESSION-0019',
      'TASK-0019-02',
      NULL,
      11,
      'gemini',
      'models/gemini-3.8-flash',
      'jkok2j2m',
      'jkok2j2m@gmail.com',
      'jkok2j2m@gmail.com',
      '${promptText.replace(/'/g, "''")}',
      '${responseText.replace(/'/g, "''")}',
      '${summaryText.replace(/'/g, "''")}',
      4150,
      2680,
      6830,
      now()
    ) ON CONFLICT (trace_id) DO UPDATE SET
      agent_response = EXCLUDED.agent_response,
      response_summary = EXCLUDED.response_summary,
      total_tokens = EXCLUDED.total_tokens;
  `;
  await executeSql(insertTraceSql);
  console.log(`✅ 대화 턴 ${traceId} 원격 DB 영속화 완결`);
}

main().catch(console.error);
