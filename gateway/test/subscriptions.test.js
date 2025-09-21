const { generateTestToken } = require('./utils/testHelpers');

// Mock WebSocket for subscription testing
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1 // OPEN
};

// Mock pubsub for testing
const mockPubsub = {
  publish: jest.fn(),
  asyncIterator: jest.fn(() => ({
    [Symbol.asyncIterator]: async function* () {
      yield { workOrderUpdated: { id: 'WO-001', moId: 'MO-001', status: 'COMPLETED' } };
    }
  }))
};

// Mock the pubsub module
jest.mock('../src/pubsub', () => mockPubsub);

describe('Subscription Tests', () => {
  let adminToken;
  let operatorToken;

  beforeAll(() => {
    adminToken = generateTestToken('admin');
    operatorToken = generateTestToken('operator');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Work Order Subscription', () => {
    test('should allow admin to subscribe to work order updates', () => {
      const { workOrderUpdated } = require('../src/resolvers').Subscription;
      
      // Mock context with admin user
      const context = {
        hasPermission: jest.fn(() => true),
        getUserRoles: jest.fn(() => ['admin'])
      };
      
      const subscription = workOrderUpdated.subscribe(null, null, context);
      
      expect(subscription).toBeDefined();
      expect(mockPubsub.asyncIterator).toHaveBeenCalledWith(['WO_COMPLETED']);
    });

    test('should allow operator to subscribe to work order updates', () => {
      const { workOrderUpdated } = require('../src/resolvers').Subscription;
      
      // Mock context with operator user
      const context = {
        hasPermission: jest.fn(() => true),
        getUserRoles: jest.fn(() => ['operator'])
      };
      
      const subscription = workOrderUpdated.subscribe(null, null, context);
      
      expect(subscription).toBeDefined();
      expect(mockPubsub.asyncIterator).toHaveBeenCalledWith(['WO_COMPLETED']);
    });

    test('should deny viewer from subscribing to work order updates', () => {
      const { workOrderUpdated } = require('../src/resolvers').Subscription;
      
      // Mock context with viewer user (should fail permission check)
      const context = {
        hasPermission: jest.fn(() => false),
        getUserRoles: jest.fn(() => ['viewer'])
      };
      
      expect(() => {
        workOrderUpdated.subscribe(null, null, context);
      }).toThrow('Insufficient permissions to subscribe to work order updates');
    });
  });

  describe('Inventory Subscription', () => {
    test('should allow admin to subscribe to inventory updates', () => {
      const { inventoryUpdated } = require('../src/resolvers').Subscription;
      
      // Mock context with admin user
      const context = {
        hasPermission: jest.fn(() => true),
        getUserRoles: jest.fn(() => ['admin'])
      };
      
      const subscription = inventoryUpdated.subscribe(null, null, context);
      
      expect(subscription).toBeDefined();
      expect(mockPubsub.asyncIterator).toHaveBeenCalledWith(['STOCK_RESERVED']);
    });

    test('should allow viewer to subscribe to inventory updates', () => {
      const { inventoryUpdated } = require('../src/resolvers').Subscription;
      
      // Mock context with viewer user
      const context = {
        hasPermission: jest.fn(() => true),
        getUserRoles: jest.fn(() => ['viewer'])
      };
      
      const subscription = inventoryUpdated.subscribe(null, null, context);
      
      expect(subscription).toBeDefined();
      expect(mockPubsub.asyncIterator).toHaveBeenCalledWith(['STOCK_RESERVED']);
    });
  });

  describe('Subscription Triggers', () => {
    test('completeWorkOrder should trigger workOrderUpdated subscription', async () => {
      const { completeWorkOrder } = require('../src/resolvers').Mutation;
      
      // Mock context
      const context = {
        hasPermission: jest.fn(() => true),
        requestId: 'test-request-id'
      };
      
      // Mock fetch response
      const fetch = require('node-fetch');
      fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          id: 'WO-001',
          moId: 'MO-001',
          status: 'COMPLETED'
        })
      });
      
      const result = await completeWorkOrder(null, { id: 'WO-001' }, context);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('WO-001');
      expect(mockPubsub.publish).toHaveBeenCalledWith('WO_COMPLETED', {
        workOrderUpdated: result
      });
    });

    test('reserveStock should trigger inventoryUpdated subscription', async () => {
      const { reserveStock } = require('../src/resolvers').Mutation;
      
      // Mock context
      const context = {
        hasPermission: jest.fn(() => true),
        requestId: 'test-request-id'
      };
      
      // Mock fetch response
      const fetch = require('node-fetch');
      fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          productId: '1',
          qtyAvailable: 95,
          qtyReserved: 5
        })
      });
      
      const result = await reserveStock(null, { productId: '1', qty: 5.0 }, context);
      
      expect(result).toBeDefined();
      expect(result.productId).toBe('1');
      expect(mockPubsub.publish).toHaveBeenCalledWith('STOCK_RESERVED', {
        inventoryUpdated: result
      });
    });
  });

  describe('Subscription Data Flow', () => {
    test('should verify subscription data structure', async () => {
      const { workOrderUpdated } = require('../src/resolvers').Subscription;
      
      const context = {
        hasPermission: jest.fn(() => true),
        getUserRoles: jest.fn(() => ['admin'])
      };
      
      const subscription = workOrderUpdated.subscribe(null, null, context);
      
      // Test the async iterator
      const iterator = subscription[Symbol.asyncIterator]();
      const result = await iterator.next();
      
      expect(result.value).toBeDefined();
      expect(result.value.workOrderUpdated).toBeDefined();
      expect(result.value.workOrderUpdated.id).toBe('WO-001');
      expect(result.value.workOrderUpdated.moId).toBe('MO-001');
      expect(result.value.workOrderUpdated.status).toBe('COMPLETED');
    });
  });
});
