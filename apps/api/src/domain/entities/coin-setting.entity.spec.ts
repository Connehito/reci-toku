import { CoinSetting } from './coin-setting.entity';

describe('CoinSetting Entity', () => {
  describe('create', () => {
    it('新しいCoinSettingを作成できる', () => {
      // Act
      const coinSetting = CoinSetting.create('max_coin_balance', '10000', '保有可能な最大コイン数');

      // Assert
      expect(coinSetting.getKey()).toBe('max_coin_balance');
      expect(coinSetting.getValue()).toBe('10000');
      expect(coinSetting.getDescription()).toBe('保有可能な最大コイン数');
      expect(coinSetting.getCreatedAt()).toBeInstanceOf(Date);
      expect(coinSetting.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('descriptionなしでCoinSettingを作成できる', () => {
      // Act
      const coinSetting = CoinSetting.create('coin_expire_days', '180', null);

      // Assert
      expect(coinSetting.getKey()).toBe('coin_expire_days');
      expect(coinSetting.getValue()).toBe('180');
      expect(coinSetting.getDescription()).toBeNull();
    });
  });

  describe('reconstruct', () => {
    it('既存のCoinSettingを復元できる', () => {
      // Act
      const coinSetting = CoinSetting.reconstruct(
        'max_coin_balance',
        '10000',
        '保有可能な最大コイン数',
        new Date('2024-01-01T00:00:00Z'),
        new Date('2025-01-15T00:00:00Z'),
      );

      // Assert
      expect(coinSetting.getKey()).toBe('max_coin_balance');
      expect(coinSetting.getValue()).toBe('10000');
      expect(coinSetting.getCreatedAt()).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(coinSetting.getUpdatedAt()).toEqual(new Date('2025-01-15T00:00:00Z'));
    });
  });

  describe('validate', () => {
    it('keyが空の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => CoinSetting.create('', '10000', '説明')).toThrow('設定キーは必須です');
    });

    it('valueが空の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => CoinSetting.create('max_coin_balance', '', '説明')).toThrow('設定値は必須です');
    });
  });

  describe('updateValue', () => {
    it('設定値を更新できる', () => {
      // Arrange
      const coinSetting = CoinSetting.create('max_coin_balance', '10000', '説明');

      // Act
      coinSetting.updateValue('20000');

      // Assert
      expect(coinSetting.getValue()).toBe('20000');
    });

    it('空の値には更新できない', () => {
      // Arrange
      const coinSetting = CoinSetting.create('max_coin_balance', '10000', '説明');

      // Act & Assert
      expect(() => coinSetting.updateValue('')).toThrow('設定値は必須です');
    });
  });

  describe('updateDescription', () => {
    it('説明を更新できる', () => {
      // Arrange
      const coinSetting = CoinSetting.create('max_coin_balance', '10000', '説明');

      // Act
      coinSetting.updateDescription('新しい説明');

      // Assert
      expect(coinSetting.getDescription()).toBe('新しい説明');
    });

    it('説明をnullに設定できる', () => {
      // Arrange
      const coinSetting = CoinSetting.create('max_coin_balance', '10000', '説明');

      // Act
      coinSetting.updateDescription(null);

      // Assert
      expect(coinSetting.getDescription()).toBeNull();
    });
  });

  describe('getValueAsNumber', () => {
    it('数値型の設定値を取得できる', () => {
      // Arrange
      const coinSetting = CoinSetting.create('max_coin_balance', '10000', '説明');

      // Act
      const value = coinSetting.getValueAsNumber();

      // Assert
      expect(value).toBe(10000);
      expect(typeof value).toBe('number');
    });

    it('数値に変換できない場合はエラーをスローする', () => {
      // Arrange
      const coinSetting = CoinSetting.create('key', 'not_a_number', '説明');

      // Act & Assert
      expect(() => coinSetting.getValueAsNumber()).toThrow(
        '設定値"not_a_number"は数値に変換できません',
      );
    });

    it('浮動小数点数も正しく変換される', () => {
      // Arrange
      const coinSetting = CoinSetting.create('exchange_rate', '1.5', '説明');

      // Act
      const value = coinSetting.getValueAsNumber();

      // Assert
      expect(value).toBe(1.5);
    });
  });

  describe('getValueAsBoolean', () => {
    it('"true"をbooleanのtrueに変換できる', () => {
      // Arrange
      const coinSetting = CoinSetting.create('enable_coin_system', 'true', '説明');

      // Act
      const value = coinSetting.getValueAsBoolean();

      // Assert
      expect(value).toBe(true);
    });

    it('"false"をbooleanのfalseに変換できる', () => {
      // Arrange
      const coinSetting = CoinSetting.create('enable_coin_system', 'false', '説明');

      // Act
      const value = coinSetting.getValueAsBoolean();

      // Assert
      expect(value).toBe(false);
    });

    it('"1"をbooleanのtrueに変換できる', () => {
      // Arrange
      const coinSetting = CoinSetting.create('enable_coin_system', '1', '説明');

      // Act
      const value = coinSetting.getValueAsBoolean();

      // Assert
      expect(value).toBe(true);
    });

    it('"0"をbooleanのfalseに変換できる', () => {
      // Arrange
      const coinSetting = CoinSetting.create('enable_coin_system', '0', '説明');

      // Act
      const value = coinSetting.getValueAsBoolean();

      // Assert
      expect(value).toBe(false);
    });

    it('その他の文字列はエラーをスローする', () => {
      // Arrange
      const coinSetting = CoinSetting.create('enable_coin_system', 'invalid', '説明');

      // Act & Assert
      expect(() => coinSetting.getValueAsBoolean()).toThrow(
        '設定値"invalid"は真偽値に変換できません',
      );
    });
  });
});
