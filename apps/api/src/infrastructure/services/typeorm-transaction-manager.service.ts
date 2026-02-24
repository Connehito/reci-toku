import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  ITransactionManager,
  UnitOfWork,
} from '../../domain/services/transaction-manager.interface';
import { RewardRepository } from '../repositories/reward.repository';
import { UserCoinRepository } from '../repositories/user-coin.repository';
import { CoinTransactionRepository } from '../repositories/coin-transaction.repository';
import { RewardSchema } from '../database/schemas/reward.schema';
import { UserCoinSchema } from '../database/schemas/user-coin.schema';
import { CoinTransactionSchema } from '../database/schemas/coin-transaction.schema';

/**
 * TypeORMを使用したトランザクション管理サービス
 *
 * QueryRunnerを使用して明示的にトランザクションを管理する
 * UnitOfWork経由で取得したリポジトリは、すべて同一トランザクション内で動作する
 *
 * Clean Architecture原則:
 * - Domain層のITransactionManagerを実装
 * - TypeORMの詳細をDomain層・UseCase層から隠蔽
 */
@Injectable()
export class TypeOrmTransactionManager implements ITransactionManager {
  private readonly logger = new Logger(TypeOrmTransactionManager.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute<T>(work: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // トランザクション用のリポジトリを生成
      const uow: UnitOfWork = {
        rewardRepository: new RewardRepository(
          queryRunner.manager.getRepository(RewardSchema),
        ),
        userCoinRepository: new UserCoinRepository(
          queryRunner.manager.getRepository(UserCoinSchema),
        ),
        coinTransactionRepository: new CoinTransactionRepository(
          queryRunner.manager.getRepository(CoinTransactionSchema),
        ),
      };

      const result = await work(uow);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('トランザクション実行中にエラーが発生しました', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
