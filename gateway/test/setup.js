// Test setup file
process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'true';
process.env.JWT_SECRET = 'test-secret';
process.env.MO_SERVICE = 'http://localhost:3001';
process.env.INVENTORY_SERVICE = 'http://localhost:3002';
process.env.PRODUCT_SERVICE = 'http://localhost:3003';

// Mock external services
const mockFetch = jest.fn();

// Mock successful responses
mockFetch.mockImplementation((url) => {
  if (url.includes('/mo')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        id: 'MO-001',
        moNumber: 'MO-2024-001',
        productId: '1',
        quantity: 10,
        status: 'PENDING'
      })
    });
  }
  
  if (url.includes('/inventory')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        productId: '1',
        qtyAvailable: 100,
        qtyReserved: 0
      })
    });
  }
  
  if (url.includes('/products/batch')) {
    return Promise.resolve({
      json: () => Promise.resolve([{
        id: '1',
        sku: 'PROD-001',
        name: 'Test Product'
      }])
    });
  }
  
  return Promise.resolve({
    json: () => Promise.resolve({})
  });
});

// Mock the node-fetch module
jest.mock('node-fetch', () => mockFetch, { virtual: true });
