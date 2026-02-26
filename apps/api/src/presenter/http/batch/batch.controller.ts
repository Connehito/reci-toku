import { Controller, Post, Logger } from '@nestjs/common';
import { ExpireCoinsUseCase } from '../../../usecase/batch/expire-coins.usecase';
import { ExpireCoinsResultDto } from '../../../usecase/batch/dto/expire-coins-result.dto';

/**
 * バッチコントローラー
 *
 * バッチ処理の手動実行エンドポイント。
 * 本番環境ではECS Scheduled Tasksから呼び出される想定。
 */
@Controller('api/batch')
export class BatchController {
  private readonly logger = new Logger(BatchController.name);

  constructor(private readonly expireCoinsUseCase: ExpireCoinsUseCase) {}

  /**
   * コイン失効バッチを実行
   *
   * @returns バッチ実行結果
   *
   * @example
   * POST /api/batch/expire-coins
   * Response: { "totalProcessed": 5, "totalExpired": 1500, "totalFailed": 0, "failedUserIds": [], "elapsedMs": 123 }
   */
  @Post('expire-coins')
  async expireCoins(): Promise<ExpireCoinsResultDto> {
    this.logger.log('コイン失効バッチ手動実行リクエスト受信');

    return await this.expireCoinsUseCase.execute();
  }
}
