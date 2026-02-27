/**
 * コイン取引履歴アイテムDTO
 *
 * UseCase層のレスポンス型（フレームワーク非依存のプレーンなinterface）
 */
export interface CoinHistoryItemDto {
  /** 取引ID */
  id: string;
  /** コイン増減量（正=付与、負=消費・失効） */
  amount: number;
  /** 取引後残高 */
  balanceAfter: number;
  /** 取引種別（1:報酬, 2:交換, 3:失効） */
  transactionType: number;
  /** 説明文（ユーザー向け表示） */
  description: string | null;
  /** 取引日時（ISO8601形式） */
  createdAt: string;
}

/**
 * コイン取引履歴リストレスポンスDTO
 *
 * UseCase層のレスポンス型（フレームワーク非依存のプレーンなinterface）
 */
export interface CoinHistoryResponseDto {
  /** 取引履歴リスト */
  transactions: CoinHistoryItemDto[];
  /** 総件数 */
  total: number;
  /** 取得件数（limit） */
  limit: number;
  /** スキップ件数（offset） */
  offset: number;
}
