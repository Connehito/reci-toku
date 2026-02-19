import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRewardRepository } from '../../domain/repositories/reward.repository.interface';
import { Reward } from '../../domain/entities/reward.entity';
import { RewardSchema } from '../database/schemas/reward.schema';
import { RewardMapper } from '../database/mappers/reward.mapper';

/**
 * RewardRepository - 報酬履歴リポジトリの実装
 *
 * Infrastructure層でDomain層のIRewardRepositoryを実装
 */
@Injectable()
export class RewardRepository implements IRewardRepository {
  constructor(
    @InjectRepository(RewardSchema)
    private readonly rewardSchemaRepository: Repository<RewardSchema>,
  ) {}

  async findById(id: string): Promise<Reward | null> {
    const schema = await this.rewardSchemaRepository.findOne({
      where: { id },
    });
    return schema ? RewardMapper.toDomain(schema) : null;
  }

  async findByMediaCashbackId(mediaCashbackId: string): Promise<Reward | null> {
    const schema = await this.rewardSchemaRepository.findOne({
      where: { mediaCashbackId },
    });
    return schema ? RewardMapper.toDomain(schema) : null;
  }

  async findByUserId(userId: number): Promise<Reward[]> {
    const schemas = await this.rewardSchemaRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return RewardMapper.toDomainList(schemas);
  }

  async findByCampaignId(campaignId: string): Promise<Reward[]> {
    const schemas = await this.rewardSchemaRepository.find({
      where: { campaignId },
      order: { createdAt: 'DESC' },
    });
    return RewardMapper.toDomainList(schemas);
  }

  async save(reward: Reward): Promise<void> {
    const schema = RewardMapper.toSchema(reward);
    await this.rewardSchemaRepository.save(schema);
  }
}
