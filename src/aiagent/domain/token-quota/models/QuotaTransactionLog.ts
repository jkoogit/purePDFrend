/**
 * @file QuotaTransactionLog.ts
 * @description 쿼터 차감 및 지급 트랜잭션 감사 로그 엔티티
 */

export type QuotaTransactionType = 'GRANT' | 'DEDUCT' | 'REFUND' | 'FREEZE' | 'UNFREEZE';

export interface QuotaTransactionLogProps {
  txId: string;
  ledgerId: string;
  userId: string;
  sessionId?: string;
  taskId?: string;
  turnId?: string;
  modelId?: string;
  txType: QuotaTransactionType;
  tokenDelta: number; // 양수: 충전/환불, 음수: 차감
  balanceAfter: number;
  unitCostApplied?: number;
  reasonDesc?: string;
  createdAt?: string;
}

export class QuotaTransactionLog {
  public readonly txId: string;
  public readonly ledgerId: string;
  public readonly userId: string;
  public readonly sessionId?: string;
  public readonly taskId?: string;
  public readonly turnId?: string;
  public readonly modelId?: string;
  public readonly txType: QuotaTransactionType;
  public readonly tokenDelta: number;
  public readonly balanceAfter: number;
  public readonly unitCostApplied?: number;
  public readonly reasonDesc?: string;
  public readonly createdAt: string;

  constructor(props: QuotaTransactionLogProps) {
    if (!props.txId || !props.ledgerId || !props.userId || !props.txType) {
      throw new Error('QuotaTransactionLog: txId, ledgerId, userId, txType은 필수입니다.');
    }
    this.txId = props.txId;
    this.ledgerId = props.ledgerId;
    this.userId = props.userId;
    this.sessionId = props.sessionId;
    this.taskId = props.taskId;
    this.turnId = props.turnId;
    this.modelId = props.modelId;
    this.txType = props.txType;
    this.tokenDelta = Number(props.tokenDelta) || 0;
    this.balanceAfter = Number(props.balanceAfter) || 0;
    this.unitCostApplied = props.unitCostApplied;
    this.reasonDesc = props.reasonDesc;
    this.createdAt = props.createdAt || new Date().toISOString();
  }
}
