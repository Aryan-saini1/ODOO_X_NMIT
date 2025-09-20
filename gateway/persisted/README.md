# Demo Persisted Queries

This directory contains pre-defined GraphQL queries that are allowed during demo mode. Each query file includes:

- **query**: The GraphQL query string
- **variables**: Default variables for the query
- **description**: Human-readable description of what the query does
- **allowedRoles**: Array of user roles that can execute this query

## Available Demo Queries

### Queries (Read Operations)
- `getManufacturingOrders.json` - Get manufacturing orders with filtering
- `getProduct.json` - Get product details by ID
- `getInventory.json` - Get inventory status for a product

### Mutations (Write Operations)
- `createManufacturingOrder.json` - Create a new manufacturing order (admin/manager only)
- `confirmManufacturingOrder.json` - Confirm a manufacturing order (admin/manager only)
- `startWorkOrder.json` - Start a work order (admin/manager/operator)
- `completeWorkOrder.json` - Complete a work order (admin/manager/operator)
- `reserveStock.json` - Reserve stock for a product (admin/manager/operator)

### Subscriptions (Real-time Updates)
- `subscribeWorkOrderUpdates.json` - Subscribe to work order status changes
- `subscribeInventoryUpdates.json` - Subscribe to inventory updates

## Role Hierarchy

1. **viewer** - Can only read data and subscribe to updates
2. **operator** - Can read data, execute work orders, and reserve stock
3. **manager** - Can read data, create/confirm manufacturing orders, execute work orders, and reserve stock
4. **admin** - Full access to all operations

## Usage

When `DEMO_MODE=true`, only these persisted queries are allowed. Users must:

1. Get a JWT token from `/demo/tokens` endpoint
2. Include the token in the Authorization header: `Bearer <token>`
3. Use only the queries defined in this directory
4. Have the appropriate role for the operation

## Adding New Queries

To add a new persisted query:

1. Create a new `.json` file in this directory
2. Include the required fields: `query`, `variables`, `description`, `allowedRoles`
3. Restart the server to load the new query
