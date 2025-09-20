const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// Test user tokens
const TEST_USERS = {
  admin: {
    userId: 'admin-001',
    email: 'admin@test.com',
    roles: ['admin'],
    permissions: ['read', 'write', 'delete', 'manage_users']
  },
  manager: {
    userId: 'manager-001',
    email: 'manager@test.com',
    roles: ['manager'],
    permissions: ['read', 'write', 'manage_orders']
  },
  operator: {
    userId: 'operator-001',
    email: 'operator@test.com',
    roles: ['operator'],
    permissions: ['read', 'execute_orders']
  },
  viewer: {
    userId: 'viewer-001',
    email: 'viewer@test.com',
    roles: ['viewer'],
    permissions: ['read']
  }
};

function generateTestToken(userType, expiresIn = '1h') {
  const user = TEST_USERS[userType];
  if (!user) {
    throw new Error(`Invalid user type: ${userType}`);
  }
  return jwt.sign(user, JWT_SECRET, { expiresIn });
}

function createGraphQLRequest(query, variables = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return {
    query,
    variables,
    headers
  };
}

function expectGraphQLError(response, expectedMessage) {
  expect(response.body.errors).toBeDefined();
  expect(response.body.errors.length).toBeGreaterThan(0);
  expect(response.body.errors[0].message).toContain(expectedMessage);
}

function expectGraphQLSuccess(response) {
  expect(response.body.errors).toBeUndefined();
  expect(response.body.data).toBeDefined();
}

function expectUnauthorized(response) {
  expectGraphQLError(response, 'Authentication required');
}

function expectInsufficientPermissions(response) {
  expectGraphQLError(response, 'Insufficient permissions');
}

function expectQueryNotAllowed(response) {
  expectGraphQLError(response, 'Query not allowed in demo mode');
}

module.exports = {
  generateTestToken,
  createGraphQLRequest,
  expectGraphQLError,
  expectGraphQLSuccess,
  expectUnauthorized,
  expectInsufficientPermissions,
  expectQueryNotAllowed,
  TEST_USERS
};
