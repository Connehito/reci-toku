import { Reward } from './reward.entity';

describe('Reward Entity', () => {
  describe('create', () => {
    it('新しいRewardを作成できる', () => {
      // Arrange
      const params = {
        id: '1',
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
      };

      // Act
      const reward = Reward.create(params);

      // Assert
      expect(reward.getId()).toBe('1');
      expect(reward.getUserId()).toBe(100);
      expect(reward.getCampaignId()).toBe('200');
      expect(reward.getMediaId()).toBe('300');
      expect(reward.getMediaCashbackId()).toBe('CASHBACK456');
      expect(reward.getMediaCashbackCode()).toBe('CODE78901234567');
      expect(reward.getIncentivePoints()).toBe(500);
      expect(reward.getCreatedAt()).toBeInstanceOf(Date);
    });
  });

  describe('reconstruct', () => {
    it('既存のRewardを復元できる', () => {
      // Act
      const reward = Reward.reconstruct(
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

      // Assert
      expect(reward.getId()).toBe('1');
      expect(reward.getUserId()).toBe(100);
      expect(reward.getProcessedAt()).toEqual(new Date('2025-01-02T00:00:00Z'));
    });
  });

  describe('validate', () => {
    it('mediaCashbackIdが空の場合はエラーをスローする', () => {
      // Arrange
      const params = {
        id: '1',
        userId: 100,
        campaignId: '200',
        mediaId: '300',
        mediaUserCode: 'USER123',
        mediaCashbackId: '',
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
      };

      // Act & Assert
      expect(() => Reward.create(params)).toThrow('mediaCashbackIdは必須です（べき等性保証）');
    });

    it('mediaCashbackCodeが15桁でない場合はエラーをスローする', () => {
      // Arrange
      const params = {
        id: '1',
        userId: 100,
        campaignId: '200',
        mediaId: '300',
        mediaUserCode: 'USER123',
        mediaCashbackId: 'CASHBACK456',
        mediaCashbackCode: 'CODE123', // 15桁未満
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
      };

      // Act & Assert
      expect(() => Reward.create(params)).toThrow('mediaCashbackCodeは15桁である必要があります');
    });

    it('incentivePointsが0以下の場合はエラーをスローする', () => {
      // Arrange
      const params = {
        id: '1',
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
        incentivePoints: 0,
        participationAt: new Date('2025-01-01T00:00:00Z'),
        processedAt: new Date('2025-01-02T00:00:00Z'),
        jwePayload: 'jwe_payload_example',
      };

      // Act & Assert
      expect(() => Reward.create(params)).toThrow('付与ポイントは正の値である必要があります');
    });
  });
});
