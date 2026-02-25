import { Reward } from '../entities/reward.entity';

/**
 * IRewardRepository - 報酬履歴リポジトリのインターフェース
 *
 * Domain層のインターフェース（依存性逆転の原則）
 * Infrastructure層でこのインターフェースを実装する
 */
export interface IRewardRepository {
  /**
   * IDで報酬を検索
   */
  findById(id: string): Promise<Reward | null>;

  /**
   * メディアキャッシュバックIDで報酬を検索（べき等性チェック用）
   */
  findByMediaCashbackId(mediaCashbackId: string): Promise<Reward | null>;

  /**
   * ユーザーIDで報酬リストを検索
   */
  findByUserId(userId: number): Promise<Reward[]>;

  /**
   * キャンペーンIDで報酬リストを検索
   */
  findByCampaignId(campaignId: string): Promise<Reward[]>;

  /**
   * 報酬を保存（作成のみ、更新は不可）
   * DB採番されたIDを持つEntityを返却する
   */
  save(reward: Reward): Promise<Reward>;
}
