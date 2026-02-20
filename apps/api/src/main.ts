import { NestFactory } from '@nestjs/core';
import { Controller, Get, Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { InfrastructureModule } from './modules/infrastructure.module';
import { RepositoryModule } from './modules/repository.module';
import { AuthModule } from './modules/auth.module';

@Controller()
class AppController {
  @Get()
  getHello(): string {
    return 'Hello World from Nest.js API!';
  }
}

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    InfrastructureModule, // Infrastructure Serviceを全体で利用可能にする
    RepositoryModule, // Repository実装を全体で利用可能にする
    AuthModule, // 認証API
  ],
  controllers: [AppController],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
  // eslint-disable-next-line no-console
  console.log('API is running on: http://localhost:3000');
}

bootstrap();
