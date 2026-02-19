/**
 * CoinTransaction - コイン取引履歴（ドメインエンティティ）
 *
 * コインの増減（付与・交換・失効）をすべて記録する台帳。
 */
export enum TransactionType {
  REWARD = 1, // 報酬による付与
  EXCHANGE = 2, // 交換による消費
  EXPIRE = 3, // 有効期限切れによる失効
}

export class CoinTransaction {
  private constructor(
    private readonly id: string,
    private readonly userId: number,
    private readonly amount: number,
    private readonly balanceAfter: number,
    private readonly transactionType: TransactionType,
    private readonly rewardId: string | null,
    private readonly mediaCashbackId: string | null,
    private readonly description: string | null,
    private readonly createdAt: Date,
  ) {
    this.validate();
  }

  /**
   * 報酬による付与トランザクションを作成
   */
  static createRewardTransaction(
    id: string,
    userId: number,
    amount: number,
    balanceAfter: number,
    rewardId: string,
    mediaCashbackId: string,
    description: string,
  ): CoinTransaction {
    if (amount <= 0) {
      throw new Error('報酬の付与額は正の値である必要があります');
    }

    return new CoinTransaction(
      id,
      userId,
      amount,
      balanceAfter,
      TransactionType.REWARD,
      rewardId,
      mediaCashbackId,
      description,
      new Date(),
    );
  }

  /**
   * 交換による消費トランザクションを作成
   */
  static createExchangeTransaction(
    id: string,
    userId: number,
    amount: number,
    balanceAfter: number,
    description: string,
  ): CoinTransaction {
    if (amount >= 0) {
      throw new Error('交換の消費額は負の値である必要があります');
    }

    return new CoinTransaction(
      id,
      userId,
      amount,
      balanceAfter,
      TransactionType.EXCHANGE,
      null,
      null,
      description,
      new Date(),
    );
  }

  /**
   * 失効トランザクションを作成
   */
  static createExpireTransaction(
    id: string,
    userId: number,
    amount: number,
    balanceAfter: number,
    description: string,
  ): CoinTransaction {
    if (amount >= 0) {
      throw new Error('失効額は負の値である必要があります');
    }

    return new CoinTransaction(
      id,
      userId,
      amount,
      balanceAfter,
      TransactionType.EXPIRE,
      null,
      null,
      description,
      new Date(),
    );
  }

  /**
   * 既存データから復元
   */
  static reconstruct(
    id: string,
    userId: number,
    amount: number,
    balanceAfter: number,
    transactionType: TransactionType,
    rewardId: string | null,
    mediaCashbackId: string | null,
    description: string | null,
    createdAt: Date,
  ): CoinTransaction {
    return new CoinTransaction(
      id,
      userId,
      amount,
      balanceAfter,
      transactionType,
      rewardId,
      mediaCashbackId,
      description,
      createdAt,
    );
  }

  private validate(): void {
    if (this.userId <= 0) {
      throw new Error('不正なユーザーIDです');
    }
    if (this.balanceAfter < 0) {
      throw new Error('取引後残高は負の値にできません');
    }
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getUserId(): number {
    return this.userId;
  }

  getAmount(): number {
    return this.amount;
  }

  getBalanceAfter(): number {
    return this.balanceAfter;
  }

  getTransactionType(): TransactionType {
    return this.transactionType;
  }

  getRewardId(): string | null {
    return this.rewardId;
  }

  getMediaCashbackId(): string | null {
    return this.mediaCashbackId;
  }

  getDescription(): string | null {
    return this.description;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
