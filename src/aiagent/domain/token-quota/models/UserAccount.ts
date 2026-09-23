/**
 * @file UserAccount.ts
 * @description 사용자 계정 엔티티 (User Account Domain Model)
 */

export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'SUSPENDED';

export interface UserAccountProps {
  userId: string;
  email: string;
  userName: string;
  accountStatus?: AccountStatus;
  orgGroup?: string;
  planId: string;
  docPayload?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export class UserAccount {
  public readonly userId: string;
  public readonly email: string;
  public readonly userName: string;
  private _accountStatus: AccountStatus;
  public readonly orgGroup: string;
  public planId: string;
  public docPayload: Record<string, any>;
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: UserAccountProps) {
    if (!props.userId || !props.email || !props.userName || !props.planId) {
      throw new Error('UserAccount: userId, email, userName, planId는 필수입니다.');
    }
    this.userId = props.userId;
    this.email = props.email;
    this.userName = props.userName;
    this._accountStatus = props.accountStatus || 'ACTIVE';
    this.orgGroup = props.orgGroup || 'purePDFrend';
    this.planId = props.planId;
    this.docPayload = props.docPayload || {};
    this.createdAt = props.createdAt || new Date().toISOString();
    this.updatedAt = props.updatedAt || new Date().toISOString();
  }

  public get accountStatus(): AccountStatus {
    return this._accountStatus;
  }

  public isActive(): boolean {
    return this._accountStatus === 'ACTIVE';
  }

  public isFrozen(): boolean {
    return this._accountStatus === 'FROZEN';
  }

  public freeze(reason?: string): void {
    this._accountStatus = 'FROZEN';
    this.updatedAt = new Date().toISOString();
    if (reason) {
      this.docPayload.freeze_reason = reason;
      this.docPayload.frozen_at = this.updatedAt;
    }
  }

  public unfreeze(): void {
    this._accountStatus = 'ACTIVE';
    this.updatedAt = new Date().toISOString();
    delete this.docPayload.freeze_reason;
    this.docPayload.unfrozen_at = this.updatedAt;
  }

  public changePlan(newPlanId: string): void {
    if (!newPlanId) throw new Error('새 요금제 ID가 필요합니다.');
    this.planId = newPlanId;
    this.updatedAt = new Date().toISOString();
  }
}
