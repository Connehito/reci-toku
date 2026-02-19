import { CoinTransaction, TransactionType } from '../entities/coin-transaction.entity';

/**
 * ICoinTransactionRepository - コイン取引履歴リポジトリのインターフェース
 *
 * Domain層のインターフェース（依存性逆転の原則）
 * Infrastructure層でこのインターフェースを実装する
 */
export interface ICoinTransactionRepository {
  /**
   * IDで取引を検索
   */
  findById(id: string): Promise<CoinTransaction | null>;

  /**
   * ユーザーIDで取引履歴を検索
   */
  findByUserId(userId: number, limit?: number): Promise<CoinTransaction[]>;

  /**
   * ユーザーIDと取引タイプで取引履歴を検索
   */
  findByUserIdAndType(
    userId: number,
    transactionType: TransactionType,
    limit?: number,
  ): Promise<CoinTransaction[]>;

  /**
   * リワードIDで取引を検索
   */
  findByRewardId(rewardId: string): Promise<CoinTransaction | null>;

  /**
   * 取引を保存（作成のみ、更新は不可）
   */
  save(transaction: CoinTransaction): Promise<void>;
}
