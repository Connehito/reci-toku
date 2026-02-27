import { UserCoin } from './user-coin.entity';
import { InvalidUserIdError } from '../exceptions/invalid-user-id.error';

describe('UserCoin Entity', () => {
  describe('create', () => {
    it('新しいUserCoinを作成できる', () => {
      // Act
      const userCoin = UserCoin.create(123);

      // Assert
      expect(userCoin.getUserId()).toBe(123);
      expect(userCoin.getBalance()).toBe(0);
      expect(userCoin.getLastEarnedAt()).toBeNull();
      expect(userCoin.getCreatedAt()).toBeInstanceOf(Date);
      expect(userCoin.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('userIdが0以下の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => UserCoin.create(0)).toThrow(InvalidUserIdError);
      expect(() => UserCoin.create(-1)).toThrow(InvalidUserIdError);
    });
  });

  describe('reconstruct', () => {
    it('既存のUserCoinを復元できる', () => {
      // Arrange
      const userId = 456;
      const balance = 1000;
      const lastEarnedAt = new Date('2025-01-01T00:00:00Z');
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2025-01-15T00:00:00Z');

      // Act
      const userCoin = UserCoin.reconstruct(userId, balance, lastEarnedAt, createdAt, updatedAt);

      // Assert
      expect(userCoin.getUserId()).toBe(456);
      expect(userCoin.getBalance()).toBe(1000);
      expect(userCoin.getLastEarnedAt()).toEqual(lastEarnedAt);
      expect(userCoin.getCreatedAt()).toEqual(createdAt);
      expect(userCoin.getUpdatedAt()).toEqual(updatedAt);
    });

    it('balanceが負の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => UserCoin.reconstruct(123, -100, null, new Date(), new Date())).toThrow(
        '残高は負の値にできません',
      );
    });
  });

  describe('addBalance', () => {
    it('コイン残高を加算できる', () => {
      // Arrange
      const userCoin = UserCoin.create(123);
      const initialBalance = userCoin.getBalance();

      // Act
      userCoin.addBalance(500);

      // Assert
      expect(userCoin.getBalance()).toBe(initialBalance + 500);
      expect(userCoin.getLastEarnedAt()).toBeInstanceOf(Date);
    });

    it('0以下の値を加算しようとするとエラーをスローする', () => {
      // Arrange
      const userCoin = UserCoin.create(123);

      // Act & Assert
      expect(() => userCoin.addBalance(0)).toThrow('加算額は正の値である必要があります');
      expect(() => userCoin.addBalance(-100)).toThrow('加算額は正の値である必要があります');
    });
  });

  describe('subtractBalance', () => {
    it('コイン残高を減算できる', () => {
      // Arrange
      const userCoin = UserCoin.reconstruct(123, 1000, new Date(), new Date(), new Date());

      // Act
      userCoin.subtractBalance(300);

      // Assert
      expect(userCoin.getBalance()).toBe(700);
    });

    it('0以下の値を減算しようとするとエラーをスローする', () => {
      // Arrange
      const userCoin = UserCoin.reconstruct(123, 1000, new Date(), new Date(), new Date());

      // Act & Assert
      expect(() => userCoin.subtractBalance(0)).toThrow('減算額は正の値である必要があります');
      expect(() => userCoin.subtractBalance(-100)).toThrow('減算額は正の値である必要があります');
    });

    it('残高不足の場合はエラーをスローする', () => {
      // Arrange
      const userCoin = UserCoin.reconstruct(123, 500, new Date(), new Date(), new Date());

      // Act & Assert
      expect(() => userCoin.subtractBalance(600)).toThrow('残高が不足しています');
    });
  });

  describe('expire', () => {
    it('コインを失効させることができる', () => {
      // Arrange
      const userCoin = UserCoin.reconstruct(123, 1000, new Date(), new Date(), new Date());

      // Act
      const expiredAmount = userCoin.expire();

      // Assert
      expect(expiredAmount).toBe(1000);
      expect(userCoin.getBalance()).toBe(0);
    });

    it('残高が0の場合は失効しない', () => {
      // Arrange
      const userCoin = UserCoin.create(123);

      // Act
      const expiredAmount = userCoin.expire();

      // Assert
      expect(expiredAmount).toBe(0);
      expect(userCoin.getBalance()).toBe(0);
    });
  });

  describe('isExpired', () => {
    it('有効期限内の場合はfalseを返す', () => {
      // Arrange（1日前に獲得したコイン、有効期限180日）
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const userCoin = UserCoin.reconstruct(123, 1000, oneDayAgo, new Date(), new Date());

      // Act
      const isExpired = userCoin.isExpired(180);

      // Assert
      expect(isExpired).toBe(false);
    });

    it('有効期限を過ぎている場合はtrueを返す', () => {
      // Arrange（200日前に獲得したコイン、有効期限180日）
      const longAgo = new Date();
      longAgo.setDate(longAgo.getDate() - 200);

      const userCoin = UserCoin.reconstruct(123, 1000, longAgo, new Date(), new Date());

      // Act
      const isExpired = userCoin.isExpired(180);

      // Assert
      expect(isExpired).toBe(true);
    });

    it('lastEarnedAtがnullの場合はfalseを返す', () => {
      // Arrange
      const userCoin = UserCoin.create(123);

      // Act
      const isExpired = userCoin.isExpired(180);

      // Assert
      expect(isExpired).toBe(false);
    });

    it('残高が0の場合はfalseを返す', () => {
      // Arrange（200日前に獲得したが残高0）
      const longAgo = new Date();
      longAgo.setDate(longAgo.getDate() - 200);

      const userCoin = UserCoin.reconstruct(123, 0, longAgo, new Date(), new Date());

      // Act
      const isExpired = userCoin.isExpired(180);

      // Assert
      expect(isExpired).toBe(false);
    });
  });
});
