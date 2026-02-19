import { CampaignMapper } from './campaign.mapper';
import { Campaign } from '../../../domain/entities/campaign.entity';
import { CampaignSchema } from '../schemas/campaign.schema';

describe('CampaignMapper', () => {
  describe('toSchema', () => {
    it('Domain Entity → TypeORM Schema に正しく変換される', () => {
      // Arrange
      const entity = Campaign.reconstruct(
        '1',
        'CAMPAIGN001',
        'テストキャンペーン',
        'https://example.com/image.jpg',
        'テスト企業',
        'COMPANY001',
        500,
        'RECEIPT',
        true,
        'PURCHASE',
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-12-31T23:59:59Z'),
        '1000円以上',
        'テストキャンペーンタイトル',
        'テストキャンペーン説明',
        'https://example.com/campaign.jpg',
        1,
        true,
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-12-31T23:59:59Z'),
        '編集者コメント',
        ['tag1', 'tag2'],
        new Date('2024-12-01T00:00:00Z'),
        new Date('2025-01-15T00:00:00Z'),
        100,
        200,
      );

      // Act
      const schema = CampaignMapper.toSchema(entity);

      // Assert
      expect(schema).toBeInstanceOf(CampaignSchema);
      expect(schema.id).toBe('1');
      expect(schema.receiptCampaignId).toBe('CAMPAIGN001');
      expect(schema.receiptCampaignName).toBe('テストキャンペーン');
      expect(schema.isAllReceiptCampaign).toBe(1);
      expect(schema.isPublished).toBe(1);
      expect(schema.displayOrder).toBe(1);
    });

    it('isAllReceiptCampaign=false の場合、0に変換される', () => {
      // Arrange
      const entity = Campaign.reconstruct(
        '2',
        'CAMPAIGN002',
        'テストキャンペーン2',
        'image2.jpg',
        '企業2',
        'COMPANY002',
        1000,
        'RECEIPT',
        false,
        'PURCHASE',
        new Date('2025-01-01'),
        new Date('2025-12-31'),
        '2000円以上',
        'タイトル2',
        '説明2',
        'campaign2.jpg',
        2,
        false,
        null,
        null,
        null,
        null,
        new Date('2024-12-01'),
        new Date('2025-01-15'),
        100,
        200,
      );

      // Act
      const schema = CampaignMapper.toSchema(entity);

      // Assert
      expect(schema.isAllReceiptCampaign).toBe(0);
      expect(schema.isPublished).toBe(0);
    });
  });

  describe('toDomain', () => {
    it('TypeORM Schema → Domain Entity に正しく変換される', () => {
      // Arrange
      const schema = new CampaignSchema();
      schema.id = '10';
      schema.receiptCampaignId = 'CAMPAIGN010';
      schema.receiptCampaignName = 'スキーマキャンペーン';
      schema.receiptCampaignImage = 'schema.jpg';
      schema.companyName = 'スキーマ企業';
      schema.companyId = 'COMPANY010';
      schema.incentivePoints = 750;
      schema.serviceType = 'RECEIPT';
      schema.isAllReceiptCampaign = 1;
      schema.missionType = 'PURCHASE';
      schema.missionOpenAt = new Date('2025-02-01T00:00:00Z');
      schema.missionCloseAt = new Date('2025-11-30T23:59:59Z');
      schema.priceText = '1500円以上';
      schema.title = 'スキーマタイトル';
      schema.description = 'スキーマ説明';
      schema.imageUrl = 'schema_image.jpg';
      schema.displayOrder = 5;
      schema.isPublished = 1;
      schema.publishedAt = new Date('2025-02-01T00:00:00Z');
      schema.unpublishedAt = new Date('2025-11-30T23:59:59Z');
      schema.editorComment = 'スキーマコメント';
      schema.tags = ['tag3', 'tag4'];
      schema.createdAt = new Date('2025-01-01T00:00:00Z');
      schema.updatedAt = new Date('2025-02-01T00:00:00Z');
      schema.createdBy = 300;
      schema.updatedBy = 400;

      // Act
      const entity = CampaignMapper.toDomain(schema);

      // Assert
      expect(entity).toBeInstanceOf(Campaign);
      expect(entity.getId()).toBe('10');
      expect(entity.getReceiptCampaignId()).toBe('CAMPAIGN010');
      expect(entity.getIsAllReceiptCampaign()).toBe(true);
      expect(entity.getIsPublished()).toBe(true);
    });

    it('isAllReceiptCampaign=0 の場合、falseに変換される', () => {
      // Arrange
      const schema = new CampaignSchema();
      schema.id = '11';
      schema.receiptCampaignId = 'CAMPAIGN011';
      schema.receiptCampaignName = 'キャンペーン11';
      schema.receiptCampaignImage = 'image11.jpg';
      schema.companyName = '企業11';
      schema.companyId = 'COMPANY011';
      schema.incentivePoints = 100;
      schema.serviceType = 'RECEIPT';
      schema.isAllReceiptCampaign = 0;
      schema.missionType = 'PURCHASE';
      schema.missionOpenAt = new Date('2025-01-01');
      schema.missionCloseAt = new Date('2025-12-31');
      schema.priceText = '500円以上';
      schema.title = 'タイトル11';
      schema.description = '説明11';
      schema.imageUrl = 'campaign11.jpg';
      schema.displayOrder = 1;
      schema.isPublished = 0;
      schema.publishedAt = null;
      schema.unpublishedAt = null;
      schema.editorComment = null;
      schema.tags = null;
      schema.createdAt = new Date('2025-01-01');
      schema.updatedAt = new Date('2025-01-01');
      schema.createdBy = 100;
      schema.updatedBy = 100;

      // Act
      const entity = CampaignMapper.toDomain(schema);

      // Assert
      expect(entity.getIsAllReceiptCampaign()).toBe(false);
      expect(entity.getIsPublished()).toBe(false);
    });
  });

  describe('toDomainList', () => {
    it('TypeORM Schema配列 → Domain Entity配列 に正しく変換される', () => {
      // Arrange
      const schema1 = new CampaignSchema();
      schema1.id = '1';
      schema1.receiptCampaignId = 'CAMP1';
      schema1.receiptCampaignName = 'キャンペーン1';
      schema1.receiptCampaignImage = 'image1.jpg';
      schema1.companyName = '企業1';
      schema1.companyId = 'COMP1';
      schema1.incentivePoints = 100;
      schema1.serviceType = 'RECEIPT';
      schema1.isAllReceiptCampaign = 1;
      schema1.missionType = 'PURCHASE';
      schema1.missionOpenAt = new Date('2025-01-01');
      schema1.missionCloseAt = new Date('2025-12-31');
      schema1.priceText = '1000円以上';
      schema1.title = 'タイトル1';
      schema1.description = '説明1';
      schema1.imageUrl = 'campaign1.jpg';
      schema1.displayOrder = 1;
      schema1.isPublished = 1;
      schema1.publishedAt = new Date('2025-01-01');
      schema1.unpublishedAt = new Date('2025-12-31');
      schema1.editorComment = 'コメント1';
      schema1.tags = ['tag1'];
      schema1.createdAt = new Date('2024-12-01');
      schema1.updatedAt = new Date('2025-01-01');
      schema1.createdBy = 1;
      schema1.updatedBy = 1;

      const schemas = [schema1];

      // Act
      const entities = CampaignMapper.toDomainList(schemas);

      // Assert
      expect(entities).toHaveLength(1);
      expect(entities[0].getId()).toBe('1');
      expect(entities[0].getIsPublished()).toBe(true);
    });

    it('空配列の場合は空配列を返す', () => {
      // Act
      const entities = CampaignMapper.toDomainList([]);

      // Assert
      expect(entities).toEqual([]);
    });
  });
});
