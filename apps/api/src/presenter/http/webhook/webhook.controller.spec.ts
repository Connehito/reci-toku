import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { ProcessWebhookUseCase } from '../../../usecase/webhook/process-webhook.usecase';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { AlreadyProcessedError } from '../../../domain/exceptions/already-processed.error';
import { CampaignNotFoundError } from '../../../domain/exceptions/campaign-not-found.error';

// uuidをモック（UseCase依存チェーン経由でESM importの解決に必要）
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

/**
 * デフォルトのWebhookペイロードを生成するヘルパー
 */
function createDefaultPayload(overrides?: Partial<WebhookPayloadDto>): WebhookPayloadDto {
  return {
    media_id: 'test_001',
    media_user_code: '12345',
    media_cashback_id: 'unique_001',
    media_cashback_code: '123456789012345',
    receipt_campaign_id: 'campaign_001',
    incentive_points: 100,
    participation_at: '2026-02-20T10:00:00Z',
    processed_at: '2026-02-20T10:00:00Z',
    ...overrides,
  } as WebhookPayloadDto;
}

describe('WebhookController', () => {
  let controller: WebhookController;
  let mockProcessWebhookUseCase: jest.Mocked<ProcessWebhookUseCase>;

  beforeEach(async () => {
    mockProcessWebhookUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ProcessWebhookUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: ProcessWebhookUseCase,
          useValue: mockProcessWebhookUseCase,
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleWebhook', () => {
    it('正常なペイロードで200 OKとsuccessを返す', async () => {
      // Arrange
      const payload = createDefaultPayload();
      mockProcessWebhookUseCase.execute.mockResolvedValue(undefined);

      // Act
      const response = await controller.handleWebhook(payload);

      // Assert
      expect(response).toEqual({ status: 'success' });
      expect(mockProcessWebhookUseCase.execute).toHaveBeenCalledWith(payload);
      expect(mockProcessWebhookUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('重複ペイロード（Application層チェック）で200 OKとalready_processedを返す', async () => {
      // Arrange
      const payload = createDefaultPayload();
      mockProcessWebhookUseCase.execute.mockRejectedValue(new AlreadyProcessedError('unique_001'));

      // Act
      const response = await controller.handleWebhook(payload);

      // Assert
      expect(response).toEqual({ status: 'already_processed' });
      expect(mockProcessWebhookUseCase.execute).toHaveBeenCalledWith(payload);
    });

    it('重複ペイロード（DB制約エラー）で200 OKとalready_processedを返す', async () => {
      // Arrange
      const payload = createDefaultPayload();

      // TypeORM QueryFailedError（MySQL UNIQUE制約違反）をシミュレート
      const duplicateError = new Error('Duplicate entry') as Error & {
        driverError: { code: string };
      };
      duplicateError.driverError = { code: 'ER_DUP_ENTRY' };
      mockProcessWebhookUseCase.execute.mockRejectedValue(duplicateError);

      // Act
      const response = await controller.handleWebhook(payload);

      // Assert
      expect(response).toEqual({ status: 'already_processed' });
      expect(mockProcessWebhookUseCase.execute).toHaveBeenCalledWith(payload);
    });

    it('キャンペーン未登録で400 Bad Requestを返す', async () => {
      // Arrange
      const payload = createDefaultPayload({
        media_cashback_id: 'unique_002',
        receipt_campaign_id: 'campaign_999',
      });
      mockProcessWebhookUseCase.execute.mockRejectedValue(
        new CampaignNotFoundError('campaign_999'),
      );

      // Act & Assert
      await expect(controller.handleWebhook(payload)).rejects.toThrow(BadRequestException);
      expect(mockProcessWebhookUseCase.execute).toHaveBeenCalledWith(payload);
    });

    it('予期しないエラーで500 Internal Server Errorを返す', async () => {
      // Arrange
      const payload = createDefaultPayload({ media_cashback_id: 'unique_003' });
      const mockError = new Error('Database connection failed');
      mockProcessWebhookUseCase.execute.mockRejectedValue(mockError);

      // Act & Assert
      await expect(controller.handleWebhook(payload)).rejects.toThrow('Database connection failed');
      expect(mockProcessWebhookUseCase.execute).toHaveBeenCalledWith(payload);
    });

    it('トランザクションエラーで500 Internal Server Errorを返す', async () => {
      // Arrange
      const payload = createDefaultPayload({ media_cashback_id: 'unique_004' });
      const mockError = new Error('Transaction failed');
      mockProcessWebhookUseCase.execute.mockRejectedValue(mockError);

      // Act & Assert
      await expect(controller.handleWebhook(payload)).rejects.toThrow('Transaction failed');
    });
  });
});
