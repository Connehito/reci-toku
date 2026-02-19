import { Campaign } from '../entities/campaign.entity';

/**
 * ICampaignRepository - キャンペーンリポジトリのインターフェース
 *
 * Domain層のインターフェース（依存性逆転の原則）
 * Infrastructure層でこのインターフェースを実装する
 */
export interface ICampaignRepository {
  /**
   * IDでキャンペーンを検索
   */
  findById(id: string): Promise<Campaign | null>;

  /**
   * レシートキャンペーンIDでキャンペーンを検索
   */
  findByReceiptCampaignId(receiptCampaignId: string): Promise<Campaign | null>;

  /**
   * 公開中のキャンペーン一覧を取得（表示順でソート）
   */
  findPublishedCampaigns(): Promise<Campaign[]>;

  /**
   * すべてのキャンペーン一覧を取得（管理画面用）
   */
  findAll(): Promise<Campaign[]>;

  /**
   * キャンペーンを保存（作成または更新）
   */
  save(campaign: Campaign): Promise<void>;

  /**
   * キャンペーンを削除
   */
  delete(id: string): Promise<void>;
}
