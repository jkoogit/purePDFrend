async function main() {
  const turnPayload = {
    session_id: 'SESSION-0018',
    task_id: 'TASK-0018-01',
    loop_id: 'LOOP-0018-01-01',
    step_index: 1,
    turn_number: 1,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: '#태스크처리 [0013] 이메일 변경 인라인 인증번호 발송·6자리 검증 통합 및 2FA 주수단 선택·비상복구코드 모달 구현',
    agent_response: '사용자관리(PG-USR-04) 프로필 크롭 연동, 인라인 정보수정 모드, 시스템 정책 연동 이메일·2FA 옵션화 및 비상 복구코드 10개 관리 모달 완결',
    response_summary: '모바일 좌측잘림 방어, 퀵설정 DnD 롱프레스 순서 재배치, 아바타 톤다운 연필 수정버튼 및 크롭/프리셋 모달 전역 승격 연동, 이름·별명·연락처·이메일 인라인 수정 모드, 이메일 변경 인라인 인증번호 발송·6자리 검증 연속 동선 일체화, 시스템 정책 연동 이메일·2FA 옵션화(필수 vs 선택) 및 비상 복구코드 10개 관리 모달 완결',
    prompt_tokens: 1450,
    completion_tokens: 820,
    total_tokens: 2270,
  };

  const res = await fetch('http://localhost:3000/api/agent/trace/turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(turnPayload),
  });
  const data = await res.json();
  console.log('SESSION-0018 Turn registration result:', data);
}

main();
