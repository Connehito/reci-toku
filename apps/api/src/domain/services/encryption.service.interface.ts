/**
 * 暗号化サービスのインターフェース
 * JWE暗号化の実装詳細（jose、その他のライブラリ）を隠蔽する
 */
export interface IEncryptionService {
  /**
   * JWE形式でペイロードを暗号化
   * @param payload - 暗号化対象のオブジェクト
   * @param clientId - クライアントID（JWE Header kid）
   * @param encryptionKey - Base64エンコードされた暗号化鍵
   * @returns JWEトークン（文字列）
   */
  encryptJWE(
    payload: Record<string, unknown>,
    clientId: string,
    encryptionKey: string,
  ): Promise<string>;

  /**
   * JWE形式の暗号化データを復号化
   * @param jwe - JWEトークン（文字列）
   * @param encryptionKey - Base64エンコードされた暗号化鍵
   * @returns 復号化されたオブジェクト
   */
  decryptJWE(jwe: string, encryptionKey: string): Promise<Record<string, unknown>>;
}
