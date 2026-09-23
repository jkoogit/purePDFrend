/**
 * @file AccountQuotaLedger.ts
 * @description 사용자 쿼터 원장 애그리게이트 루트 (Aggregate Root)
 */

import { QuotaTransactionLog } from './QuotaTransactionLog';

export interface AccountQuotaLedgerProps {
  ledgerId: string;
  userId: string;
  planId: string;
  totalGrantedQuota: number;
  usedQuota: number;
  remainingQuota: number;
  proRequestsLimit?: number;
  proRequestsUsed?: number;
  flashRequestsLimit?: number;
  flashRequestsUsed?: number;
  quotaResetAt?: string | null;
  isFrozen?: boolean;
  overageAllowed?: boolean;
  lastDeductedAt?: string | null;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeductionContext {
  sessionId?: string;
  taskId?: string;
  turnId?: string;
  modelId?: string;
  unitCostApplied?: number;
  reason?: string;
}

export interface DeductionResult {
  success: boolean;
  ledgerId: string;
  requestedTokens: number;
  deductedTokens: number;
  balanceAfter: number;
  isFrozen: boolean;
  proRequestsRemaining?: number;
  flashRequestsRemaining?: number;
  fallbackRecommended?: boolean;
  fallbackModelId?: string;
  log?: QuotaTransactionLog;
  errorMessage?: string;
}

export class AccountQuotaLedger {
  public readonly ledgerId: string;
  public readonly userId: string;
  public planId: string;
  private _totalGrantedQuota: number;
  private _usedQuota: number;
  private _remainingQuota: number;
  private _proRequestsLimit: number;
  private _proRequestsUsed: number;
  private _flashRequestsLimit: number;
  private _flashRequestsUsed: number;
  private _quotaResetAt: string | null;
  private _isFrozen: boolean;
  public readonly overageAllowed: boolean;
  private _lastDeductedAt: string | null;
  private _version: number;
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: AccountQuotaLedgerProps) {
    if (!props.ledgerId || !props.userId || !props.planId) {
      throw new Error('AccountQuotaLedger: ledgerId, userId, planId는 필수입니다.');
    }
    this.ledgerId = props.ledgerId;
    this.userId = props.userId;
    this.planId = props.planId;
    this._totalGrantedQuota = Math.max(0, Number(props.totalGrantedQuota) || 0);
    this._usedQuota = Math.max(0, Number(props.usedQuota) || 0);
    this._remainingQuota = Number(props.remainingQuota) || 0;
    this._proRequestsLimit = props.proRequestsLimit !== undefined ? Number(props.proRequestsLimit) : 250;
    this._proRequestsUsed = Math.max(0, Number(props.proRequestsUsed) || 0);
    this._flashRequestsLimit = props.flashRequestsLimit !== undefined ? Number(props.flashRequestsLimit) : 2500;
    this._flashRequestsUsed = Math.max(0, Number(props.flashRequestsUsed) || 0);
    this._quotaResetAt = props.quotaResetAt || null;
    this._isFrozen = Boolean(props.isFrozen);
    this.overageAllowed = Boolean(props.overageAllowed);
    this._lastDeductedAt = props.lastDeductedAt || null;
    this._version = Number(props.version) || 1;
    this.createdAt = props.createdAt || new Date().toISOString();
    this.updatedAt = props.updatedAt || new Date().toISOString();
  }

  public get totalGrantedQuota(): number { return this._totalGrantedQuota; }
  public get usedQuota(): number { return this._usedQuota; }
  public get remainingQuota(): number { return this._remainingQuota; }
  public get proRequestsLimit(): number { return this._proRequestsLimit; }
  public get proRequestsUsed(): number { return this._proRequestsUsed; }
  public get proRequestsRemaining(): number { return Math.max(0, this._proRequestsLimit - this._proRequestsUsed); }
  public get flashRequestsLimit(): number { return this._flashRequestsLimit; }
  public get flashRequestsUsed(): number { return this._flashRequestsUsed; }
  public get flashRequestsRemaining(): number { return Math.max(0, this._flashRequestsLimit - this._flashRequestsUsed); }
  public get quotaResetAt(): string | null { return this._quotaResetAt; }
  public get isFrozen(): boolean { return this._isFrozen; }
  public get lastDeductedAt(): string | null { return this._lastDeductedAt; }
  public get version(): number { return this._version; }

  /**
   * 토큰 소모율 계산 (0.0 ~ 1.0)
   */
  public getUsageRatio(): number {
    if (this._totalGrantedQuota === 0) return 1.0;
    return Math.min(1.0, Number((this._usedQuota / this._totalGrantedQuota).toFixed(4)));
  }

