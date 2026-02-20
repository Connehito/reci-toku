import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProcessWebhookUseCase } from '../../../usecase/webhook/process-webhook.usecase';
import { WebhookPayloadDto } from '../../../usecase/webhook/dto/webhook-payload.dto';

/**
 * Webhookコントローラー
 *
 * Performance Media NetworkからのWebhook通知を受信し、コインを付与する
 *
 * エンドポイント: POST /api/webhook
 */
@Controller('api/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly processWebhookUseCase: ProcessWebhookUseCase,
  ) {}

  /**
   * Webhook受信
   *
   * @param payload - Webhookペイロード（DTOバリデーション）
   * @returns { status: string } - 処理ステータス
   *
   * @example
   * POST /api/webhook
   * Body: { "media_user_code": "12345", "incentive_points": 100, ... }
   * Response: { "status": "success" } or { "status": "already_processed" }
   */
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleWebhook(@Body() payload: WebhookPayloadDto) {
    try {
      this.logger.log(
        `Webhook受信: userId=${payload.media_user_code}, cashbackId=${payload.media_cashback_id}`,
      );

      await this.processWebhookUseCase.execute(payload);

      return { status: 'success' };
    } catch (error) {
      // べき等性（Application層チェック）: 既に処理済みの場合は200 OKを返す（リトライさせない）
      if (error instanceof Error && error.message === 'ALREADY_PROCESSED') {
        this.logger.warn(
          `重複したWebhookを受信（Application層）: cashbackId=${payload.media_cashback_id}`,
        );
        return { status: 'already_processed' };
      }

      // べき等性（DB制約チェック）: UNIQUE制約違反の場合は200 OKを返す（レースコンディション対策）
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error.code === 'ER_DUP_ENTRY' || error.code === '23505')
      ) {
        this.logger.warn(
          `重複したWebhookを受信（DB制約）: cashbackId=${payload.media_cashback_id}`,
        );
        return { status: 'already_processed' };
      }

      // キャンペーン未登録: 400 Bad Request（リトライさせない）
      if (
        error instanceof Error &&
        error.message.startsWith('キャンペーンが未登録です')
      ) {
        this.logger.error(
          `キャンペーン未登録: ${error.message}`,
          error.stack,
        );
        throw new BadRequestException('キャンペーンが未登録です');
      }

      // その他のエラー: 500 Internal Server Error（リトライさせる）
      this.logger.error('Webhook処理失敗', error);
      throw error;
    }
  }
}
