
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
=======
# ODOO X NMIT - Demo Guide

## System Overview
This is a manufacturing system with microservices architecture demonstrating:
- Product and BOM management
- Manufacturing Order (MO) creation and workflow
- Inventory management with stock movements and reservations
- Work Order (WO) management

## Prerequisites
1. All Docker services running (PostgreSQL, product-bom, mo, inventory, wo services)
2. Frontend running on http://localhost:5173

## Demo Workflow

### Step 1: Create a Product
1. Open http://localhost:5173 in your browser
2. In the **Product BOM Service** section
3. Click **Create Product** and enter:
   - SKU: Use a unique code like `DESK-002`, `CHAIR-001`, or `TABLE-003`
   - Name: `Office Desk` (or any product name)
   - UOM: `pcs` (pieces)
4. Click **Create Product**
5. **Important**: A green success box will appear showing the Product ID - copy this ID!

### Step 2: Create a Bill of Materials (BOM)
1. In the **Create Bill of Materials** section
2. Enter the Product ID from Step 1
3. For a simple BOM without components:
   - Remove the default item by clicking **Remove**
   - Click **Create BOM**
4. Note the BOM ID returned

### Step 3: Create a Manufacturing Order
1. In the **Manufacturing Orders (MO)** section
2. Enter:
   - Product ID: (from Step 1)
   - Quantity: `10`
3. Click **Create MO**
4. Click **Refresh MOs** to see your new order
5. Note the MO ID and status (should be "PLANNED")

### Step 4: Manage the Manufacturing Order
1. With your MO visible in the list:
   - Click **Confirm** to confirm the order (status changes to "CONFIRMED")
   - Click **Block** to block it (enter a reason when prompted)
   - Click **Unblock** to unblock it

### Step 5: Check Work Orders
1. In the **Work Orders (WO)** section
2. Enter the MO ID from Step 3
3. Click **Get WOs** to see associated work orders
4. If work orders exist:
   - Click **Start** on a PLANNED work order
   - Click **Complete** on an IN_PROGRESS work order

### Step 6: Inventory Management
1. In the **Inventory Service** section
2. To check inventory:
   - Enter a Product ID
   - Click **Get Inventory**
3. To reserve stock:
   - Enter Product ID, Quantity, Reference Type (SO/WO), and Reference ID
   - Click **Reserve Stock**
4. To move stock:
   - Enter Product ID, Quantity, Type (IN/OUT), Reference Type, and Reference ID
   - Click **Move Stock**

## API Endpoints

### Product BOM Service (Port 4001)
- `POST /products` - Create a product
- `POST /boms` - Create a BOM
- `GET /boms/:productId` - Get BOM for a product

### Manufacturing Order Service (Port 4002)
- `POST /mo` - Create a manufacturing order
- `GET /mo` - List all manufacturing orders
- `PATCH /mo/:id/confirm` - Confirm an MO
- `PATCH /mo/:id/block` - Block an MO
- `PATCH /mo/:id/unblock` - Unblock an MO
- `POST /mo/:id/retry-reservation` - Retry inventory reservation
- `GET /outbox` - View outbox events

### Inventory Service (Port 4003)
- `GET /inventory/:productId` - Get inventory for a product
- `POST /stock/reserve` - Reserve stock
- `POST /stock/move` - Move stock (IN/OUT)

### Work Order Service (Port 4004)
- `POST /wo` - Create a work order
- `GET /wo/mo/:moId` - Get work orders for an MO
- `PATCH /wo/:id/start` - Start a work order
- `PATCH /wo/:id/complete` - Complete a work order

## Database Verification

To verify data is being stored in PostgreSQL:

```bash
# Check manufacturing orders
docker exec -i odoo_x_nmit-postgres-1 psql -U postgres -d modb -c "SELECT mo_number, product_id, quantity, status FROM manufacturing_orders;"

# Check products
docker exec -i odoo_x_nmit-postgres-1 psql -U postgres -d product_bom_db -c "SELECT sku, name, uom FROM products;"

# Check BOMs
docker exec -i odoo_x_nmit-postgres-1 psql -U postgres -d product_bom_db -c "SELECT id, product_id, is_active FROM boms;"

# Check work orders
docker exec -i odoo_x_nmit-postgres-1 psql -U postgres -d wodb -c "SELECT id, mo_id, operation_name, status FROM work_orders;"

# Check inventory
docker exec -i odoo_x_nmit-postgres-1 psql -U postgres -d inventorydb -c "SELECT product_id, on_hand, available, reserved FROM inventory;"
```

## Troubleshooting

1. **Port conflicts**: Make sure no other services are running on ports 4001-4004, 5173
2. **Database connection errors**: Ensure Docker containers are running with `docker ps`
3. **Frontend not loading**: Check that `npm run dev` is running in the `ui` directory
4. **API errors**: Check Docker logs with `docker logs odoo_x_nmit-<service-name>-1`

## Success Indicators

✅ Products can be created and appear with IDs
✅ BOMs can be created for products
✅ Manufacturing orders can be created and show status changes
✅ Work orders are automatically created for MOs
✅ All data persists in PostgreSQL database
✅ Frontend successfully communicates with all backend services