  /**
   * 토큰 차감 수행 (차감 성공 시 감사 로그 생성)
   */
  public deduct(tokens: number, context: DeductionContext = {}): DeductionResult {
    const requiredTokens = Math.max(0, Math.round(tokens));

    if (this._isFrozen) {
      return {
        success: false,
        ledgerId: this.ledgerId,
        requestedTokens: requiredTokens,
        deductedTokens: 0,
        balanceAfter: this._remainingQuota,
        isFrozen: true,
        errorMessage: '원장이 동결(FROZEN)되어 차감할 수 없습니다.',
      };
    }

    if (!this.overageAllowed && this._remainingQuota < requiredTokens) {
      // 쿼터 고갈 상태 발생 -> 자동 동결 처리
      this._isFrozen = true;
      this.updatedAt = new Date().toISOString();
      return {
        success: false,
        ledgerId: this.ledgerId,
        requestedTokens: requiredTokens,
        deductedTokens: 0,
        balanceAfter: this._remainingQuota,
        isFrozen: true,
        errorMessage: `잔여 쿼터(${this._remainingQuota.toLocaleString()})가 부족하여 작업이 차단되고 동결되었습니다.`,
      };
    }

    // 정상 차감 진행
    this._usedQuota += requiredTokens;
    this._remainingQuota -= requiredTokens;
    this._lastDeductedAt = new Date().toISOString();
    this.updatedAt = this._lastDeductedAt;
    this._version += 1;

    let fallbackRecommended = false;
    let fallbackModelId: string | undefined = undefined;

    const isPro = context.modelId?.toLowerCase().includes('pro');
    if (isPro) {
      this._proRequestsUsed += 1;
      if (this._proRequestsUsed >= this._proRequestsLimit) {
        fallbackRecommended = true;
        fallbackModelId = 'gemini-1.5-flash';
      }
    } else {
      this._flashRequestsUsed += 1;
    }

    // 만약 차감 후 잔여량이 0 이하이고 초과가 불허된 경우 자동 동결
    if (this._remainingQuota <= 0 && !this.overageAllowed) {
      this._isFrozen = true;
    }

    const txId = `QTX-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const log = new QuotaTransactionLog({
      txId,
      ledgerId: this.ledgerId,
      userId: this.userId,
      sessionId: context.sessionId,
      taskId: context.taskId,
      turnId: context.turnId,
      modelId: context.modelId,
      txType: 'DEDUCT',
      tokenDelta: -requiredTokens,
      balanceAfter: this._remainingQuota,
      unitCostApplied: context.unitCostApplied,
      reasonDesc: context.reason || '대화 턴 토큰 소모 차감',
      createdAt: this.updatedAt,
    });

    return {
      success: true,
      ledgerId: this.ledgerId,
      requestedTokens: requiredTokens,
      deductedTokens: requiredTokens,
      balanceAfter: this._remainingQuota,
      isFrozen: this._isFrozen,
      proRequestsRemaining: this.proRequestsRemaining,
      flashRequestsRemaining: this.flashRequestsRemaining,
      fallbackRecommended,
      fallbackModelId,
      log,
    };
  }

  /**
   * 추가 쿼터 지급 (Grant)
   */
  public grant(tokens: number, reason: string = '관리자 쿼터 충전'): QuotaTransactionLog {
    const grantTokens = Math.max(0, Math.round(tokens));
    this._totalGrantedQuota += grantTokens;
    this._remainingQuota += grantTokens;
    this.updatedAt = new Date().toISOString();
    this._version += 1;

    // 잔액이 충분해졌으면 자동 동결 해제
    if (this._remainingQuota > 0 && this._isFrozen) {
      this._isFrozen = false;
    }

    const txId = `QTX-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return new QuotaTransactionLog({
      txId,
      ledgerId: this.ledgerId,
      userId: this.userId,
      txType: 'GRANT',
      tokenDelta: grantTokens,
      balanceAfter: this._remainingQuota,
      reasonDesc: reason,
      createdAt: this.updatedAt,
    });
  }

  public freeze(reason?: string): QuotaTransactionLog {
    this._isFrozen = true;
    this.updatedAt = new Date().toISOString();
    this._version += 1;

    const txId = `QTX-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return new QuotaTransactionLog({
      txId,
      ledgerId: this.ledgerId,
      userId: this.userId,
      txType: 'FREEZE',
      tokenDelta: 0,
      balanceAfter: this._remainingQuota,
      reasonDesc: reason || '관리자 수동 동결 조치',
      createdAt: this.updatedAt,
    });
  }

  public unfreeze(reason?: string): QuotaTransactionLog {
    this._isFrozen = false;
    this.updatedAt = new Date().toISOString();
    this._version += 1;

    const txId = `QTX-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return new QuotaTransactionLog({
      txId,
      ledgerId: this.ledgerId,
      userId: this.userId,
      txType: 'UNFREEZE',
      tokenDelta: 0,
      balanceAfter: this._remainingQuota,
      reasonDesc: reason || '관리자 수동 동결 해제',
      createdAt: this.updatedAt,
    });
  }
}
