import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DeleteResult } from 'typeorm';
import { CampaignRepository } from './campaign.repository';
import { CampaignSchema } from '../database/schemas/campaign.schema';
import { Campaign } from '../../domain/entities/campaign.entity';

describe('CampaignRepository', () => {
  let repository: CampaignRepository;
  let mockRepository: jest.Mocked<Repository<CampaignSchema>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<CampaignSchema>>;

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<CampaignSchema>>;

    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as jest.Mocked<Repository<CampaignSchema>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignRepository,
        {
          provide: getRepositoryToken(CampaignSchema),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<CampaignRepository>(CampaignRepository);
  });

  describe('findById', () => {
    it('IDでキャンペーンを検索できる', async () => {
      // Arrange
      const schema = new CampaignSchema();
      schema.id = '1';
      schema.receiptCampaignId = 'CAMPAIGN001';
      schema.receiptCampaignName = 'テストキャンペーン';
      schema.receiptCampaignImage = 'image.jpg';
      schema.companyName = 'テスト企業';
      schema.companyId = 'COMPANY001';
      schema.incentivePoints = 500;
      schema.serviceType = 'RECEIPT';
      schema.isAllReceiptCampaign = 0;
      schema.missionType = null;
      schema.missionOpenAt = null;
      schema.missionCloseAt = null;
      schema.priceText = null;
      schema.title = 'ママリ表示タイトル';
      schema.description = 'ママリ表示説明文';
      schema.imageUrl = 'mamari-image.jpg';
      schema.displayOrder = 1;
      schema.isPublished = 1;
      schema.publishedAt = new Date('2025-01-01');
      schema.unpublishedAt = null;
      schema.editorComment = '編集部コメント';
      schema.tags = ['おすすめ'];
      schema.createdAt = new Date('2025-01-01');
      schema.updatedAt = new Date('2025-01-01');
      schema.createdBy = 1;
      schema.updatedBy = null;

      mockRepository.findOne.mockResolvedValue(schema);

      // Act
      const result = await repository.findById('1');

      // Assert
      expect(result).toBeInstanceOf(Campaign);
      expect(result?.getId()).toBe('1');
      expect(result?.getTitle()).toBe('ママリ表示タイトル');
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

  describe('findByReceiptCampaignId', () => {
    it('レシートキャンペーンIDでキャンペーンを検索できる', async () => {
      // Arrange
      const schema = new CampaignSchema();
      schema.id = '1';
      schema.receiptCampaignId = 'CAMPAIGN001';
      schema.receiptCampaignName = 'テストキャンペーン';
      schema.receiptCampaignImage = 'image.jpg';
      schema.companyName = 'テスト企業';
      schema.companyId = 'COMPANY001';
      schema.incentivePoints = 500;
      schema.serviceType = 'RECEIPT';
      schema.isAllReceiptCampaign = 0;
      schema.missionType = null;
      schema.missionOpenAt = null;
      schema.missionCloseAt = null;
      schema.priceText = null;
      schema.title = 'ママリ表示タイトル';
      schema.description = 'ママリ表示説明文';
      schema.imageUrl = 'mamari-image.jpg';
      schema.displayOrder = 1;
      schema.isPublished = 1;
      schema.publishedAt = new Date('2025-01-01');
      schema.unpublishedAt = null;
      schema.editorComment = '編集部コメント';
      schema.tags = ['おすすめ'];
      schema.createdAt = new Date('2025-01-01');
      schema.updatedAt = new Date('2025-01-01');
      schema.createdBy = 1;
      schema.updatedBy = null;

      mockRepository.findOne.mockResolvedValue(schema);

      // Act
      const result = await repository.findByReceiptCampaignId('CAMPAIGN001');

      // Assert
      expect(result).toBeInstanceOf(Campaign);
      expect(result?.getReceiptCampaignId()).toBe('CAMPAIGN001');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { receiptCampaignId: 'CAMPAIGN001' },
      });
    });
  });

  describe('findPublishedCampaigns', () => {
    it('公開中のキャンペーンを取得できる', async () => {
      // Arrange
      const schema1 = new CampaignSchema();
      schema1.id = '1';
      schema1.receiptCampaignId = 'CAMPAIGN001';
      schema1.receiptCampaignName = 'テストキャンペーン1';
      schema1.receiptCampaignImage = 'image1.jpg';
      schema1.companyName = 'テスト企業1';
      schema1.companyId = 'COMPANY001';
      schema1.incentivePoints = 500;
      schema1.serviceType = 'RECEIPT';
      schema1.isAllReceiptCampaign = 0;
      schema1.missionType = null;
      schema1.missionOpenAt = null;
      schema1.missionCloseAt = null;
      schema1.priceText = null;
      schema1.title = 'タイトル1';
      schema1.description = '説明文1';
      schema1.imageUrl = 'image1.jpg';
      schema1.displayOrder = 1;
      schema1.isPublished = 1;
      schema1.publishedAt = new Date('2025-01-01');
      schema1.unpublishedAt = null;
      schema1.editorComment = null;
      schema1.tags = null;
      schema1.createdAt = new Date('2025-01-01');
      schema1.updatedAt = new Date('2025-01-01');
      schema1.createdBy = 1;
      schema1.updatedBy = null;

      const schema2 = new CampaignSchema();
      schema2.id = '2';
      schema2.receiptCampaignId = 'CAMPAIGN002';
      schema2.receiptCampaignName = 'テストキャンペーン2';
      schema2.receiptCampaignImage = 'image2.jpg';
      schema2.companyName = 'テスト企業2';
      schema2.companyId = 'COMPANY002';
      schema2.incentivePoints = 300;
      schema2.serviceType = 'MISSION';
      schema2.isAllReceiptCampaign = 1;
      schema2.missionType = 'campaign';
      schema2.missionOpenAt = null;
      schema2.missionCloseAt = null;
      schema2.priceText = null;
      schema2.title = 'タイトル2';
      schema2.description = '説明文2';
      schema2.imageUrl = 'image2.jpg';
      schema2.displayOrder = 2;
      schema2.isPublished = 1;
      schema2.publishedAt = new Date('2025-01-01');
      schema2.unpublishedAt = null;
      schema2.editorComment = null;
      schema2.tags = null;
      schema2.createdAt = new Date('2025-01-02');
      schema2.updatedAt = new Date('2025-01-02');
      schema2.createdBy = 1;
      schema2.updatedBy = null;

      mockQueryBuilder.getMany.mockResolvedValue([schema1, schema2]);

      // Act
      const result = await repository.findPublishedCampaigns();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].getId()).toBe('1');
      expect(result[1].getId()).toBe('2');
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('campaign');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('campaign.is_published = :isPublished', {
        isPublished: 1,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('campaign.display_order', 'ASC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('campaign.created_at', 'DESC');
    });

    it('公開中のキャンペーンが存在しない場合は空配列を返す', async () => {
      // Arrange
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findPublishedCampaigns();

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    it('全てのキャンペーンを取得できる', async () => {
      // Arrange
      const schema = new CampaignSchema();
      schema.id = '1';
      schema.receiptCampaignId = 'CAMPAIGN001';
      schema.receiptCampaignName = 'テストキャンペーン';
      schema.receiptCampaignImage = 'image.jpg';
      schema.companyName = 'テスト企業';
      schema.companyId = 'COMPANY001';
      schema.incentivePoints = 500;
      schema.serviceType = 'RECEIPT';
      schema.isAllReceiptCampaign = 0;
      schema.missionType = null;
      schema.missionOpenAt = null;
      schema.missionCloseAt = null;
      schema.priceText = null;
      schema.title = 'タイトル';
      schema.description = '説明文';
      schema.imageUrl = 'image.jpg';
      schema.displayOrder = 1;
      schema.isPublished = 0; // 非公開も含む
      schema.publishedAt = null;
      schema.unpublishedAt = null;
      schema.editorComment = null;
      schema.tags = null;
      schema.createdAt = new Date('2025-01-01');
      schema.updatedAt = new Date('2025-01-01');
      schema.createdBy = 1;
      schema.updatedBy = null;

      mockRepository.find.mockResolvedValue([schema]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].getId()).toBe('1');
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { displayOrder: 'ASC', createdAt: 'DESC' },
      });
    });
  });

  describe('save', () => {
    it('新規キャンペーンを保存できる', async () => {
      // Arrange
      const campaign = Campaign.create({
        id: '1',
        receiptCampaignId: 'CAMPAIGN001',
        receiptCampaignName: 'テストキャンペーン',
        receiptCampaignImage: 'image.jpg',
        companyName: 'テスト企業',
        companyId: 'COMPANY001',
        incentivePoints: 500,
        serviceType: 'RECEIPT',
        isAllReceiptCampaign: false,
        missionType: null,
        missionOpenAt: null,
        missionCloseAt: null,
        priceText: null,
        title: 'ママリ表示タイトル',
        description: 'ママリ表示説明文',
        imageUrl: 'mamari-image.jpg',
        displayOrder: 1,
        createdBy: 1,
      });

      mockRepository.save.mockResolvedValue({} as CampaignSchema);

      // Act
      await repository.save(campaign);

      // Assert
      expect(mockRepository.save).toHaveBeenCalled();
      const savedSchema = mockRepository.save.mock.calls[0][0];
      expect(savedSchema.id).toBe('1');
      expect(savedSchema.receiptCampaignId).toBe('CAMPAIGN001');
      expect(savedSchema.title).toBe('ママリ表示タイトル');
    });
  });

  describe('delete', () => {
    it('IDでキャンペーンを削除できる', async () => {
      // Arrange
      mockRepository.delete.mockResolvedValue({} as DeleteResult);

      // Act
      await repository.delete('1');

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith({ id: '1' });
    });
  });
});
