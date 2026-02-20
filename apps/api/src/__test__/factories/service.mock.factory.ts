import { ISecretsService } from '../../domain/services/secrets.service.interface';
import { IEncryptionService } from '../../domain/services/encryption.service.interface';
import { ITransactionManager } from '../../domain/services/transaction-manager.interface';

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

  static createTransactionManagerMock(): jest.Mocked<ITransactionManager> {
    return {
      execute: jest.fn().mockImplementation(<T>(work: () => Promise<T>) => work()),
    } as jest.Mocked<ITransactionManager>;
  }
}
