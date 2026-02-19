import { UserCoinMapper } from './user-coin.mapper';
import { UserCoin } from '../../../domain/entities/user-coin.entity';
import { UserCoinSchema } from '../schemas/user-coin.schema';

describe('UserCoinMapper', () => {
  describe('toSchema', () => {
    it('Domain Entity → TypeORM Schema に正しく変換される', () => {
      // Arrange
      const entity = UserCoin.reconstruct(
        123,
        1000,
        new Date('2025-01-01T00:00:00Z'),
        new Date('2024-01-01T00:00:00Z'),
        new Date('2025-01-15T00:00:00Z'),
      );

      // Act
      const schema = UserCoinMapper.toSchema(entity);

      // Assert
      expect(schema).toBeInstanceOf(UserCoinSchema);
      expect(schema.userId).toBe(123);
      expect(schema.currentBalance).toBe(1000);
      expect(schema.lastEarnedAt).toEqual(new Date('2025-01-01T00:00:00Z'));
      expect(schema.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(schema.updatedAt).toEqual(new Date('2025-01-15T00:00:00Z'));
    });

    it('lastEarnedAtがnullの場合も正しく変換される', () => {
      // Arrange
      const entity = UserCoin.reconstruct(
        456,
        0,
        null,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T00:00:00Z'),
      );

      // Act
      const schema = UserCoinMapper.toSchema(entity);

      // Assert
      expect(schema.userId).toBe(456);
      expect(schema.currentBalance).toBe(0);
      expect(schema.lastEarnedAt).toBeNull();
    });
  });

  describe('toDomain', () => {
    it('TypeORM Schema → Domain Entity に正しく変換される', () => {
      // Arrange
      const schema = new UserCoinSchema();
      schema.userId = 789;
      schema.currentBalance = 5000;
      schema.lastEarnedAt = new Date('2025-02-01T00:00:00Z');
      schema.createdAt = new Date('2024-01-01T00:00:00Z');
      schema.updatedAt = new Date('2025-02-01T00:00:00Z');

      // Act
      const entity = UserCoinMapper.toDomain(schema);

      // Assert
      expect(entity).toBeInstanceOf(UserCoin);
      expect(entity.getUserId()).toBe(789);
      expect(entity.getBalance()).toBe(5000);
      expect(entity.getLastEarnedAt()).toEqual(new Date('2025-02-01T00:00:00Z'));
      expect(entity.getCreatedAt()).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(entity.getUpdatedAt()).toEqual(new Date('2025-02-01T00:00:00Z'));
    });
  });

  describe('toDomainList', () => {
    it('TypeORM Schema配列 → Domain Entity配列 に正しく変換される', () => {
      // Arrange
      const schema1 = new UserCoinSchema();
      schema1.userId = 1;
      schema1.currentBalance = 100;
      schema1.lastEarnedAt = null;
      schema1.createdAt = new Date('2024-01-01');
      schema1.updatedAt = new Date('2024-01-01');

      const schema2 = new UserCoinSchema();
      schema2.userId = 2;
      schema2.currentBalance = 200;
      schema2.lastEarnedAt = new Date('2025-01-01');
      schema2.createdAt = new Date('2024-01-01');
      schema2.updatedAt = new Date('2025-01-01');

      const schemas = [schema1, schema2];

      // Act
      const entities = UserCoinMapper.toDomainList(schemas);

      // Assert
      expect(entities).toHaveLength(2);
      expect(entities[0].getUserId()).toBe(1);
      expect(entities[0].getBalance()).toBe(100);
      expect(entities[1].getUserId()).toBe(2);
      expect(entities[1].getBalance()).toBe(200);
    });

    it('空配列の場合は空配列を返す', () => {
      // Act
      const entities = UserCoinMapper.toDomainList([]);

      // Assert
      expect(entities).toEqual([]);
    });
  });
});
