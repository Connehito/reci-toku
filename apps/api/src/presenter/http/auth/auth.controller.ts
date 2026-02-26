import { Controller, Post, Body, ParseIntPipe, Logger, BadRequestException } from '@nestjs/common';
import { GenerateJweTokenUseCase } from '../../../usecase/auth/generate-jwe-token.usecase';
import { InvalidUserIdError } from '../../../domain/exceptions/invalid-user-id.error';

/**
 * 認証コントローラー
 *
 * Performance Media Network連携用のJWEトークンを生成するエンドポイント
 */
@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly generateJweTokenUseCase: GenerateJweTokenUseCase) {}

  /**
   * JWEトークン生成
   *
   * @param body - リクエストボディ { userId: number }
   * @returns { token: string } - JWEトークン
   *
   * @example
   * POST /api/auth/token
   * Body: { "userId": 12345 }
   * Response: { "token": "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwia2lkIjoiY2xpZW50X2lkIn0..." }
   */
  @Post('token')
  async generateToken(@Body('userId', ParseIntPipe) userId: number) {
    try {
      this.logger.log(`JWEトークン生成リクエスト: userId=${userId}`);

      const jweToken = await this.generateJweTokenUseCase.execute(userId);

      return { token: jweToken };
    } catch (error) {
      this.logger.error(
        `JWEトークン生成エラー: userId=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );

      if (error instanceof InvalidUserIdError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
