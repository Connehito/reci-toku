import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseTestController } from './database-test.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSchema } from '../infrastructure/database/schemas/user.schema';
import { CampaignSchema } from '../infrastructure/database/schemas/campaign.schema';
import { UserCoinSchema } from '../infrastructure/database/schemas/user-coin.schema';
import { RewardSchema } from '../infrastructure/database/schemas/reward.schema';
import { CoinTransactionSchema } from '../infrastructure/database/schemas/coin-transaction.schema';
import { CoinSettingSchema } from '../infrastructure/database/schemas/coin-setting.schema';

describe('DatabaseTestController', () => {
  let controller: DatabaseTestController;

  const mockUserSchemaRepository = {
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockCampaignRepository = {
    count: jest.fn(),
    query: jest.fn(),
  };

  const mockUserSchemaCoinRepository = {
    count: jest.fn(),
    query: jest.fn(),
  };

  const mockRewardRepository = {
    count: jest.fn(),
    query: jest.fn(),
  };

  const mockTransactionRepository = {
    count: jest.fn(),
    query: jest.fn(),
  };

  const mockSettingRepository = {
    count: jest.fn(),
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatabaseTestController],
      providers: [
        {
          provide: getRepositoryToken(UserSchema),
          useValue: mockUserSchemaRepository,
        },
        {
          provide: getRepositoryToken(CampaignSchema),
          useValue: mockCampaignRepository,
        },
        {
          provide: getRepositoryToken(UserCoinSchema),
          useValue: mockUserSchemaCoinRepository,
        },
        {
          provide: getRepositoryToken(RewardSchema),
          useValue: mockRewardRepository,
        },
        {
          provide: getRepositoryToken(CoinTransactionSchema),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(CoinSettingSchema),
          useValue: mockSettingRepository,
        },
      ],
    }).compile();

    controller = module.get<DatabaseTestController>(DatabaseTestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserSchemaCount', () => {
    it('should return user count', async () => {
      mockUserSchemaRepository.count.mockResolvedValue(100);

      const result = await controller.getUserSchemaCount();

      expect(result).toEqual({
        status: 'ok',
        message: 'Database connection successful',
        userCount: 100,
      });
      expect(mockUserSchemaRepository.count).toHaveBeenCalled();
    });
  });

  describe('getLatestUserSchema', () => {
    it('should return latest user', async () => {
      const mockUserSchema: UserSchema = {
        id: 1,
        uuid: 'test-uuid',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserSchemaRepository.find.mockResolvedValue([mockUserSchema]);

      const result = await controller.getLatestUserSchema();

      expect(result.status).toBe('ok');
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe(1);
      expect(mockUserSchemaRepository.find).toHaveBeenCalledWith({
        order: { id: 'DESC' },
        take: 1,
      });
    });

    it('should handle no users', async () => {
      mockUserSchemaRepository.find.mockResolvedValue([]);

      const result = await controller.getLatestUserSchema();

      expect(result.status).toBe('ok');
      expect(result.user).toBeNull();
    });
  });

  describe('getReceiptRewardTableCounts', () => {
    it('should return counts for all receipt reward tables', async () => {
      mockCampaignRepository.count.mockResolvedValue(5);
      mockUserSchemaCoinRepository.count.mockResolvedValue(10);
      mockRewardRepository.count.mockResolvedValue(20);
      mockTransactionRepository.count.mockResolvedValue(30);
      mockSettingRepository.count.mockResolvedValue(2);

      const result = await controller.getReceiptRewardTableCounts();

      expect(result).toEqual({
        status: 'ok',
        message: 'Receipt reward tables connection successful',
        tables: {
          campaigns: 5,
          userCoins: 10,
          rewards: 20,
          transactions: 30,
          settings: 2,
        },
      });
    });
  });

  describe('checkReceiptRewardTables', () => {
    it('should return success if all tables exist', async () => {
      mockCampaignRepository.query.mockResolvedValue([]);
      mockUserSchemaCoinRepository.query.mockResolvedValue([]);
      mockRewardRepository.query.mockResolvedValue([]);
      mockTransactionRepository.query.mockResolvedValue([]);
      mockSettingRepository.query.mockResolvedValue([]);

      const result = await controller.checkReceiptRewardTables();

      expect(result.status).toBe('ok');
      expect(result.message).toBe('All receipt reward tables exist and are accessible');
    });

    it('should return error if tables do not exist', async () => {
      mockCampaignRepository.query.mockRejectedValue(new Error('Table does not exist'));

      const result = await controller.checkReceiptRewardTables();

      expect(result.status).toBe('error');
      expect(result.message).toBe('Some receipt reward tables do not exist');
    });
  });
});
