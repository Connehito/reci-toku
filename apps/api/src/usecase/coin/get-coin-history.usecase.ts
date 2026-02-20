import { Injectable, Inject, Logger } from '@nestjs/common';
import { TOKENS } from '../../domain/tokens';
import { ICoinTransactionRepository } from '../../domain/repositories/coin-transaction.repository.interface';
import { CoinHistoryResponseDto, CoinHistoryItemDto } from './dto/coin-history-response.dto';

/**
 * コイン取引履歴照会UseCase
 *
 * ユーザーのコイン取引履歴をページネーション対応で取得する
 *
 * Clean Architecture原則:
 * - Domain層のInterfaceにのみ依存
 * - Infrastructure層の具象クラスに依存しない
 */
@Injectable()
export class GetCoinHistoryUseCase {
  private readonly logger = new Logger(GetCoinHistoryUseCase.name);
  private readonly DEFAULT_LIMIT = 20; // デフォルト取得件数
  private readonly MAX_LIMIT = 100; // 最大取得件数

  constructor(
    @Inject(TOKENS.ICoinTransactionRepository)
    private readonly coinTransactionRepository: ICoinTransactionRepository,
  ) {}

  /**
   * コイン取引履歴を取得
   *
   * @param userId - ユーザーID
   * @param limit - 取得件数（デフォルト20、最大100）
   * @param offset - スキップ件数（デフォルト0）
   * @returns コイン取引履歴レスポンス
   */
  async execute(
    userId: number,
    limit: number = this.DEFAULT_LIMIT,
    offset: number = 0,
  ): Promise<CoinHistoryResponseDto> {
    this.logger.log(`コイン取引履歴照会: userId=${userId}, limit=${limit}, offset=${offset}`);

    // ユーザーIDのバリデーション
    if (!userId || userId <= 0) {
      throw new Error('不正なユーザーIDです');
    }

    // limitのバリデーション
    if (limit <= 0 || limit > this.MAX_LIMIT) {
      throw new Error(`取得件数は1以上${this.MAX_LIMIT}以下である必要があります`);
    }

    // offsetのバリデーション
    if (offset < 0) {
      throw new Error('スキップ件数は0以上である必要があります');
    }

    // 取引履歴取得（ページネーション）
    const { transactions, total } = await this.coinTransactionRepository.findByUserIdWithPagination(
      userId,
      limit,
      offset,
    );

    // Domain EntityをDTOに変換
    const transactionItems: CoinHistoryItemDto[] = transactions.map((tx) => ({
      id: tx.getId(),
      amount: tx.getAmount(),
      balanceAfter: tx.getBalanceAfter(),
      transactionType: tx.getTransactionType(),
      description: tx.getDescription(),
      createdAt: tx.getCreatedAt().toISOString(),
    }));

    return {
      transactions: transactionItems,
      total,
      limit,
      offset,
    };
  }
}
