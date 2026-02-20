import { Module } from '@nestjs/common';
import { ProcessWebhookUseCase } from '../usecase/webhook/process-webhook.usecase';
import { WebhookController } from '../presenter/http/webhook/webhook.controller';

/**
 * Webhook Module
 *
 * Webhook受信関連のUseCase、Controllerを管理
 * InfrastructureModule、RepositoryModuleから必要なサービスをインポート
 */
@Module({
  providers: [ProcessWebhookUseCase],
  controllers: [WebhookController],
})
export class WebhookModule {}
