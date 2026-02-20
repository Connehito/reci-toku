import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { GenerateJweTokenUseCase } from '../../../usecase/auth/generate-jwe-token.usecase';

describe('AuthController', () => {
  let controller: AuthController;
  let mockGenerateJweTokenUseCase: jest.Mocked<GenerateJweTokenUseCase>;

  beforeEach(async () => {
    mockGenerateJweTokenUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GenerateJweTokenUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: GenerateJweTokenUseCase,
          useValue: mockGenerateJweTokenUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('正常にJWEトークンを生成して返す', async () => {
      // Arrange
      const userId = 12345;
      const mockJweToken = 'mocked.jwe.token.here';
      mockGenerateJweTokenUseCase.execute.mockResolvedValue(mockJweToken);

      // Act
      const result = await controller.generateToken(userId);

      // Assert
      expect(result).toEqual({ token: mockJweToken });
      expect(mockGenerateJweTokenUseCase.execute).toHaveBeenCalledWith(userId);
      expect(mockGenerateJweTokenUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('異なるユーザーIDで正常にトークンを生成できる', async () => {
      // Arrange
      const userId = 99999;
      const mockJweToken = 'another.jwe.token';
      mockGenerateJweTokenUseCase.execute.mockResolvedValue(mockJweToken);

      // Act
      const result = await controller.generateToken(userId);

      // Assert
      expect(result).toEqual({ token: mockJweToken });
      expect(mockGenerateJweTokenUseCase.execute).toHaveBeenCalledWith(99999);
    });

    it('不正なユーザーIDの場合はBadRequestExceptionをスローする', async () => {
      // Arrange
      const userId = 0;
      mockGenerateJweTokenUseCase.execute.mockRejectedValue(new Error('不正なユーザーIDです'));

      // Act & Assert
      await expect(controller.generateToken(userId)).rejects.toThrow(BadRequestException);
      expect(mockGenerateJweTokenUseCase.execute).toHaveBeenCalledWith(userId);
    });

    it('UseCaseで予期しないエラーが発生した場合は元のエラーを再スローする', async () => {
      // Arrange
      const userId = 12345;
      const mockError = new Error('Unexpected error');
      mockGenerateJweTokenUseCase.execute.mockRejectedValue(mockError);

      // Act & Assert
      await expect(controller.generateToken(userId)).rejects.toThrow('Unexpected error');
      expect(mockGenerateJweTokenUseCase.execute).toHaveBeenCalledWith(userId);
    });

    it('Secrets Manager接続エラーの場合はエラーを再スローする', async () => {
      // Arrange
      const userId = 12345;
      const mockError = new Error('Secrets Manager connection failed');
      mockGenerateJweTokenUseCase.execute.mockRejectedValue(mockError);

      // Act & Assert
      await expect(controller.generateToken(userId)).rejects.toThrow(
        'Secrets Manager connection failed',
      );
    });

    it('JWE暗号化エラーの場合はエラーを再スローする', async () => {
      // Arrange
      const userId = 12345;
      const mockError = new Error('JWE encryption failed');
      mockGenerateJweTokenUseCase.execute.mockRejectedValue(mockError);

      // Act & Assert
      await expect(controller.generateToken(userId)).rejects.toThrow('JWE encryption failed');
    });
  });
});
