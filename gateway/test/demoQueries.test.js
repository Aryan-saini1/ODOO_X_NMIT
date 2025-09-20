const fs = require('fs');
const path = require('path');
const { generateTestToken } = require('./utils/testHelpers');

describe('Demo Queries Verification', () => {
  let demoQueries;

  beforeAll(() => {
    const demoQueriesPath = path.join(__dirname, 'demo-queries.json');
    demoQueries = JSON.parse(fs.readFileSync(demoQueriesPath, 'utf8'));
  });

  test('should have all required demo queries', () => {
    const requiredQueries = ['createMO', 'confirmMO', 'startWO', 'completeWO'];
    
    requiredQueries.forEach(query => {
      expect(demoQueries[query]).toBeDefined();
      expect(typeof demoQueries[query]).toBe('string');
      expect(demoQueries[query].length).toBeGreaterThan(0);
    });
  });

  test('createMO should be a valid mutation', () => {
    const createMO = demoQueries.createMO;
    expect(createMO).toContain('mutation');
    expect(createMO).toContain('createManufacturingOrder');
    expect(createMO).toContain('input:{productId:"1",quantity:10}');
    expect(createMO).toContain('{ id moNumber }');
  });

  test('confirmMO should be a valid mutation', () => {
    const confirmMO = demoQueries.confirmMO;
    expect(confirmMO).toContain('mutation');
    expect(confirmMO).toContain('confirmManufacturingOrder');
    expect(confirmMO).toContain('id:"MO-001"');
    expect(confirmMO).toContain('{ id moNumber status }');
  });

  test('startWO should be a valid mutation', () => {
    const startWO = demoQueries.startWO;
    expect(startWO).toContain('mutation');
    expect(startWO).toContain('startWorkOrder');
    expect(startWO).toContain('id:"WO-001"');
    expect(startWO).toContain('{ id moId status }');
  });

  test('completeWO should be a valid mutation', () => {
    const completeWO = demoQueries.completeWO;
    expect(completeWO).toContain('mutation');
    expect(completeWO).toContain('completeWorkOrder');
    expect(completeWO).toContain('id:"WO-001"');
    expect(completeWO).toContain('{ id moId status }');
  });

  test('should have additional useful queries', () => {
    expect(demoQueries.getMO).toBeDefined();
    expect(demoQueries.getProduct).toBeDefined();
    expect(demoQueries.getInventory).toBeDefined();
    expect(demoQueries.reserveStock).toBeDefined();
    expect(demoQueries.subscribeWO).toBeDefined();
    expect(demoQueries.subscribeInventory).toBeDefined();
  });

  test('should have valid GraphQL syntax for all queries', () => {
    Object.entries(demoQueries).forEach(([name, query]) => {
      // Basic GraphQL syntax validation
      expect(query).toMatch(/^(query|mutation|subscription)/);
      expect(query).toContain('{');
      expect(query).toContain('}');
      
      // Should not contain obvious syntax errors
      expect(query).not.toContain('{{');
      expect(query).not.toContain('}}');
    });
  });
});

describe('JWT Token Generation', () => {
  test('should generate valid tokens for all user roles', () => {
    const roles = ['admin', 'manager', 'operator', 'viewer'];
    
    roles.forEach(role => {
      const token = generateTestToken(role);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  test('should generate different tokens for different roles', () => {
    const adminToken = generateTestToken('admin');
    const managerToken = generateTestToken('manager');
    const operatorToken = generateTestToken('operator');
    const viewerToken = generateTestToken('viewer');
    
    expect(adminToken).not.toBe(managerToken);
    expect(managerToken).not.toBe(operatorToken);
    expect(operatorToken).not.toBe(viewerToken);
    expect(viewerToken).not.toBe(adminToken);
  });
});

describe('Query Loader Tests', () => {
  test('should load persisted queries correctly', () => {
    const QueryLoader = require('../src/loaders/queryLoader');
    const queryLoader = new QueryLoader();
    
    const persistedQueries = queryLoader.getAllPersistedQueries();
    expect(persistedQueries.length).toBeGreaterThan(0);
    
    // Check that we have the expected queries
    const queryIds = persistedQueries.map(q => q.id);
    expect(queryIds).toContain('createManufacturingOrder');
    expect(queryIds).toContain('confirmManufacturingOrder');
    expect(queryIds).toContain('startWorkOrder');
    expect(queryIds).toContain('completeWorkOrder');
  });

  test('should validate query permissions correctly', () => {
    const QueryLoader = require('../src/loaders/queryLoader');
    const queryLoader = new QueryLoader();
    
    // Test with admin role
    expect(queryLoader.hasRequiredRole(['admin'], ['admin', 'manager'])).toBe(true);
    expect(queryLoader.hasRequiredRole(['admin'], ['viewer'])).toBe(false);
    
    // Test with manager role
    expect(queryLoader.hasRequiredRole(['manager'], ['admin', 'manager'])).toBe(true);
    expect(queryLoader.hasRequiredRole(['manager'], ['operator'])).toBe(false);
    
    // Test with operator role
    expect(queryLoader.hasRequiredRole(['operator'], ['admin', 'manager', 'operator'])).toBe(true);
    expect(queryLoader.hasRequiredRole(['operator'], ['viewer'])).toBe(false);
    
    // Test with viewer role
    expect(queryLoader.hasRequiredRole(['viewer'], ['admin', 'manager', 'operator', 'viewer'])).toBe(true);
    expect(queryLoader.hasRequiredRole(['viewer'], ['admin'])).toBe(false);
  });
});
