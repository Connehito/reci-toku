import { Test, TestingModule } from '@nestjs/testing';
import { GetCoinHistoryUseCase } from './get-coin-history.usecase';
import { TOKENS } from '../../domain/tokens';
import { RepositoryMockFactory } from '../../__test__/factories/repository.mock.factory';
import { EntityFactory } from '../../__test__/factories/entity.factory';
import { InvalidUserIdError } from '../../domain/exceptions/invalid-user-id.error';
import { InvalidPaginationError } from '../../domain/exceptions/invalid-pagination.error';

// uuidをモック
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

describe('GetCoinHistoryUseCase', () => {
  let useCase: GetCoinHistoryUseCase;
  let mockCoinTransactionRepository: ReturnType<
    typeof RepositoryMockFactory.createCoinTransactionRepositoryMock
  >;

  beforeEach(async () => {
    mockCoinTransactionRepository = RepositoryMockFactory.createCoinTransactionRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCoinHistoryUseCase,
        {
          provide: TOKENS.ICoinTransactionRepository,
          useValue: mockCoinTransactionRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetCoinHistoryUseCase>(GetCoinHistoryUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('正常にコイン取引履歴を取得できる', async () => {
      // Arrange
      const userId = 12345;
      const transactions = [
        EntityFactory.createRewardTransaction({ amount: 100, balanceAfter: 100 }),
        EntityFactory.createRewardTransaction({ amount: 50, balanceAfter: 150 }),
      ];

      mockCoinTransactionRepository.findByUserIdWithPagination.mockResolvedValue({
        transactions,
        total: 2,
      });

      // Act
      const result = await useCase.execute(userId, 20, 0);

      // Assert
      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
      expect(result.transactions[0].amount).toBe(100);
      expect(result.transactions[0].balanceAfter).toBe(100);
      expect(mockCoinTransactionRepository.findByUserIdWithPagination).toHaveBeenCalledWith(
        userId,
        20,
        0,
      );
    });

    it('ページネーションで2ページ目を取得できる', async () => {
      // Arrange
      const userId = 12345;
      const transactions = [
        EntityFactory.createRewardTransaction({ amount: 30, balanceAfter: 180 }),
      ];

      mockCoinTransactionRepository.findByUserIdWithPagination.mockResolvedValue({
        transactions,
        total: 21,
      });

      // Act
      const result = await useCase.execute(userId, 20, 20);

      // Assert
      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(21);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(20);
      expect(mockCoinTransactionRepository.findByUserIdWithPagination).toHaveBeenCalledWith(
        userId,
        20,
        20,
      );
    });

    it('取引履歴が0件の場合は空配列を返す', async () => {
      // Arrange
      const userId = 99999;
      mockCoinTransactionRepository.findByUserIdWithPagination.mockResolvedValue({
        transactions: [],
        total: 0,
      });

      // Act
      const result = await useCase.execute(userId, 20, 0);

      // Assert
      expect(result.transactions).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('limitを指定して取得件数を制限できる', async () => {
      // Arrange
      const userId = 12345;
      const transactions = [
        EntityFactory.createRewardTransaction(),
        EntityFactory.createRewardTransaction(),
        EntityFactory.createRewardTransaction(),
        EntityFactory.createRewardTransaction(),
        EntityFactory.createRewardTransaction(),
      ];

      mockCoinTransactionRepository.findByUserIdWithPagination.mockResolvedValue({
        transactions,
        total: 100,
      });

      // Act
      const result = await useCase.execute(userId, 5, 0);

      // Assert
      expect(result.transactions).toHaveLength(5);
      expect(result.total).toBe(100);
      expect(result.limit).toBe(5);
      expect(mockCoinTransactionRepository.findByUserIdWithPagination).toHaveBeenCalledWith(
        userId,
        5,
        0,
      );
    });

    it('デフォルトlimit（20件）で取得できる', async () => {
      // Arrange
      const userId = 12345;
      mockCoinTransactionRepository.findByUserIdWithPagination.mockResolvedValue({
        transactions: [],
        total: 0,
      });

      // Act
      await useCase.execute(userId);

      // Assert
      expect(mockCoinTransactionRepository.findByUserIdWithPagination).toHaveBeenCalledWith(
        userId,
        20,
        0,
      );
    });

    it('不正なユーザーID（0）の場合はエラーをスローする', async () => {
      // Arrange
      const userId = 0;

      // Act & Assert
      await expect(useCase.execute(userId)).rejects.toThrow(InvalidUserIdError);
      expect(mockCoinTransactionRepository.findByUserIdWithPagination).not.toHaveBeenCalled();
    });

    it('不正なlimit（0以下）の場合はInvalidPaginationErrorをスローする', async () => {
      // Arrange
      const userId = 12345;

      // Act & Assert
      await expect(useCase.execute(userId, 0, 0)).rejects.toThrow(InvalidPaginationError);
      await expect(useCase.execute(userId, 0, 0)).rejects.toThrow(
        '取得件数は1以上100以下である必要があります',
      );
      expect(mockCoinTransactionRepository.findByUserIdWithPagination).not.toHaveBeenCalled();
    });

    it('不正なlimit（101以上）の場合はInvalidPaginationErrorをスローする', async () => {
      // Arrange
      const userId = 12345;

      // Act & Assert
      await expect(useCase.execute(userId, 101, 0)).rejects.toThrow(InvalidPaginationError);
      await expect(useCase.execute(userId, 101, 0)).rejects.toThrow(
        '取得件数は1以上100以下である必要があります',
      );
      expect(mockCoinTransactionRepository.findByUserIdWithPagination).not.toHaveBeenCalled();
    });

    it('不正なoffset（負の値）の場合はInvalidPaginationErrorをスローする', async () => {
      // Arrange
      const userId = 12345;

      // Act & Assert
      await expect(useCase.execute(userId, 20, -1)).rejects.toThrow(InvalidPaginationError);
      await expect(useCase.execute(userId, 20, -1)).rejects.toThrow(
        'スキップ件数は0以上である必要があります',
      );
      expect(mockCoinTransactionRepository.findByUserIdWithPagination).not.toHaveBeenCalled();
    });
  });
});
