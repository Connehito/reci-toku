import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AwsSecretsService } from './aws-secrets.service';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// AWS SDK v3のモック
jest.mock('@aws-sdk/client-secrets-manager');

describe('AwsSecretsService', () => {
  let service: AwsSecretsService;
  let mockSecretsManagerClient: jest.Mocked<SecretsManagerClient>;
  let mockConfigService: { get: jest.Mock };

  beforeEach(async () => {
    // モッククライアントの作成
    mockSecretsManagerClient = {
      send: jest.fn() as jest.Mock,
    } as unknown as jest.Mocked<SecretsManagerClient>;

    // SecretsManagerClientのコンストラクタをモック
    (SecretsManagerClient as jest.Mock).mockImplementation(() => {
      return mockSecretsManagerClient;
    });

    // ConfigServiceのモック
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          AWS_REGION: 'ap-northeast-1',
          PMN_SECRET_ID: 'reci-toku/test/pmn-credentials',
        };
        return config[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwsSecretsService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AwsSecretsService>(AwsSecretsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPMNCredentials', () => {
    it('正常にPMN認証情報を取得できる', async () => {
      // Arrange
      const mockSecretString = JSON.stringify({
        encryption_key: 'dGVzdC1lbmNyeXB0aW9uLWtleQ==',
        client_id: 'test-client-id',
      });

      (mockSecretsManagerClient.send as jest.Mock).mockResolvedValue({
        SecretString: mockSecretString,
      });

      // Act
      const result = await service.getPMNCredentials();

      // Assert
      expect(result).toEqual({
        encryptionKey: 'dGVzdC1lbmNyeXB0aW9uLWtleQ==',
        clientId: 'test-client-id',
      });
      expect(mockSecretsManagerClient.send).toHaveBeenCalledWith(expect.any(GetSecretValueCommand));
    });

    it('SecretStringが存在しない場合はエラーをスローする', async () => {
      // Arrange
      (mockSecretsManagerClient.send as jest.Mock).mockResolvedValue({});

      // Act & Assert
      await expect(service.getPMNCredentials()).rejects.toThrow(
        'SecretStringが取得できませんでした',
      );
    });

    it('encryption_keyが存在しない場合はエラーをスローする', async () => {
      // Arrange
      const mockSecretString = JSON.stringify({
        client_id: 'test-client-id',
      });

      (mockSecretsManagerClient.send as jest.Mock).mockResolvedValue({
        SecretString: mockSecretString,
      });

      // Act & Assert
      await expect(service.getPMNCredentials()).rejects.toThrow('PMN認証情報が不正です');
    });

    it('client_idが存在しない場合はエラーをスローする', async () => {
      // Arrange
      const mockSecretString = JSON.stringify({
        encryption_key: 'dGVzdC1lbmNyeXB0aW9uLWtleQ==',
      });

      (mockSecretsManagerClient.send as jest.Mock).mockResolvedValue({
        SecretString: mockSecretString,
      });

      // Act & Assert
      await expect(service.getPMNCredentials()).rejects.toThrow('PMN認証情報が不正です');
    });

    it('AWS SDK呼び出しがエラーの場合は例外を再スローする', async () => {
      // Arrange
      const awsError = new Error('AWS connection failed');
      (mockSecretsManagerClient.send as jest.Mock).mockRejectedValue(awsError);

      // Act & Assert
      await expect(service.getPMNCredentials()).rejects.toThrow('AWS connection failed');
    });
  });
});
