import { Campaign } from './campaign.entity';

describe('Campaign Entity', () => {
  const createValidCampaignParams = () => ({
    id: '1',
    receiptCampaignId: 'CAMPAIGN001',
    receiptCampaignName: 'テストキャンペーン',
    receiptCampaignImage: 'https://example.com/image.jpg',
    companyName: 'テスト企業',
    companyId: 'COMPANY001',
    incentivePoints: 500,
    serviceType: 'RECEIPT',
    isAllReceiptCampaign: true,
    missionType: 'PURCHASE',
    missionOpenAt: new Date('2025-01-01T00:00:00Z'),
    missionCloseAt: new Date('2025-12-31T23:59:59Z'),
    priceText: '1000円以上',
    title: 'テストキャンペーンタイトル',
    description: 'テストキャンペーン説明',
    imageUrl: 'https://example.com/campaign.jpg',
    displayOrder: 1,
    createdBy: 100,
  });

  describe('create', () => {
    it('新しいCampaignを作成できる', () => {
      // Arrange
      const params = createValidCampaignParams();

      // Act
      const campaign = Campaign.create(params);

      // Assert
      expect(campaign.getId()).toBe('1');
      expect(campaign.getReceiptCampaignId()).toBe('CAMPAIGN001');
      expect(campaign.getIncentivePoints()).toBe(500);
      expect(campaign.getIsPublished()).toBe(false);
      expect(campaign.getPublishedAt()).toBeNull();
      expect(campaign.getCreatedAt()).toBeInstanceOf(Date);
      expect(campaign.getUpdatedAt()).toBeInstanceOf(Date);
      expect(campaign.getCreatedBy()).toBe(100);
    });
  });

  describe('reconstruct', () => {
    it('既存のCampaignを復元できる', () => {
      // Act
      const campaign = Campaign.reconstruct(
        '1',
        'CAMPAIGN001',
        'テストキャンペーン',
        'image.jpg',
        'テスト企業',
        'COMPANY001',
        500,
        'RECEIPT',
        true,
        'PURCHASE',
        new Date('2025-01-01'),
        new Date('2025-12-31'),
        '1000円以上',
        'タイトル',
        '説明',
        'campaign.jpg',
        1,
        true,
        new Date('2025-01-01'),
        new Date('2025-12-31'),
        '編集者コメント',
        ['tag1', 'tag2'],
        new Date('2024-12-01'),
        new Date('2025-01-15'),
        100,
        200,
      );

      // Assert
      expect(campaign.getId()).toBe('1');
      expect(campaign.getIsPublished()).toBe(true);
      expect(campaign.getUpdatedBy()).toBe(200);
    });
  });

  describe('validate', () => {
    it('incentivePointsが0以下の場合はエラーをスローする', () => {
      // Arrange
      const params = {
        ...createValidCampaignParams(),
        incentivePoints: 0,
      };

      // Act & Assert
      expect(() => Campaign.create(params)).toThrow('付与ポイントは正の値である必要があります');
    });
  });

  describe('publish', () => {
    it('キャンペーンを公開できる', () => {
      // Arrange
      const campaign = Campaign.create(createValidCampaignParams());
      const publishedAt = new Date('2025-01-01T00:00:00Z');
      const unpublishedAt = new Date('2025-12-31T23:59:59Z');

      expect(campaign.getIsPublished()).toBe(false);

      // Act
      campaign.publish(publishedAt, unpublishedAt, 200);

      // Assert
      expect(campaign.getIsPublished()).toBe(true);
      expect(campaign.getPublishedAt()).toEqual(publishedAt);
      expect(campaign.getUnpublishedAt()).toEqual(unpublishedAt);
      expect(campaign.getUpdatedBy()).toBe(200);
    });

    it('公開期間なしで公開できる', () => {
      // Arrange
      const campaign = Campaign.create(createValidCampaignParams());

      // Act
      campaign.publish(null, null, 200);

      // Assert
      expect(campaign.getIsPublished()).toBe(true);
      expect(campaign.getPublishedAt()).toBeNull();
      expect(campaign.getUnpublishedAt()).toBeNull();
    });
  });

  describe('unpublish', () => {
    it('公開中のキャンペーンを非公開にできる', () => {
      // Arrange
      const campaign = Campaign.create(createValidCampaignParams());
      campaign.publish(new Date('2025-01-01'), new Date('2025-12-31'), 200);

      expect(campaign.getIsPublished()).toBe(true);

      // Act
      campaign.unpublish(300);

      // Assert
      expect(campaign.getIsPublished()).toBe(false);
      expect(campaign.getUpdatedBy()).toBe(300);
    });
  });

  describe('update', () => {
    it('キャンペーン情報を更新できる', () => {
      // Arrange
      const campaign = Campaign.create(createValidCampaignParams());

      // Act
      campaign.update({
        title: '更新されたタイトル',
        description: '更新された説明',
        imageUrl: 'https://example.com/new_image.jpg',
        displayOrder: 10,
        editorComment: '更新コメント',
        tags: ['new_tag1', 'new_tag2'],
        updatedBy: 300,
      });

      // Assert
      expect(campaign.getTitle()).toBe('更新されたタイトル');
      expect(campaign.getDescription()).toBe('更新された説明');
      expect(campaign.getImageUrl()).toBe('https://example.com/new_image.jpg');
      expect(campaign.getDisplayOrder()).toBe(10);
      expect(campaign.getEditorComment()).toBe('更新コメント');
      expect(campaign.getTags()).toEqual(['new_tag1', 'new_tag2']);
      expect(campaign.getUpdatedBy()).toBe(300);
    });

    it('一部のフィールドのみ更新できる', () => {
      // Arrange
      const campaign = Campaign.create(createValidCampaignParams());
      const originalDescription = campaign.getDescription();

      // Act
      campaign.update({
        title: '新しいタイトル',
        updatedBy: 300,
      });

      // Assert
      expect(campaign.getTitle()).toBe('新しいタイトル');
      expect(campaign.getDescription()).toBe(originalDescription); // 変更なし
    });
  });

  describe('isActive', () => {
    it('公開中で期間内の場合はtrueを返す', () => {
      // Arrange
      const now = new Date();
      const campaign = Campaign.create(createValidCampaignParams());
      const publishedAt = new Date(now.getTime() - 1000 * 60 * 60 * 24); // 1日前
      const unpublishedAt = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 1日後

      campaign.publish(publishedAt, unpublishedAt, 100);

      // Act & Assert
      expect(campaign.isActive()).toBe(true);
    });

    it('非公開の場合はfalseを返す', () => {
      // Arrange
      const campaign = Campaign.create(createValidCampaignParams());

      // Act & Assert
      expect(campaign.isActive()).toBe(false);
    });

    it('公開期間が設定されていない場合は公開状態のみで判定する', () => {
      // Arrange
      const campaign = Campaign.create(createValidCampaignParams());
      campaign.publish(null, null, 100);

      // Act & Assert
      expect(campaign.isActive()).toBe(true);
    });
  });
});
