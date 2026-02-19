import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { IUserCoinRepository } from '../../domain/repositories/user-coin.repository.interface';
import { UserCoin } from '../../domain/entities/user-coin.entity';
import { UserCoinSchema } from '../database/schemas/user-coin.schema';
import { UserCoinMapper } from '../database/mappers/user-coin.mapper';

/**
 * UserCoinRepository - ユーザーコイン残高リポジトリの実装
 *
 * Infrastructure層でDomain層のIUserCoinRepositoryを実装
 */
@Injectable()
export class UserCoinRepository implements IUserCoinRepository {
  constructor(
    @InjectRepository(UserCoinSchema)
    private readonly userCoinSchemaRepository: Repository<UserCoinSchema>,
  ) {}

  async findByUserId(userId: number): Promise<UserCoin | null> {
    const schema = await this.userCoinSchemaRepository.findOne({
      where: { userId },
    });
    return schema ? UserCoinMapper.toDomain(schema) : null;
  }

  async save(userCoin: UserCoin): Promise<void> {
    const schema = UserCoinMapper.toSchema(userCoin);
    await this.userCoinSchemaRepository.save(schema);
  }

  async delete(userId: number): Promise<void> {
    await this.userCoinSchemaRepository.delete({ userId });
  }

  async findExpiredCoins(expireDays: number): Promise<UserCoin[]> {
    // 有効期限切れの日付を計算
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - expireDays);

    const schemas = await this.userCoinSchemaRepository.find({
      where: {
        lastEarnedAt: LessThan(expirationDate),
      },
    });

    return UserCoinMapper.toDomainList(schemas).filter((coin) => coin.getBalance() > 0);
  }
}
