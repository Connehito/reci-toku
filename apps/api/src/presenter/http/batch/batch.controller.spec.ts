import { Test, TestingModule } from '@nestjs/testing';
import { BatchController } from './batch.controller';
import { ExpireCoinsUseCase } from '../../../usecase/batch/expire-coins.usecase';
import { ExpireCoinsResultDto } from '../../../usecase/batch/dto/expire-coins-result.dto';

describe('BatchController', () => {
  let controller: BatchController;
  let mockExpireCoinsUseCase: jest.Mocked<ExpireCoinsUseCase>;

  beforeEach(async () => {
    mockExpireCoinsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ExpireCoinsUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchController],
      providers: [
        {
          provide: ExpireCoinsUseCase,
          useValue: mockExpireCoinsUseCase,
        },
      ],
    }).compile();

    controller = module.get<BatchController>(BatchController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('expireCoins', () => {
    it('正常にバッチ実行結果を返す', async () => {
      // Arrange
      const mockResult: ExpireCoinsResultDto = {
        totalProcessed: 5,
        totalExpired: 1500,
        totalFailed: 0,
        failedUserIds: [],
        elapsedMs: 123,
      };

      mockExpireCoinsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.expireCoins();

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockExpireCoinsUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('対象ユーザーが0件の場合も正常に結果を返す', async () => {
      // Arrange
      const mockResult: ExpireCoinsResultDto = {
        totalProcessed: 0,
        totalExpired: 0,
        totalFailed: 0,
        failedUserIds: [],
        elapsedMs: 5,
      };

      mockExpireCoinsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.expireCoins();

      // Assert
      expect(result).toEqual(mockResult);
    });

    it('一部失敗を含む結果を返す', async () => {
      // Arrange
      const mockResult: ExpireCoinsResultDto = {
        totalProcessed: 4,
        totalExpired: 1200,
        totalFailed: 1,
        failedUserIds: [22222],
        elapsedMs: 456,
      };

      mockExpireCoinsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.expireCoins();

      // Assert
      expect(result).toEqual(mockResult);
      expect(result.totalFailed).toBe(1);
      expect(result.failedUserIds).toEqual([22222]);
    });

    it('UseCaseで予期しないエラーが発生した場合は元のエラーを再スローする', async () => {
      // Arrange
      const mockError = new Error('Database connection failed');
      mockExpireCoinsUseCase.execute.mockRejectedValue(mockError);

      // Act & Assert
      await expect(controller.expireCoins()).rejects.toThrow('Database connection failed');
      expect(mockExpireCoinsUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });
});
