import { RewardMapper } from './reward.mapper';
import { Reward } from '../../../domain/entities/reward.entity';
import { RewardSchema } from '../schemas/reward.schema';

describe('RewardMapper', () => {
  describe('toSchema', () => {
    it('Domain Entity → TypeORM Schema に正しく変換される', () => {
      // Arrange
      const entity = Reward.reconstruct(
        '1',
        100,
        '200',
        '300',
        'USER123',
        'CASHBACK456',
        'CODE78901234567',
        'CAMPAIGN001',
        'テストキャンペーン',
        'https://example.com/image.jpg',
        'COMPANY001',
        'テスト企業',
        'RECEIPT',
        500,
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-02T00:00:00Z'),
        'jwe_payload_example',
        new Date('2025-01-01T00:00:00Z'),
      );

      // Act
      const schema = RewardMapper.toSchema(entity);

      // Assert
      expect(schema).toBeInstanceOf(RewardSchema);
      expect(schema.id).toBe('1');
      expect(schema.userId).toBe(100);
      expect(schema.campaignId).toBe('200');
      expect(schema.mediaId).toBe('300');
      expect(schema.mediaUserCode).toBe('USER123');
      expect(schema.mediaCashbackId).toBe('CASHBACK456');
      expect(schema.mediaCashbackCode).toBe('CODE78901234567');
      expect(schema.receiptCampaignId).toBe('CAMPAIGN001');
      expect(schema.receiptCampaignName).toBe('テストキャンペーン');
      expect(schema.receiptCampaignImage).toBe('https://example.com/image.jpg');
      expect(schema.companyId).toBe('COMPANY001');
      expect(schema.companyName).toBe('テスト企業');
      expect(schema.serviceType).toBe('RECEIPT');
      expect(schema.incentivePoints).toBe(500);
      expect(schema.participationAt).toEqual(new Date('2025-01-01T00:00:00Z'));
      expect(schema.processedAt).toEqual(new Date('2025-01-02T00:00:00Z'));
      expect(schema.jwePayload).toBe('jwe_payload_example');
      expect(schema.createdAt).toEqual(new Date('2025-01-01T00:00:00Z'));
    });

    it('IDがnullのEntityの場合、schema.idをセットしない', () => {
      // Arrange
      const entity = Reward.create({
        userId: 100,
        campaignId: '200',
        mediaId: '300',
        mediaUserCode: 'USER123',
        mediaCashbackId: 'CASHBACK456',
        mediaCashbackCode: 'CODE78901234567',
        receiptCampaignId: 'CAMPAIGN001',
        receiptCampaignName: 'テストキャンペーン',
        receiptCampaignImage: 'https://example.com/image.jpg',
        companyId: 'COMPANY001',
        companyName: 'テスト企業',
        serviceType: 'RECEIPT',
        incentivePoints: 500,
        participationAt: new Date('2025-01-01T00:00:00Z'),
        processedAt: new Date('2025-01-02T00:00:00Z'),
        jwePayload: 'jwe_payload_example',
      });

      // Act
      const schema = RewardMapper.toSchema(entity);

      // Assert
      expect(schema).toBeInstanceOf(RewardSchema);
      expect(schema.id).toBeUndefined();
      expect(schema.userId).toBe(100);
    });
  });

  describe('toDomain', () => {
    it('TypeORM Schema → Domain Entity に正しく変換される', () => {
      // Arrange
      const schema = new RewardSchema();
      schema.id = '2';
      schema.userId = 200;
      schema.campaignId = '300';
      schema.mediaId = '400';
      schema.mediaUserCode = 'USER456';
      schema.mediaCashbackId = 'CASHBACK789';
      schema.mediaCashbackCode = 'CODE12345678901';
      schema.receiptCampaignId = 'CAMPAIGN002';
      schema.receiptCampaignName = 'テストキャンペーン2';
      schema.receiptCampaignImage = 'https://example.com/image2.jpg';
      schema.companyId = 'COMPANY002';
      schema.companyName = 'テスト企業2';
      schema.serviceType = 'RECEIPT';
      schema.incentivePoints = 1000;
      schema.participationAt = new Date('2025-02-01T00:00:00Z');
      schema.processedAt = new Date('2025-02-02T00:00:00Z');
      schema.jwePayload = 'jwe_payload_example2';
      schema.createdAt = new Date('2025-02-01T00:00:00Z');

      // Act
      const entity = RewardMapper.toDomain(schema);

      // Assert
      expect(entity).toBeInstanceOf(Reward);
      expect(entity.getId()).toBe('2');
      expect(entity.getUserId()).toBe(200);
      expect(entity.getCampaignId()).toBe('300');
      expect(entity.getMediaId()).toBe('400');
      expect(entity.getMediaUserCode()).toBe('USER456');
      expect(entity.getMediaCashbackId()).toBe('CASHBACK789');
      expect(entity.getMediaCashbackCode()).toBe('CODE12345678901');
    });
  });

  describe('toDomainList', () => {
    it('TypeORM Schema配列 → Domain Entity配列 に正しく変換される', () => {
      // Arrange
      const schema1 = new RewardSchema();
      schema1.id = '1';
      schema1.userId = 100;
      schema1.campaignId = '200';
      schema1.mediaId = '300';
      schema1.mediaUserCode = 'USER1';
      schema1.mediaCashbackId = 'CASHBACK1';
      schema1.mediaCashbackCode = 'CODE12345678901';
      schema1.receiptCampaignId = 'CAMP1';
      schema1.receiptCampaignName = 'キャンペーン1';
      schema1.receiptCampaignImage = 'image1.jpg';
      schema1.companyId = 'COMP1';
      schema1.companyName = '企業1';
      schema1.serviceType = 'RECEIPT';
      schema1.incentivePoints = 100;
      schema1.participationAt = new Date('2025-01-01');
      schema1.processedAt = new Date('2025-01-02');
      schema1.jwePayload = 'jwe1';
      schema1.createdAt = new Date('2025-01-01');

      const schema2 = new RewardSchema();
      schema2.id = '2';
      schema2.userId = 200;
      schema2.campaignId = '300';
      schema2.mediaId = '400';
      schema2.mediaUserCode = 'USER2';
      schema2.mediaCashbackId = 'CASHBACK2';
      schema2.mediaCashbackCode = 'CODE23456789012';
      schema2.receiptCampaignId = 'CAMP2';
      schema2.receiptCampaignName = 'キャンペーン2';
      schema2.receiptCampaignImage = 'image2.jpg';
      schema2.companyId = 'COMP2';
      schema2.companyName = '企業2';
      schema2.serviceType = 'RECEIPT';
      schema2.incentivePoints = 200;
      schema2.participationAt = new Date('2025-02-01');
      schema2.processedAt = new Date('2025-02-02');
      schema2.jwePayload = 'jwe2';
      schema2.createdAt = new Date('2025-02-01');

      const schemas = [schema1, schema2];

      // Act
      const entities = RewardMapper.toDomainList(schemas);

      // Assert
      expect(entities).toHaveLength(2);
      expect(entities[0].getId()).toBe('1');
      expect(entities[1].getId()).toBe('2');
    });

    it('空配列の場合は空配列を返す', () => {
      // Act
      const entities = RewardMapper.toDomainList([]);

      // Assert
      expect(entities).toEqual([]);
    });
  });
});
