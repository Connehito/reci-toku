/**
 * DIトークン定数
 * Magic stringの代わりにSymbolを使用して型安全なDIを実現
 */
export const TOKENS = {
  // Infrastructure Services
  ISecretsService: Symbol('ISecretsService'),
  IEncryptionService: Symbol('IEncryptionService'),
  ITransactionManager: Symbol('ITransactionManager'),

  // Repositories
  IUserCoinRepository: Symbol('IUserCoinRepository'),
  ICoinTransactionRepository: Symbol('ICoinTransactionRepository'),
  IRewardRepository: Symbol('IRewardRepository'),
  ICampaignRepository: Symbol('ICampaignRepository'),
  ICoinSettingRepository: Symbol('ICoinSettingRepository'),
} as const;

// 型定義（オプション、型チェック強化用）
export type TokenType = typeof TOKENS;
