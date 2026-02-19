import { UserCoin } from '../entities/user-coin.entity';

/**
 * IUserCoinRepository - ユーザーコイン残高リポジトリのインターフェース
 *
 * Domain層のインターフェース（依存性逆転の原則）
 * Infrastructure層でこのインターフェースを実装する
 */
export interface IUserCoinRepository {
  /**
   * ユーザーIDでコイン残高を検索
   */
  findByUserId(userId: number): Promise<UserCoin | null>;

  /**
   * ユーザーコイン残高を保存（作成または更新）
   */
  save(userCoin: UserCoin): Promise<void>;

  /**
   * ユーザーコイン残高を削除
   */
  delete(userId: number): Promise<void>;

  /**
   * 有効期限切れのユーザーコインを検索
   */
  findExpiredCoins(expireDays: number): Promise<UserCoin[]>;
}
