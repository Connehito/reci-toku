import { Test, TestingModule } from '@nestjs/testing';
import { GenerateJweTokenUseCase } from './generate-jwe-token.usecase';
import { TOKENS } from '../../domain/tokens';
import { ServiceMockFactory } from '../../__test__/factories/service.mock.factory';

describe('GenerateJweTokenUseCase', () => {
  let useCase: GenerateJweTokenUseCase;
  let mockSecretsService: ReturnType<typeof ServiceMockFactory.createSecretsServiceMock>;
  let mockEncryptionService: ReturnType<typeof ServiceMockFactory.createEncryptionServiceMock>;

  beforeEach(async () => {
    // モックサービスの作成
    mockSecretsService = ServiceMockFactory.createSecretsServiceMock();
    mockEncryptionService = ServiceMockFactory.createEncryptionServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateJweTokenUseCase,
        { provide: TOKENS.ISecretsService, useValue: mockSecretsService },
        {
          provide: TOKENS.IEncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    useCase = module.get<GenerateJweTokenUseCase>(GenerateJweTokenUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('正常にJWEトークンを生成できる', async () => {
      // Arrange
      const userId = 12345;
      const mockCredentials = {
        encryptionKey: 'test-encryption-key',
        clientId: 'test-client-id',
      };
      const mockJweToken = 'mocked.jwe.token.here';

      mockSecretsService.getPMNCredentials.mockResolvedValue(mockCredentials);
      mockEncryptionService.encryptJWE.mockResolvedValue(mockJweToken);

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result).toBe(mockJweToken);
      expect(mockSecretsService.getPMNCredentials).toHaveBeenCalledTimes(1);
      expect(mockEncryptionService.encryptJWE).toHaveBeenCalledWith(
        { media_user_code: '12345' },
        mockCredentials.clientId,
        mockCredentials.encryptionKey,
      );
    });

    it('ペイロードにmedia_user_codeが文字列として設定される', async () => {
      // Arrange
      const userId = 99999;
      const mockCredentials = {
        encryptionKey: 'test-key',
        clientId: 'test-id',
      };
      const mockJweToken = 'jwe-token';

      mockSecretsService.getPMNCredentials.mockResolvedValue(mockCredentials);
      mockEncryptionService.encryptJWE.mockResolvedValue(mockJweToken);

      // Act
      await useCase.execute(userId);

      // Assert
      expect(mockEncryptionService.encryptJWE).toHaveBeenCalledWith(
        { media_user_code: '99999' },
        expect.any(String),
        expect.any(String),
      );
    });

    it('不正なユーザーID（0）の場合はエラーをスローする', async () => {
      // Arrange
      const userId = 0;

      // Act & Assert
      await expect(useCase.execute(userId)).rejects.toThrow('不正なユーザーIDです');
      expect(mockSecretsService.getPMNCredentials).not.toHaveBeenCalled();
      expect(mockEncryptionService.encryptJWE).not.toHaveBeenCalled();
    });

    it('不正なユーザーID（負の値）の場合はエラーをスローする', async () => {
      // Arrange
      const userId = -1;

      // Act & Assert
      await expect(useCase.execute(userId)).rejects.toThrow('不正なユーザーIDです');
      expect(mockSecretsService.getPMNCredentials).not.toHaveBeenCalled();
      expect(mockEncryptionService.encryptJWE).not.toHaveBeenCalled();
    });

    it('Secrets Manager取得失敗時はエラーを再スローする', async () => {
      // Arrange
      const userId = 12345;
      const mockError = new Error('Secrets Manager connection failed');
      mockSecretsService.getPMNCredentials.mockRejectedValue(mockError);

      // Act & Assert
      await expect(useCase.execute(userId)).rejects.toThrow('Secrets Manager connection failed');
      expect(mockSecretsService.getPMNCredentials).toHaveBeenCalledTimes(1);
      expect(mockEncryptionService.encryptJWE).not.toHaveBeenCalled();
    });

    it('JWE暗号化失敗時はエラーを再スローする', async () => {
      // Arrange
      const userId = 12345;
      const mockCredentials = {
        encryptionKey: 'test-key',
        clientId: 'test-id',
      };
      const mockError = new Error('JWE encryption failed');

      mockSecretsService.getPMNCredentials.mockResolvedValue(mockCredentials);
      mockEncryptionService.encryptJWE.mockRejectedValue(mockError);

      // Act & Assert
      await expect(useCase.execute(userId)).rejects.toThrow('JWE encryption failed');
      expect(mockSecretsService.getPMNCredentials).toHaveBeenCalledTimes(1);
      expect(mockEncryptionService.encryptJWE).toHaveBeenCalledTimes(1);
    });
  });
});
