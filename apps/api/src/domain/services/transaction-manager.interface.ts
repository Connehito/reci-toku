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
   * @param work - トランザクション内で実行する処理
   * @returns 処理結果
   */
  execute<T>(work: () => Promise<T>): Promise<T>;
}
