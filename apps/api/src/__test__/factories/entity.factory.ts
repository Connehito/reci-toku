import { UserCoin } from '../../domain/entities/user-coin.entity';
import { Reward } from '../../domain/entities/reward.entity';
import { Campaign } from '../../domain/entities/campaign.entity';
import {
  CoinTransaction,
  TransactionType,
} from '../../domain/entities/coin-transaction.entity';
import { v4 as uuidv4 } from 'uuid';

/**
 * テストデータ作成の統一ファクトリー
 * DRY原則、保守性向上
 *
 * メリット:
 * - 全テストで統一されたテストデータ作成
 * - Entity変更時に1箇所修正するだけ
 * - テストコードの可読性向上
 */
export class EntityFactory {
  /**
   * UserCoinテストデータを作成
   */
  static createUserCoin(
    overrides: Partial<{
      userId: number;
      balance: number;
      lastEarnedAt: Date | null;
    }> = {},
  ): UserCoin {
    const defaults = {
      userId: 12345,
      balance: 100,
      lastEarnedAt: new Date('2026-02-20T10:00:00Z'),
    };
    const params = { ...defaults, ...overrides };

    return UserCoin.reconstruct(
      params.userId,
      params.balance,
      params.lastEarnedAt,
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-02-20T10:00:00Z'),
    );
  }

  /**
   * Rewardテストデータを作成
   */
  static createReward(overrides: Partial<any> = {}): Reward {
    const defaults = {
      id: uuidv4(),
      userId: 12345,
      campaignId: '1',
      mediaId: 'media_001',
      mediaUserCode: '12345',
      mediaCashbackId: 'cashback_001',
      mediaCashbackCode: '123456789012345',
      receiptCampaignId: 'campaign_001',
      receiptCampaignName: 'テストキャンペーン',
      receiptCampaignImage: null,
      companyId: null,
      companyName: null,
      serviceType: 'receipt',
      incentivePoints: 100,
      participationAt: new Date('2026-02-20T10:00:00Z'),
      processedAt: new Date('2026-02-20T10:00:00Z'),
      jwePayload: '{}',
    };
    return Reward.create({ ...defaults, ...overrides });
  }

  /**
   * Campaignテストデータを作成
   */
  static createCampaign(overrides: Partial<any> = {}): Campaign {
    const defaults = {
      id: '1',
      receiptCampaignId: 'campaign_001',
      receiptCampaignName: 'テストキャンペーン',
      receiptCampaignImage: null,
      companyName: 'テスト企業',
      companyId: null,
      incentivePoints: 100,
      serviceType: 'receipt',
      isAllReceiptCampaign: false,
      missionType: null,
      missionOpenAt: null,
      missionCloseAt: null,
      priceText: null,
      title: 'ビール購入でコインGET',
      description: '対象商品を購入すると100コイン',
      imageUrl: null,
      displayOrder: 0,
      isPublished: true,
      publishedAt: null,
      unpublishedAt: null,
      editorComment: null,
      tags: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-02-20T10:00:00Z'),
      createdBy: null,
      updatedBy: null,
    };
    const params = { ...defaults, ...overrides };

    return Campaign.reconstruct(
      params.id,
      params.receiptCampaignId,
      params.receiptCampaignName,
      params.receiptCampaignImage,
      params.companyName,
      params.companyId,
      params.incentivePoints,
      params.serviceType,
      params.isAllReceiptCampaign,
      params.missionType,
      params.missionOpenAt,
      params.missionCloseAt,
      params.priceText,
      params.title,
      params.description,
      params.imageUrl,
      params.displayOrder,
      params.isPublished,
      params.publishedAt,
      params.unpublishedAt,
      params.editorComment,
      params.tags,
      params.createdAt,
      params.updatedAt,
      params.createdBy,
      params.updatedBy,
    );
  }

  /**
   * CoinTransactionテストデータを作成（報酬付与）
   */
  static createRewardTransaction(overrides: Partial<any> = {}): CoinTransaction {
    const defaults = {
      id: uuidv4(),
      userId: 12345,
      amount: 100,
      balanceAfter: 100,
      rewardId: uuidv4(),
      mediaCashbackId: 'cashback_001',
      description: 'テストキャンペーン参加',
    };
    const params = { ...defaults, ...overrides };

    return CoinTransaction.createRewardTransaction(
      params.id,
      params.userId,
      params.amount,
      params.balanceAfter,
      params.rewardId,
      params.mediaCashbackId,
      params.description,
    );
  }

  /**
   * CoinTransactionテストデータを作成（交換）
   */
  static createExchangeTransaction(overrides: Partial<any> = {}): CoinTransaction {
    const defaults = {
      id: uuidv4(),
      userId: 12345,
      amount: -50,
      balanceAfter: 50,
      description: 'テスト商品と交換',
    };
    const params = { ...defaults, ...overrides };

    return CoinTransaction.createExchangeTransaction(
      params.id,
      params.userId,
      params.amount,
      params.balanceAfter,
      params.description,
    );
  }

  /**
   * CoinTransactionテストデータを作成（失効）
   */
  static createExpireTransaction(overrides: Partial<any> = {}): CoinTransaction {
    const defaults = {
      id: uuidv4(),
      userId: 12345,
      amount: -100,
      balanceAfter: 0,
      description: '有効期限切れ',
    };
    const params = { ...defaults, ...overrides };

    return CoinTransaction.createExpireTransaction(
      params.id,
      params.userId,
      params.amount,
      params.balanceAfter,
      params.description,
    );
  }
}
