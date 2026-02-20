import { Test, TestingModule } from '@nestjs/testing';
import { ProcessWebhookUseCase } from './process-webhook.usecase';
import { TOKENS } from '../../domain/tokens';
import { RepositoryMockFactory } from '../../__test__/factories/repository.mock.factory';
import { ServiceMockFactory } from '../../__test__/factories/service.mock.factory';
import { EntityFactory } from '../../__test__/factories/entity.factory';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

// uuidをモック
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

describe('ProcessWebhookUseCase', () => {
  let useCase: ProcessWebhookUseCase;
  let mockRewardRepository: ReturnType<
    typeof RepositoryMockFactory.createRewardRepositoryMock
  >;
  let mockUserCoinRepository: ReturnType<
    typeof RepositoryMockFactory.createUserCoinRepositoryMock
  >;
  let mockCoinTransactionRepository: ReturnType<
    typeof RepositoryMockFactory.createCoinTransactionRepositoryMock
  >;
  let mockCampaignRepository: ReturnType<
    typeof RepositoryMockFactory.createCampaignRepositoryMock
  >;
  let mockTransactionManager: ReturnType<
    typeof ServiceMockFactory.createTransactionManagerMock
  >;

  beforeEach(async () => {
    // モックリポジトリの作成
    mockRewardRepository = RepositoryMockFactory.createRewardRepositoryMock();
    mockUserCoinRepository =
      RepositoryMockFactory.createUserCoinRepositoryMock();
    mockCoinTransactionRepository =
      RepositoryMockFactory.createCoinTransactionRepositoryMock();
    mockCampaignRepository =
      RepositoryMockFactory.createCampaignRepositoryMock();
    mockTransactionManager =
      ServiceMockFactory.createTransactionManagerMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessWebhookUseCase,
        { provide: TOKENS.IRewardRepository, useValue: mockRewardRepository },
        {
          provide: TOKENS.IUserCoinRepository,
          useValue: mockUserCoinRepository,
        },
        {
          provide: TOKENS.ICoinTransactionRepository,
          useValue: mockCoinTransactionRepository,
        },
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
      const payload: WebhookPayloadDto = {
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

      mockCampaignRepository.findByReceiptCampaignId.mockResolvedValue(
        campaign,
      );
      mockRewardRepository.findByMediaCashbackId.mockResolvedValue(null); // 重複なし
      mockUserCoinRepository.findByUserId.mockResolvedValue(userCoin);

      // Act
      await useCase.execute(payload);

      // Assert
      expect(
        mockCampaignRepository.findByReceiptCampaignId,
      ).toHaveBeenCalledWith('campaign_001');
      expect(mockRewardRepository.findByMediaCashbackId).toHaveBeenCalledWith(
        'unique_001',
      );
      expect(mockRewardRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserCoinRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCoinTransactionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockTransactionManager.execute).toHaveBeenCalledTimes(1);
    });

    it('初回獲得時はUserCoinを作成する', async () => {
      // Arrange
      const payload: WebhookPayloadDto = {
        media_id: 'test_001',
        media_user_code: '99999',
        media_cashback_id: 'unique_002',
        media_cashback_code: '123456789012345',
        receipt_campaign_id: 'campaign_001',
        incentive_points: 100,
        participation_at: '2026-02-20T10:00:00Z',
        processed_at: '2026-02-20T10:00:00Z',
      } as WebhookPayloadDto;

      const campaign = EntityFactory.createCampaign();
      mockCampaignRepository.findByReceiptCampaignId.mockResolvedValue(
        campaign,
      );
      mockRewardRepository.findByMediaCashbackId.mockResolvedValue(null);
      mockUserCoinRepository.findByUserId.mockResolvedValue(null); // 初回獲得

      // Act
      await useCase.execute(payload);

      // Assert
      expect(mockUserCoinRepository.findByUserId).toHaveBeenCalledWith(99999);
      expect(mockUserCoinRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCoinTransactionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('重複したmedia_cashback_idの場合はALREADY_PROCESSEDエラーをスローする', async () => {
      // Arrange
      const payload: WebhookPayloadDto = {
        media_id: 'test_001',
        media_user_code: '12345',
        media_cashback_id: 'unique_001',
        media_cashback_code: '123456789012345',
        receipt_campaign_id: 'campaign_001',
        incentive_points: 100,
        participation_at: '2026-02-20T10:00:00Z',
        processed_at: '2026-02-20T10:00:00Z',
      } as WebhookPayloadDto;

      const campaign = EntityFactory.createCampaign();
      const existingReward = EntityFactory.createReward({
        mediaCashbackId: 'unique_001',
      });

      mockCampaignRepository.findByReceiptCampaignId.mockResolvedValue(
        campaign,
      );
      mockRewardRepository.findByMediaCashbackId.mockResolvedValue(
        existingReward,
      );

      // Act & Assert
      await expect(useCase.execute(payload)).rejects.toThrow(
        'ALREADY_PROCESSED',
      );
      expect(mockRewardRepository.save).not.toHaveBeenCalled();
      expect(mockUserCoinRepository.save).not.toHaveBeenCalled();
      expect(mockCoinTransactionRepository.save).not.toHaveBeenCalled();
    });

    it('キャンペーンが未登録の場合はエラーをスローする', async () => {
      // Arrange
      const payload: WebhookPayloadDto = {
        media_id: 'test_001',
        media_user_code: '12345',
        media_cashback_id: 'unique_003',
        media_cashback_code: '123456789012345',
        receipt_campaign_id: 'campaign_999',
        incentive_points: 100,
        participation_at: '2026-02-20T10:00:00Z',
        processed_at: '2026-02-20T10:00:00Z',
      } as WebhookPayloadDto;

      mockCampaignRepository.findByReceiptCampaignId.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(payload)).rejects.toThrow(
        'キャンペーンが未登録です',
      );
      expect(mockRewardRepository.save).not.toHaveBeenCalled();
      expect(mockUserCoinRepository.save).not.toHaveBeenCalled();
      expect(mockCoinTransactionRepository.save).not.toHaveBeenCalled();
    });

    it('トランザクション内で3テーブルが原子的に更新される', async () => {
      // Arrange
      const payload: WebhookPayloadDto = {
        media_id: 'test_001',
        media_user_code: '12345',
        media_cashback_id: 'unique_004',
        media_cashback_code: '123456789012345',
        receipt_campaign_id: 'campaign_001',
        incentive_points: 100,
        participation_at: '2026-02-20T10:00:00Z',
        processed_at: '2026-02-20T10:00:00Z',
      } as WebhookPayloadDto;

      const campaign = EntityFactory.createCampaign();
      const userCoin = EntityFactory.createUserCoin();

      mockCampaignRepository.findByReceiptCampaignId.mockResolvedValue(
        campaign,
      );
      mockRewardRepository.findByMediaCashbackId.mockResolvedValue(null);
      mockUserCoinRepository.findByUserId.mockResolvedValue(userCoin);

      // Act
      await useCase.execute(payload);

      // Assert - トランザクション実行確認
      expect(mockTransactionManager.execute).toHaveBeenCalledTimes(1);
      expect(mockRewardRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserCoinRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCoinTransactionRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
