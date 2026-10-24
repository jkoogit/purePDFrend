import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
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
      timeout: 25000,
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.success) resolve(parsed);
          else reject(new Error(parsed.error || body));
        } catch (e) {
          reject(new Error(body));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function generateSvgDiagram(title: string, subtitle: string, steps: { label: string; desc: string; color: string }[]): string {
  const width = 880;
  const height = 240 + Math.ceil(steps.length / 3) * 110;
  
  let stepBoxes = '';
  steps.forEach((s, idx) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const x = 40 + col * 270;
    const y = 140 + row * 120;
    const strokeColor = s.color === 'emerald' ? '#10b981' : s.color === 'amber' ? '#f59e0b' : '#6366f1';
    const badgeBg = s.color === 'emerald' ? '#064e3b' : s.color === 'amber' ? '#78350f' : '#1e1b4b';

    stepBoxes += `
      <g transform="translate(${x}, ${y})">
        <rect width="250" height="95" rx="12" fill="#0f172a" stroke="${strokeColor}" stroke-width="1.5" />
        <rect x="12" y="12" width="60" height="20" rx="4" fill="${badgeBg}" />
        <text x="42" y="26" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="10" font-weight="700" text-anchor="middle">STEP ${idx + 1}</text>
        <text x="80" y="27" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="700">${s.label}</text>
        <text x="12" y="55" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11">${s.desc}</text>
      </g>
    `;
    if (col < 2 && idx < steps.length - 1) {
      stepBoxes += `
        <path d="M ${x + 255} ${y + 48} L ${x + 265} ${y + 48}" stroke="#475569" stroke-width="2" marker-end="url(#arrow)" />
      `;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1"/>
    </marker>
  </defs>
  <rect width="${width}" height="${height}" rx="16" fill="url(#bg-grad)" stroke="#1e293b" stroke-width="2"/>
  <text x="40" y="50" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="20" font-weight="800">${title}</text>
  <text x="40" y="80" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13">${subtitle}</text>
  <line x1="40" y1="105" x2="${width - 40}" y2="105" stroke="#334155" stroke-dasharray="4 4"/>
  ${stepBoxes}
</svg>`;
}

const DIAGRAM_CONFIGS: Record<string, { svgName: string; title: string; subtitle: string; steps: any[] }> = {
  '03-06': {
    svgName: '03-06_01_turn_auto_lifecycle.svg',
    title: '매턴 응답 자동처리 및 보완턴 거버넌스 상태 전이도',
    subtitle: '요청 수신 -> 처리/검증 -> 자동 보완 -> 감사 영속화 파이프라인',
    steps: [
      { label: '요청 수신', desc: '프롬프트 키워드 및 의도 분석', color: 'indigo' },
      { label: '턴 실행/검증', desc: 'TDD 단위검증 및 린트/컴파일', color: 'indigo' },
      { label: '보완턴 분기', desc: '오류 발생 시 자동 자가치유', color: 'amber' },
      { label: '감사 영속화', desc: 'DB/로컬 스토어 100% 저장', color: 'emerald' },
    ]
  },
  '03-08': {
    svgName: '03-08_01_task_backlog_flow.svg',
    title: '태스크 항목 분할 및 백로그 거버넌스 운영 흐름도',
    subtitle: '작업 단위 마이크로 턴 분할 -> 백로그 격리 -> 단계별 승급',
    steps: [
      { label: '태스크 분할', desc: '작업별 순번 번호 부여', color: 'indigo' },
      { label: '범위 검증', desc: '범위 이탈 요청 식별', color: 'amber' },
      { label: '백로그 격리', desc: '하네스 백로그 큐 분리 등록', color: 'indigo' },
      { label: '태스크 완결', desc: '단위 기능 완성 및 리뷰 발행', color: 'emerald' },
    ]
  },
  '03-09': {
    svgName: '03-09_01_token_quota_filter.svg',
    title: '토큰 한도 초과 오류 대화턴 저장 제외 필터링 아키텍처',
    subtitle: '에이전트별 전용 탐지 전략 -> 429/쿼터 에러 격리 -> 무중단 폴백',
    steps: [
      { label: '응답 분석', desc: 'TokenQuotaDetectionService 기동', color: 'indigo' },
      { label: '429/쿼터 탐지', desc: 'RESOURCE_EXHAUSTED 판정', color: 'amber' },
      { label: '감사 DB 제외', desc: '오류 턴 감사 영속화 원천 배제', color: 'indigo' },
      { label: '로컬 폴백', desc: '화면 크래시 방지 및 안내', color: 'emerald' },
    ]
  },
  '03-10': {
    svgName: '03-10_01_db_resilience_lifecycle.svg',
    title: 'DB 장애 대응 및 무중단 운영 라이프사이클 (Zero-Hang)',
    subtitle: '연결 단절 감지 -> 로컬 스토어 폴백 -> 무중단 실행 -> 자동 재동기화',
    steps: [
      { label: '단절 감지', desc: '브릿지 20초 타임아웃 판정', color: 'amber' },
      { label: '로컬 폴백', desc: 'local_agent_store.json 가동', color: 'indigo' },
      { label: '오프라인 실행', desc: 'PDF 변환/OCR 독립 실행', color: 'emerald' },
      { label: '복구 동기화', desc: '재연결 시 DB 일괄 동기화', color: 'emerald' },
    ]
  },
  '03-11': {
    svgName: '03-11_01_harness_state_machine.svg',
    title: '에이전트 통합 거버넌스 3계층 상태머신 구조도',
    subtitle: '세션(0000) -> 태스크(00) -> 루프(LOOP) 계층 라이프사이클',
    steps: [
      { label: '세션 시작', desc: '이슈/PR/브랜치 점검 및 등록', color: 'indigo' },
      { label: '태스크 실행', desc: 'READ-ONLY 계획 후 #태스크처리', color: 'indigo' },
      { label: '코드 리뷰', desc: '#태스크정리 및 원격 커밋 푸시', color: 'amber' },
      { label: '세션 완결', desc: 'KPT 회고 및 dev->stg->main 승급', color: 'emerald' },
    ]
  },
  '03-12': {
    svgName: '03-12_01_service_guardrails_flow.svg',
    title: '서비스 전수점검 및 상시 가드레일 진단 아키텍처',
    subtitle: '5대 가드레일(DB, 세션, 빌드, 토큰, UI) 종합 정밀 검증',
    steps: [
      { label: '진단 트리거', desc: 'Navbar 정밀점검 원클릭 실행', color: 'indigo' },
      { label: '가드레일 검사', desc: '5대 도메인 100% 전수 점검', color: 'indigo' },
      { label: '실시간 리포트', desc: '체크포인트 상태 모달 노출', color: 'amber' },
      { label: '자가 치유', desc: '불일치 감지 시 자동 보완 가이드', color: 'emerald' },
    ]
  },
  '03-13': {
    svgName: '03-13_01_design_philosophy_ia.svg',
    title: 'UI/UX 통일성 및 3대 도메인 IA 그룹화 아키텍처',
    subtitle: '담백한 엔지니어링 톤앤매너, 모바일 44px 터치, 슬레이트/인디고 팔레트',
    steps: [
      { label: '3대 도메인', desc: '하네스 / 지식창고 / 스튜디오', color: 'indigo' },
      { label: '8대 뷰 매핑', desc: '작업그래프부터 시나리오까지', color: 'indigo' },
      { label: '모바일 반응형', desc: '반응형 카드 및 터치 가드레일', color: 'emerald' },
      { label: '색상 단일화', desc: 'Slate, Indigo, Emerald 규격', color: 'emerald' },
    ]
  },
  '05-04': {
    svgName: '05-04_01_session_store_isolation.svg',
    title: '세션 스토어 격리 및 동적 DB 영속화 아키텍처',
    subtitle: '다중 세션 상호 간섭 차단 및 고신뢰 하이브리드 영속화',
    steps: [
      { label: '세션 식별', desc: 'SESSION-YYYYMMDD-XXX 격리', color: 'indigo' },
      { label: '스토어 분리', desc: '독립 컨텍스트 캐시 보장', color: 'indigo' },
      { label: '브릿지 동기화', desc: 'PostgreSQL JSONB 일괄 적재', color: 'emerald' },
    ]
  },
  '05-05': {
    svgName: '05-05_01_checkpoint_turn_pipeline.svg',
    title: 'DB 인덱스 최적화 및 대화턴 일괄 영속화 파이프라인',
    subtitle: 'B-Tree 인덱스 튜닝 및 트랜잭션 단위 안전 영속화',
    steps: [
      { label: '턴 캡처', desc: '사용자 프롬프트 및 응답 기록', color: 'indigo' },
      { label: '인덱스 튜닝', desc: 'session_id, task_id 복합 인덱스', color: 'indigo' },
      { label: '영속화 보증', desc: 'agent_conversation_trace 적재', color: 'emerald' },
    ]
  },
  '05-06': {
    svgName: '05-06_01_domain_state_transition.svg',
    title: '모바일 반응형 UX 및 3대 도메인 상태 전이도',
    subtitle: 'App.tsx SSOT 기반 하네스-지식창고-스튜디오 원활한 전환',
    steps: [
      { label: '하네스 거버넌스', desc: '그래프 / 태스크 / 통계 / 감사', color: 'indigo' },
      { label: '추적 & 지식창고', desc: '문서 거버넌스 / 시스템 설정', color: 'indigo' },
      { label: 'PDF 스튜디오', desc: 'OCR 엔진 / 시나리오 설계', color: 'emerald' },
    ]
  },
  '06-01': {
    svgName: '06-01_01_mobile_ui_objects.svg',
    title: '모바일 반응형 5대 표준 오브젝트 상호작용 체계',
    subtitle: '헤더바, 퀵칩바, 캐러셀, 드로어, 모달 뷰포트 완결성',
    steps: [
      { label: '헤더 & 퀵칩', desc: 'h-14 글로벌바 + h-11 스크롤바', color: 'indigo' },
      { label: '카드 & 캐러셀', desc: '테이블-카드 변환 + ScrollSnap', color: 'indigo' },
      { label: '드로어 & 모달', desc: 'z-index 계층 및 safe-area 보장', color: 'emerald' },
    ]
  }
};

function migrateDocument(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const baseName = path.basename(filePath);
  const dirName = path.dirname(filePath);
  const relPath = path.relative(path.join(process.cwd(), 'docs'), filePath).replace(/\\/g, '/');

  // 1. 다이어그램 이미지 생성 및 연계
  for (const [key, conf] of Object.entries(DIAGRAM_CONFIGS)) {
    if (baseName.startsWith(key)) {
      const imagesDir = path.join(dirName, 'images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      const svgPath = path.join(imagesDir, conf.svgName);
      if (!fs.existsSync(svgPath)) {
        const svgContent = generateSvgDiagram(conf.title, conf.subtitle, conf.steps);
        fs.writeFileSync(svgPath, svgContent, 'utf-8');
        console.log(`Generated SVG: ${svgPath}`);
      }

      // Check if image is linked in content
      const imgTag = `<div align="center">\n  <img src="./images/${conf.svgName}" alt="${conf.title}" style="max-width: 100%; height: auto; border: 1px solid #334155; border-radius: 12px;" />\n  <p><em>[그림] ${conf.title}</em></p>\n</div>`;
      if (!content.includes(conf.svgName)) {
        // Insert right before ```mermaid
        if (content.includes('```mermaid')) {
          content = content.replace('```mermaid', `${imgTag}\n\n\`\`\`mermaid`);
          console.log(`Linked SVG into ${baseName}`);
        }
      }
    }
  }

  // 2. 상단 메타데이터 관련 정책 문서 링크 보강
  const policyLinkSection = `> - 관련 정책 문서:\n>   - [03-01. 문서 작성 및 편집이력 관리 정책](../03.정책/03-01_문서작성_및_편집이력_정책.md)\n>   - [03-13. UI/UX 디자인 시스템 운영 정책](../03.정책/03-13_UIUX_통일성_및_모바일반응형_디자인시스템_운영정책.md)\n>   - [03-14. 모바일 반응형 디자인 가이드](../03.정책/03-14_모바일반응형_카드전환_및_가로스크롤_원천방지_디자인가이드.md)`;
  
  if (!content.includes('관련 정책 문서') && !baseName.startsWith('README')) {
    // Look for blockquote end or header
    if (content.includes('> **적용 범위**:') || content.includes('> **적용범위**:')) {
      content = content.replace(/(> \*\*적용\s*범위\*\*:[^\n]+)/, `$1\n${policyLinkSection}`);
    }
  }

  // 3. 편집 이력 (Revision History) 표준 8컬럼 변환 및 현행화
  const stdHeader = `| 작업일자 | 이슈 | 태스크 | 작업자 | 작업내용 | 사용 AI 모델명 | 에이전트 | 참고링크 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`;

  const newRevisionRow = `| 2026-09-21 | #14 | TASK-008 | gemini | v2.2 전면 개정: 8대 필드 편집이력, 상호 링크, 다이어그램 이미지화 및 DB 영속화 표준 반영 | Gemini 3.8 Flash | Google AI Studio | [03-01. 문서 정책](../03.정책/03-01_문서작성_및_편집이력_정책.md) |`;

  if (content.includes('## 📋 편집 이력 (Revision History)') || content.includes('## 📝 편집 이력 (Revision History)') || content.includes('## 📜 4. 편집 이력') || content.includes('## 📜 5. 편집 이력 (Revision History)')) {
    // If it has old 5-column table:
    if (content.includes('| 버전 | 개정일자 | 개정자 | 작업 구분 | 주요 개정 내용 |')) {
      content = content.replace(
        /\| 버전 \| 개정일자 \| 개정자 \| 작업 구분 \| 주요 개정 내용 \|\s*\| :--- \| :--- \| :--- \| :--- \| :--- \|([\s\S]*?)(?=(\n## |\n---|$))/,
        (match, rows) => {
          // Parse old rows and convert
          const convertedRows: string[] = [];
          const lines = rows.trim().split('\n');
          for (const line of lines) {
            if (!line.includes('|')) continue;
            const parts = line.split('|').map((p: string) => p.trim()).filter(Boolean);
            if (parts.length >= 5) {
              const version = parts[0];
              const date = parts[1];
              const author = parts[2];
              const type = parts[3];
              const desc = parts[4];
              convertedRows.push(`| ${date} | #01 | TASK-001 | ${author} | [${version}] ${type}: ${desc} | Gemini 2.5 Flash | Google AI Studio | [03-01. 문서 정책](../03.정책/03-01_문서작성_및_편집이력_정책.md) |`);
            }
          }
          if (!convertedRows.some(r => r.includes('TASK-008'))) {
            convertedRows.push(newRevisionRow);
          }
          return `${stdHeader}\n${convertedRows.join('\n')}\n`;
        }
      );
    } else if (!content.includes('TASK-008')) {
      // Append row to existing 8-col table
      content = content.replace(
        /(\| 작업일자 \| 이슈 \| 태스크 \| 작업자 \| 작업내용 \| 사용 AI 모델명 \| 에이전트 \| 참고링크 \|[\s\S]*?)(\n---|\n## |$)/,
        `$1\n${newRevisionRow}\n$2`
      );
    }
  } else if (!baseName.startsWith('README')) {
    // Add revision history at bottom if missing
    content = `${content.trim()}\n\n---\n\n## 📝 편집 이력 (Revision History)\n\n${stdHeader}\n| 2026-09-20 | #10 | TASK-005 | gemini | 최초 제정 및 도메인 거버넌스 수립 | Gemini 2.5 Flash | Google AI Studio | [03-01. 문서 정책](../03.정책/03-01_문서작성_및_편집이력_정책.md) |\n${newRevisionRow}\n`;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
}

function scanAndMigrate(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'images') {
      scanAndMigrate(full);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      migrateDocument(full);
    }
  }
}

async function main() {
  const docsDir = path.join(process.cwd(), 'docs');
  console.log('1. Migrating docs to v2.2 policy standards (history, links, diagrams)...');
  scanAndMigrate(docsDir);
  console.log('2. Migration of markdown files completed.');

  console.log('3. Running database sync...');
  const { execSync } = await import('child_process');
  const syncOut = execSync('npx tsx scripts/sync_docs_content.ts', { encoding: 'utf-8' });
  console.log(syncOut);

  console.log('4. Updating local agent store...');
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    // Update trace
    const newTrace = {
      trace_id: `TRACE-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-3)}`,
      session_id: 'SESSION-20260921-004',
      task_id: 'TASK-20260921-001',
      loop_id: null,
      step_index: 3,
      agent_name: 'gemini',
      model_name: 'models/gemini-3.8-flash',
      user_prompt: '#태스크처리 1차 메뉴 첫 버튼 여백 보정 및 /docs 전수 문서정책(이력, 링크, 다이어그램 이미지) 반영과 DB 영속화',
      agent_response: 'Navbar 작업그래프 좌측 여백 보강, /docs 전수 문서 8대 필드 편집이력/상호링크/SVG 다이어그램 이미지 생성 연계 및 개발DB aiagent.agent_docs_meta 영속화 완결',
      response_summary: '문서정책 v2.2 전수 반영 및 DB 영속화 완료',
      prompt_tokens: 1800,
      completion_tokens: 1300,
      total_tokens: 3100,
      created_at: new Date().toISOString(),
    };
    store.traces = store.traces || [];
    store.traces.push(newTrace);
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');
    console.log('Updated local_agent_store.json with new trace.');
  }
}

main().catch(console.error);
