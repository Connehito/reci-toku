import { CoinTransactionMapper } from './coin-transaction.mapper';
import { CoinTransaction, TransactionType } from '../../../domain/entities/coin-transaction.entity';
import { CoinTransactionSchema } from '../schemas/coin-transaction.schema';

describe('CoinTransactionMapper', () => {
  describe('toSchema', () => {
    it('Domain Entity → TypeORM Schema に正しく変換される（REWARD）', () => {
      // Arrange
      const entity = CoinTransaction.reconstruct(
        '1',
        100,
        500,
        1500,
        TransactionType.REWARD,
        '200',
        'CASHBACK123',
        'レシートリワード獲得',
        new Date('2025-01-01T00:00:00Z'),
      );

      // Act
      const schema = CoinTransactionMapper.toSchema(entity);

      // Assert
      expect(schema).toBeInstanceOf(CoinTransactionSchema);
      expect(schema.id).toBe('1');
      expect(schema.userId).toBe(100);
      expect(schema.amount).toBe(500);
      expect(schema.balanceAfter).toBe(1500);
      expect(schema.transactionType).toBe(TransactionType.REWARD);
      expect(schema.rewardId).toBe('200');
      expect(schema.mediaCashbackId).toBe('CASHBACK123');
      expect(schema.description).toBe('レシートリワード獲得');
      expect(schema.createdAt).toEqual(new Date('2025-01-01T00:00:00Z'));
    });

    it('Domain Entity → TypeORM Schema に正しく変換される（EXCHANGE）', () => {
      // Arrange
      const entity = CoinTransaction.reconstruct(
        '2',
        100,
        -1000,
        500,
        TransactionType.EXCHANGE,
        null,
        null,
        'ギフト券への交換',
        new Date('2025-01-02T00:00:00Z'),
      );

      // Act
      const schema = CoinTransactionMapper.toSchema(entity);

      // Assert
      expect(schema.id).toBe('2');
      expect(schema.amount).toBe(-1000);
      expect(schema.transactionType).toBe(TransactionType.EXCHANGE);
      expect(schema.rewardId).toBeNull();
      expect(schema.mediaCashbackId).toBeNull();
    });
  });

  describe('toDomain', () => {
    it('TypeORM Schema → Domain Entity に正しく変換される', () => {
      // Arrange
      const schema = new CoinTransactionSchema();
      schema.id = '10';
      schema.userId = 200;
      schema.amount = 1000;
      schema.balanceAfter = 2000;
      schema.transactionType = TransactionType.REWARD;
      schema.rewardId = '300';
      schema.mediaCashbackId = 'CASHBACK456';
      schema.description = 'テスト取引';
      schema.createdAt = new Date('2025-02-01T00:00:00Z');

      // Act
      const entity = CoinTransactionMapper.toDomain(schema);

      // Assert
      expect(entity).toBeInstanceOf(CoinTransaction);
      expect(entity.getId()).toBe('10');
      expect(entity.getUserId()).toBe(200);
      expect(entity.getAmount()).toBe(1000);
      expect(entity.getBalanceAfter()).toBe(2000);
      expect(entity.getTransactionType()).toBe(TransactionType.REWARD);
      expect(entity.getRewardId()).toBe('300');
      expect(entity.getMediaCashbackId()).toBe('CASHBACK456');
      expect(entity.getDescription()).toBe('テスト取引');
      expect(entity.getCreatedAt()).toEqual(new Date('2025-02-01T00:00:00Z'));
    });
  });

  describe('toDomainList', () => {
    it('TypeORM Schema配列 → Domain Entity配列 に正しく変換される', () => {
      // Arrange
      const schema1 = new CoinTransactionSchema();
      schema1.id = '1';
      schema1.userId = 100;
      schema1.amount = 100;
      schema1.balanceAfter = 100;
      schema1.transactionType = TransactionType.REWARD;
      schema1.rewardId = '1';
      schema1.mediaCashbackId = 'CB1';
      schema1.description = '取引1';
      schema1.createdAt = new Date('2025-01-01');

      const schema2 = new CoinTransactionSchema();
      schema2.id = '2';
      schema2.userId = 100;
      schema2.amount = -50;
      schema2.balanceAfter = 50;
      schema2.transactionType = TransactionType.EXCHANGE;
      schema2.rewardId = null;
      schema2.mediaCashbackId = null;
      schema2.description = '取引2';
      schema2.createdAt = new Date('2025-01-02');

      const schemas = [schema1, schema2];

      // Act
      const entities = CoinTransactionMapper.toDomainList(schemas);

      // Assert
      expect(entities).toHaveLength(2);
      expect(entities[0].getId()).toBe('1');
      expect(entities[0].getTransactionType()).toBe(TransactionType.REWARD);
      expect(entities[1].getId()).toBe('2');
      expect(entities[1].getTransactionType()).toBe(TransactionType.EXCHANGE);
    });

    it('空配列の場合は空配列を返す', () => {
      // Act
      const entities = CoinTransactionMapper.toDomainList([]);

      // Assert
      expect(entities).toEqual([]);
    });
  });
});
