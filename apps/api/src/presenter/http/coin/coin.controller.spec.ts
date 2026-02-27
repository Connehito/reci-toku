import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CoinController } from './coin.controller';
import { GetCoinBalanceUseCase } from '../../../usecase/coin/get-coin-balance.usecase';
import { GetCoinHistoryUseCase } from '../../../usecase/coin/get-coin-history.usecase';
import { CoinBalanceResponseDto } from '../../../usecase/coin/dto/coin-balance-response.dto';
import { InvalidUserIdError } from '../../../domain/exceptions/invalid-user-id.error';
import { InvalidPaginationError } from '../../../domain/exceptions/invalid-pagination.error';
import { CoinHistoryResponseDto } from '../../../usecase/coin/dto/coin-history-response.dto';

describe('CoinController', () => {
  let controller: CoinController;
  let mockGetCoinBalanceUseCase: jest.Mocked<GetCoinBalanceUseCase>;
  let mockGetCoinHistoryUseCase: jest.Mocked<GetCoinHistoryUseCase>;

  beforeEach(async () => {
    mockGetCoinBalanceUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetCoinBalanceUseCase>;

    mockGetCoinHistoryUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetCoinHistoryUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoinController],
      providers: [
        {
          provide: GetCoinBalanceUseCase,
          useValue: mockGetCoinBalanceUseCase,
        },
        {
          provide: GetCoinHistoryUseCase,
          useValue: mockGetCoinHistoryUseCase,
        },
      ],
    }).compile();

    controller = module.get<CoinController>(CoinController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('正常にコイン残高を取得できる', async () => {
      // Arrange
      const userId = 12345;
      const mockResponse: CoinBalanceResponseDto = {
        balance: 100,
        lastEarnedAt: '2026-02-20T10:00:00.000Z',
        expiresAt: '2026-08-19T10:00:00.000Z',
      };

      mockGetCoinBalanceUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getBalance(userId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockGetCoinBalanceUseCase.execute).toHaveBeenCalledWith(userId);
      expect(mockGetCoinBalanceUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('初回獲得前のユーザーは残高0を返す', async () => {
      // Arrange
      const userId = 99999;
      const mockResponse: CoinBalanceResponseDto = {
        balance: 0,
        lastEarnedAt: null,
        expiresAt: null,
      };

      mockGetCoinBalanceUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getBalance(userId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockGetCoinBalanceUseCase.execute).toHaveBeenCalledWith(userId);
    });

    it('異なるユーザーIDで正常に残高を取得できる', async () => {
      // Arrange
      const userId = 77777;
      const mockResponse: CoinBalanceResponseDto = {
        balance: 250,
        lastEarnedAt: '2026-01-15T08:30:00.000Z',
        expiresAt: '2026-07-14T08:30:00.000Z',
      };

      mockGetCoinBalanceUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getBalance(userId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockGetCoinBalanceUseCase.execute).toHaveBeenCalledWith(77777);
    });

    it('不正なユーザーIDの場合はBadRequestExceptionをスローする', async () => {
      // Arrange
      const userId = 0;
      mockGetCoinBalanceUseCase.execute.mockRejectedValue(new InvalidUserIdError(0));

      // Act & Assert
      await expect(controller.getBalance(userId)).rejects.toThrow(BadRequestException);
      expect(mockGetCoinBalanceUseCase.execute).toHaveBeenCalledWith(userId);
    });

    it('UseCaseで予期しないエラーが発生した場合は元のエラーを再スローする', async () => {
      // Arrange
      const userId = 12345;
      const mockError = new Error('Database connection failed');
      mockGetCoinBalanceUseCase.execute.mockRejectedValue(mockError);

      // Act & Assert
      await expect(controller.getBalance(userId)).rejects.toThrow('Database connection failed');
      expect(mockGetCoinBalanceUseCase.execute).toHaveBeenCalledWith(userId);
    });
  });

  describe('getHistory', () => {
    it('正常にコイン取引履歴を取得できる', async () => {
      // Arrange
      const userId = 12345;
      const limit = 10;
      const offset = 0;
      const mockResponse: CoinHistoryResponseDto = {
        transactions: [
          {
            id: '1',
            amount: 50,
            balanceAfter: 150,
            transactionType: 1,
            description: 'レシート報酬',
            createdAt: '2026-02-20T10:00:00.000Z',
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      };

      mockGetCoinHistoryUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getHistory(userId, limit, offset);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockGetCoinHistoryUseCase.execute).toHaveBeenCalledWith(userId, limit, offset);
      expect(mockGetCoinHistoryUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('デフォルトのlimit/offsetで取引履歴を取得できる', async () => {
      // Arrange
      const userId = 12345;
      const mockResponse: CoinHistoryResponseDto = {
        transactions: [],
        total: 0,
        limit: 20,
        offset: 0,
      };

      mockGetCoinHistoryUseCase.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getHistory(userId, 20, 0);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockGetCoinHistoryUseCase.execute).toHaveBeenCalledWith(userId, 20, 0);
    });

    it('不正なユーザーIDの場合はBadRequestExceptionをスローする', async () => {
      // Arrange
      const userId = 0;
      mockGetCoinHistoryUseCase.execute.mockRejectedValue(new InvalidUserIdError(0));

      // Act & Assert
      await expect(controller.getHistory(userId, 20, 0)).rejects.toThrow(BadRequestException);
      expect(mockGetCoinHistoryUseCase.execute).toHaveBeenCalledWith(userId, 20, 0);
    });

    it('不正なlimit値の場合はBadRequestExceptionをスローする', async () => {
      // Arrange
      const userId = 12345;
      mockGetCoinHistoryUseCase.execute.mockRejectedValue(
        new InvalidPaginationError('取得件数は1以上100以下である必要があります'),
      );

      // Act & Assert
      await expect(controller.getHistory(userId, 200, 0)).rejects.toThrow(BadRequestException);
    });

    it('不正なoffset値の場合はBadRequestExceptionをスローする', async () => {
      // Arrange
      const userId = 12345;
      mockGetCoinHistoryUseCase.execute.mockRejectedValue(
        new InvalidPaginationError('スキップ件数は0以上である必要があります'),
      );

      // Act & Assert
      await expect(controller.getHistory(userId, 20, -1)).rejects.toThrow(BadRequestException);
    });

    it('UseCaseで予期しないエラーが発生した場合は元のエラーを再スローする', async () => {
      // Arrange
      const userId = 12345;
      const mockError = new Error('Database connection failed');
      mockGetCoinHistoryUseCase.execute.mockRejectedValue(mockError);

      // Act & Assert
      await expect(controller.getHistory(userId, 20, 0)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockGetCoinHistoryUseCase.execute).toHaveBeenCalledWith(userId, 20, 0);
    });
  });
});
