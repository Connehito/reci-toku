import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinTransactionRepository } from './coin-transaction.repository';
import { CoinTransactionSchema } from '../database/schemas/coin-transaction.schema';
import { CoinTransaction, TransactionType } from '../../domain/entities/coin-transaction.entity';

describe('CoinTransactionRepository', () => {
  let repository: CoinTransactionRepository;
  let mockRepository: jest.Mocked<Repository<CoinTransactionSchema>>;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<CoinTransactionSchema>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinTransactionRepository,
        {
          provide: getRepositoryToken(CoinTransactionSchema),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<CoinTransactionRepository>(CoinTransactionRepository);
  });

  describe('findById', () => {
    it('IDで取引履歴を検索できる', async () => {
      // Arrange
      const schema = new CoinTransactionSchema();
      schema.id = '1';
      schema.userId = 100;
      schema.amount = 500;
      schema.balanceAfter = 1000;
      schema.transactionType = TransactionType.REWARD;
      schema.rewardId = 'reward-123';
      schema.mediaCashbackId = 'cashback-456';
      schema.description = 'キャンペーン報酬';
      schema.createdAt = new Date('2025-01-01');

      mockRepository.findOne.mockResolvedValue(schema);

      // Act
      const result = await repository.findById('1');

      // Assert
      expect(result).toBeInstanceOf(CoinTransaction);
      expect(result?.getId()).toBe('1');
      expect(result?.getUserId()).toBe(100);
      expect(result?.getAmount()).toBe(500);
      expect(result?.getBalanceAfter()).toBe(1000);
    });

    it('存在しないIDの場合はnullを返す', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById('999');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('ユーザーIDで取引履歴リストを検索できる', async () => {
      // Arrange
      const schema1 = new CoinTransactionSchema();
      schema1.id = '1';
      schema1.userId = 100;
      schema1.amount = 500;
      schema1.balanceAfter = 1000;
      schema1.transactionType = TransactionType.REWARD;
      schema1.rewardId = 'reward-123';
      schema1.mediaCashbackId = 'cashback-456';
      schema1.description = 'キャンペーン報酬';
      schema1.createdAt = new Date('2025-01-01');

      const schema2 = new CoinTransactionSchema();
      schema2.id = '2';
      schema2.userId = 100;
      schema2.amount = -200;
      schema2.balanceAfter = 800;
      schema2.transactionType = TransactionType.EXCHANGE;
      schema2.rewardId = null;
      schema2.mediaCashbackId = null;
      schema2.description = 'ギフト交換';
      schema2.createdAt = new Date('2025-01-02');

      mockRepository.find.mockResolvedValue([schema2, schema1]); // DESC順

      // Act
      const result = await repository.findByUserId(100);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].getId()).toBe('2');
      expect(result[1].getId()).toBe('1');
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 100 },
        order: { createdAt: 'DESC' },
        take: undefined,
      });
    });

    it('limit指定で取引履歴を制限できる', async () => {
      // Arrange
      const schema = new CoinTransactionSchema();
      schema.id = '1';
      schema.userId = 100;
      schema.amount = 500;
      schema.balanceAfter = 1000;
      schema.transactionType = TransactionType.REWARD;
      schema.rewardId = 'reward-123';
      schema.mediaCashbackId = 'cashback-456';
      schema.description = 'キャンペーン報酬';
      schema.createdAt = new Date('2025-01-01');

      mockRepository.find.mockResolvedValue([schema]);

      // Act
      await repository.findByUserId(100, 10);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 100 },
        order: { createdAt: 'DESC' },
        take: 10,
      });
    });
  });

  describe('findByUserIdAndType', () => {
    it('ユーザーIDと取引種別で取引履歴を検索できる', async () => {
      // Arrange
      const schema = new CoinTransactionSchema();
      schema.id = '1';
      schema.userId = 100;
      schema.amount = 500;
      schema.balanceAfter = 1000;
      schema.transactionType = TransactionType.REWARD;
      schema.rewardId = 'reward-123';
      schema.mediaCashbackId = 'cashback-456';
      schema.description = 'キャンペーン報酬';
      schema.createdAt = new Date('2025-01-01');

      mockRepository.find.mockResolvedValue([schema]);

      // Act
      const result = await repository.findByUserIdAndType(100, TransactionType.REWARD);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].getTransactionType()).toBe(TransactionType.REWARD);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 100, transactionType: TransactionType.REWARD },
        order: { createdAt: 'DESC' },
        take: undefined,
      });
    });

    it('limit指定で取引履歴を制限できる', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([]);

      // Act
      await repository.findByUserIdAndType(100, TransactionType.EXCHANGE, 5);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 100, transactionType: TransactionType.EXCHANGE },
        order: { createdAt: 'DESC' },
        take: 5,
      });
    });
  });

  describe('findByRewardId', () => {
    it('報酬IDで取引履歴を検索できる（べき等性チェック用）', async () => {
      // Arrange
      const schema = new CoinTransactionSchema();
      schema.id = '1';
      schema.userId = 100;
      schema.amount = 500;
      schema.balanceAfter = 1000;
      schema.transactionType = TransactionType.REWARD;
      schema.rewardId = 'reward-123';
      schema.mediaCashbackId = 'cashback-456';
      schema.description = 'キャンペーン報酬';
      schema.createdAt = new Date('2025-01-01');

      mockRepository.findOne.mockResolvedValue(schema);

      // Act
      const result = await repository.findByRewardId('reward-123');

      // Assert
      expect(result).toBeInstanceOf(CoinTransaction);
      expect(result?.getRewardId()).toBe('reward-123');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { rewardId: 'reward-123' },
      });
    });

    it('存在しない報酬IDの場合はnullを返す', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByRewardId('nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('報酬取引を保存できる（IDはAUTO_INCREMENTに任せる）', async () => {
      // Arrange
      const transaction = CoinTransaction.createRewardTransaction(
        100,
        500,
        1000,
        'reward-123',
        'cashback-456',
        'キャンペーン報酬',
      );

      mockRepository.save.mockResolvedValue({} as CoinTransactionSchema);

      // Act
      await repository.save(transaction);

      // Assert
      expect(mockRepository.save).toHaveBeenCalled();
      const savedSchema = mockRepository.save.mock.calls[0][0];
      expect(savedSchema.id).toBeUndefined(); // IDはnull → AUTO_INCREMENTに任せる
      expect(savedSchema.userId).toBe(100);
      expect(savedSchema.amount).toBe(500);
      expect(savedSchema.transactionType).toBe(TransactionType.REWARD);
    });

    it('交換取引を保存できる（IDはAUTO_INCREMENTに任せる）', async () => {
      // Arrange
      const transaction = CoinTransaction.createExchangeTransaction(200, -300, 700, 'ギフト交換');

      mockRepository.save.mockResolvedValue({} as CoinTransactionSchema);

      // Act
      await repository.save(transaction);

      // Assert
      expect(mockRepository.save).toHaveBeenCalled();
      const savedSchema = mockRepository.save.mock.calls[0][0];
      expect(savedSchema.id).toBeUndefined(); // IDはnull → AUTO_INCREMENTに任せる
      expect(savedSchema.amount).toBe(-300);
      expect(savedSchema.transactionType).toBe(TransactionType.EXCHANGE);
    });

    it('失効取引を保存できる（IDはAUTO_INCREMENTに任せる）', async () => {
      // Arrange
      const transaction = CoinTransaction.createExpireTransaction(300, -100, 0, '有効期限切れ');

      mockRepository.save.mockResolvedValue({} as CoinTransactionSchema);

      // Act
      await repository.save(transaction);

      // Assert
      expect(mockRepository.save).toHaveBeenCalled();
      const savedSchema = mockRepository.save.mock.calls[0][0];
      expect(savedSchema.id).toBeUndefined(); // IDはnull → AUTO_INCREMENTに任せる
      expect(savedSchema.amount).toBe(-100);
      expect(savedSchema.transactionType).toBe(TransactionType.EXPIRE);
    });
  });
});
