/**
 * コイン残高レスポンスDTO
 *
 * UseCase層のレスポンス型（フレームワーク非依存のプレーンなinterface）
 */
export interface CoinBalanceResponseDto {
  /** 現在の保有コイン残高 */
  balance: number;

  /**
   * 最終獲得日時（ISO8601形式）
   * 初回獲得前はnull
   */
  lastEarnedAt: string | null;

  /**
   * 有効期限日時（ISO8601形式）
   * 計算式: lastEarnedAt + coin_expire_days
   * 残高0またはlastEarnedAtがnullの場合はnull
   */
  expiresAt: string | null;
}
