/**
 * UserCoin - ユーザーコイン残高（ドメインエンティティ）
 *
 * このクラスはフレームワーク非依存のPOTO（Plain Old TypeScript Object）です。
 * ビジネスロジックとドメインルールを含みます。
 */
export class UserCoin {
  private constructor(
    private readonly userId: number,
    private balance: number,
    private lastEarnedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * 新規ユーザーのコインを作成
   */
  static create(userId: number): UserCoin {
    const now = new Date();
    return new UserCoin(userId, 0, null, now, now);
  }

  /**
   * 既存データから復元
   */
  static reconstruct(
    userId: number,
    balance: number,
    lastEarnedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ): UserCoin {
    return new UserCoin(userId, balance, lastEarnedAt, createdAt, updatedAt);
  }

  /**
   * バリデーション
   */
  private validate(): void {
    if (this.balance < 0) {
      throw new Error('残高は負の値にできません');
    }
    if (this.userId <= 0) {
      throw new Error('不正なユーザーIDです');
    }
  }

  /**
   * コインを加算（報酬獲得時）
   */
  addBalance(amount: number): void {
    if (amount <= 0) {
      throw new Error('加算額は正の値である必要があります');
    }

    this.balance += amount;
    this.lastEarnedAt = new Date(); // 有効期限を延長
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * コインを減算（交換時）
   */
  subtractBalance(amount: number): void {
    if (amount <= 0) {
      throw new Error('減算額は正の値である必要があります');
    }
    if (this.balance < amount) {
      throw new Error('残高が不足しています');
    }

    this.balance -= amount;
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * コインを失効（有効期限切れ時）
   */
  expire(): number {
    const expiredAmount = this.balance;
    this.balance = 0;
    this.updatedAt = new Date();
    return expiredAmount;
  }

  /**
   * 有効期限切れかチェック
   */
  isExpired(expireDays: number): boolean {
    if (!this.lastEarnedAt || this.balance === 0) {
      return false;
    }

    const expireDate = new Date(this.lastEarnedAt);
    expireDate.setDate(expireDate.getDate() + expireDays);
    return new Date() > expireDate;
  }

  /**
   * 残高取得
   */
  getBalance(): number {
    return this.balance;
  }

  /**
   * ユーザーID取得
   */
  getUserId(): number {
    return this.userId;
  }

  /**
   * 最終獲得日時取得
   */
  getLastEarnedAt(): Date | null {
    return this.lastEarnedAt;
  }

  /**
   * 作成日時取得
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * 更新日時取得
   */
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
