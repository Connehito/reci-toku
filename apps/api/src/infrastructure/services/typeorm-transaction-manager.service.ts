import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ITransactionManager } from '../../domain/services/transaction-manager.interface';

/**
 * TypeORMを使用したトランザクション管理サービス
 *
 * Clean Architecture原則:
 * - Domain層のITransactionManagerを実装
 * - TypeORMの詳細をDomain層・UseCase層から隠蔽
 * - 将来、他のORM（Prisma等）に切り替えてもUseCase層は変更不要
 */
@Injectable()
export class TypeOrmTransactionManager implements ITransactionManager {
  private readonly logger = new Logger(TypeOrmTransactionManager.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute<T>(work: () => Promise<T>): Promise<T> {
    return await this.dataSource.transaction(async () => {
      try {
        return await work();
      } catch (error) {
        this.logger.error('トランザクション実行中にエラーが発生しました', error);
        throw error;
      }
    });
  }
}
