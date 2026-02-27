import { Test, TestingModule } from '@nestjs/testing';
import { GetCoinBalanceUseCase } from './get-coin-balance.usecase';
import { TOKENS } from '../../domain/tokens';
import { RepositoryMockFactory } from '../../__test__/factories/repository.mock.factory';
import { EntityFactory } from '../../__test__/factories/entity.factory';
import { CoinSetting } from '../../domain/entities/coin-setting.entity';
import { InvalidUserIdError } from '../../domain/exceptions/invalid-user-id.error';

// uuidをモック
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

describe('GetCoinBalanceUseCase', () => {
  let useCase: GetCoinBalanceUseCase;
  let mockUserCoinRepository: ReturnType<typeof RepositoryMockFactory.createUserCoinRepositoryMock>;
  let mockCoinSettingRepository: ReturnType<
    typeof RepositoryMockFactory.createCoinSettingRepositoryMock
  >;

  beforeEach(async () => {
    mockUserCoinRepository = RepositoryMockFactory.createUserCoinRepositoryMock();
    mockCoinSettingRepository = RepositoryMockFactory.createCoinSettingRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCoinBalanceUseCase,
        {
          provide: TOKENS.IUserCoinRepository,
          useValue: mockUserCoinRepository,
        },
        {
          provide: TOKENS.ICoinSettingRepository,
          useValue: mockCoinSettingRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetCoinBalanceUseCase>(GetCoinBalanceUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('正常にコイン残高と有効期限を取得できる', async () => {
      // Arrange
      const userId = 12345;
      const lastEarnedAt = new Date('2026-02-20T10:00:00Z');
      const userCoin = EntityFactory.createUserCoin({
        userId,
        balance: 100,
        lastEarnedAt,
      });

      const coinSetting = {
        getValueAsNumber: jest.fn().mockReturnValue(180),
      } as unknown as CoinSetting;

      mockUserCoinRepository.findByUserId.mockResolvedValue(userCoin);
      mockCoinSettingRepository.findByKey.mockResolvedValue(coinSetting);

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.balance).toBe(100);
      expect(result.lastEarnedAt).toBe('2026-02-20T10:00:00.000Z');
      expect(result.expiresAt).toBe('2026-08-19T10:00:00.000Z'); // 180日後
      expect(mockUserCoinRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockCoinSettingRepository.findByKey).toHaveBeenCalledWith('coin_expire_days');
    });

    it('初回獲得前のユーザーは残高0、有効期限nullを返す', async () => {
      // Arrange
      const userId = 99999;
      mockUserCoinRepository.findByUserId.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result).toEqual({
        balance: 0,
        lastEarnedAt: null,
        expiresAt: null,
      });
      expect(mockUserCoinRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockCoinSettingRepository.findByKey).not.toHaveBeenCalled();
    });

    it('残高0の場合は有効期限nullを返す', async () => {
      // Arrange
      const userId = 12345;
      const userCoin = EntityFactory.createUserCoin({
        userId,
        balance: 0,
        lastEarnedAt: new Date('2026-02-20T10:00:00Z'),
      });

      const coinSetting = {
        getValueAsNumber: jest.fn().mockReturnValue(180),
      } as unknown as CoinSetting;

      mockUserCoinRepository.findByUserId.mockResolvedValue(userCoin);
      mockCoinSettingRepository.findByKey.mockResolvedValue(coinSetting);

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.balance).toBe(0);
      expect(result.lastEarnedAt).toBe('2026-02-20T10:00:00.000Z');
      expect(result.expiresAt).toBeNull(); // 残高0なので有効期限なし
    });

    it('CoinSetting未設定の場合はデフォルト180日を使用', async () => {
      // Arrange
      const userId = 12345;
      const lastEarnedAt = new Date('2026-02-20T10:00:00Z');
      const userCoin = EntityFactory.createUserCoin({
        userId,
        balance: 100,
        lastEarnedAt,
      });

      mockUserCoinRepository.findByUserId.mockResolvedValue(userCoin);
      mockCoinSettingRepository.findByKey.mockResolvedValue(null); // 未設定

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(result.balance).toBe(100);
      expect(result.expiresAt).toBe('2026-08-19T10:00:00.000Z'); // デフォルト180日後
    });

    it('不正なユーザーID（0）の場合はエラーをスローする', async () => {
      // Arrange
      const userId = 0;

      // Act & Assert
      await expect(useCase.execute(userId)).rejects.toThrow(InvalidUserIdError);
      expect(mockUserCoinRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('不正なユーザーID（負の値）の場合はエラーをスローする', async () => {
      // Arrange
      const userId = -1;

      // Act & Assert
      await expect(useCase.execute(userId)).rejects.toThrow(InvalidUserIdError);
      expect(mockUserCoinRepository.findByUserId).not.toHaveBeenCalled();
    });
  });
});
