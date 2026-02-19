import { UserCoin } from '../../../domain/entities/user-coin.entity';
import { UserCoinSchema } from '../schemas/user-coin.schema';

/**
 * UserCoinMapper - Domain Entity ⇔ TypeORM Schema 変換
 *
 * Clean Architectureの境界を守るため、
 * Domain層（フレームワーク非依存）とInfrastructure層（TypeORM依存）を分離する。
 */
export class UserCoinMapper {
  /**
   * Domain Entity → TypeORM Schema
   */
  static toSchema(entity: UserCoin): UserCoinSchema {
    const schema = new UserCoinSchema();
    schema.userId = entity.getUserId();
    schema.currentBalance = entity.getBalance();
    schema.lastEarnedAt = entity.getLastEarnedAt();
    schema.createdAt = entity.getCreatedAt();
    schema.updatedAt = entity.getUpdatedAt();
    return schema;
  }

  /**
   * TypeORM Schema → Domain Entity
   */
  static toDomain(schema: UserCoinSchema): UserCoin {
    return UserCoin.reconstruct(
      schema.userId,
      schema.currentBalance,
      schema.lastEarnedAt,
      schema.createdAt,
      schema.updatedAt,
    );
  }

  /**
   * TypeORM Schema配列 → Domain Entity配列
   */
  static toDomainList(schemas: UserCoinSchema[]): UserCoin[] {
    return schemas.map((schema) => this.toDomain(schema));
  }
}
