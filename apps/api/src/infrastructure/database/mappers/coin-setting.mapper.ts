import { CoinSetting } from '../../../domain/entities/coin-setting.entity';
import { CoinSettingSchema } from '../schemas/coin-setting.schema';

/**
 * CoinSettingMapper - Domain Entity ⇔ TypeORM Schema 変換
 */
export class CoinSettingMapper {
  /**
   * Domain Entity → TypeORM Schema
   */
  static toSchema(entity: CoinSetting): CoinSettingSchema {
    const schema = new CoinSettingSchema();
    schema.key = entity.getKey();
    schema.value = entity.getValue();
    schema.description = entity.getDescription();
    schema.createdAt = entity.getCreatedAt();
    schema.updatedAt = entity.getUpdatedAt();
    return schema;
  }

  /**
   * TypeORM Schema → Domain Entity
   */
  static toDomain(schema: CoinSettingSchema): CoinSetting {
    return CoinSetting.reconstruct(
      schema.key,
      schema.value,
      schema.description,
      schema.createdAt,
      schema.updatedAt,
    );
  }

  /**
   * TypeORM Schema配列 → Domain Entity配列
   */
  static toDomainList(schemas: CoinSettingSchema[]): CoinSetting[] {
    return schemas.map((schema) => this.toDomain(schema));
  }
}
