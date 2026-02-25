export interface PMNCredentials {
  encryptionKey: string; // Base64エンコードされた256bit鍵
  clientId: string; // Performance Media Network client_id
}

/**
 * シークレット管理サービスのインターフェース
 * AWS Secrets Managerなどの実装の詳細を隠蔽する
 */
export interface ISecretsService {
  /**
   * Performance Media Network連携用の認証情報を取得
   * @returns PMN認証情報（暗号化鍵とクライアントID）
   */
  getPMNCredentials(): Promise<PMNCredentials>;
}
