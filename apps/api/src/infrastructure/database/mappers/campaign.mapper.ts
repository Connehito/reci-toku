import { Campaign } from '../../../domain/entities/campaign.entity';
import { CampaignSchema } from '../schemas/campaign.schema';

/**
 * CampaignMapper - Domain Entity ⇔ TypeORM Schema 変換
 */
export class CampaignMapper {
  /**
   * Domain Entity → TypeORM Schema
   */
  static toSchema(entity: Campaign): CampaignSchema {
    const schema = new CampaignSchema();
    // IDがnullの場合はAUTO_INCREMENTに任せる
    const id = entity.getId();
    if (id !== null) {
      schema.id = id;
    }
    schema.receiptCampaignId = entity.getReceiptCampaignId();
    schema.receiptCampaignName = entity.getReceiptCampaignName();
    schema.receiptCampaignImage = entity.getReceiptCampaignImage();
    schema.companyName = entity.getCompanyName();
    schema.companyId = entity.getCompanyId();
    schema.incentivePoints = entity.getIncentivePoints();
    schema.serviceType = entity.getServiceType();
    schema.isAllReceiptCampaign = entity.getIsAllReceiptCampaign() ? 1 : 0;
    schema.missionType = entity.getMissionType();
    schema.missionOpenAt = entity.getMissionOpenAt();
    schema.missionCloseAt = entity.getMissionCloseAt();
    schema.priceText = entity.getPriceText();
    schema.title = entity.getTitle();
    schema.description = entity.getDescription();
    schema.imageUrl = entity.getImageUrl();
    schema.displayOrder = entity.getDisplayOrder();
    schema.isPublished = entity.getIsPublished() ? 1 : 0;
    schema.publishedAt = entity.getPublishedAt();
    schema.unpublishedAt = entity.getUnpublishedAt();
    schema.editorComment = entity.getEditorComment();
    schema.tags = entity.getTags();
    schema.createdAt = entity.getCreatedAt();
    schema.updatedAt = entity.getUpdatedAt();
    schema.createdBy = entity.getCreatedBy();
    schema.updatedBy = entity.getUpdatedBy();
    return schema;
  }

  /**
   * TypeORM Schema → Domain Entity
   */
  static toDomain(schema: CampaignSchema): Campaign {
    return Campaign.reconstruct(
      schema.id,
      schema.receiptCampaignId,
      schema.receiptCampaignName,
      schema.receiptCampaignImage,
      schema.companyName,
      schema.companyId,
      schema.incentivePoints,
      schema.serviceType,
      schema.isAllReceiptCampaign === 1,
      schema.missionType,
      schema.missionOpenAt,
      schema.missionCloseAt,
      schema.priceText,
      schema.title,
      schema.description,
      schema.imageUrl,
      schema.displayOrder,
      schema.isPublished === 1,
      schema.publishedAt,
      schema.unpublishedAt,
      schema.editorComment,
      schema.tags,
      schema.createdAt,
      schema.updatedAt,
      schema.createdBy,
      schema.updatedBy,
    );
  }

  /**
   * TypeORM Schema配列 → Domain Entity配列
   */
  static toDomainList(schemas: CampaignSchema[]): Campaign[] {
    return schemas.map((schema) => this.toDomain(schema));
  }
}
