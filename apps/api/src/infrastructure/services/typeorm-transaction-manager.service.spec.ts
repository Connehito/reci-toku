import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmTransactionManager } from './typeorm-transaction-manager.service';
import { DataSource } from 'typeorm';
import { UnitOfWork } from '../../domain/services/transaction-manager.interface';

describe('TypeOrmTransactionManager', () => {
  let service: TypeOrmTransactionManager;
  let mockConnect: jest.Mock;
  let mockStartTransaction: jest.Mock;
  let mockCommitTransaction: jest.Mock;
  let mockRollbackTransaction: jest.Mock;
  let mockRelease: jest.Mock;
  let mockGetRepository: jest.Mock;

  beforeEach(async () => {
    mockConnect = jest.fn();
    mockStartTransaction = jest.fn();
    mockCommitTransaction = jest.fn();
    mockRollbackTransaction = jest.fn();
    mockRelease = jest.fn();
    // getRepositoryは空オブジェクトを返す（Repository実装のコンストラクタに渡される）
    mockGetRepository = jest.fn().mockReturnValue({
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    });

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: mockConnect,
        startTransaction: mockStartTransaction,
        commitTransaction: mockCommitTransaction,
        rollbackTransaction: mockRollbackTransaction,
        release: mockRelease,
        manager: {
          getRepository: mockGetRepository,
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmTransactionManager,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<TypeOrmTransactionManager>(TypeOrmTransactionManager);
  });

  describe('execute', () => {
    it('正常にトランザクション内で処理を実行できる', async () => {
      // Arrange & Act
      const result = await service.execute(async (uow: UnitOfWork) => {
        expect(uow.rewardRepository).toBeDefined();
        expect(uow.userCoinRepository).toBeDefined();
        expect(uow.coinTransactionRepository).toBeDefined();
        return 'success';
      });

      // Assert
      expect(result).toBe('success');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockStartTransaction).toHaveBeenCalledTimes(1);
      expect(mockCommitTransaction).toHaveBeenCalledTimes(1);
      expect(mockRollbackTransaction).not.toHaveBeenCalled();
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    it('処理がエラーをスローした場合、ロールバックする', async () => {
      // Arrange
      const mockError = new Error('Test error');

      // Act & Assert
      await expect(
        service.execute(async () => {
          throw mockError;
        }),
      ).rejects.toThrow('Test error');
      expect(mockStartTransaction).toHaveBeenCalledTimes(1);
      expect(mockRollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockCommitTransaction).not.toHaveBeenCalled();
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    it('トランザクション内でUnitOfWorkのリポジトリが使える', async () => {
      // Arrange & Act
      await service.execute(async (uow: UnitOfWork) => {
        // UnitOfWork経由でリポジトリにアクセスできることを確認
        expect(uow.rewardRepository).toHaveProperty('save');
        expect(uow.userCoinRepository).toHaveProperty('save');
        expect(uow.coinTransactionRepository).toHaveProperty('save');
      });

      // Assert: getRepositoryが3つのSchema分呼ばれる
      expect(mockGetRepository).toHaveBeenCalledTimes(3);
    });

    it('エラー時もQueryRunnerが必ず解放される', async () => {
      // Act
      try {
        await service.execute(async () => {
          throw new Error('Unexpected error');
        });
      } catch {
        // エラーは無視
      }

      // Assert: finallyでreleaseが呼ばれる
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });
  });
});
