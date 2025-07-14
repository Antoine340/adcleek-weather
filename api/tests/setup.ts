import 'dotenv/config';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = './test-weather.db';
process.env.PORT = '3001'; // Different port for tests

// Increase timeout for async operations
jest.setTimeout(30000);

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

afterAll(() => {
  console.log('✅ Test suite completed');
}); 