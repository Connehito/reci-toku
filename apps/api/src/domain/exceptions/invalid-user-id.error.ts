/**
 * 不正なユーザーIDエラー
 *
 * Domain層の例外クラス（フレームワーク非依存）
 * ユーザーIDが0以下など不正な値の場合にスローされる
 */
export class InvalidUserIdError extends Error {
  constructor(userId: number) {
    super(`不正なユーザーIDです: ${userId}`);
    this.name = 'InvalidUserIdError';
  }
}
