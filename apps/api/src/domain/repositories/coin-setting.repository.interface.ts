import { CoinSetting } from '../entities/coin-setting.entity';

/**
 * ICoinSettingRepository - コイン設定リポジトリのインターフェース
 *
 * Domain層のインターフェース（依存性逆転の原則）
 * Infrastructure層でこのインターフェースを実装する
 */
export interface ICoinSettingRepository {
  /**
   * キーで設定を検索
   */
  findByKey(key: string): Promise<CoinSetting | null>;

  /**
   * すべての設定を取得
   */
  findAll(): Promise<CoinSetting[]>;

  /**
   * 設定を保存（作成または更新）
   */
  save(coinSetting: CoinSetting): Promise<void>;

  /**
   * 設定を削除
   */
  delete(key: string): Promise<void>;
}
