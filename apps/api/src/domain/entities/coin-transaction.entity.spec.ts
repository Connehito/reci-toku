import { CoinTransaction, TransactionType } from './coin-transaction.entity';

describe('CoinTransaction Entity', () => {
  describe('createRewardTransaction', () => {
    it('REWARDタイプのトランザクションを作成できる', () => {
      // Act
      const transaction = CoinTransaction.createRewardTransaction(
        '1',
        100,
        500,
        1500,
        '200',
        'CASHBACK123',
        'レシートリワード獲得',
      );

      // Assert
      expect(transaction.getId()).toBe('1');
      expect(transaction.getUserId()).toBe(100);
      expect(transaction.getAmount()).toBe(500);
      expect(transaction.getBalanceAfter()).toBe(1500);
      expect(transaction.getTransactionType()).toBe(TransactionType.REWARD);
      expect(transaction.getRewardId()).toBe('200');
      expect(transaction.getMediaCashbackId()).toBe('CASHBACK123');
      expect(transaction.getDescription()).toBe('レシートリワード獲得');
      expect(transaction.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('amountが0以下の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() =>
        CoinTransaction.createRewardTransaction('1', 100, 0, 1000, '200', 'CASHBACK123', '説明'),
      ).toThrow('報酬の付与額は正の値である必要があります');

      expect(() =>
        CoinTransaction.createRewardTransaction('1', 100, -100, 1000, '200', 'CASHBACK123', '説明'),
      ).toThrow('報酬の付与額は正の値である必要があります');
    });
  });

  describe('createExchangeTransaction', () => {
    it('EXCHANGEタイプのトランザクションを作成できる', () => {
      // Act
      const transaction = CoinTransaction.createExchangeTransaction(
        '2',
        100,
        -1000,
        500,
        'ギフト券への交換',
      );

      // Assert
      expect(transaction.getId()).toBe('2');
      expect(transaction.getUserId()).toBe(100);
      expect(transaction.getAmount()).toBe(-1000);
      expect(transaction.getBalanceAfter()).toBe(500);
      expect(transaction.getTransactionType()).toBe(TransactionType.EXCHANGE);
      expect(transaction.getRewardId()).toBeNull();
      expect(transaction.getMediaCashbackId()).toBeNull();
      expect(transaction.getDescription()).toBe('ギフト券への交換');
    });

    it('amountが0以上の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => CoinTransaction.createExchangeTransaction('2', 100, 0, 500, '説明')).toThrow(
        '交換の消費額は負の値である必要があります',
      );

      expect(() => CoinTransaction.createExchangeTransaction('2', 100, 100, 500, '説明')).toThrow(
        '交換の消費額は負の値である必要があります',
      );
    });
  });

  describe('createExpireTransaction', () => {
    it('EXPIREタイプのトランザクションを作成できる', () => {
      // Act
      const transaction = CoinTransaction.createExpireTransaction(
        '3',
        100,
        -200,
        0,
        'コイン有効期限切れ',
      );

      // Assert
      expect(transaction.getId()).toBe('3');
      expect(transaction.getUserId()).toBe(100);
      expect(transaction.getAmount()).toBe(-200);
      expect(transaction.getBalanceAfter()).toBe(0);
      expect(transaction.getTransactionType()).toBe(TransactionType.EXPIRE);
      expect(transaction.getRewardId()).toBeNull();
      expect(transaction.getMediaCashbackId()).toBeNull();
      expect(transaction.getDescription()).toBe('コイン有効期限切れ');
    });

    it('amountが0以上の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => CoinTransaction.createExpireTransaction('3', 100, 0, 0, '説明')).toThrow(
        '失効額は負の値である必要があります',
      );

      expect(() => CoinTransaction.createExpireTransaction('3', 100, 100, 0, '説明')).toThrow(
        '失効額は負の値である必要があります',
      );
    });
  });

  describe('reconstruct', () => {
    it('既存のCoinTransactionを復元できる', () => {
      // Act
      const transaction = CoinTransaction.reconstruct(
        '1',
        100,
        500,
        1500,
        TransactionType.REWARD,
        '200',
        'CASHBACK123',
        'レシートリワード獲得',
        new Date('2025-01-01T00:00:00Z'),
      );

      // Assert
      expect(transaction.getId()).toBe('1');
      expect(transaction.getUserId()).toBe(100);
      expect(transaction.getAmount()).toBe(500);
      expect(transaction.getBalanceAfter()).toBe(1500);
      expect(transaction.getTransactionType()).toBe(TransactionType.REWARD);
      expect(transaction.getCreatedAt()).toEqual(new Date('2025-01-01T00:00:00Z'));
    });
  });
});
