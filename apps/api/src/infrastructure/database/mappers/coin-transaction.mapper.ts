import { CoinTransaction, TransactionType } from '../../../domain/entities/coin-transaction.entity';
import { CoinTransactionSchema } from '../schemas/coin-transaction.schema';

/**
 * CoinTransactionMapper - Domain Entity ⇔ TypeORM Schema 変換
 */
export class CoinTransactionMapper {
  /**
   * Domain Entity → TypeORM Schema
   */
  static toSchema(entity: CoinTransaction): CoinTransactionSchema {
    const schema = new CoinTransactionSchema();
    // IDがnullの場合はAUTO_INCREMENTに任せる
    const id = entity.getId();
    if (id !== null) {
      schema.id = id;
    }
    schema.userId = entity.getUserId();
    schema.amount = entity.getAmount();
    schema.balanceAfter = entity.getBalanceAfter();
    schema.transactionType = entity.getTransactionType();
    schema.rewardId = entity.getRewardId();
    schema.mediaCashbackId = entity.getMediaCashbackId();
    schema.description = entity.getDescription();
    schema.createdAt = entity.getCreatedAt();
    return schema;
  }

  /**
   * TypeORM Schema → Domain Entity
   */
  static toDomain(schema: CoinTransactionSchema): CoinTransaction {
    return CoinTransaction.reconstruct(
      schema.id,
      schema.userId,
      schema.amount,
      schema.balanceAfter,
      schema.transactionType as TransactionType,
      schema.rewardId,
      schema.mediaCashbackId,
      schema.description,
      schema.createdAt,
    );
  }

  /**
   * TypeORM Schema配列 → Domain Entity配列
   */
  static toDomainList(schemas: CoinTransactionSchema[]): CoinTransaction[] {
    return schemas.map((schema) => this.toDomain(schema));
  }
}
