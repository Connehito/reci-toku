import { Module } from '@nestjs/common';
import { ProcessWebhookUseCase } from '../usecase/webhook/process-webhook.usecase';
import { WebhookController } from '../presenter/http/webhook/webhook.controller';

/**
 * Webhook Module
 *
 * Webhook受信関連のUseCase、Controllerを管理
 * Webhook処理で利用するサービスは、@Global指定されたInfrastructureModule・RepositoryModuleから提供される
 */
@Module({
  providers: [ProcessWebhookUseCase],
  controllers: [WebhookController],
})
export class WebhookModule {}
