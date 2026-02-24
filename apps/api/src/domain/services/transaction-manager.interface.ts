import { IRewardRepository } from '../repositories/reward.repository.interface';
import { IUserCoinRepository } from '../repositories/user-coin.repository.interface';
import { ICoinTransactionRepository } from '../repositories/coin-transaction.repository.interface';

/**
 * UnitOfWork - トランザクション内で使用するリポジトリ群
 *
 * このインターフェース経由で取得したリポジトリは、
 * すべて同一トランザクション内で動作することが保証される
 */
export interface UnitOfWork {
  rewardRepository: IRewardRepository;
  userCoinRepository: IUserCoinRepository;
  coinTransactionRepository: ICoinTransactionRepository;
}

/**
 * トランザクション管理の抽象化
 * ORM実装の詳細（TypeORM、Prismaなど）をUseCaseから隠蔽する
 *
 * Clean Architecture原則:
 * - UseCase層はデータベースの実装詳細を知らない
 * - 将来、他のORMに切り替えてもUseCase層は変更不要
 */
export interface ITransactionManager {
  /**
   * トランザクション内で処理を実行
   * UnitOfWork経由のリポジトリ操作はすべて同一トランザクションで実行される
   * @param work - トランザクション内で実行する処理（UnitOfWorkを受け取る）
   * @returns 処理結果
   */
  execute<T>(work: (uow: UnitOfWork) => Promise<T>): Promise<T>;
}
