/**
 * CoinSetting - システム設定（ドメインエンティティ）
 *
 * Key-Value形式でシステム設定を管理。
 * 例: coin_expire_days（コイン有効期限日数）
 */
export class CoinSetting {
  private constructor(
    private readonly key: string,
    private value: string,
    private description: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * 新規設定を作成
   */
  static create(key: string, value: string, description: string | null): CoinSetting {
    const now = new Date();
    return new CoinSetting(key, value, description, now, now);
  }

  /**
   * 既存データから復元
   */
  static reconstruct(
    key: string,
    value: string,
    description: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): CoinSetting {
    return new CoinSetting(key, value, description, createdAt, updatedAt);
  }

  private validate(): void {
    if (!this.key || this.key.trim() === '') {
      throw new Error('設定キーは必須です');
    }
    if (!this.value || this.value.trim() === '') {
      throw new Error('設定値は必須です');
    }
  }

  /**
   * 設定値を更新
   */
  updateValue(value: string): void {
    if (!value || value.trim() === '') {
      throw new Error('設定値は必須です');
    }
    this.value = value;
    this.updatedAt = new Date();
  }

  /**
   * 説明を更新
   */
  updateDescription(description: string | null): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  /**
   * 数値として取得
   */
  getValueAsNumber(): number {
    const num = Number(this.value);
    if (isNaN(num)) {
      throw new Error(`設定値"${this.value}"は数値に変換できません`);
    }
    return num;
  }

  /**
   * 真偽値として取得
   */
  getValueAsBoolean(): boolean {
    const lower = this.value.toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
    throw new Error(`設定値"${this.value}"は真偽値に変換できません`);
  }

  // Getters
  getKey(): string {
    return this.key;
  }

  getValue(): string {
    return this.value;
  }

  getDescription(): string | null {
    return this.description;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
