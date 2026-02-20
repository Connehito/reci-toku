import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmTransactionManager } from './typeorm-transaction-manager.service';
import { DataSource } from 'typeorm';

describe('TypeOrmTransactionManager', () => {
  let service: TypeOrmTransactionManager;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    mockDataSource = {
      transaction: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmTransactionManager,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<TypeOrmTransactionManager>(
      TypeOrmTransactionManager,
    );
  });

  describe('execute', () => {
    it('正常にトランザクション内で処理を実行できる', async () => {
      // Arrange
      const mockWork = jest.fn().mockResolvedValue('success');
      mockDataSource.transaction.mockImplementation(
        async (work: any) => await work(),
      );

      // Act
      const result = await service.execute(mockWork);

      // Assert
      expect(result).toBe('success');
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockWork).toHaveBeenCalledTimes(1);
    });

    it('処理がエラーをスローした場合、そのエラーを再スローする', async () => {
      // Arrange
      const mockError = new Error('Test error');
      const mockWork = jest.fn().mockRejectedValue(mockError);
      mockDataSource.transaction.mockImplementation(async (work: any) => {
        return await work();
      });

      // Act & Assert
      await expect(service.execute(mockWork)).rejects.toThrow('Test error');
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('トランザクション内で複数の操作を実行できる', async () => {
      // Arrange
      const operation1 = jest.fn().mockResolvedValue('op1');
      const operation2 = jest.fn().mockResolvedValue('op2');
      const mockWork = jest.fn().mockImplementation(async () => {
        await operation1();
        await operation2();
        return 'completed';
      });
      mockDataSource.transaction.mockImplementation(
        async (work: any) => await work(),
      );

      // Act
      const result = await service.execute(mockWork);

      // Assert
      expect(result).toBe('completed');
      expect(operation1).toHaveBeenCalledTimes(1);
      expect(operation2).toHaveBeenCalledTimes(1);
    });

    it('トランザクション内で型安全な処理を実行できる', async () => {
      // Arrange
      interface TestResult {
        id: number;
        name: string;
      }
      const expectedResult: TestResult = { id: 1, name: 'test' };
      const mockWork = jest.fn().mockResolvedValue(expectedResult);
      mockDataSource.transaction.mockImplementation(
        async (work: any) => await work(),
      );

      // Act
      const result = await service.execute<TestResult>(mockWork);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result.id).toBe(1);
      expect(result.name).toBe('test');
    });
  });
});
