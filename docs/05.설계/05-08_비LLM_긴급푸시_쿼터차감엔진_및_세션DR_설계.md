# 05-08. 비-LLM 긴급 푸시, 다차원 쿼터 차감 엔진 및 세션 재해복구(DR) 아키텍처 설계

> **문서 상태**: 확정 및 구현 적용 (Active)  
> **최초 작성일**: 2026-09-23  
> **소관 부서**: purePDFrend 시스템 아키텍처 설계국  
> **관련 정책**: 03-15 (토큰소진 선제방지), 03-16 (비LLM 긴급푸시 및 세션DR)

---

## 1. 시스템 아키텍처 개요

본 설계는 LLM 토큰 소진 및 세션 행(Hang) 상황에서도 소프트웨어 소스 코드의 유실을 원천 방어하고, 사용자 계정별 쿼터를 정밀하게 차감하며, 다중 세션 간 무손실 인계를 실현하는 3대 서브시스템으로 구성됩니다.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           purePDFrend Frontend (Web UI)                          │
│  [🚨 긴급 GitHub Push]   [💾 세션 백업]   [🔄 세션 복원]   [📊 실시간 쿼터/행 뱃지]  │
└──────────────────────────┬───────────────────────────────────────────────────────┘
                           │ Direct HTTP REST Call (Non-LLM Bypass)
┌──────────────────────────▼───────────────────────────────────────────────────────┐
│                           Node.js Express Backend (/server.ts)                   │
│  1. /api/agent/emergency/push    : GitHub Git Data API 직결 커밋/푸시             │
│  2. /api/agent/session/snapshot  : 세션 DR 스냅샷 영속화                          │
│  3. /api/agent/session/restore   : 1건 직결 / 다건 선택 세션 복원 파이프라인       │
│  4. /api/agent/quota/deduct      : 모델별 횟수(Pro 250/Flash 2,500) & 토큰 차감    │
└──────────────┬───────────────────────────────┬───────────────────────────────────┘
               │                               │
┌──────────────▼───────────────┐ ┌─────────────▼───────────────────────────────────┐
│     PostgreSQL Database      │ │             GitHub Git Database API             │
│ - aiagent.harness_session_meta│ │ POST /repos/:owner/:repo/git/blobs             │
│ - aiagent.agent_quota_ledger │ │ POST /repos/:owner/:repo/git/trees              │
│ - aiagent.agent_quota_log    │ │ POST /repos/:owner/:repo/git/commits            │
└──────────────────────────────┘ │ PATCH /repos/:owner/:repo/git/refs/heads/:branch│
                                 └─────────────────────────────────────────────────┘
```

---

## 2. 서브시스템 상세 설계

### 2.1 비-LLM 긴급 Push 서브시스템 (`EmergencyGitPushEngine`)
- **엔드포인트**: `POST /api/agent/emergency/push`
- **입력**: `{ targetBranch?: string, commitMessage?: string }`
- **실행 로직**:
  1. 프로젝트 루트의 `src/`, `docs/`, `data/`, `scripts/` 디렉터리 내 변경 파일 전수 스캔.
  2. GitHub Git Database API(`POST /git/blobs`)를 호출하여 각 파일의 SHA 생성.
  3. Base Tree를 기반으로 신규 Tree 생성(`POST /git/trees`).
  4. 긴급 백업 커밋 생성(`POST /git/commits`): `[EMERGENCY-PUSH] non-llm recovery checkpoint (SHA)`.
  5. 대상 브랜치(`refs/heads/dev` 또는 `refs/heads/task/xxx`)로 Reference 업데이트(`PATCH /git/refs`).
  6. 결과 반환: `{ success: true, commitSha, changedFileCount, branch }`.

### 2.2 다차원 쿼터 차감 엔진 (`QuotaDeductionEngine`)
- **하이브리드 차감 원칙**:
  - **호출 횟수(Request Count)**: Pro 모델 사용 시 `pro_requests_used + 1` (최대 250), Flash 모델 사용 시 `flash_requests_used + 1` (최대 2,500).
  - **토큰 볼륨(Token Count)**: `prompt_tokens + (completion_tokens * weight)`.
  - **Graceful Degradation (폴백 권고)**:
    - Pro 횟수가 250회에 도달할 경우, API 응답에 `fallback_recommended: true`, `fallback_model: 'gemini-1.5-flash'` 플래그를 전달하여 무중단 서비스를 유지.

### 2.3 세션 재해복구(DR) 서브시스템 (`SessionDisasterRecoveryService`)
- **스냅샷 영속화 구조**:
```json
{
  "snapshot_id": "SNAP-20260923-0009-01",
  "session_num": "0009",
  "session_title": "[0009]에이전트 사용자·모델·요금제 메타 거버넌스 및 다차원 쿼터 시스템 구축",
  "last_task_id": "TASK-20260922-001",
  "current_task_name": "[02] 비-LLM 긴급 Push 및 세션 재해복구 체계 구축",
  "latest_commit_sha": "7109f1c922e4ae6c123cb34e6d0e6a0df1c69542",
  "branch": "dev",
  "status": "PENDING_RECOVERY",
  "created_at": "2026-09-23T00:50:00Z"
}
```
- **복원 파이프라인**:
  - `GET /api/agent/session/snapshots`: 미완료 스냅샷 목록 반환.
  - 단일 스냅샷 존재 시: 즉시 1번 스냅샷을 기반으로 세션 복구 객체 반환.
  - 다건 존재 시: 선택 가능한 인덱스 리스트 반환.
