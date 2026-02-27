module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.module.ts', // Moduleファイルはカバレッジ対象外
    '!src/config/**/*.ts', // 設定ファイルはカバレッジ対象外
    '!src/infrastructure/database/schemas/*.schema.ts', // TypeORM Schemaはカバレッジ対象外
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jose|uuid)/)', // jose, uuidライブラリをトランスパイル対象に含める
  ],
};
