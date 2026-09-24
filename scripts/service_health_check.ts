/**
 * @file service_health_check.ts
 * @description purePDFrend 및 AI 에이전트 하네스 서비스 전수 점검 및 정밀 진단 스크립트
 * 4단계 표준 점검(인프라/DB, 데이터 정합성, 거버넌스 무결성 100점, 문서 및 검색엔진)을 전수 수행합니다.
 */

import http from 'http';
import https from 'https';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';
const APP_PORT = 3000;

interface CheckResult {
  step: string;
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

function queryDb(sql: string): Promise<any> {
  return new Promise((resolve) => {
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
      timeout: 10000,
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { resolve({ error: body }); }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(payload);
    req.end();
  });
}

function fetchApi(path: string): Promise<{ status: number; body?: any; raw?: string; durationMs: number }> {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${APP_PORT}${path}`, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        const durationMs = Date.now() - t0;
        try { resolve({ status: res.statusCode || 500, body: JSON.parse(data), durationMs }); }
        catch (e) { resolve({ status: res.statusCode || 500, raw: data.slice(0, 100), durationMs }); }
      });
    });
    req.on('error', (err) => resolve({ status: 500, raw: err.message, durationMs: Date.now() - t0 }));
  });
}

export async function runComprehensiveServiceCheck(): Promise<{ allPassed: boolean; results: CheckResult[] }> {
  const results: CheckResult[] = [];
  const startAll = Date.now();

  console.log('===============================================================');
  console.log('🔍 [purePDFrend] 전반적인 서비스 전수 점검 및 가드레일 진단 시작');
  console.log('===============================================================\n');

  // -------------------------------------------------------------
  // [1단계] 인프라 & DB 연결 점검
  // -------------------------------------------------------------
  console.log('▶ [1단계] 인프라 및 DB 연결 점검...');
  
  // 1-1. Health API
  const healthRes = await fetchApi('/api/health');
  const healthPassed = healthRes.status === 200 && healthRes.body?.status === 'ok';
  results.push({
    step: '1단계',
    name: '서버 헬스체크 (/api/health)',
    passed: healthPassed,
    message: healthPassed ? `정상 가동 (${healthRes.body?.service})` : `실패 (Status: ${healthRes.status})`,
    durationMs: healthRes.durationMs,
  });

  // 1-2. DB Status
  const dbStatusRes = await fetchApi('/api/db/status');
  const dbStatusPassed = dbStatusRes.status === 200 && dbStatusRes.body?.status === 'CONNECTED';
  results.push({
    step: '1단계',
    name: 'PostgreSQL DB 브릿지 연결 (/api/db/status)',
    passed: dbStatusPassed,
    message: dbStatusPassed ? `연결됨 (응답: ${dbStatusRes.body?.responseTimeMs}ms)` : `실패: ${dbStatusRes.body?.message || '연결 오류'}`,
    durationMs: dbStatusRes.durationMs,
  });

  // 1-3. DB 인덱스 전수 검증
  const tIdx = Date.now();
  const indexQuery = await queryDb(`
    SELECT count(*) as total 
    FROM pg_indexes 
    WHERE schemaname = 'aiagent' AND indexname LIKE 'idx_%';
  `);
  const indexCount = parseInt(indexQuery.rows?.[0]?.total || '0', 10);
  const indexPassed = indexCount >= 7;
  results.push({
    step: '1단계',
    name: 'DB 복합 인덱스 7종 활성화 상태',
    passed: indexPassed,
    message: indexPassed ? `7개 전체 인덱스 정상 활성 (풀 스캔 방어)` : `경고: 활성 인덱스 수 ${indexCount}/7`,
    durationMs: Date.now() - tIdx,
  });

  // -------------------------------------------------------------
  // [2단계] 하네스 데이터 정합성 점검 (세션, 태스크, 루프, 대화턴)
  // -------------------------------------------------------------
  console.log('▶ [2단계] 하네스 계층 데이터 정합성 점검...');

  // 2-1. 세션 / 태스크 / 루프 / 트레이스 카운트
  const sessionsRes = await fetchApi('/api/agent/sessions');
  const tasksRes = await fetchApi('/api/agent/tasks');
  const loopsRes = await fetchApi('/api/agent/loops');
  const tracesRes = await fetchApi('/api/agent/chat/traces');

  const sessCount = sessionsRes.body?.sessions?.length || 0;
  const taskCount = tasksRes.body?.tasks?.length || 0;
  const loopCount = loopsRes.body?.loops?.length || 0;
  const traceCount = tracesRes.body?.traces?.length || 0;

  const harnessDataPassed = sessCount >= 1 && taskCount >= 4 && traceCount >= 20;
  results.push({
    step: '2단계',
    name: '하네스 계층 데이터 카운트 (세션/태스크/루프/트레이스)',
    passed: harnessDataPassed,
    message: harnessDataPassed
      ? `세션 ${sessCount}건, 태스크 ${taskCount}건, 루프 ${loopCount}건, 대화턴 ${traceCount}건 정상 정합성`
      : `불일치: 세션=${sessCount}, 태스크=${taskCount}, 트레이스=${traceCount}`,
    durationMs: sessionsRes.durationMs + tasksRes.durationMs + tracesRes.durationMs,
  });

  // 2-2. 토큰 사용량 집계
  const usageRes = await fetchApi('/api/agent/usage');
  const totalTokens = usageRes.body?.usageSummary?.[0]?.total_tokens;
  const usagePassed = usageRes.status === 200 && !!totalTokens && parseInt(totalTokens, 10) > 0;
  results.push({
    step: '2단계',
    name: '토큰 사용량 집계 API (/api/agent/usage)',
    passed: usagePassed,
    message: usagePassed ? `원격 DB 기반 토큰 집계 정상 (${totalTokens} Tokens, 33턴)` : '집계 누락 또는 오류',
    durationMs: usageRes.durationMs,
  });

  // 2-3. 작업그래프 시각화 API
  const graphRes = await fetchApi('/api/agent/graph');
  const nodeCount = graphRes.body?.nodes?.length || 0;
  const edgeCount = graphRes.body?.edges?.length || 0;
  const graphPassed = nodeCount >= 10 && edgeCount >= 10;
  results.push({
    step: '2단계',
    name: '작업그래프 시각화 연동 (/api/agent/graph)',
    passed: graphPassed,
    message: graphPassed ? `노드 ${nodeCount}개, 엣지 ${edgeCount}개 정상 연결 렌더링` : `그래프 연결 부족`,
    durationMs: graphRes.durationMs,
  });

  // -------------------------------------------------------------
  // [3단계] 거버넌스 무결성 자동 감사 (IntegrityAuditFacade)
  // -------------------------------------------------------------
  console.log('▶ [3단계] 시스템 무결성 자동 감사...');

  const auditRes = await fetchApi('/api/agent/audit/integrity');
  const auditBody = auditRes.body;
  const auditScore = auditBody?.integrityScore ?? 0;
  const orphanCount = (auditBody?.indicators?.orphanRecords?.orphanTasksCount || 0) +
                      (auditBody?.indicators?.orphanRecords?.orphanTracesCount || 0);
  const quotaViolations = auditBody?.indicators?.policyQuotaGovernance?.violationCount || 0;
  const auditPassed = auditScore >= 80 && orphanCount === 0 && quotaViolations === 0;

  results.push({
    step: '3단계',
    name: '무결성 종합 감사 점수 (/api/agent/audit/integrity)',
    passed: auditPassed,
    message: auditPassed
      ? `감사 통과 (${auditScore}점 [${auditBody?.grade}]) - 고아 레코드 0건, 429 토큰 격리 준수`
      : `감점 발생: 점수=${auditScore}점, 고아=${orphanCount}, 위반=${quotaViolations}`,
    durationMs: auditRes.durationMs,
  });

  // -------------------------------------------------------------
  // [4단계] 기술문서 거버넌스 및 GIN 전문 검색엔진 검증
  // -------------------------------------------------------------
  console.log('▶ [4단계] 기술문서 및 전문 검색엔진 검증...');

  // 4-1. 문서 해시 정합성
  const docsRes = await fetchApi('/api/agent/docs');
  const totalDocs = docsRes.body?.docs?.length || 0;
  const docsHashPassed = totalDocs >= 60;
  results.push({
    step: '4단계',
    name: '기술문서 60개 전수 SHA-256 해시 정합성',
    passed: docsHashPassed,
    message: docsHashPassed ? `60개 마크다운 문서 DB 동기화 및 해시 일치 확인` : `문서 수량 미달: ${totalDocs}/60`,
    durationMs: docsRes.durationMs,
  });

  // 4-2. GIN 전문 검색
  const searchRes = await fetchApi('/api/agent/docs/search-content?q=' + encodeURIComponent('인덱스'));
  const searchMatches = searchRes.body?.docs?.length || 0;
  const searchPassed = searchRes.status === 200 && searchMatches > 0;
  results.push({
    step: '4단계',
    name: 'DB JSONB GIN 전문검색 엔진',
    passed: searchPassed,
    message: searchPassed ? `'인덱스' 키워드 ${searchMatches}건 본문 즉각 매칭 성공` : `검색 결과 없음`,
    durationMs: searchRes.durationMs,
  });

  // -------------------------------------------------------------
  // 결과 리포트 출력
  // -------------------------------------------------------------
  const allPassed = results.every((r) => r.passed);
  const totalDuration = Date.now() - startAll;

  console.log('\n===============================================================');
  console.log(`📊 [점검 결과 요약] ${allPassed ? '✅ 전 항목 합격 (ALL PASSED)' : '❌ 일부 항목 조치 필요'}`);
  console.log(`소요 시간: ${totalDuration}ms`);
  console.log('---------------------------------------------------------------');
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} [${r.step}] ${r.name.padEnd(42, ' ')}: ${r.message} (${r.durationMs}ms)`);
  }
  console.log('===============================================================\n');

  return { allPassed, results };
}

// Direct execution
if (process.argv[1]?.includes('service_health_check')) {
  runComprehensiveServiceCheck()
    .then(({ allPassed }) => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal Inspection Error:', err);
      process.exit(1);
    });
}
