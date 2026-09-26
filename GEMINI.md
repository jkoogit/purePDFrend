# Gemini Model Routing & Token Governance Constitution (GEMINI.md)

> **프로젝트**: purePDFrend (AI Agent Governance Engine)  
> **버전**: v1.0.0 (2026-09-23)  
> **적용 대상**: 모든 Gemini 계열 모델 (Pro, Flash, Flash-Lite) 및 AI Studio 개발 환경

---

## 1. 3계층 모델 라우팅 정책 (3-Tier Model Routing)

Google AI Studio 및 외부 에이전트 연동 시, 각 작업의 특성과 토큰 소비량에 따라 모델을 전략적으로 차등 배정합니다.

| 티어 (Tier) | 모델명 | 일일 호출 쿼터 (RPD) | 주 담당 업무 및 하네스 단계 | 목적 |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (Heavy)** | `gemini-1.5-pro` | **250회/일** | `#태스크시작` (요구사항 심층 분석, DDD/헥사고날 아키텍처 수립, 복잡 알고리즘 설계) | 고난도 추론 및 논리적 무결성 확보 |
| **Tier 2 (Standard)** | `gemini-1.5-flash` | **2,500회/일 (10x)** | `#태스크처리` (컴포넌트/엔드포인트 기능 구현, TDD 단위 테스트, 린트/컴파일 오류 수정) | 빠른 반응 속도 및 대용량 코드 생성 |
| **Tier 3 (Lightweight)**| `gemini-1.5-flash-8b` / `flash-lite` | **4,000회/일** | `#태스크정리`, `#태스크승급`, 문서 인덱싱, 단순 상태 동기화 | 불필요한 Pro 쿼터 낭비 방지 |

---

## 2. 듀얼 쿼터 및 Graceful Degradation (지능형 폴백)

1. **호출 한도 감시**:
   - `gemini-1.5-pro` 누적 호출이 **250회**에 도달하거나 잔여 쿼터가 소진될 경우, 엔진은 `fallbackRecommended: true`를 반환합니다.
2. **무중단 폴백 (Fallback to Flash)**:
   - Pro 쿼터 소진 시 즉각 `gemini-1.5-flash`로 라우팅을 자동 전환하여 에이전트 작업이 정지(Freeze)되지 않도록 보장합니다.
3. **토큰 리셋 기준**:
   - Google AI 일일 쿼터(RPD)는 **한국 표준시(KST) 매일 16:00 (PST 00:00)**에 자동 리셋됩니다.

---

## 3. 세션 행(Hang) 및 재해복구(DR) 연동

- **원인별 대응**:
  - `HANG_OVERLOAD` (503 / 순간 부하): 1~3분 쿨다운 후 재시도.
  - `HANG_QUOTA_EXHAUSTED` (429 / 일일 한도 소진): 한국시간 16:00 대기 또는 타 계정 전환.
  - `HANG_CONTEXT_BLOAT` (15만 토큰 초과): Web UI에서 **[🚨 긴급 소스 GitHub Push]** 클릭 후 새 세션에서 `#세션복구` 실행.
  - `HANG_INDETERMINATE` (10분 무응답): 10분 초과 시 비-LLM 긴급 Push 및 스냅샷 복구 진행.

---

## 4. 비-LLM 긴급 Push 우회로

에이전트가 토큰 소진이나 응답 불가 상태에 빠지더라도, 프론트엔드 Web UI는 백엔드 `EmergencyGitPushEngine`(`POST /api/agent/emergency/push`)을 직접 호출하여 **작업 중인 모든 소스(코드/문서)를 GitHub 원격 `dev` 브랜치에 안전하게 보존**합니다.
