/**
 * 不正なページネーションパラメータエラー
 *
 * Domain層の例外クラス（フレームワーク非依存）
 * limit/offsetが不正な値の場合にスローされる
 */
export class InvalidPaginationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPaginationError';
  }
}
