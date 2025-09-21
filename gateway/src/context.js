const jwt = require('jsonwebtoken');
const createProductLoader = require('./loaders/productLoader');
const QueryLoader = require('./loaders/queryLoader');

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
  'viewer': 1,
  'operator': 2,
  'manager': 3,
  'admin': 4
};

function getUserFromHeader(req) {
  const auth = req.headers.authorization || '';
  if (!auth) {
    throw new Error('Authorization header required');
  }
  
  const token = auth.replace('Bearer ', '');
  if (!token) {
    throw new Error('Bearer token required');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
    
    // Ensure user has required fields
    if (!decoded.userId || !decoded.roles || !Array.isArray(decoded.roles)) {
      throw new Error('Invalid token structure');
    }
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      roles: decoded.roles,
      permissions: decoded.permissions || []
    };
  } catch (e) {
    if (e.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (e.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw e;
  }
}

function hasPermission(user, requiredRoles = [], requiredPermissions = []) {
  // Check roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole = user.roles.some(role => requiredRoles.includes(role));
    if (!hasRequiredRole) {
      return false;
    }
  }
  
  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.every(permission => 
      user.permissions.includes(permission)
    );
    if (!hasRequiredPermission) {
      return false;
    }
  }
  
  return true;
}

function createContext(req) {
  let user = null;
  let authError = null;
  
  try {
    user = getUserFromHeader(req);
  } catch (error) {
    authError = error.message;
  }
  
  const queryLoader = new QueryLoader();
  
  return {
    user,
    authError,
    loaders: {
      product: createProductLoader(),
    },
    requestId: req.headers['x-request-id'] || require('crypto').randomUUID(),
    queryLoader,
    hasPermission: (requiredRoles, requiredPermissions) => 
      user ? hasPermission(user, requiredRoles, requiredPermissions) : false,
    isAuthenticated: () => user !== null,
    getUserRoles: () => user ? user.roles : [],
    getUserPermissions: () => user ? user.permissions : []
  };
}

module.exports = { createContext };
