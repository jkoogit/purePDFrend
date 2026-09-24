import http from 'http';

const payload = JSON.stringify({
  task_id: 'TASK-260924-0012-03',
  session_id: 'SESSION-260924-0012',
  task_name: '[0017]In-Memory Write-Through PDF 시스템 설정 관리자(PdfConfigManager) 및 2-Way BBox OCR 교정기(OCRCorrectionStudio) UI/UX 고도화 구현',
  status_cd: '정리중',
  git_branch: 'task/0012_0015_layout-editor-and-dr-fix_Gemini',
  started_at: new Date().toISOString(),
  doc_payload: {
    reviewDoc: 'docs/10.리뷰/260924_029_In_Memory_Write_Through_설정관리자_및_2Way_BBox_교정기_구현_리뷰.md',
    features: [
      'In-Memory Write-Through 설정 관리자 (0ms Fast Read, localStorage 영속화, Observer Pub-Sub)',
      'React 18 usePdfConfig 불변 캐싱 무한루프 방어',
      '3대 프리셋 프로파일 원클릭 전환',
      '2-Way 실시간 양방향 포커스 동기화',
      'HistoryManager 무제한 실행취소/다시실행 (Ctrl+Z, Ctrl+Y)'
    ]
  }
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/agent/tasks',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  },
  (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      console.log('Task DB Sync Result:', res.statusCode, data);
    });
  }
);

req.on('error', (e) => console.error('Task DB Sync Error:', e));
req.write(payload);
req.end();
