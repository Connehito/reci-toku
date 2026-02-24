import { ISecretsService } from '../../domain/services/secrets.service.interface';
import { IEncryptionService } from '../../domain/services/encryption.service.interface';
import { ITransactionManager, UnitOfWork } from '../../domain/services/transaction-manager.interface';
import { RepositoryMockFactory } from './repository.mock.factory';

/**
 * Infrastructure Service層のモック統一ファクトリー
 *
 * メリット:
 * - 全テストで統一されたモック作成
 * - Interface変更時に1箇所修正するだけ
 * - テストコードの可読性向上
 */
export class ServiceMockFactory {
  static createSecretsServiceMock(): jest.Mocked<ISecretsService> {
    return {
      getPMNCredentials: jest.fn(),
    };
  }

  static createEncryptionServiceMock(): jest.Mocked<IEncryptionService> {
    return {
      encryptJWE: jest.fn(),
      decryptJWE: jest.fn(),
    };
  }

  /**
   * TransactionManagerのモックを作成
   * execute()はUnitOfWorkをworkに渡して実行する
   */
  static createTransactionManagerMock(uow?: UnitOfWork): jest.Mocked<ITransactionManager> {
    const defaultUow: UnitOfWork = uow ?? {
      rewardRepository: RepositoryMockFactory.createRewardRepositoryMock(),
      userCoinRepository: RepositoryMockFactory.createUserCoinRepositoryMock(),
      coinTransactionRepository: RepositoryMockFactory.createCoinTransactionRepositoryMock(),
    };
    return {
      execute: jest
        .fn()
        .mockImplementation(<T>(work: (uow: UnitOfWork) => Promise<T>) => work(defaultUow)),
    } as jest.Mocked<ITransactionManager>;
  }
}
