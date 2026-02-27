/**
 * コイン失効バッチの実行結果DTO
 */
export interface ExpireCoinsResultDto {
  /** 処理対象ユーザー数 */
  totalProcessed: number;
  /** 失効コイン合計 */
  totalExpired: number;
  /** 失敗ユーザー数 */
  totalFailed: number;
  /** 失敗ユーザーIDリスト */
  failedUserIds: number[];
  /** 実行時間（ミリ秒） */
  elapsedMs: number;
}
