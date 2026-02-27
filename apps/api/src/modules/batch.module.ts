import { Module } from '@nestjs/common';
import { ExpireCoinsUseCase } from '../usecase/batch/expire-coins.usecase';
import { BatchController } from '../presenter/http/batch/batch.controller';

/**
 * Batch Module
 *
 * バッチ処理のUseCase、Controllerを管理
 * InfrastructureModule、RepositoryModuleから必要なサービスをインポート
 */
@Module({
  providers: [ExpireCoinsUseCase],
  controllers: [BatchController],
})
export class BatchModule {}
