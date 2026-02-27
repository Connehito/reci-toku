import { Test, TestingModule } from '@nestjs/testing';
import { ExpireCoinsUseCase } from './expire-coins.usecase';
import { TOKENS } from '../../domain/tokens';
import { RepositoryMockFactory } from '../../__test__/factories/repository.mock.factory';
import { ServiceMockFactory } from '../../__test__/factories/service.mock.factory';
import { EntityFactory } from '../../__test__/factories/entity.factory';
import { CoinSetting } from '../../domain/entities/coin-setting.entity';
import { TransactionType } from '../../domain/entities/coin-transaction.entity';
import { UnitOfWork } from '../../domain/services/transaction-manager.interface';

describe('ExpireCoinsUseCase', () => {
  let useCase: ExpireCoinsUseCase;
  // トランザクション外（失効対象取得・設定読み取り用）
  let mockUserCoinRepository: ReturnType<
    typeof RepositoryMockFactory.createUserCoinRepositoryMock
  >;
  let mockCoinSettingRepository: ReturnType<
    typeof RepositoryMockFactory.createCoinSettingRepositoryMock
  >;
  // UnitOfWork内（トランザクション内で使用されるリポジトリ）
  let uowUserCoinRepository: ReturnType<
    typeof RepositoryMockFactory.createUserCoinRepositoryMock
  >;
  let uowCoinTransactionRepository: ReturnType<
    typeof RepositoryMockFactory.createCoinTransactionRepositoryMock
  >;
  let mockTransactionManager: ReturnType<typeof ServiceMockFactory.createTransactionManagerMock>;

  beforeEach(async () => {
    // トランザクション外のモックリポジトリ
    mockUserCoinRepository = RepositoryMockFactory.createUserCoinRepositoryMock();
    mockCoinSettingRepository = RepositoryMockFactory.createCoinSettingRepositoryMock();

    // UnitOfWork用のモックリポジトリ
    uowUserCoinRepository = RepositoryMockFactory.createUserCoinRepositoryMock();
    uowCoinTransactionRepository = RepositoryMockFactory.createCoinTransactionRepositoryMock();

    const uow: UnitOfWork = {
      rewardRepository: RepositoryMockFactory.createRewardRepositoryMock(),
      userCoinRepository: uowUserCoinRepository,
      coinTransactionRepository: uowCoinTransactionRepository,
    };
    mockTransactionManager = ServiceMockFactory.createTransactionManagerMock(uow);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpireCoinsUseCase,
        { provide: TOKENS.IUserCoinRepository, useValue: mockUserCoinRepository },
        { provide: TOKENS.ICoinSettingRepository, useValue: mockCoinSettingRepository },
        { provide: TOKENS.ITransactionManager, useValue: mockTransactionManager },
      ],
    }).compile();

    useCase = module.get<ExpireCoinsUseCase>(ExpireCoinsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('有効期限切れユーザーのコインを失効させる', async () => {
      // Arrange
      const expiredUserCoin = EntityFactory.createUserCoin({
        userId: 12345,
        balance: 500,
        lastEarnedAt: new Date('2025-06-01T00:00:00Z'),
      });
      const coinSetting = CoinSetting.reconstruct(
        'coin_expire_days',
        '180',
        'コイン有効期限日数',
        new Date(),
        new Date(),
      );

      mockCoinSettingRepository.findByKey.mockResolvedValue(coinSetting);
      mockUserCoinRepository.findExpiredCoins.mockResolvedValue([expiredUserCoin]);
      // トランザクション内でfindByUserIdが最新状態を返す
      uowUserCoinRepository.findByUserId.mockResolvedValue(expiredUserCoin);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.totalProcessed).toBe(1);
      expect(result.totalExpired).toBe(500);
      expect(result.totalFailed).toBe(0);
      expect(result.failedUserIds).toEqual([]);
      expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
      expect(mockCoinSettingRepository.findByKey).toHaveBeenCalledWith('coin_expire_days');
      expect(mockUserCoinRepository.findExpiredCoins).toHaveBeenCalledWith(180);
      expect(mockTransactionManager.execute).toHaveBeenCalledTimes(1);
      expect(uowUserCoinRepository.findByUserId).toHaveBeenCalledWith(12345);
      expect(uowUserCoinRepository.save).toHaveBeenCalledTimes(1);
      expect(uowCoinTransactionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('複数ユーザーのコインを一括失効させる', async () => {
      // Arrange
      const userCoin1 = EntityFactory.createUserCoin({
        userId: 11111,
        balance: 200,
        lastEarnedAt: new Date('2025-06-01T00:00:00Z'),
      });
      const userCoin2 = EntityFactory.createUserCoin({
        userId: 22222,
        balance: 300,
        lastEarnedAt: new Date('2025-05-01T00:00:00Z'),
      });
      const userCoin3 = EntityFactory.createUserCoin({
        userId: 33333,
        balance: 100,
        lastEarnedAt: new Date('2025-04-01T00:00:00Z'),
      });

      mockCoinSettingRepository.findByKey.mockResolvedValue(null); // デフォルト使用
      mockUserCoinRepository.findExpiredCoins.mockResolvedValue([userCoin1, userCoin2, userCoin3]);
      // トランザクション内でfindByUserIdが各ユーザーを返す
      uowUserCoinRepository.findByUserId
        .mockResolvedValueOnce(userCoin1)
        .mockResolvedValueOnce(userCoin2)
        .mockResolvedValueOnce(userCoin3);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.totalProcessed).toBe(3);
      expect(result.totalExpired).toBe(600); // 200 + 300 + 100
      expect(result.totalFailed).toBe(0);
      expect(mockTransactionManager.execute).toHaveBeenCalledTimes(3);
      expect(uowUserCoinRepository.save).toHaveBeenCalledTimes(3);
      expect(uowCoinTransactionRepository.save).toHaveBeenCalledTimes(3);
    });

    it('対象ユーザーが0件の場合は何もしない', async () => {
      // Arrange
      mockCoinSettingRepository.findByKey.mockResolvedValue(null);
      mockUserCoinRepository.findExpiredCoins.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.totalProcessed).toBe(0);
      expect(result.totalExpired).toBe(0);
      expect(result.totalFailed).toBe(0);
      expect(result.failedUserIds).toEqual([]);
      expect(mockTransactionManager.execute).not.toHaveBeenCalled();
    });

    it('CoinSetting未設定の場合はデフォルト180日を使用する', async () => {
      // Arrange
      mockCoinSettingRepository.findByKey.mockResolvedValue(null);
      mockUserCoinRepository.findExpiredCoins.mockResolvedValue([]);

      // Act
      await useCase.execute();

      // Assert
      expect(mockUserCoinRepository.findExpiredCoins).toHaveBeenCalledWith(180);
    });

    it('1ユーザーの失効失敗時も他ユーザーの処理を続行する', async () => {
      // Arrange
      const userCoin1 = EntityFactory.createUserCoin({
        userId: 11111,
        balance: 200,
        lastEarnedAt: new Date('2025-06-01T00:00:00Z'),
      });
      const userCoin2 = EntityFactory.createUserCoin({
        userId: 22222,
        balance: 300,
        lastEarnedAt: new Date('2025-05-01T00:00:00Z'),
      });
      const userCoin3 = EntityFactory.createUserCoin({
        userId: 33333,
        balance: 100,
        lastEarnedAt: new Date('2025-04-01T00:00:00Z'),
      });

      mockCoinSettingRepository.findByKey.mockResolvedValue(null);
      mockUserCoinRepository.findExpiredCoins.mockResolvedValue([userCoin1, userCoin2, userCoin3]);

      // 2番目のユーザーでエラーを発生させる
      let callCount = 0;
      mockTransactionManager.execute.mockImplementation(
        <T>(work: (uow: UnitOfWork) => Promise<T>) => {
          callCount++;
          if (callCount === 2) {
            return Promise.reject(new Error('Database connection failed'));
          }
          // findByUserIdが対応するユーザーコインを返すようにモックを作成
          const localUowUserCoinRepo = RepositoryMockFactory.createUserCoinRepositoryMock();
          const targetCoin = callCount === 1 ? userCoin1 : userCoin3;
          localUowUserCoinRepo.findByUserId.mockResolvedValue(targetCoin);
          const uow: UnitOfWork = {
            rewardRepository: RepositoryMockFactory.createRewardRepositoryMock(),
            userCoinRepository: localUowUserCoinRepo,
            coinTransactionRepository: uowCoinTransactionRepository,
          };
          return work(uow);
        },
      );

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.totalProcessed).toBe(2); // 1番目と3番目が成功
      expect(result.totalFailed).toBe(1);
      expect(result.failedUserIds).toEqual([22222]);
      expect(mockTransactionManager.execute).toHaveBeenCalledTimes(3); // 3回とも呼ばれる
    });

    it('トランザクション内で残高0になっていたらスキップする（Race Condition対策）', async () => {
      // Arrange
      const expiredUserCoin = EntityFactory.createUserCoin({
        userId: 12345,
        balance: 500,
        lastEarnedAt: new Date('2025-06-01T00:00:00Z'),
      });
      const alreadyExpiredUserCoin = EntityFactory.createUserCoin({
        userId: 12345,
        balance: 0,
        lastEarnedAt: new Date('2025-06-01T00:00:00Z'),
      });

      mockCoinSettingRepository.findByKey.mockResolvedValue(null);
      mockUserCoinRepository.findExpiredCoins.mockResolvedValue([expiredUserCoin]);
      // トランザクション内では既に残高0（他のプロセスが先に失効済み）
      uowUserCoinRepository.findByUserId.mockResolvedValue(alreadyExpiredUserCoin);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.totalProcessed).toBe(0);
      expect(result.totalExpired).toBe(0);
      expect(result.totalFailed).toBe(0);
      expect(uowUserCoinRepository.save).not.toHaveBeenCalled();
      expect(uowCoinTransactionRepository.save).not.toHaveBeenCalled();
    });

    it('トランザクション内でユーザーが見つからない場合はスキップする', async () => {
      // Arrange
      const expiredUserCoin = EntityFactory.createUserCoin({
        userId: 12345,
        balance: 500,
        lastEarnedAt: new Date('2025-06-01T00:00:00Z'),
      });

      mockCoinSettingRepository.findByKey.mockResolvedValue(null);
      mockUserCoinRepository.findExpiredCoins.mockResolvedValue([expiredUserCoin]);
      // トランザクション内でユーザーが見つからない
      uowUserCoinRepository.findByUserId.mockResolvedValue(null);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.totalProcessed).toBe(0);
      expect(result.totalExpired).toBe(0);
      expect(uowUserCoinRepository.save).not.toHaveBeenCalled();
    });

    it('失効トランザクションが正しい値で作成される', async () => {
      // Arrange
      const expiredUserCoin = EntityFactory.createUserCoin({
        userId: 12345,
        balance: 500,
        lastEarnedAt: new Date('2025-06-01T00:00:00Z'),
      });

      mockCoinSettingRepository.findByKey.mockResolvedValue(null);
      mockUserCoinRepository.findExpiredCoins.mockResolvedValue([expiredUserCoin]);
      uowUserCoinRepository.findByUserId.mockResolvedValue(expiredUserCoin);

      // Act
      await useCase.execute();

      // Assert - UserCoinのsave引数を検証（expire()済みで残高0）
      const savedUserCoin = uowUserCoinRepository.save.mock.calls[0][0];
      expect(savedUserCoin.getBalance()).toBe(0);
      expect(savedUserCoin.getUserId()).toBe(12345);

      // Assert - CoinTransactionのsave引数を検証
      const savedTransaction = uowCoinTransactionRepository.save.mock.calls[0][0];
      expect(savedTransaction.getUserId()).toBe(12345);
      expect(savedTransaction.getAmount()).toBe(-500); // 負の値
      expect(savedTransaction.getBalanceAfter()).toBe(0);
      expect(savedTransaction.getDescription()).toBe('コイン有効期限切れ');
      expect(savedTransaction.getTransactionType()).toBe(TransactionType.EXPIRE);
    });

    it('UnitOfWork経由でリポジトリが使われる', async () => {
      // Arrange
      const expiredUserCoin = EntityFactory.createUserCoin({
        userId: 12345,
        balance: 100,
        lastEarnedAt: new Date('2025-06-01T00:00:00Z'),
      });

      mockCoinSettingRepository.findByKey.mockResolvedValue(null);
      mockUserCoinRepository.findExpiredCoins.mockResolvedValue([expiredUserCoin]);
      uowUserCoinRepository.findByUserId.mockResolvedValue(expiredUserCoin);

      // Act
      await useCase.execute();

      // Assert - トランザクション外のfindExpiredCoinsは直接リポジトリで呼ばれる
      expect(mockUserCoinRepository.findExpiredCoins).toHaveBeenCalledTimes(1);

      // Assert - トランザクション内ではUnitOfWork経由のリポジトリが使われる
      expect(mockTransactionManager.execute).toHaveBeenCalledTimes(1);
      expect(uowUserCoinRepository.findByUserId).toHaveBeenCalledWith(12345);
      expect(uowUserCoinRepository.save).toHaveBeenCalledTimes(1);
      expect(uowCoinTransactionRepository.save).toHaveBeenCalledTimes(1);

      // Assert - トランザクション外のリポジトリではsaveが呼ばれない
      expect(mockUserCoinRepository.save).not.toHaveBeenCalled();
    });
  });
});
