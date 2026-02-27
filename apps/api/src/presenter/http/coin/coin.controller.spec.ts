import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CoinController } from './coin.controller';
import { GetCoinBalanceUseCase } from '../../../usecase/coin/get-coin-balance.usecase';
import { CoinBalanceResponseDto } from '../../../usecase/coin/dto/coin-balance-response.dto';
import { InvalidUserIdError } from '../../../domain/exceptions/invalid-user-id.error';

describe('CoinController', () => {
  let controller: CoinController;
  let mockGetCoinBalanceUseCase: jest.Mocked<GetCoinBalanceUseCase>;

  beforeEach(async () => {
    mockGetCoinBalanceUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetCoinBalanceUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoinController],
      providers: [
        {
          provide: GetCoinBalanceUseCase,
          useValue: mockGetCoinBalanceUseCase,
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
});
