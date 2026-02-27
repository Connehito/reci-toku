/**
 * Campaign - キャンペーンマスタ（ドメインエンティティ）
 *
 * 管理画面からキャンペーンを動的に追加・編集するためのマスタ。
 * 手動キュレーション方式を採用。
 */
export class Campaign {
  private constructor(
    private readonly id: string | null,
    private readonly receiptCampaignId: string,
    private readonly receiptCampaignName: string,
    private readonly receiptCampaignImage: string | null,
    private readonly companyName: string | null,
    private readonly companyId: string | null,
    private readonly incentivePoints: number,
    private readonly serviceType: string,
    private readonly isAllReceiptCampaign: boolean,
    private readonly missionType: string | null,
    private readonly missionOpenAt: Date | null,
    private readonly missionCloseAt: Date | null,
    private readonly priceText: string | null,
    private title: string,
    private description: string | null,
    private imageUrl: string | null,
    private displayOrder: number,
    private isPublished: boolean,
    private publishedAt: Date | null,
    private unpublishedAt: Date | null,
    private editorComment: string | null,
    private tags: string[] | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private readonly createdBy: number | null,
    private updatedBy: number | null,
  ) {
    this.validate();
  }

  /**
   * 新規キャンペーンを作成
   */
  static create(params: {
    receiptCampaignId: string;
    receiptCampaignName: string;
    receiptCampaignImage: string | null;
    companyName: string | null;
    companyId: string | null;
    incentivePoints: number;
    serviceType: string;
    isAllReceiptCampaign: boolean;
    missionType: string | null;
    missionOpenAt: Date | null;
    missionCloseAt: Date | null;
    priceText: string | null;
    title: string;
    description: string | null;
    imageUrl: string | null;
    displayOrder: number;
    createdBy: number | null;
  }): Campaign {
    const now = new Date();
    return new Campaign(
      null,
      params.receiptCampaignId,
      params.receiptCampaignName,
      params.receiptCampaignImage,
      params.companyName,
      params.companyId,
      params.incentivePoints,
      params.serviceType,
      params.isAllReceiptCampaign,
      params.missionType,
      params.missionOpenAt,
      params.missionCloseAt,
      params.priceText,
      params.title,
      params.description,
      params.imageUrl,
      params.displayOrder,
      false, // 初期状態は非公開
      null,
      null,
      null,
      null,
      now,
      now,
      params.createdBy,
      null,
    );
  }

  /**
   * 既存データから復元
   */
  static reconstruct(
    id: string,
    receiptCampaignId: string,
    receiptCampaignName: string,
    receiptCampaignImage: string | null,
    companyName: string | null,
    companyId: string | null,
    incentivePoints: number,
    serviceType: string,
    isAllReceiptCampaign: boolean,
    missionType: string | null,
    missionOpenAt: Date | null,
    missionCloseAt: Date | null,
    priceText: string | null,
    title: string,
    description: string | null,
    imageUrl: string | null,
    displayOrder: number,
    isPublished: boolean,
    publishedAt: Date | null,
    unpublishedAt: Date | null,
    editorComment: string | null,
    tags: string[] | null,
    createdAt: Date,
    updatedAt: Date,
    createdBy: number | null,
    updatedBy: number | null,
  ): Campaign {
    return new Campaign(
      id,
      receiptCampaignId,
      receiptCampaignName,
      receiptCampaignImage,
      companyName,
      companyId,
      incentivePoints,
      serviceType,
      isAllReceiptCampaign,
      missionType,
      missionOpenAt,
      missionCloseAt,
      priceText,
      title,
      description,
      imageUrl,
      displayOrder,
      isPublished,
      publishedAt,
      unpublishedAt,
      editorComment,
      tags,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
    );
  }

  private validate(): void {
    if (!this.receiptCampaignId) {
      throw new Error('receiptCampaignIdは必須です');
    }
    if (this.incentivePoints <= 0) {
      throw new Error('付与ポイントは正の値である必要があります');
    }
    if (!this.title || this.title.trim() === '') {
      throw new Error('タイトルは必須です');
    }
  }

  /**
   * キャンペーンを公開
   */
  publish(publishedAt: Date | null, unpublishedAt: Date | null, updatedBy: number): void {
    this.isPublished = true;
    this.publishedAt = publishedAt;
    this.unpublishedAt = unpublishedAt;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  /**
   * キャンペーンを非公開
   */
  unpublish(updatedBy: number): void {
    this.isPublished = false;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  /**
   * キャンペーン情報を更新
   */
  update(params: {
    title?: string;
    description?: string | null;
    imageUrl?: string | null;
    displayOrder?: number;
    editorComment?: string | null;
    tags?: string[] | null;
    updatedBy: number;
  }): void {
    if (params.title !== undefined) {
      if (!params.title || params.title.trim() === '') {
        throw new Error('タイトルは必須です');
      }
      this.title = params.title;
    }
    if (params.description !== undefined) this.description = params.description;
    if (params.imageUrl !== undefined) this.imageUrl = params.imageUrl;
    if (params.displayOrder !== undefined) this.displayOrder = params.displayOrder;
    if (params.editorComment !== undefined) this.editorComment = params.editorComment;
    if (params.tags !== undefined) this.tags = params.tags;

    this.updatedBy = params.updatedBy;
    this.updatedAt = new Date();
  }

  /**
   * 公開中かチェック
   */
  isActive(): boolean {
    if (!this.isPublished) return false;

    const now = new Date();

    // 公開開始日時チェック
    if (this.publishedAt && now < this.publishedAt) return false;

    // 公開終了日時チェック
    if (this.unpublishedAt && now >= this.unpublishedAt) return false;

    return true;
  }

  // Getters
  getId(): string | null {
    return this.id;
  }

  getReceiptCampaignId(): string {
    return this.receiptCampaignId;
  }

  getReceiptCampaignName(): string {
    return this.receiptCampaignName;
  }

  getReceiptCampaignImage(): string | null {
    return this.receiptCampaignImage;
  }

  getCompanyName(): string | null {
    return this.companyName;
  }

  getCompanyId(): string | null {
    return this.companyId;
  }

  getIncentivePoints(): number {
    return this.incentivePoints;
  }

  getServiceType(): string {
    return this.serviceType;
  }

  getIsAllReceiptCampaign(): boolean {
    return this.isAllReceiptCampaign;
  }

  getMissionType(): string | null {
    return this.missionType;
  }

  getMissionOpenAt(): Date | null {
    return this.missionOpenAt;
  }

  getMissionCloseAt(): Date | null {
    return this.missionCloseAt;
  }

  getPriceText(): string | null {
    return this.priceText;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string | null {
    return this.description;
  }

  getImageUrl(): string | null {
    return this.imageUrl;
  }

  getDisplayOrder(): number {
    return this.displayOrder;
  }

  getIsPublished(): boolean {
    return this.isPublished;
  }

  getPublishedAt(): Date | null {
    return this.publishedAt;
  }

  getUnpublishedAt(): Date | null {
    return this.unpublishedAt;
  }

  getEditorComment(): string | null {
    return this.editorComment;
  }

  getTags(): string[] | null {
    return this.tags;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getCreatedBy(): number | null {
    return this.createdBy;
  }

  getUpdatedBy(): number | null {
    return this.updatedBy;
  }
}
