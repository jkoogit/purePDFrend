async function main() {
  const turnPayload = {
    session_id: 'SESSION-0016',
    task_id: 'TASK-0016-01',
    loop_id: 'LOOP-0016-01-01',
    step_index: 1,
    turn_number: 1,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.7-flash',
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    user_prompt: '#태스크처리 [0016-01] 소진 작업(전수 목록 화면 UI 정책 일괄 적용, 긴급 백업 복구)',
    agent_response: '전수 목록 화면 UI 표준 정책(너비 조절, 정렬 버튼 분리, 타이틀 중앙 정렬) 일괄 적용 및 긴급 백업 복구 완료',
    response_summary: '목록 UI 정책 3종 일괄 적용, 긴급 백업 패널 마운트 복구, tsc 컴파일 무결성 PASS',
    prompt_tokens: 1200,
    completion_tokens: 650,
    total_tokens: 1850,
  };

  const res = await fetch('http://localhost:3000/api/agent/trace/turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(turnPayload),
  });
  const data = await res.json();
  console.log('Turn 1 registration result:', data);
}

main();
