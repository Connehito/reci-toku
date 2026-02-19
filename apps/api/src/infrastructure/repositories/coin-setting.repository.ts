import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICoinSettingRepository } from '../../domain/repositories/coin-setting.repository.interface';
import { CoinSetting } from '../../domain/entities/coin-setting.entity';
import { CoinSettingSchema } from '../database/schemas/coin-setting.schema';
import { CoinSettingMapper } from '../database/mappers/coin-setting.mapper';

/**
 * CoinSettingRepository - コイン設定リポジトリの実装
 *
 * Infrastructure層でDomain層のICoinSettingRepositoryを実装
 */
@Injectable()
export class CoinSettingRepository implements ICoinSettingRepository {
  constructor(
    @InjectRepository(CoinSettingSchema)
    private readonly coinSettingSchemaRepository: Repository<CoinSettingSchema>,
  ) {}

  async findByKey(key: string): Promise<CoinSetting | null> {
    const schema = await this.coinSettingSchemaRepository.findOne({
      where: { key },
    });
    return schema ? CoinSettingMapper.toDomain(schema) : null;
  }

  async findAll(): Promise<CoinSetting[]> {
    const schemas = await this.coinSettingSchemaRepository.find({
      order: { key: 'ASC' },
    });
    return CoinSettingMapper.toDomainList(schemas);
  }

  async save(coinSetting: CoinSetting): Promise<void> {
    const schema = CoinSettingMapper.toSchema(coinSetting);
    await this.coinSettingSchemaRepository.save(schema);
  }

  async delete(key: string): Promise<void> {
    await this.coinSettingSchemaRepository.delete({ key });
  }
}
