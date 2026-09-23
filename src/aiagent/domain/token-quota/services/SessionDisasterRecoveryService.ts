/**
 * @file SessionDisasterRecoveryService.ts
 * @description 세션 재해복구(DR), 스냅샷 관리 및 행(Hang) 원인 판별 도메인 서비스
 */

export type HangReasonType = 
  | 'NORMAL'                  // 정상
  | 'HANG_OVERLOAD'           // 순간 부하 지연 (1~3분 쿨다운)
  | 'HANG_QUOTA_EXHAUSTED'    // 일일 쿼터 소진 (KST 16:00 리셋 대기 또는 타 계정 전환)
  | 'HANG_CONTEXT_BLOAT'      // 세션 15만 토큰 포화 (새 세션 분기 필요)
  | 'HANG_INDETERMINATE';     // 원인 불명 10분 대기

export interface HangStatusAssessment {
  status: HangReasonType;
  badgeLabel: string;
  badgeColor: 'green' | 'yellow' | 'red' | 'orange' | 'gray';
  message: string;
  recommendedAction: string;
  canEmergencyPush: boolean;
}

export interface SessionSnapshot {
  snapshotId: string;
  sessionNum: string;
  sessionTitle: string;
  lastTaskId?: string;
  currentTaskName?: string;
  latestCommitSha: string;
  branch: string;
  status: 'PENDING_RECOVERY' | 'RESTORED' | 'ARCHIVED';
  totalContextTokens?: number;
  hangReason?: HangReasonType;
  createdAt: string;
  restoredAt?: string | null;
}

export class SessionDisasterRecoveryService {
  /**
   * 행(Hang) 원인 정밀 판별
   */
  public static assessHangStatus(params: {
    httpStatus?: number;
    errorMessage?: string;
    contextTokens?: number;
    silentDurationSeconds?: number;
  }): HangStatusAssessment {
    const { httpStatus, errorMessage = '', contextTokens = 0, silentDurationSeconds = 0 } = params;
    const lowerMsg = errorMessage.toLowerCase();

    // 1. 일일 쿼터 소진 (장시간 소진)
    if (
      httpStatus === 429 &&
      (lowerMsg.includes('resource_exhausted') || lowerMsg.includes('usage limit') || lowerMsg.includes('quota'))
    ) {
      return {
        status: 'HANG_QUOTA_EXHAUSTED',
        badgeLabel: '일일 쿼터 소진',
        badgeColor: 'red',
        message: 'Google AI 일일 호출 한도(RPD)가 소진되었습니다.',
        recommendedAction: '한국시간 16:00 리셋을 대기하거나 다른 계정/에이전트로 세션을 복구하세요.',
        canEmergencyPush: true,
      };
    }

    // 2. 순간 부하 (일시적 지연)
    if (
      httpStatus === 503 ||
      (httpStatus === 429 && (lowerMsg.includes('overloaded') || lowerMsg.includes('rate limit'))) ||
      lowerMsg.includes('model is overloaded')
    ) {
      return {
        status: 'HANG_OVERLOAD',
        badgeLabel: '순간 부하 지연',
        badgeColor: 'yellow',
        message: '모델 서버 일시 과부하 또는 분당 한도(RPM) 초과 상태입니다.',
        recommendedAction: '1~3분 쿨다운 후 자동으로 회복되므로 잠시 대기하세요.',
        canEmergencyPush: true,
      };
    }

    // 3. 컨텍스트 포화 (150,000+ 토큰)
    if (contextTokens >= 150000) {
      return {
        status: 'HANG_CONTEXT_BLOAT',
        badgeLabel: '컨텍스트 포화',
        badgeColor: 'orange',
        message: `현재 세션 누적 토큰(${contextTokens.toLocaleString()})이 15만을 초과하여 지연이 심화됩니다.`,
        recommendedAction: '[긴급 소스 Push] 후 새 세션을 열고 #세션복구로 깨끗하게 인계하세요.',
        canEmergencyPush: true,
      };
    }

    // 4. 원인 불명 10분 대기
    if (silentDurationSeconds >= 600) {
      return {
        status: 'HANG_INDETERMINATE',
        badgeLabel: '10분 응답 지연',
        badgeColor: 'gray',
        message: '10분 이상 에이전트 무응답 상태가 지속되었습니다.',
        recommendedAction: '소스를 긴급 Push하고 새 세션에서 #세션복구를 실행하세요.',
        canEmergencyPush: true,
      };
    }

    // 5. 정상
    return {
      status: 'NORMAL',
      badgeLabel: '정상 작동',
      badgeColor: 'green',
      message: '세션 및 텔레메트리가 정상적으로 동기화되고 있습니다.',
      recommendedAction: '계획된 태스크를 계속 진행하세요.',
      canEmergencyPush: true,
    };
  }

  /**
   * #세션복구 요청 시 분기 해석 (1건 자동복구 vs 다건 목록 선택)
   */
  public static resolveRecoveryTarget(
    snapshots: SessionSnapshot[],
    requestedTarget?: string
  ): {
    strategy: 'DIRECT_RESTORE' | 'SHOW_SELECTION_LIST' | 'NO_SNAPSHOT';
    targetSnapshot?: SessionSnapshot;
    candidates?: SessionSnapshot[];
    message: string;
  } {
    const pending = snapshots.filter(s => s.status === 'PENDING_RECOVERY');

    if (pending.length === 0) {
      return {
        strategy: 'NO_SNAPSHOT',
        message: '복구 대기 중인 세션 스냅샷이 없습니다.',
      };
    }

    // 대상이 명시된 경우 (예: #세션복구:0009 또는 #세션복구:SNAP-xxx)
    if (requestedTarget) {
      const cleanTarget = requestedTarget.replace(/[\[\]]/g, '').trim();
      const match = pending.find(
        s => s.snapshotId === cleanTarget || s.sessionNum === cleanTarget
      );
      if (match) {
        return {
          strategy: 'DIRECT_RESTORE',
          targetSnapshot: match,
          message: `[${match.sessionNum}] 세션 스냅샷(${match.snapshotId})을 즉시 복구합니다.`,
        };
      }
    }

    // 1건만 존재하는 경우: 자동 직결 복구
    if (pending.length === 1) {
      const single = pending[0];
      return {
        strategy: 'DIRECT_RESTORE',
        targetSnapshot: single,
        message: `복구 대기 세션 [${single.sessionNum}] 1건이 확인되어 자동 직결 복구를 진행합니다.`,
      };
    }

    // 2건 이상 존재하는 경우: 다건 목록 제시 및 선택 유도
    return {
      strategy: 'SHOW_SELECTION_LIST',
      candidates: pending,
      message: `복구 가능한 세션 스냅샷이 ${pending.length}건 존재합니다. 복구할 번호를 선택해주세요.`,
    };
  }
}
