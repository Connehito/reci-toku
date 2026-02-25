import { Reward } from '../../../domain/entities/reward.entity';
import { RewardSchema } from '../schemas/reward.schema';

/**
 * RewardMapper - Domain Entity ⇔ TypeORM Schema 変換
 */
export class RewardMapper {
  /**
   * Domain Entity → TypeORM Schema
   */
  static toSchema(entity: Reward): RewardSchema {
    const schema = new RewardSchema();
    // IDがnullの場合はAUTO_INCREMENTに任せる
    const id = entity.getId();
    if (id !== null) {
      schema.id = id;
    }
    schema.userId = entity.getUserId();
    schema.campaignId = entity.getCampaignId();
    schema.mediaId = entity.getMediaId();
    schema.mediaUserCode = entity.getMediaUserCode();
    schema.mediaCashbackId = entity.getMediaCashbackId();
    schema.mediaCashbackCode = entity.getMediaCashbackCode();
    schema.receiptCampaignId = entity.getReceiptCampaignId();
    schema.receiptCampaignName = entity.getReceiptCampaignName();
    schema.receiptCampaignImage = entity.getReceiptCampaignImage();
    schema.companyId = entity.getCompanyId();
    schema.companyName = entity.getCompanyName();
    schema.serviceType = entity.getServiceType();
    schema.incentivePoints = entity.getIncentivePoints();
    schema.participationAt = entity.getParticipationAt();
    schema.processedAt = entity.getProcessedAt();
    schema.jwePayload = entity.getJwePayload();
    schema.createdAt = entity.getCreatedAt();
    return schema;
  }

  /**
   * TypeORM Schema → Domain Entity
   */
  static toDomain(schema: RewardSchema): Reward {
    return Reward.reconstruct(
      schema.id,
      schema.userId,
      schema.campaignId,
      schema.mediaId,
      schema.mediaUserCode,
      schema.mediaCashbackId,
      schema.mediaCashbackCode,
      schema.receiptCampaignId,
      schema.receiptCampaignName,
      schema.receiptCampaignImage,
      schema.companyId,
      schema.companyName,
      schema.serviceType,
      schema.incentivePoints,
      schema.participationAt,
      schema.processedAt,
      schema.jwePayload,
      schema.createdAt,
    );
  }

  /**
   * TypeORM Schema配列 → Domain Entity配列
   */
  static toDomainList(schemas: RewardSchema[]): Reward[] {
    return schemas.map((schema) => this.toDomain(schema));
  }
}
