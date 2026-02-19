import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICampaignRepository } from '../../domain/repositories/campaign.repository.interface';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignSchema } from '../database/schemas/campaign.schema';
import { CampaignMapper } from '../database/mappers/campaign.mapper';

/**
 * CampaignRepository - キャンペーンリポジトリの実装
 *
 * Infrastructure層でDomain層のICampaignRepositoryを実装
 */
@Injectable()
export class CampaignRepository implements ICampaignRepository {
  constructor(
    @InjectRepository(CampaignSchema)
    private readonly campaignSchemaRepository: Repository<CampaignSchema>,
  ) {}

  async findById(id: string): Promise<Campaign | null> {
    const schema = await this.campaignSchemaRepository.findOne({
      where: { id },
    });
    return schema ? CampaignMapper.toDomain(schema) : null;
  }

  async findByReceiptCampaignId(receiptCampaignId: string): Promise<Campaign | null> {
    const schema = await this.campaignSchemaRepository.findOne({
      where: { receiptCampaignId },
    });
    return schema ? CampaignMapper.toDomain(schema) : null;
  }

  async findPublishedCampaigns(): Promise<Campaign[]> {
    const now = new Date();
    const schemas = await this.campaignSchemaRepository
      .createQueryBuilder('campaign')
      .where('campaign.is_published = :isPublished', { isPublished: 1 })
      .andWhere('(campaign.published_at IS NULL OR campaign.published_at <= :now)', { now })
      .andWhere('(campaign.unpublished_at IS NULL OR campaign.unpublished_at > :now)', { now })
      .orderBy('campaign.display_order', 'ASC')
      .addOrderBy('campaign.created_at', 'DESC')
      .getMany();

    return CampaignMapper.toDomainList(schemas);
  }

  async findAll(): Promise<Campaign[]> {
    const schemas = await this.campaignSchemaRepository.find({
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
    return CampaignMapper.toDomainList(schemas);
  }

  async save(campaign: Campaign): Promise<void> {
    const schema = CampaignMapper.toSchema(campaign);
    await this.campaignSchemaRepository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.campaignSchemaRepository.delete({ id });
  }
}
