import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardRepository } from './reward.repository';
import { RewardSchema } from '../database/schemas/reward.schema';
import { Reward } from '../../domain/entities/reward.entity';

describe('RewardRepository', () => {
  let repository: RewardRepository;
  let mockRepository: jest.Mocked<Repository<RewardSchema>>;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<RewardSchema>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardRepository,
        {
          provide: getRepositoryToken(RewardSchema),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<RewardRepository>(RewardRepository);
  });

  describe('findById', () => {
    it('IDで報酬を検索できる', async () => {
      // Arrange
      const schema = new RewardSchema();
      schema.id = '1';
      schema.userId = 100;
      schema.campaignId = '200';
      schema.mediaId = '300';
      schema.mediaUserCode = 'USER123';
      schema.mediaCashbackId = 'CASHBACK456';
      schema.mediaCashbackCode = 'CODE12345678901';
      schema.receiptCampaignId = 'CAMPAIGN001';
      schema.receiptCampaignName = 'テストキャンペーン';
      schema.receiptCampaignImage = 'image.jpg';
      schema.companyId = 'COMPANY001';
      schema.companyName = 'テスト企業';
      schema.serviceType = 'RECEIPT';
      schema.incentivePoints = 500;
      schema.participationAt = new Date('2025-01-01');
      schema.processedAt = new Date('2025-01-02');
      schema.jwePayload = 'jwe';
      schema.createdAt = new Date('2025-01-01');

      mockRepository.findOne.mockResolvedValue(schema);

      // Act
      const result = await repository.findById('1');

      // Assert
      expect(result).toBeInstanceOf(Reward);
      expect(result?.getId()).toBe('1');
      expect(result?.getUserId()).toBe(100);
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

  describe('findByMediaCashbackId', () => {
    it('メディアキャッシュバックIDで報酬を検索できる（べき等性チェック用）', async () => {
      // Arrange
      const schema = new RewardSchema();
      schema.id = '1';
      schema.userId = 100;
      schema.campaignId = '200';
      schema.mediaId = '300';
      schema.mediaUserCode = 'USER123';
      schema.mediaCashbackId = 'CASHBACK456';
      schema.mediaCashbackCode = 'CODE12345678901';
      schema.receiptCampaignId = 'CAMPAIGN001';
      schema.receiptCampaignName = 'テストキャンペーン';
      schema.receiptCampaignImage = 'image.jpg';
      schema.companyId = 'COMPANY001';
      schema.companyName = 'テスト企業';
      schema.serviceType = 'RECEIPT';
      schema.incentivePoints = 500;
      schema.participationAt = new Date('2025-01-01');
      schema.processedAt = new Date('2025-01-02');
      schema.jwePayload = 'jwe';
      schema.createdAt = new Date('2025-01-01');

      mockRepository.findOne.mockResolvedValue(schema);

      // Act
      const result = await repository.findByMediaCashbackId('CASHBACK456');

      // Assert
      expect(result).toBeInstanceOf(Reward);
      expect(result?.getMediaCashbackId()).toBe('CASHBACK456');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { mediaCashbackId: 'CASHBACK456' },
      });
    });
  });

  describe('findByUserId', () => {
    it('ユーザーIDで報酬リストを検索できる', async () => {
      // Arrange
      const schema = new RewardSchema();
      schema.id = '1';
      schema.userId = 100;
      schema.campaignId = '200';
      schema.mediaId = '300';
      schema.mediaUserCode = 'USER123';
      schema.mediaCashbackId = 'CASHBACK456';
      schema.mediaCashbackCode = 'CODE12345678901';
      schema.receiptCampaignId = 'CAMPAIGN001';
      schema.receiptCampaignName = 'テストキャンペーン';
      schema.receiptCampaignImage = 'image.jpg';
      schema.companyId = 'COMPANY001';
      schema.companyName = 'テスト企業';
      schema.serviceType = 'RECEIPT';
      schema.incentivePoints = 500;
      schema.participationAt = new Date('2025-01-01');
      schema.processedAt = new Date('2025-01-02');
      schema.jwePayload = 'jwe';
      schema.createdAt = new Date('2025-01-01');

      mockRepository.find.mockResolvedValue([schema]);

      // Act
      const result = await repository.findByUserId(100);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].getUserId()).toBe(100);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 100 },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByCampaignId', () => {
    it('キャンペーンIDで報酬リストを検索できる', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([]);

      // Act
      const result = await repository.findByCampaignId('200');

      // Assert
      expect(result).toHaveLength(0);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { campaignId: '200' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('save', () => {
    it('報酬を保存できる', async () => {
      // Arrange
      const reward = Reward.create({
        id: '1',
        userId: 100,
        campaignId: '200',
        mediaId: '300',
        mediaUserCode: 'USER123',
        mediaCashbackId: 'CASHBACK456',
        mediaCashbackCode: 'CODE12345678901',
        receiptCampaignId: 'CAMPAIGN001',
        receiptCampaignName: 'テストキャンペーン',
        receiptCampaignImage: 'image.jpg',
        companyId: 'COMPANY001',
        companyName: 'テスト企業',
        serviceType: 'RECEIPT',
        incentivePoints: 500,
        participationAt: new Date('2025-01-01'),
        processedAt: new Date('2025-01-02'),
        jwePayload: 'jwe',
      });

      mockRepository.save.mockResolvedValue({} as RewardSchema);

      // Act
      await repository.save(reward);

      // Assert
      expect(mockRepository.save).toHaveBeenCalled();
      const savedSchema = mockRepository.save.mock.calls[0][0];
      expect(savedSchema.id).toBe('1');
      expect(savedSchema.userId).toBe(100);
    });
  });
});
