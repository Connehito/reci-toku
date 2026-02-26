import { Injectable, Inject } from '@nestjs/common';
import { TOKENS } from '../../domain/tokens';
import { ISecretsService } from '../../domain/services/secrets.service.interface';
import { IEncryptionService } from '../../domain/services/encryption.service.interface';
import { InvalidUserIdError } from '../../domain/exceptions/invalid-user-id.error';

/**
 * JWEトークン生成UseCase
 *
 * Performance Media Network連携用の認証トークンを生成する
 *
 * Clean Architecture原則:
 * - Domain層のInterfaceにのみ依存
 * - Infrastructure層の具象クラスに依存しない
 * - ビジネスロジックをフレームワークから独立させる
 */
@Injectable()
export class GenerateJweTokenUseCase {
  constructor(
    @Inject(TOKENS.ISecretsService)
    private readonly secretsService: ISecretsService,
    @Inject(TOKENS.IEncryptionService)
    private readonly encryptionService: IEncryptionService,
  ) {}

  /**
   * JWEトークンを生成
   *
   * @param userId - ユーザーID
   * @returns JWEトークン（文字列）
   */
  async execute(userId: number): Promise<string> {
    // ユーザーIDのバリデーション
    if (!userId || userId <= 0) {
      throw new InvalidUserIdError(userId);
    }

    // Secrets Managerから暗号化鍵とclient_id取得
    const { encryptionKey, clientId } = await this.secretsService.getPMNCredentials();

    // Payload作成（Performance Media Network仕様）
    const payload = {
      media_user_code: userId.toString(),
    };

    // JWE生成
    const jweToken = await this.encryptionService.encryptJWE(payload, clientId, encryptionKey);

    return jweToken;
  }
}
