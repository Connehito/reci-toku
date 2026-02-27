import { Controller, Get, Param, ParseIntPipe, Logger, BadRequestException } from '@nestjs/common';
import { GetCoinBalanceUseCase } from '../../../usecase/coin/get-coin-balance.usecase';
import { InvalidUserIdError } from '../../../domain/exceptions/invalid-user-id.error';

/**
 * コインコントローラー
 *
 * コイン残高照会、取引履歴のエンドポイント
 */
@Controller('api/coin')
export class CoinController {
  private readonly logger = new Logger(CoinController.name);

  constructor(private readonly getCoinBalanceUseCase: GetCoinBalanceUseCase) {}

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
}
