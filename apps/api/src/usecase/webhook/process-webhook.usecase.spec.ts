import { Test, TestingModule } from '@nestjs/testing';
import { ProcessWebhookUseCase } from './process-webhook.usecase';
import { TOKENS } from '../../domain/tokens';
import { RepositoryMockFactory } from '../../__test__/factories/repository.mock.factory';
import { ServiceMockFactory } from '../../__test__/factories/service.mock.factory';
import { EntityFactory } from '../../__test__/factories/entity.factory';
import { ProcessWebhookInput } from './dto/process-webhook.input';
import { AlreadyProcessedError } from '../../domain/exceptions/already-processed.error';
import { CampaignNotFoundError } from '../../domain/exceptions/campaign-not-found.error';
import { UnitOfWork } from '../../domain/services/transaction-manager.interface';

// uuidをモック
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

describe('ProcessWebhookUseCase', () => {
  let useCase: ProcessWebhookUseCase;
  // トランザクション外（べき等性チェック用）
  let mockRewardRepository: ReturnType<typeof RepositoryMockFactory.createRewardRepositoryMock>;
  let mockCampaignRepository: ReturnType<typeof RepositoryMockFactory.createCampaignRepositoryMock>;
  // UnitOfWork内（トランザクション内で使用されるリポジトリ）
  let uowRewardRepository: ReturnType<typeof RepositoryMockFactory.createRewardRepositoryMock>;
  let uowUserCoinRepository: ReturnType<typeof RepositoryMockFactory.createUserCoinRepositoryMock>;
  let uowCoinTransactionRepository: ReturnType<
    typeof RepositoryMockFactory.createCoinTransactionRepositoryMock
  >;
  let mockTransactionManager: ReturnType<typeof ServiceMockFactory.createTransactionManagerMock>;

  beforeEach(async () => {
    // トランザクション外のモックリポジトリ
    mockRewardRepository = RepositoryMockFactory.createRewardRepositoryMock();
    mockCampaignRepository = RepositoryMockFactory.createCampaignRepositoryMock();

    // UnitOfWork用のモックリポジトリ
    uowRewardRepository = RepositoryMockFactory.createRewardRepositoryMock();
    uowUserCoinRepository = RepositoryMockFactory.createUserCoinRepositoryMock();
    uowCoinTransactionRepository = RepositoryMockFactory.createCoinTransactionRepositoryMock();

    const uow: UnitOfWork = {
      rewardRepository: uowRewardRepository,
      userCoinRepository: uowUserCoinRepository,
      coinTransactionRepository: uowCoinTransactionRepository,
    };
    mockTransactionManager = ServiceMockFactory.createTransactionManagerMock(uow);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessWebhookUseCase,
        { provide: TOKENS.IRewardRepository, useValue: mockRewardRepository },
        {
          provide: TOKENS.ICampaignRepository,
          useValue: mockCampaignRepository,
        },
        {
          provide: TOKENS.ITransactionManager,
          useValue: mockTransactionManager,
        },
      ],
    }).compile();

    useCase = module.get<ProcessWebhookUseCase>(ProcessWebhookUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('正常なWebhookペイロードでコインを付与できる', async () => {
      // Arrange
      const payload: ProcessWebhookInput = {
        media_id: 'test_001',
        media_user_code: '12345',
        media_cashback_id: 'unique_001',
        media_cashback_code: '123456789012345',
        receipt_campaign_id: 'campaign_001',
        receipt_campaign_name: 'テストキャンペーン',
        receipt_campaign_image: null,
        company_id: null,
        company_name: null,
        service_type: 'receipt',
        incentive_points: 100,
        participation_at: '2026-02-20T10:00:00Z',
        processed_at: '2026-02-20T10:00:00Z',
      };

      const campaign = EntityFactory.createCampaign({
        receiptCampaignId: 'campaign_001',
      });
      const userCoin = EntityFactory.createUserCoin({
        userId: 12345,
        balance: 50,
      });

      mockCampaignRepository.findByReceiptCampaignId.mockResolvedValue(campaign);
      mockRewardRepository.findByMediaCashbackId.mockResolvedValue(null); // 重複なし
      uowUserCoinRepository.findByUserId.mockResolvedValue(userCoin);

      // Act
      await useCase.execute(payload);

      // Assert
      expect(mockCampaignRepository.findByReceiptCampaignId).toHaveBeenCalledWith('campaign_001');
      expect(mockRewardRepository.findByMediaCashbackId).toHaveBeenCalledWith('unique_001');
      // UnitOfWork経由でトランザクション内のリポジトリが使われる
      expect(uowRewardRepository.save).toHaveBeenCalledTimes(1);
      expect(uowUserCoinRepository.save).toHaveBeenCalledTimes(1);
      expect(uowCoinTransactionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockTransactionManager.execute).toHaveBeenCalledTimes(1);
    });

    it('初回獲得時はUserCoinを作成する', async () => {
      // Arrange
      const payload: ProcessWebhookInput = {
        media_id: 'test_001',
        media_user_code: '99999',
        media_cashback_id: 'unique_002',
        media_cashback_code: '123456789012345',
        receipt_campaign_id: 'campaign_001',
        incentive_points: 100,
        participation_at: '2026-02-20T10:00:00Z',
        processed_at: '2026-02-20T10:00:00Z',
      } as ProcessWebhookInput;

      const campaign = EntityFactory.createCampaign();
      mockCampaignRepository.findByReceiptCampaignId.mockResolvedValue(campaign);
      mockRewardRepository.findByMediaCashbackId.mockResolvedValue(null);
      uowUserCoinRepository.findByUserId.mockResolvedValue(null); // 初回獲得

      // Act
      await useCase.execute(payload);

      // Assert
      expect(uowUserCoinRepository.findByUserId).toHaveBeenCalledWith(99999);
      expect(uowUserCoinRepository.save).toHaveBeenCalledTimes(1);
      expect(uowCoinTransactionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('重複したmedia_cashback_idの場合はALREADY_PROCESSEDエラーをスローする', async () => {
      // Arrange
      const payload: ProcessWebhookInput = {
        media_id: 'test_001',
        media_user_code: '12345',
        media_cashback_id: 'unique_001',
        media_cashback_code: '123456789012345',
        receipt_campaign_id: 'campaign_001',
        incentive_points: 100,
        participation_at: '2026-02-20T10:00:00Z',
        processed_at: '2026-02-20T10:00:00Z',
      } as ProcessWebhookInput;

      const campaign = EntityFactory.createCampaign();
      const existingReward = EntityFactory.createReward({
        mediaCashbackId: 'unique_001',
      });

      mockCampaignRepository.findByReceiptCampaignId.mockResolvedValue(campaign);
      mockRewardRepository.findByMediaCashbackId.mockResolvedValue(existingReward);

      // Act & Assert
      await expect(useCase.execute(payload)).rejects.toThrow(AlreadyProcessedError);
      expect(uowRewardRepository.save).not.toHaveBeenCalled();
      expect(uowUserCoinRepository.save).not.toHaveBeenCalled();
      expect(uowCoinTransactionRepository.save).not.toHaveBeenCalled();
    });

    it('キャンペーンが未登録の場合はエラーをスローする', async () => {
      // Arrange
      const payload: ProcessWebhookInput = {
        media_id: 'test_001',
        media_user_code: '12345',
        media_cashback_id: 'unique_003',
        media_cashback_code: '123456789012345',
        receipt_campaign_id: 'campaign_999',
        incentive_points: 100,
        participation_at: '2026-02-20T10:00:00Z',
        processed_at: '2026-02-20T10:00:00Z',
      } as ProcessWebhookInput;

      mockCampaignRepository.findByReceiptCampaignId.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(payload)).rejects.toThrow(CampaignNotFoundError);
      expect(uowRewardRepository.save).not.toHaveBeenCalled();
      expect(uowUserCoinRepository.save).not.toHaveBeenCalled();
      expect(uowCoinTransactionRepository.save).not.toHaveBeenCalled();
    });

    it('トランザクション内でUnitOfWork経由のリポジトリが使われる', async () => {
      // Arrange
      const payload: ProcessWebhookInput = {
        media_id: 'test_001',
        media_user_code: '12345',
        media_cashback_id: 'unique_004',
        media_cashback_code: '123456789012345',
        receipt_campaign_id: 'campaign_001',
        incentive_points: 100,
        participation_at: '2026-02-20T10:00:00Z',
        processed_at: '2026-02-20T10:00:00Z',
      } as ProcessWebhookInput;

      const campaign = EntityFactory.createCampaign();
      const userCoin = EntityFactory.createUserCoin();

      mockCampaignRepository.findByReceiptCampaignId.mockResolvedValue(campaign);
      mockRewardRepository.findByMediaCashbackId.mockResolvedValue(null);
      uowUserCoinRepository.findByUserId.mockResolvedValue(userCoin);

      // Act
      await useCase.execute(payload);

      // Assert - UnitOfWork経由でトランザクション内のリポジトリが使われること
      expect(mockTransactionManager.execute).toHaveBeenCalledTimes(1);
      expect(uowRewardRepository.save).toHaveBeenCalledTimes(1);
      expect(uowUserCoinRepository.save).toHaveBeenCalledTimes(1);
      expect(uowCoinTransactionRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
