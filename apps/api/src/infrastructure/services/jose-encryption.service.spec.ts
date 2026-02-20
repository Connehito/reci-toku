import { Test, TestingModule } from '@nestjs/testing';
import { JoseEncryptionService } from './jose-encryption.service';
import * as jose from 'jose';

// joseライブラリをモック
jest.mock('jose', () => ({
  CompactEncrypt: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    encrypt: jest.fn().mockResolvedValue('mocked.jwe.token.here.value'),
  })),
  compactDecrypt: jest.fn(),
}));

describe('JoseEncryptionService', () => {
  let service: JoseEncryptionService;

  // テスト用の暗号化鍵（256bit = 32bytes、Base64エンコード）
  const testEncryptionKey = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');
  const testClientId = 'test-client-id';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [JoseEncryptionService],
    }).compile();

    service = module.get<JoseEncryptionService>(JoseEncryptionService);
  });

  describe('encryptJWE', () => {
    it('正常にJWEトークンを生成できる', async () => {
      // Arrange
      const payload = { media_user_code: '12345' };

      // Act
      const jweToken = await service.encryptJWE(payload, testClientId, testEncryptionKey);

      // Assert
      expect(jweToken).toBeDefined();
      expect(typeof jweToken).toBe('string');
      expect(jweToken).toBe('mocked.jwe.token.here.value');
      expect(jose.CompactEncrypt).toHaveBeenCalled();
    });

    it('Protected Headerが正しく設定される', async () => {
      // Arrange
      const payload = { media_user_code: '12345' };
      const mockSetProtectedHeader = jest.fn().mockReturnThis();
      const mockEncrypt = jest.fn().mockResolvedValue('jwe-token');

      (jose.CompactEncrypt as jest.Mock).mockImplementation(() => ({
        setProtectedHeader: mockSetProtectedHeader,
        encrypt: mockEncrypt,
      }));

      // Act
      await service.encryptJWE(payload, testClientId, testEncryptionKey);

      // Assert
      expect(mockSetProtectedHeader).toHaveBeenCalledWith({
        alg: 'dir',
        enc: 'A256GCM',
        kid: testClientId,
      });
    });

    it('不正なBase64エンコードの鍵でエラーをスローする', async () => {
      // Arrange
      const payload = { media_user_code: '12345' };
      const invalidKey = 'invalid-base64!!!';

      (jose.CompactEncrypt as jest.Mock).mockImplementation(() => ({
        setProtectedHeader: jest.fn().mockReturnThis(),
        encrypt: jest.fn().mockRejectedValue(new Error('Invalid key')),
      }));

      // Act & Assert
      await expect(service.encryptJWE(payload, testClientId, invalidKey)).rejects.toThrow();
    });
  });

  describe('decryptJWE', () => {
    it('正常にJWEトークンを復号化できる', async () => {
      // Arrange
      const jweToken = 'test.jwe.token';
      const expectedPayload = { media_user_code: '12345' };
      const mockPlaintext = new TextEncoder().encode(JSON.stringify(expectedPayload));

      (jose.compactDecrypt as jest.Mock).mockResolvedValue({
        plaintext: mockPlaintext,
      });

      // Act
      const decryptedPayload = await service.decryptJWE(jweToken, testEncryptionKey);

      // Assert
      expect(decryptedPayload).toEqual(expectedPayload);
      expect(jose.compactDecrypt).toHaveBeenCalled();
    });

    it('不正なJWEトークンでエラーをスローする', async () => {
      // Arrange
      const invalidJwe = 'invalid.jwe.token.format.here';

      (jose.compactDecrypt as jest.Mock).mockRejectedValue(new Error('Invalid JWE'));

      // Act & Assert
      await expect(service.decryptJWE(invalidJwe, testEncryptionKey)).rejects.toThrow();
    });

    it('異なる鍵で復号化しようとするとエラーをスローする', async () => {
      // Arrange
      const jweToken = 'test.jwe.token';
      const differentKey = Buffer.from('differentkey0123456789abcdef').toString('base64');

      (jose.compactDecrypt as jest.Mock).mockRejectedValue(new Error('Decryption failed'));

      // Act & Assert
      await expect(service.decryptJWE(jweToken, differentKey)).rejects.toThrow('Decryption failed');
    });
  });
});
