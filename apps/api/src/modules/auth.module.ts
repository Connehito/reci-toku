import { Module } from '@nestjs/common';
import { GenerateJweTokenUseCase } from '../usecase/auth/generate-jwe-token.usecase';
import { AuthController } from '../presenter/http/auth/auth.controller';

/**
 * Auth Module
 *
 * 認証関連のUseCase、Controllerを管理
 * 認証関連で利用するサービスは、@Global指定されたInfrastructureModuleから提供される
 */
@Module({
  providers: [GenerateJweTokenUseCase],
  controllers: [AuthController],
})
export class AuthModule {}
