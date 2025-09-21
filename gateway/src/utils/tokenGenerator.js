const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret';

// Demo users with different roles
const DEMO_USERS = {
  admin: {
    userId: 'admin-001',
    email: 'admin@manufacturing.com',
    roles: ['admin'],
    permissions: ['read', 'write', 'delete', 'manage_users']
  },
  manager: {
    userId: 'manager-001',
    email: 'manager@manufacturing.com',
    roles: ['manager'],
    permissions: ['read', 'write', 'manage_orders']
  },
  operator: {
    userId: 'operator-001',
    email: 'operator@manufacturing.com',
    roles: ['operator'],
    permissions: ['read', 'execute_orders']
  },
  viewer: {
    userId: 'viewer-001',
    email: 'viewer@manufacturing.com',
    roles: ['viewer'],
    permissions: ['read']
  }
};

function generateToken(userType, expiresIn = '24h') {
  const user = DEMO_USERS[userType];
  if (!user) {
    throw new Error(`Invalid user type: ${userType}. Valid types: ${Object.keys(DEMO_USERS).join(', ')}`);
  }
  
  return jwt.sign(user, JWT_SECRET, { expiresIn });
}

function generateAllTokens() {
  const tokens = {};
  Object.keys(DEMO_USERS).forEach(userType => {
    tokens[userType] = generateToken(userType);
  });
  return tokens;
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

module.exports = {
  generateToken,
  generateAllTokens,
  verifyToken,
  DEMO_USERS
};
