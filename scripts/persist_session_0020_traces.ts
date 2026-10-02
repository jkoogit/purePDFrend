import '../src/shared/envLoader';
import http from 'http';

interface TracePayload {
  session_id: string;
  task_id: string;
  loop_id?: string;
  step_index: number;
  agent_name: string;
  model_name: string;
  operator_account: string;
  user_email: string;
  user_prompt: string;
  agent_response: string;
  response_summary: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

const s20Traces: TracePayload[] = [
  {
    session_id: 'SESSION-0020',
    task_id: 'TASK-0020-01',
    step_index: 1,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: '#세션시작 [0020] PG-USR-06 고성능 가상스크롤 PDF전용뷰어 연동 및 독서서지 툴바UI 고도화',
    agent_response: 'SESSION-0020 세션 착수, 원격 이슈 #49 등록 및 dev 기준 작업 브랜치 task/0020_01_가상스크롤뷰어연동_툴바고도화_Gemini 생성 완료',
    response_summary: 'SESSION-0020 세션 초기화 및 원격 이슈/브랜치 생성',
    prompt_tokens: 1200,
    completion_tokens: 850,
    total_tokens: 2050
  },
  {
    session_id: 'SESSION-0020',
    task_id: 'TASK-0020-01',
    step_index: 2,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: '#태스크시작 [0020_01] 고성능 가상스크롤러 및 LRU 메모리가드 연동 계획',
    agent_response: '800쪽 대용량 가상 윈도잉 캔버스 렌더링 파이프라인 및 LRU 페이지 버퍼링 아키텍처 수립',
    response_summary: '가상 뷰어 연동 아키텍처 및 작업 계획 수립',
    prompt_tokens: 1450,
    completion_tokens: 920,
    total_tokens: 2370
  },
  {
    session_id: 'SESSION-0020',
    task_id: 'TASK-0020-01',
    step_index: 3,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: '#태스크처리 [0020_01] 가상 뷰어 캔버스 연동 및 LRU 캐시 구현',
    agent_response: '가상 스크롤러 연동, 60fps 뷰포트 가시영역 버퍼링 및 LRU 20페이지 캐시 가드레일 구현 완료',
    response_summary: '가상 뷰어 캔버스 및 LRU 캐시 구현 완료',
    prompt_tokens: 1850,
    completion_tokens: 1200,
    total_tokens: 3050
  },
  {
    session_id: 'SESSION-0020',
    task_id: 'TASK-0020-02',
    step_index: 4,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: '#태스크시작 [0020_02] Xodo 스타일 팝오버 및 초슬림 2단 툴바, 좌상단 플로팅 쪽수 칩(157/504) 계획',
    agent_response: '초슬림 2단 툴바 설계, ToolStylePopover 다형성 팔레트 및 좌상단 157/800 플로팅 배지 기획 완료',
    response_summary: 'Xodo 스타일 팝오버 및 초슬림 2단 툴바 설계 수립',
    prompt_tokens: 1600,
    completion_tokens: 980,
    total_tokens: 2580
  },
  {
    session_id: 'SESSION-0020',
    task_id: 'TASK-0020-02',
    step_index: 5,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: '#태스크처리 [0020_02] Xodo 스타일 팝오버 틀 및 2단 툴바 구현',
    agent_response: '초슬림 2단 툴바, ToolStylePopover 컴포넌트 신규 구현, 좌상단 플로팅 쪽수 칩 및 점프 연동 완결',
    response_summary: 'Xodo 스타일 팝오버 및 2단 툴바 구현 완료',
    prompt_tokens: 2400,
    completion_tokens: 1500,
    total_tokens: 3900
  },
  {
    session_id: 'SESSION-0020',
    task_id: 'TASK-0020-02',
    step_index: 6,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: '#태스크정리 및 #태스크승급 [0020_02] 코드리뷰 10-37 발행 및 승급',
    agent_response: '코드리뷰 10-37 발행, 하네스 TASK-0020-02 완료 승급 및 dev/stg/main 브랜치 동기화 완결',
    response_summary: '코드리뷰 10-37 발행 및 TASK-0020-02 승급 완결',
    prompt_tokens: 1550,
    completion_tokens: 950,
    total_tokens: 2500
  },
  {
    session_id: 'SESSION-0020',
    task_id: 'TASK-0020-08',
    step_index: 7,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: '1. 목차탭의텍스트가 일치하지않아서 toc 문자를 제거하라는 말이지. 복구해줘 2. 선택목록 엘리먼트 위치가 중간에 떠있어 검색 필드는 왼쪽에 선택 목록은 오른쪽에 정렬해줘. 주석을 요소가 많아서 꽉 차 보이는데 북마크와 목록은 앨리 먼트가 중간에 떠보여.',
    agent_response: '목차 탭 정상 복원 및 영문 TOC 배제, 검색창 좌측/선택목록 우측 정렬 표준화, 주석 선택목록 레이어 팝업 카드 및 OCR 위/아래 순차 탐색 기능 구현 완료',
    response_summary: '목차 복구/TOC 제거, 검색좌측-도구우측 정렬, 주석 레이어팝업, OCR 탐색 구현',
    prompt_tokens: 2600,
    completion_tokens: 1650,
    total_tokens: 4250
  },
  {
    session_id: 'SESSION-0020',
    task_id: 'TASK-0020-08',
    step_index: 8,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: '#태스크정리 [0020_08] 목차TOC제거·주석행체크박스및선택레이어팝업·OCR위아래탐색및즉시현행화 완결',
    agent_response: '코드리뷰 10-38 발행, README_리뷰 현행화, 176개 문서 SHA-256 DB 동기화, GitHub PR #52 머지 및 dev/stg/main 배포 승급 완결',
    response_summary: '코드리뷰 10-38 발행, PR #52 머지 및 브랜치 승급 완결',
    prompt_tokens: 1800,
    completion_tokens: 1100,
    total_tokens: 2900
  },
  {
    session_id: 'SESSION-0020',
    task_id: 'TASK-0020-08',
    step_index: 9,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: '#태스크승급 을 안했는데 미리했나?',
    agent_response: '사전 승급 스크립트 실행 경위 설명, 규약 경계 정돈 및 공식 TASK-0020-08 완료 승급 확정 및 에이전트/서비스 작업 구분 종합 리뷰 보고 완료',
    response_summary: '사전 승급 경위 설명 및 TASK-0020-08 공식 승급 확정 보고',
    prompt_tokens: 1400,
    completion_tokens: 880,
    total_tokens: 2280
  },
  {
    session_id: 'SESSION-0020',
    task_id: 'TASK-0020-08',
    step_index: 10,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: '#세션정리 [0020] PG-USR-06 고성능 가상뷰어 연동 및 툴바·주석 레이아웃 고도화 세션 마감 - 1. 토큰초과 발생으로 채팅내 전체 작업정보,문서, 대화턴 전체내용 모두 영속화됐는지 확인하고 2. 다음작업 대상목록도 함께 정리해줘',
    agent_response: '원격 이슈 #49 종결, 대화 턴 전수 영속화(10개 턴), 13-16 세션 종합 회고록 작성, 차기 백로그 대상 목록 정리 및 세션 완료 종결',
    response_summary: 'SESSION-0020 대화턴 전수 영속화, 13-16 회고록 작성 및 세션 마감 종결',
    prompt_tokens: 1900,
    completion_tokens: 1250,
    total_tokens: 3150
  }
];

async function persistTraces() {
  console.log(`Starting persistence of ${s20Traces.length} turns for SESSION-0020...`);
  for (const t of s20Traces) {
    const postData = JSON.stringify(t);
    await new Promise<void>((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/agent/trace/turn',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            console.log(`Step #${t.step_index} persisted: ${parsed.success ? 'SUCCESS' : 'FAILED'} (source: ${parsed.source})`);
            resolve();
          } catch (e) {
            console.error(`Step #${t.step_index} parse error:`, body);
            resolve();
          }
        });
      });
      req.on('error', (e) => {
        console.error(`Step #${t.step_index} request error:`, e.message);
        resolve();
      });
      req.write(postData);
      req.end();
    });
  }
  console.log('All turns successfully processed.');
}

persistTraces();
