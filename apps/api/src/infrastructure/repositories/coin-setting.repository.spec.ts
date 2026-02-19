import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { CoinSettingRepository } from './coin-setting.repository';
import { CoinSettingSchema } from '../database/schemas/coin-setting.schema';
import { CoinSetting } from '../../domain/entities/coin-setting.entity';

describe('CoinSettingRepository', () => {
  let repository: CoinSettingRepository;
  let mockRepository: jest.Mocked<Repository<CoinSettingSchema>>;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<CoinSettingSchema>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinSettingRepository,
        {
          provide: getRepositoryToken(CoinSettingSchema),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<CoinSettingRepository>(CoinSettingRepository);
  });

  describe('findByKey', () => {
    it('キーで設定を検索できる', async () => {
      // Arrange
      const schema = new CoinSettingSchema();
      schema.key = 'coin_expire_days';
      schema.value = '180';
      schema.description = 'コイン有効期限（日数）';
      schema.createdAt = new Date('2024-01-01');
      schema.updatedAt = new Date('2025-01-01');

      mockRepository.findOne.mockResolvedValue(schema);

      // Act
      const result = await repository.findByKey('coin_expire_days');

      // Assert
      expect(result).toBeInstanceOf(CoinSetting);
      expect(result?.getKey()).toBe('coin_expire_days');
      expect(result?.getValue()).toBe('180');
      expect(result?.getDescription()).toBe('コイン有効期限（日数）');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'coin_expire_days' },
      });
    });

    it('存在しないキーの場合はnullを返す', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByKey('nonexistent_key');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('全ての設定を取得できる', async () => {
      // Arrange
      const schema1 = new CoinSettingSchema();
      schema1.key = 'coin_expire_days';
      schema1.value = '180';
      schema1.description = 'コイン有効期限（日数）';
      schema1.createdAt = new Date('2024-01-01');
      schema1.updatedAt = new Date('2025-01-01');

      const schema2 = new CoinSettingSchema();
      schema2.key = 'max_coin_balance';
      schema2.value = '10000';
      schema2.description = '最大保有コイン数';
      schema2.createdAt = new Date('2024-01-01');
      schema2.updatedAt = new Date('2025-01-01');

      mockRepository.find.mockResolvedValue([schema1, schema2]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].getKey()).toBe('coin_expire_days');
      expect(result[1].getKey()).toBe('max_coin_balance');
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { key: 'ASC' },
      });
    });

    it('設定が存在しない場合は空配列を返す', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('新規設定を保存できる', async () => {
      // Arrange
      const setting = CoinSetting.create('coin_expire_days', '180', 'コイン有効期限（日数）');

      mockRepository.save.mockResolvedValue({} as CoinSettingSchema);

      // Act
      await repository.save(setting);

      // Assert
      expect(mockRepository.save).toHaveBeenCalled();
      const savedSchema = mockRepository.save.mock.calls[0][0];
      expect(savedSchema.key).toBe('coin_expire_days');
      expect(savedSchema.value).toBe('180');
      expect(savedSchema.description).toBe('コイン有効期限（日数）');
    });

    it('既存設定を更新できる', async () => {
      // Arrange
      const setting = CoinSetting.reconstruct(
        'coin_expire_days',
        '180',
        'コイン有効期限（日数）',
        new Date('2024-01-01'),
        new Date('2025-01-01'),
      );
      setting.updateValue('365');

      mockRepository.save.mockResolvedValue({} as CoinSettingSchema);

      // Act
      await repository.save(setting);

      // Assert
      expect(mockRepository.save).toHaveBeenCalled();
      const savedSchema = mockRepository.save.mock.calls[0][0];
      expect(savedSchema.value).toBe('365');
    });
  });

  describe('delete', () => {
    it('キーで設定を削除できる', async () => {
      // Arrange
      mockRepository.delete.mockResolvedValue({} as DeleteResult);

      // Act
      await repository.delete('coin_expire_days');

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith({ key: 'coin_expire_days' });
    });
  });
});
