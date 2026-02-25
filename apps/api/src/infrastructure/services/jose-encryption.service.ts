import { Injectable, Logger } from '@nestjs/common';
import * as jose from 'jose';
import { IEncryptionService } from '../../domain/services/encryption.service.interface';

/**
 * joseライブラリを使用したJWE暗号化サービス
 *
 * Performance Media Network仕様:
 * - アルゴリズム: A256GCM (AES-256-GCM)
 * - 鍵管理: Direct encryption (alg: dir)
 * - 初期化ベクタ (IV): 毎回ランダム生成（joseライブラリが自動処理）
 *
 * Clean Architecture原則:
 * - Domain層のIEncryptionServiceを実装
 * - joseライブラリの詳細をDomain層から隠蔽
 */
@Injectable()
export class JoseEncryptionService implements IEncryptionService {
  private readonly logger = new Logger(JoseEncryptionService.name);

  async encryptJWE(
    payload: Record<string, unknown>,
    clientId: string,
    encryptionKey: string,
  ): Promise<string> {
    try {
      const key = Buffer.from(encryptionKey, 'base64');

      const jwe = await new jose.CompactEncrypt(new TextEncoder().encode(JSON.stringify(payload)))
        .setProtectedHeader({
          alg: 'dir', // Direct encryption
          enc: 'A256GCM', // AES-256-GCM
          kid: clientId, // Performance Media Network要求仕様
        })
        .encrypt(key);

      return jwe;
    } catch (error) {
      this.logger.error('JWE暗号化に失敗しました', error);
      throw error;
    }
  }

  async decryptJWE(jwe: string, encryptionKey: string): Promise<Record<string, unknown>> {
    try {
      const key = Buffer.from(encryptionKey, 'base64');
      const { plaintext } = await jose.compactDecrypt(jwe, key);
      return JSON.parse(new TextDecoder().decode(plaintext));
    } catch (error) {
      this.logger.error('JWE復号化に失敗しました', error);
      throw error;
    }
  }
}
