// Demo configuration for the GraphQL Gateway
module.exports = {
  // Demo mode settings
  DEMO_MODE: true,
  JWT_SECRET: 'demo-secret-key-change-in-production',
  
  // Service URLs (for demo, these can be mock endpoints)
  MO_SERVICE: 'http://localhost:3001',
  INVENTORY_SERVICE: 'http://localhost:3002',
  PRODUCT_SERVICE: 'http://localhost:3003',
  
  // Server Configuration
  PORT: 4000,
  
  // Role definitions
  ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager', 
    OPERATOR: 'operator',
    VIEWER: 'viewer'
  },
  
  // Permission definitions
  PERMISSIONS: {
    READ: 'read',
    WRITE: 'write',
    DELETE: 'delete',
    MANAGE_USERS: 'manage_users',
    MANAGE_ORDERS: 'manage_orders',
    EXECUTE_ORDERS: 'execute_orders'
  }
};
