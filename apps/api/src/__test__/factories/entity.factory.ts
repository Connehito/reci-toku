import { UserCoin } from '../../domain/entities/user-coin.entity';
import { Reward } from '../../domain/entities/reward.entity';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CoinTransaction, TransactionType } from '../../domain/entities/coin-transaction.entity';

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
   * Rewardテストデータを作成（reconstruct経由でID付きデータを生成）
   */
  static createReward(
    overrides: Partial<{
      id: string;
      userId: number;
      campaignId: string;
      mediaId: string;
      mediaUserCode: string;
      mediaCashbackId: string;
      mediaCashbackCode: string;
      receiptCampaignId: string;
      receiptCampaignName: string | null;
      receiptCampaignImage: string | null;
      companyId: string | null;
      companyName: string | null;
      serviceType: string | null;
      incentivePoints: number;
      participationAt: Date;
      processedAt: Date;
      jwePayload: string | null;
      createdAt: Date;
    }> = {},
  ): Reward {
    const defaults = {
      id: '1',
      userId: 12345,
      campaignId: '1',
      mediaId: 'media_001',
      mediaUserCode: '12345',
      mediaCashbackId: 'cashback_001',
      mediaCashbackCode: '123456789012345',
      receiptCampaignId: 'campaign_001',
      receiptCampaignName: 'テストキャンペーン' as string | null,
      receiptCampaignImage: null as string | null,
      companyId: null as string | null,
      companyName: null as string | null,
      serviceType: 'receipt' as string | null,
      incentivePoints: 100,
      participationAt: new Date('2026-02-20T10:00:00Z'),
      processedAt: new Date('2026-02-20T10:00:00Z'),
      jwePayload: '{}' as string | null,
      createdAt: new Date('2026-02-20T10:00:00Z'),
    };
    const params = { ...defaults, ...overrides };

    return Reward.reconstruct(
      params.id,
      params.userId,
      params.campaignId,
      params.mediaId,
      params.mediaUserCode,
      params.mediaCashbackId,
      params.mediaCashbackCode,
      params.receiptCampaignId,
      params.receiptCampaignName,
      params.receiptCampaignImage,
      params.companyId,
      params.companyName,
      params.serviceType,
      params.incentivePoints,
      params.participationAt,
      params.processedAt,
      params.jwePayload,
      params.createdAt,
    );
  }

  /**
   * Campaignテストデータを作成
   */
  static createCampaign(
    overrides: Partial<{
      id: string;
      receiptCampaignId: string;
      receiptCampaignName: string;
      receiptCampaignImage: string | null;
      companyName: string | null;
      companyId: string | null;
      incentivePoints: number;
      serviceType: string;
      isAllReceiptCampaign: boolean;
      missionType: string | null;
      missionOpenAt: Date | null;
      missionCloseAt: Date | null;
      priceText: string | null;
      title: string;
      description: string | null;
      imageUrl: string | null;
      displayOrder: number;
      isPublished: boolean;
      publishedAt: Date | null;
      unpublishedAt: Date | null;
      editorComment: string | null;
      tags: string[] | null;
      createdAt: Date;
      updatedAt: Date;
      createdBy: number | null;
      updatedBy: number | null;
    }> = {},
  ): Campaign {
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
   * CoinTransactionテストデータを作成（報酬付与、reconstruct経由でID付きデータを生成）
   */
  static createRewardTransaction(
    overrides: Partial<{
      id: string;
      userId: number;
      amount: number;
      balanceAfter: number;
      rewardId: string;
      mediaCashbackId: string;
      description: string;
      createdAt: Date;
    }> = {},
  ): CoinTransaction {
    const defaults = {
      id: '1',
      userId: 12345,
      amount: 100,
      balanceAfter: 100,
      rewardId: '1' as string | null,
      mediaCashbackId: 'cashback_001' as string | null,
      description: 'テストキャンペーン参加' as string | null,
      createdAt: new Date('2026-02-20T10:00:00Z'),
    };
    const params = { ...defaults, ...overrides };

    return CoinTransaction.reconstruct(
      params.id,
      params.userId,
      params.amount,
      params.balanceAfter,
      TransactionType.REWARD,
      params.rewardId,
      params.mediaCashbackId,
      params.description,
      params.createdAt,
    );
  }

  /**
   * CoinTransactionテストデータを作成（交換、reconstruct経由でID付きデータを生成）
   */
  static createExchangeTransaction(
    overrides: Partial<{
      id: string;
      userId: number;
      amount: number;
      balanceAfter: number;
      description: string;
      createdAt: Date;
    }> = {},
  ): CoinTransaction {
    const defaults = {
      id: '2',
      userId: 12345,
      amount: -50,
      balanceAfter: 50,
      description: 'テスト商品と交換' as string | null,
      createdAt: new Date('2026-02-20T10:00:00Z'),
    };
    const params = { ...defaults, ...overrides };

    return CoinTransaction.reconstruct(
      params.id,
      params.userId,
      params.amount,
      params.balanceAfter,
      TransactionType.EXCHANGE,
      null,
      null,
      params.description,
      params.createdAt,
    );
  }

  /**
   * CoinTransactionテストデータを作成（失効、reconstruct経由でID付きデータを生成）
   */
  static createExpireTransaction(
    overrides: Partial<{
      id: string;
      userId: number;
      amount: number;
      balanceAfter: number;
      description: string;
      createdAt: Date;
    }> = {},
  ): CoinTransaction {
    const defaults = {
      id: '3',
      userId: 12345,
      amount: -100,
      balanceAfter: 0,
      description: '有効期限切れ' as string | null,
      createdAt: new Date('2026-02-20T10:00:00Z'),
    };
    const params = { ...defaults, ...overrides };

    return CoinTransaction.reconstruct(
      params.id,
      params.userId,
      params.amount,
      params.balanceAfter,
      TransactionType.EXPIRE,
      null,
      null,
      params.description,
      params.createdAt,
    );
  }
}
