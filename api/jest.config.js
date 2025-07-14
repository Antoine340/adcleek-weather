module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts', // Exclude entry point
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  testTimeout: 30000, // 30 seconds timeout for API tests
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  globals: {
    'ts-jest': {
      useESM: false,
      isolatedModules: true
    }
  },
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
}; 