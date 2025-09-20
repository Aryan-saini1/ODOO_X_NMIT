# GraphQL Gateway Demo Guide

## 🚀 Quick Start

The GraphQL Gateway is now running with demo mode enabled, featuring:
- **Query Restrictions**: Only pre-defined persisted queries are allowed
- **JWT Authentication**: Bearer token required for all requests
- **Role-Based Access Control**: Different permissions for different user roles

## 📡 Endpoints

- **GraphQL**: `http://localhost:4000/graphql`
- **Demo Tokens**: `http://localhost:4000/demo/tokens`
- **Demo Info**: `http://localhost:4000/demo/info`

## 🔐 Authentication

### Get Demo Tokens
```bash
curl http://localhost:4000/demo/tokens
```

This returns JWT tokens for different user roles:
- **admin** - Full access to all operations
- **manager** - Can create/manage manufacturing orders
- **operator** - Can execute work orders and reserve stock
- **viewer** - Read-only access

### Use Tokens
Include the token in your GraphQL requests:
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"query": "query { manufacturingOrders { id moNumber status } }"}'
```

## 📋 Available Demo Queries

### 1. Get Manufacturing Orders
```graphql
query GetManufacturingOrders($status: String, $limit: Int) {
  manufacturingOrders(status: $status, limit: $limit) {
    id
    moNumber
    productId
    product {
      id
      sku
      name
    }
    quantity
    status
    bomSnapshot
  }
}
```
**Roles**: admin, manager, operator, viewer

### 2. Get Product Details
```graphql
query GetProduct($id: ID!) {
  product(id: $id) {
    id
    sku
    name
  }
}
```
**Roles**: admin, manager, operator, viewer

### 3. Get Inventory Status
```graphql
query GetInventory($productId: ID!) {
  inventory(productId: $productId) {
    productId
    qtyAvailable
    qtyReserved
  }
}
```
**Roles**: admin, manager, operator, viewer

### 4. Create Manufacturing Order
```graphql
mutation CreateManufacturingOrder($input: CreateMOInput!) {
  createManufacturingOrder(input: $input) {
    id
    moNumber
    productId
    product {
      id
      sku
      name
    }
    quantity
    status
    bomSnapshot
  }
}
```
**Roles**: admin, manager only

### 5. Start Work Order
```graphql
mutation StartWorkOrder($id: ID!) {
  startWorkOrder(id: $id) {
    id
    moId
    status
  }
}
```
**Roles**: admin, manager, operator

### 6. Complete Work Order
```graphql
mutation CompleteWorkOrder($id: ID!) {
  completeWorkOrder(id: $id) {
    id
    moId
    status
  }
}
```
**Roles**: admin, manager, operator

### 7. Reserve Stock
```graphql
mutation ReserveStock($productId: ID!, $qty: Float!) {
  reserveStock(productId: $productId, qty: $qty) {
    productId
    qtyAvailable
    qtyReserved
  }
}
```
**Roles**: admin, manager, operator

### 8. Subscribe to Work Order Updates
```graphql
subscription WorkOrderUpdates {
  workOrderUpdated {
    id
    moId
    status
  }
}
```
**Roles**: admin, manager, operator, viewer

### 9. Subscribe to Inventory Updates
```graphql
subscription InventoryUpdates {
  inventoryUpdated {
    productId
    qtyAvailable
    qtyReserved
  }
}
```
**Roles**: admin, manager, operator, viewer

## 🛡️ Security Features

### Query Restrictions
- In demo mode, only persisted queries are allowed
- Prevents heavy/complex queries that could impact performance
- All queries are pre-validated and role-checked

### Role-Based Access Control
- **viewer**: Read-only access to data and subscriptions
- **operator**: Can execute work orders and reserve stock
- **manager**: Can create and confirm manufacturing orders
- **admin**: Full access to all operations

### JWT Authentication
- All requests require valid JWT tokens
- Tokens include user roles and permissions
- Automatic token validation and expiration checking

## 🧪 Testing Examples

### Test with Admin Token
```bash
# Get admin token from /demo/tokens endpoint
ADMIN_TOKEN="your_admin_token_here"

# Create a manufacturing order (admin can do this)
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "query": "mutation { createManufacturingOrder(input: {productId: \"PROD-001\", quantity: 100}) { id moNumber status } }"
  }'
```

### Test with Viewer Token
```bash
# Get viewer token from /demo/tokens endpoint
VIEWER_TOKEN="your_viewer_token_here"

# Try to create a manufacturing order (should fail)
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -d '{
    "query": "mutation { createManufacturingOrder(input: {productId: \"PROD-001\", quantity: 100}) { id moNumber status } }"
  }'
# Expected: "Insufficient permissions to create manufacturing orders"
```

### Test Query Restriction
```bash
# Try a non-persisted query (should fail in demo mode)
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "query": "query { __schema { types { name } } }"
  }'
# Expected: "Query not allowed in demo mode"
```

## 🔧 Configuration

### Environment Variables
- `DEMO_MODE=true` - Enables query restrictions
- `JWT_SECRET` - Secret for JWT token signing
- `PORT=4000` - Server port

### Disable Demo Mode
To disable demo mode and allow all queries:
```bash
$env:DEMO_MODE="false"
node gateway\src\index.js
```

## 📁 File Structure

```
gateway/
├── persisted/           # Demo query definitions
│   ├── *.json         # Individual query files
│   └── README.md      # Query documentation
├── src/
│   ├── loaders/       # Data loaders and query loader
│   ├── resolvers/     # GraphQL resolvers with RBAC
│   ├── utils/         # Token generator utilities
│   └── context.js     # Enhanced context with auth
└── demo-config.js     # Demo configuration
```

## 🎯 Demo Scenarios

1. **Manufacturing Manager**: Use manager token to create and confirm manufacturing orders
2. **Production Operator**: Use operator token to start and complete work orders
3. **Inventory Viewer**: Use viewer token to monitor inventory and work order status
4. **System Admin**: Use admin token to perform all operations

The system now provides a secure, role-based manufacturing management platform with controlled access and query restrictions for demo purposes!
