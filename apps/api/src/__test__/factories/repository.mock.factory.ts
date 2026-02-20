import { IUserCoinRepository } from '../../domain/repositories/user-coin.repository.interface';
import { IRewardRepository } from '../../domain/repositories/reward.repository.interface';
import { ICoinTransactionRepository } from '../../domain/repositories/coin-transaction.repository.interface';
import { ICampaignRepository } from '../../domain/repositories/campaign.repository.interface';
import { ICoinSettingRepository } from '../../domain/repositories/coin-setting.repository.interface';

/**
 * Repository層のモック統一ファクトリー
 * 全テストで同じモック生成ロジックを使用
 *
 * メリット:
 * - 全テストで統一されたモック作成
 * - Interface変更時に1箇所修正するだけ
 * - テストコードの可読性向上
 * - DRY原則の徹底
 */
export class RepositoryMockFactory {
  static createUserCoinRepositoryMock(): jest.Mocked<IUserCoinRepository> {
    return {
      findByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findExpiredCoins: jest.fn(),
    };
  }

  static createRewardRepositoryMock(): jest.Mocked<IRewardRepository> {
    return {
      findById: jest.fn(),
      findByMediaCashbackId: jest.fn(),
      findByUserId: jest.fn(),
      findByCampaignId: jest.fn(),
      save: jest.fn(),
    };
  }

  static createCoinTransactionRepositoryMock(): jest.Mocked<ICoinTransactionRepository> {
    return {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndType: jest.fn(),
      findByRewardId: jest.fn(),
      save: jest.fn(),
    };
  }

  static createCampaignRepositoryMock(): jest.Mocked<ICampaignRepository> {
    return {
      findById: jest.fn(),
      findByReceiptCampaignId: jest.fn(),
      findPublishedCampaigns: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
  }

  static createCoinSettingRepositoryMock(): jest.Mocked<ICoinSettingRepository> {
    return {
      findByKey: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
  }
}
