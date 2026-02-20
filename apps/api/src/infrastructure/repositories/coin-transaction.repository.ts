import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICoinTransactionRepository } from '../../domain/repositories/coin-transaction.repository.interface';
import { CoinTransaction, TransactionType } from '../../domain/entities/coin-transaction.entity';
import { CoinTransactionSchema } from '../database/schemas/coin-transaction.schema';
import { CoinTransactionMapper } from '../database/mappers/coin-transaction.mapper';

/**
 * CoinTransactionRepository - コイン取引履歴リポジトリの実装
 *
 * Infrastructure層でDomain層のICoinTransactionRepositoryを実装
 */
@Injectable()
export class CoinTransactionRepository implements ICoinTransactionRepository {
  constructor(
    @InjectRepository(CoinTransactionSchema)
    private readonly coinTransactionSchemaRepository: Repository<CoinTransactionSchema>,
  ) {}

  async findById(id: string): Promise<CoinTransaction | null> {
    const schema = await this.coinTransactionSchemaRepository.findOne({
      where: { id },
    });
    return schema ? CoinTransactionMapper.toDomain(schema) : null;
  }

  async findByUserId(userId: number, limit?: number): Promise<CoinTransaction[]> {
    const schemas = await this.coinTransactionSchemaRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return CoinTransactionMapper.toDomainList(schemas);
  }

  async findByUserIdAndType(
    userId: number,
    transactionType: TransactionType,
    limit?: number,
  ): Promise<CoinTransaction[]> {
    const schemas = await this.coinTransactionSchemaRepository.find({
      where: { userId, transactionType },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return CoinTransactionMapper.toDomainList(schemas);
  }

  async findByRewardId(rewardId: string): Promise<CoinTransaction | null> {
    const schema = await this.coinTransactionSchemaRepository.findOne({
      where: { rewardId },
    });
    return schema ? CoinTransactionMapper.toDomain(schema) : null;
  }

  async findByUserIdWithPagination(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<{ transactions: CoinTransaction[]; total: number }> {
    const [schemas, total] = await this.coinTransactionSchemaRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      transactions: CoinTransactionMapper.toDomainList(schemas),
      total,
    };
  }

  async save(transaction: CoinTransaction): Promise<void> {
    const schema = CoinTransactionMapper.toSchema(transaction);
    await this.coinTransactionSchemaRepository.save(schema);
  }
}
