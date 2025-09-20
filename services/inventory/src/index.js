const Fastify = require('fastify');
const pool = require('./db');
require('dotenv').config({ path: '../.env' });

const app = Fastify({ 
  logger: true,
  requestIdHeader: 'x-request-id',
  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID()
});
app.register(require('@fastify/formbody'));

// GET /inventory/:productId - Get inventory for a product
app.get('/inventory/:productId', async (req, reply) => {
  const { productId } = req.params;
  const requestId = req.headers['x-request-id'];
  
  try {
    const result = await pool.query(
      'SELECT * FROM inventory WHERE product_id = $1',
      [productId]
    );
    
    if (result.rowCount === 0) {
      return reply.code(404).send({ 
        error: `Inventory not found for product: ${productId}`,
        requestId 
      });
    }
    
    return reply.send(result.rows);
    
  } catch (error) {
    app.log.error({ requestId, error }, 'Error fetching inventory');
    return reply.code(500).send({ 
      error: 'Failed to fetch inventory',
      requestId 
    });
  }
});

// POST /stock/reserve - Reserve stock
app.post('/stock/reserve', async (req, reply) => {
  const { productId, qty, referenceType, referenceId, idempotencyKey } = req.body;
  const requestId = req.headers['x-request-id'];
  
  if (!productId || !qty || !referenceType || !referenceId) {
    return reply.code(400).send({ 
      error: 'productId, qty, referenceType, and referenceId are required',
      requestId 
    });
  }
  
  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Check for idempotency key if provided
    if (idempotencyKey) {
      const existingRes = await client.query(
        'SELECT * FROM stock_transactions WHERE idempotency_key = $1',
        [idempotencyKey]
      );
      
      if (existingRes.rowCount > 0) {
        await client.query('COMMIT');
        app.log.info({ requestId, transactionId: existingRes.rows[0].id }, 'Idempotent request, returning existing result');
        return reply.send({ 
          status: 'RESERVED',
          reservedQty: Math.abs(existingRes.rows[0].change_qty),
          idempotencyKey
        });
      }
    }
    
    // Get inventory for update
    const invRes = await client.query(
      'SELECT * FROM inventory WHERE product_id = $1 FOR UPDATE',
      [productId]
    );
    
    let inventory;
    let available = 0;
    
    if (invRes.rowCount === 0) {
      // No inventory row - treat as zero available
      await client.query(
        `INSERT INTO outbox 
         (aggregate_type, aggregate_id, event_type, payload) 
         VALUES ($1, $2, $3, $4)`,
        ['INVENTORY', productId, 'STOCK_RESERVATION_FAILED', { 
          productId, 
          requested: qty, 
          available: 0,
          referenceType,
          referenceId 
        }]
      );
      
      await client.query('COMMIT');
      
      app.log.warn({ requestId, productId }, 'Stock reservation failed - no inventory record');
      
      return reply.code(409).send({ 
        status: 'FAILED',
        available: 0,
        requested: qty,
        requestId 
      });
    }
    
    inventory = invRes.rows[0];
    available = Number(inventory.qty_available) - Number(inventory.qty_reserved);
    
    if (available < qty) {
      // Insufficient stock
      await client.query(
        `INSERT INTO outbox 
         (aggregate_type, aggregate_id, event_type, payload) 
         VALUES ($1, $2, $3, $4)`,
        ['INVENTORY', inventory.id, 'STOCK_RESERVATION_FAILED', {
          productId,
          requested: qty,
          available,
          referenceType,
          referenceId
        }]
      );
      
      await client.query('COMMIT');
      
      app.log.warn({ requestId, productId, available, requested: qty }, 'Stock reservation failed - insufficient stock');
      
      return reply.code(409).send({ 
        status: 'FAILED',
        available,
        requested: qty,
        requestId 
      });
    }
    
    // Update inventory
    const updatedInvRes = await client.query(
      `UPDATE inventory
       SET qty_reserved = qty_reserved + $1, updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [qty, inventory.id]
    );
    
    // Insert transaction
    const txnRes = await client.query(
      `INSERT INTO stock_transactions
       (product_id, change_qty, type, reference_type, reference_id, idempotency_key, balance_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [productId, -qty, 'RESERVE', referenceType, referenceId, idempotencyKey, available - qty]
    );
    
    // Insert outbox event
    await client.query(
      `INSERT INTO outbox
       (aggregate_type, aggregate_id, event_type, payload)
       VALUES ($1, $2, $3, $4)`,
      ['INVENTORY', inventory.id, 'STOCK_RESERVED', {
        productId,
        qty,
        referenceType,
        referenceId,
        transactionId: txnRes.rows[0].id
      }]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    app.log.info({ requestId, productId, qty }, 'Stock reserved successfully');
    
    return reply.send({
      status: 'RESERVED',
      reservedQty: qty,
      idempotencyKey
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    
    // Handle unique violation gracefully
    if (error.code === '23505' && error.constraint === 'stock_transactions_idempotency_key_idx') {
      app.log.warn({ requestId, error }, 'Concurrent idempotent request, retrying');
      return app.inject({
        method: 'POST',
        url: '/stock/reserve',
        headers: { 'x-request-id': requestId },
        payload: req.body
      });
    }
    
    app.log.error({ requestId, error }, 'Error reserving stock');
    return reply.code(500).send({ 
      error: 'Failed to reserve stock',
      requestId 
    });
  } finally {
    client.release();
  }
});

// POST /stock/move - Move stock in or out
app.post('/stock/move', async (req, reply) => {
  const { productId, qty, type, referenceType, referenceId, idempotencyKey } = req.body;
  const requestId = req.headers['x-request-id'];
  
  if (!productId || !qty || !type || !referenceType || !referenceId) {
    return reply.code(400).send({ 
      error: 'productId, qty, type, referenceType, and referenceId are required',
      requestId 
    });
  }
  
  if (type !== 'IN' && type !== 'OUT') {
    return reply.code(400).send({ 
      error: "type must be either 'IN' or 'OUT'",
      requestId 
    });
  }
  
  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Check for idempotency key if provided
    if (idempotencyKey) {
      const existingRes = await client.query(
        'SELECT * FROM stock_transactions WHERE idempotency_key = $1',
        [idempotencyKey]
      );
      
      if (existingRes.rowCount > 0) {
        await client.query('COMMIT');
        app.log.info({ requestId, transactionId: existingRes.rows[0].id }, 'Idempotent request, returning existing result');
        return reply.send({ 
          status: 'SUCCESS',
          type,
          qty: Math.abs(existingRes.rows[0].change_qty),
          idempotencyKey
        });
      }
    }
    
    // Get inventory for update - create if not exists
    let invRes = await client.query(
      'SELECT * FROM inventory WHERE product_id = $1 FOR UPDATE',
      [productId]
    );
    
    let inventory;
    let available = 0;
    
    if (invRes.rowCount === 0 && type === 'IN') {
      // Create new inventory record for IN
      invRes = await client.query(
        `INSERT INTO inventory 
         (product_id, location_id, qty_available, qty_reserved) 
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [productId, '00000000-0000-0000-0000-000000000000', 0, 0]  // Default location
      );
    }
    
    inventory = invRes.rows[0];
    
    if (!inventory && type === 'OUT') {
      // Can't take stock out if there's no inventory record
      await client.query('ROLLBACK');
      return reply.code(409).send({ 
        error: 'No inventory record found for this product',
        requestId 
      });
    }
    
    if (type === 'IN') {
      // Update inventory for IN
      await client.query(
        `UPDATE inventory
         SET qty_available = qty_available + $1, updated_at = now()
         WHERE id = $2`,
        [qty, inventory.id]
      );
      
      // Get updated available quantity
      const updatedInvRes = await client.query(
        'SELECT qty_available, qty_reserved FROM inventory WHERE id = $1',
        [inventory.id]
      );
      available = Number(updatedInvRes.rows[0].qty_available) - Number(updatedInvRes.rows[0].qty_reserved);
      
      // Insert transaction
      const txnRes = await client.query(
        `INSERT INTO stock_transactions
         (product_id, change_qty, type, reference_type, reference_id, idempotency_key, balance_after)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [productId, qty, 'IN', referenceType, referenceId, idempotencyKey, available]
      );
      
      // Insert outbox event
      await client.query(
        `INSERT INTO outbox
         (aggregate_type, aggregate_id, event_type, payload)
         VALUES ($1, $2, $3, $4)`,
        ['INVENTORY', inventory.id, 'STOCK_IN', {
          productId,
          qty,
          referenceType,
          referenceId,
          transactionId: txnRes.rows[0].id
        }]
      );
      
    } else { // OUT
      available = Number(inventory.qty_available) - Number(inventory.qty_reserved);
      
      if (available < qty) {
        // Check if we can fulfill from reserved
        if (Number(inventory.qty_available) < qty) {
          // Not enough total quantity
          await client.query('ROLLBACK');
          return reply.code(409).send({ 
            error: 'Insufficient stock',
            available: Number(inventory.qty_available),
            requested: qty,
            requestId 
          });
        }
        
        // We can fulfill from reserved qty
        await client.query(
          `UPDATE inventory
           SET qty_available = qty_available - $1, 
               qty_reserved = qty_reserved - $2,
               updated_at = now()
           WHERE id = $3`,
          [qty, qty - available, inventory.id]
        );
      } else {
        // Can fulfill from available qty
        await client.query(
          `UPDATE inventory
           SET qty_available = qty_available - $1, updated_at = now()
           WHERE id = $2`,
          [qty, inventory.id]
        );
      }
      
      // Get updated available quantity
      const updatedInvRes = await client.query(
        'SELECT qty_available, qty_reserved FROM inventory WHERE id = $1',
        [inventory.id]
      );
      const newAvailable = Number(updatedInvRes.rows[0].qty_available) - Number(updatedInvRes.rows[0].qty_reserved);
      
      // Insert transaction
      const txnRes = await client.query(
        `INSERT INTO stock_transactions
         (product_id, change_qty, type, reference_type, reference_id, idempotency_key, balance_after)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [productId, -qty, 'OUT', referenceType, referenceId, idempotencyKey, newAvailable]
      );
      
      // Insert outbox event
      await client.query(
        `INSERT INTO outbox
         (aggregate_type, aggregate_id, event_type, payload)
         VALUES ($1, $2, $3, $4)`,
        ['INVENTORY', inventory.id, 'STOCK_OUT', {
          productId,
          qty,
          referenceType,
          referenceId,
          transactionId: txnRes.rows[0].id
        }]
      );
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    app.log.info({ requestId, productId, type, qty }, 'Stock move completed successfully');
    
    return reply.send({
      status: 'SUCCESS',
      type,
      qty,
      idempotencyKey
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    
    // Handle unique violation gracefully
    if (error.code === '23505' && error.constraint === 'stock_transactions_idempotency_key_idx') {
      app.log.warn({ requestId, error }, 'Concurrent idempotent request, retrying');
      return app.inject({
        method: 'POST',
        url: '/stock/move',
        headers: { 'x-request-id': requestId },
        payload: req.body
      });
    }
    
    app.log.error({ requestId, error }, 'Error moving stock');
    return reply.code(500).send({ 
      error: 'Failed to move stock',
      requestId 
    });
  } finally {
    client.release();
  }
});

// Start the server
const port = process.env.PORT || 4003;
app.listen({ port }, (err) => { 
  if (err) throw err; 
  console.log(`Inventory service listening on ${port}`); 
});
