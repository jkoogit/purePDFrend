import '../src/shared/envLoader';
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
          resolve(JSON.parse(data));
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
  const traceId = 'TRACE-0020-00-00-01';
  const promptText = `[0020] PG-USR-06 고성능 가상 스크롤 PDF 전용 뷰어 연동 및 독서/서지 툴바 UI 고도화

#세션시작 [0020] PG-USR-06 고성능 가상 스크롤 PDF 전용 뷰어 연동 및 독서/서지 툴바 UI 고도화

### 1. 작업 대상 및 핵심 목표
- PG-USR-05 문서관리 라이브러리에서 책/문서 클릭 시 PG-USR-06 PDF 전용 뷰어로 부드러운 화면 전환
- 800쪽 이상 대용량 문서를 위한 60fps 가상 스크롤러(Virtualizer) 및 LRU 페이지 메모리 가드 연동
- 상단 전용 툴바: 줌(확대/축소/맞춤), 회전(좌/우 90°), 페이지 이동(슬라이더+직접입력), 검색(Searchable PDF 하이라이트)

### 2. 세션 작업 환경 및 계정
- 세션 계정: jkok2j2m@gmail.com (운영자: jkok2j2m)
- 작업 브랜치 베이스: 원격 dev 브랜치 (최신 커밋 SHA: 5ff8e61d)
- 참조 문서:
  - docs/13.회고/13-15_SESSION-261001-0019_세션종합_KPT_회고록.md
  - docs/05.설계/05-22_화면프로그램ID체계표_및_정보구조_IA_설계서.md
  - docs/10.리뷰/260924_026_800쪽_대용량_가상뷰어_메모리가드_및_로컬실행환경_보완_리뷰.md`;

  const responseText = `# [0020] PG-USR-06 고성능 가상 스크롤 PDF 전용 뷰어 연동 및 독서/서지 툴바 UI 고도화 세션 시작
1. 세션명 현행화: [0020] PG-USR-06 고성능 가상 스크롤 PDF 전용 뷰어 연동 및 독서/서지 툴바 UI 고도화
2. 원격 저장소 이슈 및 PR 점검: 오픈 이슈 0건, 오픈 PR 0건 확인 (모두 정상 종결)
3. 원격 브랜치 일치 점검: dev, stg, main 최신 커밋 (SHA: 753fda5943ef83f1fdc66de8252add5196dd4cb9) 100% 일치 확인
4. 원격 GitHub 세션 이슈 생성: #49 등록 완료
5. 원격 작업 브랜치 생성: task/0020_01_가상스크롤뷰어연동_툴바고도화_Gemini (기준 SHA: 753fda5)
6. 하네스 스토어 동기화: SESSION-0019 아카이빙 및 SESSION-0020 local_agent_store.json / DB aiagent.harness_session_meta 등록 완료`;

  const summaryText = 'SESSION-0020 세션시작: 원격 이슈 #49 등록, task/0020_01 작업 브랜치 생성, dev/stg/main 100% 동기화, 하네스 스토어 및 DB 등록 완결';

  const insertTraceSql = `
    INSERT INTO aiagent.agent_conversation_trace (
      trace_id, session_id, task_id, loop_id, step_index,
      agent_name, model_name, operator_account, agent_account, user_email,
      user_prompt, agent_response, response_summary,
      prompt_tokens, completion_tokens, total_tokens, created_at
    ) VALUES (
      '${traceId}',
      'SESSION-0020',
      NULL,
      NULL,
      1,
      'gemini',
      'models/gemini-3.8-flash',
      'jkok2j2m',
      'jkok2j2m@gmail.com',
      'jkok2j2m@gmail.com',
      '${promptText.replace(/'/g, "''")}',
      '${responseText.replace(/'/g, "''")}',
      '${summaryText.replace(/'/g, "''")}',
      1420,
      890,
      2310,
      now()
    ) ON CONFLICT (trace_id) DO UPDATE SET
      agent_response = EXCLUDED.agent_response,
      response_summary = EXCLUDED.response_summary,
      total_tokens = EXCLUDED.total_tokens;
  `;

  const res = await executeSql(insertTraceSql);
  console.log('✅ TRACE-0020-00-00-01 등록 완료:', res);
}

main().catch(console.error);
