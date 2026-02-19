import { CoinSettingMapper } from './coin-setting.mapper';
import { CoinSetting } from '../../../domain/entities/coin-setting.entity';
import { CoinSettingSchema } from '../schemas/coin-setting.schema';

describe('CoinSettingMapper', () => {
  describe('toSchema', () => {
    it('Domain Entity → TypeORM Schema に正しく変換される', () => {
      // Arrange
      const entity = CoinSetting.reconstruct(
        'max_coin_balance',
        '10000',
        '保有可能な最大コイン数',
        new Date('2024-01-01T00:00:00Z'),
        new Date('2025-01-15T00:00:00Z'),
      );

      // Act
      const schema = CoinSettingMapper.toSchema(entity);

      // Assert
      expect(schema).toBeInstanceOf(CoinSettingSchema);
      expect(schema.key).toBe('max_coin_balance');
      expect(schema.value).toBe('10000');
      expect(schema.description).toBe('保有可能な最大コイン数');
      expect(schema.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(schema.updatedAt).toEqual(new Date('2025-01-15T00:00:00Z'));
    });

    it('descriptionがnullの場合も正しく変換される', () => {
      // Arrange
      const entity = CoinSetting.reconstruct(
        'coin_expire_days',
        '180',
        null,
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T00:00:00Z'),
      );

      // Act
      const schema = CoinSettingMapper.toSchema(entity);

      // Assert
      expect(schema.key).toBe('coin_expire_days');
      expect(schema.value).toBe('180');
      expect(schema.description).toBeNull();
    });
  });

  describe('toDomain', () => {
    it('TypeORM Schema → Domain Entity に正しく変換される', () => {
      // Arrange
      const schema = new CoinSettingSchema();
      schema.key = 'coin_expire_days';
      schema.value = '365';
      schema.description = 'コイン有効期限（日数）';
      schema.createdAt = new Date('2024-01-01T00:00:00Z');
      schema.updatedAt = new Date('2025-02-01T00:00:00Z');

      // Act
      const entity = CoinSettingMapper.toDomain(schema);

      // Assert
      expect(entity).toBeInstanceOf(CoinSetting);
      expect(entity.getKey()).toBe('coin_expire_days');
      expect(entity.getValue()).toBe('365');
      expect(entity.getDescription()).toBe('コイン有効期限（日数）');
      expect(entity.getCreatedAt()).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(entity.getUpdatedAt()).toEqual(new Date('2025-02-01T00:00:00Z'));
    });

    it('数値型の設定値も正しく変換される', () => {
      // Arrange
      const schema = new CoinSettingSchema();
      schema.key = 'min_exchange_amount';
      schema.value = '500';
      schema.description = '最小交換可能コイン数';
      schema.createdAt = new Date('2024-01-01');
      schema.updatedAt = new Date('2024-01-01');

      // Act
      const entity = CoinSettingMapper.toDomain(schema);

      // Assert
      expect(entity.getValue()).toBe('500');
      expect(entity.getValueAsNumber()).toBe(500);
    });
  });

  describe('toDomainList', () => {
    it('TypeORM Schema配列 → Domain Entity配列 に正しく変換される', () => {
      // Arrange
      const schema1 = new CoinSettingSchema();
      schema1.key = 'max_coin_balance';
      schema1.value = '10000';
      schema1.description = '最大コイン数';
      schema1.createdAt = new Date('2024-01-01');
      schema1.updatedAt = new Date('2024-01-01');

      const schema2 = new CoinSettingSchema();
      schema2.key = 'coin_expire_days';
      schema2.value = '180';
      schema2.description = 'コイン有効期限';
      schema2.createdAt = new Date('2024-01-01');
      schema2.updatedAt = new Date('2025-01-01');

      const schema3 = new CoinSettingSchema();
      schema3.key = 'enable_coin_system';
      schema3.value = 'true';
      schema3.description = 'コインシステムの有効化';
      schema3.createdAt = new Date('2024-01-01');
      schema3.updatedAt = new Date('2024-01-01');

      const schemas = [schema1, schema2, schema3];

      // Act
      const entities = CoinSettingMapper.toDomainList(schemas);

      // Assert
      expect(entities).toHaveLength(3);
      expect(entities[0].getKey()).toBe('max_coin_balance');
      expect(entities[0].getValueAsNumber()).toBe(10000);
      expect(entities[1].getKey()).toBe('coin_expire_days');
      expect(entities[1].getValueAsNumber()).toBe(180);
      expect(entities[2].getKey()).toBe('enable_coin_system');
      expect(entities[2].getValueAsBoolean()).toBe(true);
    });

    it('空配列の場合は空配列を返す', () => {
      // Act
      const entities = CoinSettingMapper.toDomainList([]);

      // Assert
      expect(entities).toEqual([]);
    });
  });
});
