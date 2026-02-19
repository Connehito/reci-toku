import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { UserCoinRepository } from './user-coin.repository';
import { UserCoinSchema } from '../database/schemas/user-coin.schema';
import { UserCoin } from '../../domain/entities/user-coin.entity';

describe('UserCoinRepository', () => {
  let repository: UserCoinRepository;
  let mockRepository: jest.Mocked<Repository<UserCoinSchema>>;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<UserCoinSchema>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCoinRepository,
        {
          provide: getRepositoryToken(UserCoinSchema),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<UserCoinRepository>(UserCoinRepository);
  });

  describe('findByUserId', () => {
    it('ユーザーIDでコイン残高を検索できる', async () => {
      // Arrange
      const schema = new UserCoinSchema();
      schema.userId = 123;
      schema.currentBalance = 1000;
      schema.lastEarnedAt = new Date('2025-01-01');
      schema.createdAt = new Date('2024-01-01');
      schema.updatedAt = new Date('2025-01-01');

      mockRepository.findOne.mockResolvedValue(schema);

      // Act
      const result = await repository.findByUserId(123);

      // Assert
      expect(result).toBeInstanceOf(UserCoin);
      expect(result?.getUserId()).toBe(123);
      expect(result?.getBalance()).toBe(1000);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 123 },
      });
    });

    it('存在しないユーザーIDの場合はnullを返す', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByUserId(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('ユーザーコインを保存できる', async () => {
      // Arrange
      const userCoin = UserCoin.create(123);
      mockRepository.save.mockResolvedValue({} as UserCoinSchema);

      // Act
      await repository.save(userCoin);

      // Assert
      expect(mockRepository.save).toHaveBeenCalled();
      const savedSchema = mockRepository.save.mock.calls[0][0];
      expect(savedSchema.userId).toBe(123);
      expect(savedSchema.currentBalance).toBe(0);
    });
  });

  describe('delete', () => {
    it('ユーザーIDでコインを削除できる', async () => {
      // Arrange
      mockRepository.delete.mockResolvedValue({} as DeleteResult);

      // Act
      await repository.delete(123);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith({ userId: 123 });
    });
  });

  describe('findExpiredCoins', () => {
    it('有効期限切れのコインを検索できる', async () => {
      // Arrange
      const schema1 = new UserCoinSchema();
      schema1.userId = 1;
      schema1.currentBalance = 100;
      schema1.lastEarnedAt = new Date('2024-01-01');
      schema1.createdAt = new Date('2024-01-01');
      schema1.updatedAt = new Date('2024-01-01');

      const schema2 = new UserCoinSchema();
      schema2.userId = 2;
      schema2.currentBalance = 200;
      schema2.lastEarnedAt = new Date('2024-01-01');
      schema2.createdAt = new Date('2024-01-01');
      schema2.updatedAt = new Date('2024-01-01');

      mockRepository.find.mockResolvedValue([schema1, schema2]);

      // Act
      const result = await repository.findExpiredCoins(180);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].getUserId()).toBe(1);
      expect(result[1].getUserId()).toBe(2);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          lastEarnedAt: expect.any(Object),
        },
      });
    });

    it('残高0のコインは除外される', async () => {
      // Arrange
      const schema1 = new UserCoinSchema();
      schema1.userId = 1;
      schema1.currentBalance = 0; // 残高0
      schema1.lastEarnedAt = new Date('2024-01-01');
      schema1.createdAt = new Date('2024-01-01');
      schema1.updatedAt = new Date('2024-01-01');

      mockRepository.find.mockResolvedValue([schema1]);

      // Act
      const result = await repository.findExpiredCoins(180);

      // Assert
      expect(result).toHaveLength(0); // 残高0は除外
    });
  });
});
