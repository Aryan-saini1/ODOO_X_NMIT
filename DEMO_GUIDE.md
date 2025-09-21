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
