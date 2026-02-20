import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Logger,
  BadRequestException,
  DefaultValuePipe,
} from '@nestjs/common';
import { GetCoinBalanceUseCase } from '../../../usecase/coin/get-coin-balance.usecase';
import { InvalidUserIdError } from '../../../domain/exceptions/invalid-user-id.error';
import { GetCoinHistoryUseCase } from '../../../usecase/coin/get-coin-history.usecase';

/**
 * コインコントローラー
 *
 * コイン残高照会、取引履歴のエンドポイント
 */
@Controller('api/coin')
export class CoinController {
  private readonly logger = new Logger(CoinController.name);

  constructor(
    private readonly getCoinBalanceUseCase: GetCoinBalanceUseCase,
    private readonly getCoinHistoryUseCase: GetCoinHistoryUseCase,
  ) {}

  /**
   * コイン残高照会
   *
   * @param userId - ユーザーID（パスパラメータ）
   * @returns コイン残高レスポンス
   *
   * @example
   * GET /api/coin/balance/12345
   * Response: { "balance": 100, "lastEarnedAt": "2026-02-20T10:00:00.000Z", "expiresAt": "2026-08-19T10:00:00.000Z" }
   */
  @Get('balance/:userId')
  async getBalance(@Param('userId', ParseIntPipe) userId: number) {
    try {
      this.logger.log(`コイン残高照会リクエスト: userId=${userId}`);

      return await this.getCoinBalanceUseCase.execute(userId);
    } catch (error) {
      this.logger.error(
        `コイン残高照会エラー: userId=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );

      if (error instanceof InvalidUserIdError) {
        throw new BadRequestException('不正なユーザーIDです');
      }

      throw error;
    }
  }

  /**
   * コイン取引履歴取得
   *
   * @param userId - ユーザーID（パスパラメータ）
   * @param limit - 取得件数（クエリパラメータ、デフォルト20）
   * @param offset - スキップ件数（クエリパラメータ、デフォルト0）
   * @returns コイン取引履歴レスポンス
   *
   * @example
   * GET /api/coin/history/12345?limit=10&offset=0
   * Response: { "transactions": [...], "total": 100, "limit": 10, "offset": 0 }
   */
  @Get('history/:userId')
  async getHistory(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    try {
      this.logger.log(
        `コイン取引履歴照会リクエスト: userId=${userId}, limit=${limit}, offset=${offset}`,
      );

      return await this.getCoinHistoryUseCase.execute(userId, limit, offset);
    } catch (error) {
      this.logger.error(
        `コイン取引履歴照会エラー: userId=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );

      if (
        error instanceof Error &&
        (error.message === '不正なユーザーIDです' ||
          error.message.includes('取得件数') ||
          error.message.includes('スキップ件数'))
      ) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
