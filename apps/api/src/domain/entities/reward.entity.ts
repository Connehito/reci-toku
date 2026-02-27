import { InvalidUserIdError } from '../exceptions/invalid-user-id.error';

/**
 * Reward - 報酬履歴（ドメインエンティティ）
 *
 * Performance Media Network（PMN）からのWebhook通知を記録する証跡。
 * べき等性保証のため`mediaCashbackId`は一意である必要がある。
 */
export class Reward {
  private constructor(
    private readonly id: string | null,
    private readonly userId: number,
    private readonly campaignId: string,
    private readonly mediaId: string,
    private readonly mediaUserCode: string,
    private readonly mediaCashbackId: string,
    private readonly mediaCashbackCode: string,
    private readonly receiptCampaignId: string,
    private readonly receiptCampaignName: string | null,
    private readonly receiptCampaignImage: string | null,
    private readonly companyId: string | null,
    private readonly companyName: string | null,
    private readonly serviceType: string | null,
    private readonly incentivePoints: number,
    private readonly participationAt: Date,
    private readonly processedAt: Date,
    private readonly jwePayload: string | null,
    private readonly createdAt: Date,
  ) {
    this.validate();
  }

  /**
   * 新規報酬を作成
   */
  static create(params: {
    userId: number;
    campaignId: string;
    mediaId: string;
    mediaUserCode: string;
    mediaCashbackId: string;
    mediaCashbackCode: string;
    receiptCampaignId: string;
    receiptCampaignName: string | null;
    receiptCampaignImage: string | null;
    companyId: string | null;
    companyName: string | null;
    serviceType: string | null;
    incentivePoints: number;
    participationAt: Date;
    processedAt: Date;
    jwePayload: string | null;
  }): Reward {
    return new Reward(
      null,
      params.userId,
      params.campaignId,
      params.mediaId,
      params.mediaUserCode,
      params.mediaCashbackId,
      params.mediaCashbackCode,
      params.receiptCampaignId,
      params.receiptCampaignName,
      params.receiptCampaignImage,
      params.companyId,
      params.companyName,
      params.serviceType,
      params.incentivePoints,
      params.participationAt,
      params.processedAt,
      params.jwePayload,
      new Date(),
    );
  }

  /**
   * 既存データから復元
   */
  static reconstruct(
    id: string,
    userId: number,
    campaignId: string,
    mediaId: string,
    mediaUserCode: string,
    mediaCashbackId: string,
    mediaCashbackCode: string,
    receiptCampaignId: string,
    receiptCampaignName: string | null,
    receiptCampaignImage: string | null,
    companyId: string | null,
    companyName: string | null,
    serviceType: string | null,
    incentivePoints: number,
    participationAt: Date,
    processedAt: Date,
    jwePayload: string | null,
    createdAt: Date,
  ): Reward {
    return new Reward(
      id,
      userId,
      campaignId,
      mediaId,
      mediaUserCode,
      mediaCashbackId,
      mediaCashbackCode,
      receiptCampaignId,
      receiptCampaignName,
      receiptCampaignImage,
      companyId,
      companyName,
      serviceType,
      incentivePoints,
      participationAt,
      processedAt,
      jwePayload,
      createdAt,
    );
  }

  private validate(): void {
    if (this.userId <= 0) {
      throw new InvalidUserIdError(this.userId);
    }
    if (this.incentivePoints <= 0) {
      throw new Error('付与ポイントは正の値である必要があります');
    }
    if (!this.mediaCashbackId) {
      throw new Error('mediaCashbackIdは必須です（べき等性保証）');
    }
    if (this.mediaCashbackCode.length !== 15) {
      throw new Error('mediaCashbackCodeは15桁である必要があります');
    }
  }

  // Getters
  getId(): string | null {
    return this.id;
  }

  getUserId(): number {
    return this.userId;
  }

  getCampaignId(): string {
    return this.campaignId;
  }

  getMediaId(): string {
    return this.mediaId;
  }

  getMediaUserCode(): string {
    return this.mediaUserCode;
  }

  getMediaCashbackId(): string {
    return this.mediaCashbackId;
  }

  getMediaCashbackCode(): string {
    return this.mediaCashbackCode;
  }

  getReceiptCampaignId(): string {
    return this.receiptCampaignId;
  }

  getReceiptCampaignName(): string | null {
    return this.receiptCampaignName;
  }

  getReceiptCampaignImage(): string | null {
    return this.receiptCampaignImage;
  }

  getCompanyId(): string | null {
    return this.companyId;
  }

  getCompanyName(): string | null {
    return this.companyName;
  }

  getServiceType(): string | null {
    return this.serviceType;
  }

  getIncentivePoints(): number {
    return this.incentivePoints;
  }

  getParticipationAt(): Date {
    return this.participationAt;
  }

  getProcessedAt(): Date {
    return this.processedAt;
  }

  getJwePayload(): string | null {
    return this.jwePayload;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
