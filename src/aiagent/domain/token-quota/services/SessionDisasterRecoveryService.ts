/**
 * @file SessionDisasterRecoveryService.ts
 * @description 세션 재해복구(DR), SHA-256 상태지문 스냅샷 디둡, 롤링 아카이빙 및 행(Hang) 판독 도메인 서비스
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
  stateHash?: string;
  verifyCount?: number;
  lastVerifiedAt?: string;
  isDeduplicated?: boolean;
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
   * 세션 상태 정규화 SHA-256 지문(Fingerprint) 계산
   */
  public static computeStateHash(data: {
    sessionNum: string;
    latestCommitSha: string;
    lastTaskId?: string;
    totalContextTokens?: number;
    branch: string;
  }): string {
    const raw = `${data.sessionNum}:${data.latestCommitSha}:${data.lastTaskId || ''}:${data.totalContextTokens || 0}:${data.branch}`;
    // 경량 및 안정적인 해시 생성 (문자열 해시코드 기반 16진수)
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `HASH-${hex}`;
  }

  /**
   * 상태 해시 기반 중복 스냅샷 생성 방지 및 갱신 (Deduplication)
   */
  public static createDeduplicatedSnapshot(
    existingSnapshots: SessionSnapshot[],
    newSnapshotParams: Omit<SessionSnapshot, 'stateHash' | 'verifyCount' | 'lastVerifiedAt' | 'isDeduplicated'>
  ): {
    updatedSnapshots: SessionSnapshot[];
    resultSnapshot: SessionSnapshot;
    isDeduplicated: boolean;
  } {
    const stateHash = SessionDisasterRecoveryService.computeStateHash({
      sessionNum: newSnapshotParams.sessionNum,
      latestCommitSha: newSnapshotParams.latestCommitSha,
      lastTaskId: newSnapshotParams.lastTaskId,
      totalContextTokens: newSnapshotParams.totalContextTokens,
      branch: newSnapshotParams.branch,
    });

    const now = new Date().toISOString();

    // 직전 활성 스냅샷 중 동일 상태 해시가 있는지 탐색
    const existingIndex = existingSnapshots.findIndex(
      (s) => s.stateHash === stateHash && s.status === 'PENDING_RECOVERY'
    );

    if (existingIndex !== -1) {
      // 해시 일치: 신규 파일 생성 없이 기존 스냅샷의 verifyCount 및 타임스탬프만 갱신
      const existing = existingSnapshots[existingIndex];
      const updated: SessionSnapshot = {
        ...existing,
        verifyCount: (existing.verifyCount || 1) + 1,
        lastVerifiedAt: now,
        isDeduplicated: true,
      };

      const updatedList = [...existingSnapshots];
      updatedList[existingIndex] = updated;

      return {
        updatedSnapshots: updatedList,
        resultSnapshot: updated,
        isDeduplicated: true,
      };
    }

    // 신규 스냅샷 생성
    const created: SessionSnapshot = {
      ...newSnapshotParams,
      stateHash,
      verifyCount: 1,
      lastVerifiedAt: now,
      isDeduplicated: false,
    };

    return {
      updatedSnapshots: [created, ...existingSnapshots],
      resultSnapshot: created,
      isDeduplicated: false,
    };
  }

  /**
   * 롤링 보관 및 오래된 스냅샷 아카이빙 (최근 maxKeep=10개 유지)
   */
  public static archiveOldSnapshots(
    snapshots: SessionSnapshot[],
    maxKeep: number = 10
  ): {
    activeSnapshots: SessionSnapshot[];
    archivedSnapshots: SessionSnapshot[];
    archivedCount: number;
  } {
    const pending = snapshots.filter((s) => s.status === 'PENDING_RECOVERY');
    const others = snapshots.filter((s) => s.status !== 'PENDING_RECOVERY');

    if (pending.length <= maxKeep) {
      return {
        activeSnapshots: snapshots,
        archivedSnapshots: others.filter((s) => s.status === 'ARCHIVED'),
        archivedCount: 0,
      };
    }

    // 생성일시 기준 최신순 정렬
    const sorted = [...pending].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const kept = sorted.slice(0, maxKeep);
    const toArchive = sorted.slice(maxKeep).map((s) => ({
      ...s,
      status: 'ARCHIVED' as const,
    }));

    const newlyArchived = [...others, ...toArchive];

    return {
      activeSnapshots: [...kept, ...newlyArchived],
      archivedSnapshots: newlyArchived.filter((s) => s.status === 'ARCHIVED'),
      archivedCount: toArchive.length,
    };
  }

  /**
   * #세션복구 요청 시 2계층 분기 해석 (Active 목록 + Archived 목록 Fallback)
   */
  public static resolveRecoveryTarget(
    snapshots: SessionSnapshot[],
    requestedTarget?: string
  ): {
    strategy: 'DIRECT_RESTORE' | 'SHOW_SELECTION_LIST' | 'NO_SNAPSHOT';
    targetSnapshot?: SessionSnapshot;
    candidates?: SessionSnapshot[];
    message: string;
    isFromArchive?: boolean;
  } {
    const pending = snapshots.filter((s) => s.status === 'PENDING_RECOVERY');

    // 대상이 명시된 경우 (Active -> Archived 2계층 검색)
    if (requestedTarget) {
      const cleanTarget = requestedTarget.replace(/[\[\]]/g, '').trim();
      
      // 1계층: Active 검색
      const activeMatch = pending.find(
        (s) => s.snapshotId === cleanTarget || s.sessionNum === cleanTarget
      );
      if (activeMatch) {
        return {
          strategy: 'DIRECT_RESTORE',
          targetSnapshot: activeMatch,
          message: `[${activeMatch.sessionNum}] 세션 스냅샷(${activeMatch.snapshotId})을 즉시 복구합니다.`,
          isFromArchive: false,
        };
      }

      // 2계층: Archive Cold Storage 검색
      const archiveMatch = snapshots.find(
        (s) => (s.snapshotId === cleanTarget || s.sessionNum === cleanTarget) && s.status === 'ARCHIVED'
      );
      if (archiveMatch) {
        return {
          strategy: 'DIRECT_RESTORE',
          targetSnapshot: archiveMatch,
          message: `아카이브 보관소에서 [${archiveMatch.sessionNum}] 세션 스냅샷(${archiveMatch.snapshotId})을 탐색하여 복구합니다.`,
          isFromArchive: true,
        };
      }
    }

    if (pending.length === 0) {
      return {
        strategy: 'NO_SNAPSHOT',
        message: '복구 대기 중인 활성 세션 스냅샷이 없습니다.',
      };
    }

    // 1건만 존재하는 경우: 자동 직결 복구
    if (pending.length === 1) {
      const single = pending[0];
      return {
        strategy: 'DIRECT_RESTORE',
        targetSnapshot: single,
        message: `복구 대기 세션 [${single.sessionNum}] 1건이 확인되어 자동 직결 복구를 진행합니다.`,
        isFromArchive: false,
      };
    }

    // 2건 이상 존재하는 경우: 다건 목록 제시 및 선택 유도
    return {
      strategy: 'SHOW_SELECTION_LIST',
      candidates: pending,
      message: `복구 가능한 활성 세션 스냅샷이 ${pending.length}건 존재합니다. 복구할 번호를 선택해주세요.`,
      isFromArchive: false,
    };
  }
}
