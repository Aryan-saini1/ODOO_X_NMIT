// Simple test to verify Jest setup works
describe('Jest Setup Test', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DEMO_MODE).toBe('true');
    expect(process.env.JWT_SECRET).toBe('test-secret');
  });

  test('should verify demo queries file exists', () => {
    const fs = require('fs');
    const path = require('path');
    
    const demoQueriesPath = path.join(__dirname, 'demo-queries.json');
    expect(fs.existsSync(demoQueriesPath)).toBe(true);
    
    const demoQueries = JSON.parse(fs.readFileSync(demoQueriesPath, 'utf8'));
    expect(demoQueries.createMO).toBeDefined();
    expect(demoQueries.confirmMO).toBeDefined();
    expect(demoQueries.startWO).toBeDefined();
    expect(demoQueries.completeWO).toBeDefined();
  });

  test('should verify test utilities work', () => {
    const { generateTestToken, TEST_USERS } = require('./utils/testHelpers');
    
    expect(TEST_USERS.admin).toBeDefined();
    expect(TEST_USERS.manager).toBeDefined();
    expect(TEST_USERS.operator).toBeDefined();
    expect(TEST_USERS.viewer).toBeDefined();
    
    const adminToken = generateTestToken('admin');
    expect(adminToken).toBeDefined();
    expect(typeof adminToken).toBe('string');
  });
});
