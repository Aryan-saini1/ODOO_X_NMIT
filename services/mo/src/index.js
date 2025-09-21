const Fastify = require('fastify');
const fetch = require('node-fetch');
const pool = require('./db');

const app = Fastify({ 
  logger: true,
  requestIdHeader: 'x-request-id',
  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID()
});
app.register(require('@fastify/formbody'));
app.register(require('@fastify/cors'), {
  origin: '*', // for development only - in production set specific origins
  methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
});

// POST /mo - Create a new Manufacturing Order
app.post('/mo', async (req, reply) => {
  const { productId, quantity, createdBy, idempotencyKey } = req.body;
  const requestId = req.headers['x-request-id'];
  
  if (!productId || !quantity) {
    return reply.code(400).send({ 
      error: 'productId and quantity are required',
      requestId
    });
  }

  // Check for idempotency if key provided
  if (idempotencyKey) {
    try {
      const existingMoResult = await pool.query(
        'SELECT * FROM manufacturing_orders WHERE idempotency_key = $1',
        [idempotencyKey]
      );
      
      if (existingMoResult.rows.length > 0) {
        const existingMo = existingMoResult.rows[0];
        app.log.info({ requestId, idempotencyKey }, 'MO create idempotency hit');
        return reply.code(200).send({ ...existingMo, idempotent: true });
      }
    } catch (error) {
      app.log.error({ requestId, error }, 'Error checking idempotency key');
    }
  }

  const client = await pool.connect();
  try {
    // 1. Fetch BOM from Product service
    const productServiceUrl = process.env.PRODUCT_SERVICE || 'http://localhost:4001';
    const bomRes = await fetch(`${productServiceUrl}/boms/${productId}`);
    
    if (!bomRes.ok) {
      const error = await bomRes.json();
      app.log.error({ requestId, error }, 'Failed to fetch BOM');
      return reply.code(400).send({ 
        error: `BOM not found for product: ${productId}`,
        requestId
      });
    }
    
    const bom = await bomRes.json();
    
    // 2. Begin transaction
    await client.query('BEGIN');
    
    // Get next sequence number for mo_number
    const seqResult = await client.query("SELECT nextval('mo_number_seq')");
    const seqNum = seqResult.rows[0].nextval;
    const moNumberValue = `MO-${seqNum}`;
    
    // 3. Insert MO with status='PLANNED' and sequence-based mo_number
    let moResult;
    try {
      moResult = await client.query(
        `INSERT INTO manufacturing_orders 
         (product_id, quantity, bom_snapshot, status, created_by, idempotency_key, mo_number) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [productId, quantity, bom, 'PLANNED', createdBy || null, idempotencyKey || null, moNumberValue]
      );
    } catch (error) {
      // Handle unique violation (idempotency key conflict)
      if (error.code === '23505' && idempotencyKey) { // unique_violation
        await client.query('ROLLBACK');
        client.release();
        
        // Re-fetch the existing MO
        const existingMoResult = await pool.query(
          'SELECT * FROM manufacturing_orders WHERE idempotency_key = $1',
          [idempotencyKey]
        );
        
        if (existingMoResult.rows.length > 0) {
          const existingMo = existingMoResult.rows[0];
          app.log.info({ requestId, idempotencyKey }, 'MO create idempotency hit (after race condition)');
          return reply.code(200).send({ ...existingMo, idempotent: true });
        } else {
          throw error; // Re-throw if we can't find it for some reason
        }
      }
      throw error; // Re-throw any other errors
    }
    
    const mo = moResult.rows[0];
    
    // 4. Insert outbox entry
    const outboxResult = await client.query(
      `INSERT INTO outbox 
       (aggregate_type, aggregate_id, event_type, payload) 
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['MANUFACTURING_ORDER', mo.id, 'MO_CREATED', mo]
    );
    
    // Add outbox ID to the response
    mo.outbox_event_id = outboxResult.rows[0].id;
    
    // 5. Commit and return created MO
    await client.query('COMMIT');
    
    app.log.info({ requestId, moId: mo.id, moNumber: mo.mo_number }, 'Manufacturing order created');
    
    // After transaction, create WOs for each BOM item
    const woIds = [];
    const woServiceUrl = process.env.WO_SERVICE || 'http://localhost:4004';
    
    if (bom && bom.items && bom.items.length > 0) {
      for (const item of bom.items) {
        try {
          const woResponse = await fetch(`${woServiceUrl}/wo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              moId: mo.id, 
              operationName: item.operation_name || item.operation || 'operation', 
              sequence: item.operation_sequence || item.sequence || 0
            })
          });
          
          if (woResponse.ok) {
            const woData = await woResponse.json();
            woIds.push(woData.id);
          } else {
            app.log.error({ requestId, moId: mo.id, itemId: item.id }, 'Failed to create WO for BOM item');
          }
        } catch (error) {
          app.log.error({ requestId, moId: mo.id, error: error.message }, 'Error creating WO for BOM item');
        }
      }
    }
    
    // Record WO creation in outbox (separate transaction)
    const outboxClient = await pool.connect();
    try {
      await outboxClient.query('BEGIN');
      const outboxResult = await outboxClient.query(
        `INSERT INTO outbox 
         (aggregate_type, aggregate_id, event_type, payload) 
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['MANUFACTURING_ORDER', mo.id, 'WOS_CREATED', { moId: mo.id, woIds }]
      );
      const outboxId = outboxResult.rows[0].id;
      await outboxClient.query('COMMIT');
      app.log.info({ requestId, moId: mo.id }, `Created WOs: ${woIds.join(', ')}`);
      // Set outbox info for later verification
      mo.outbox_info = { outboxId, event_type: 'WOS_CREATED' };
    } catch (error) {
      await outboxClient.query('ROLLBACK');
      app.log.error({ requestId, moId: mo.id, error }, 'Failed to record WO creation in outbox');
    } finally {
      outboxClient.release();
    }
    
    return reply.code(201).send(mo);
    
  } catch (error) {
    await client.query('ROLLBACK');
    app.log.error({ requestId, error }, 'Error creating manufacturing order');
    return reply.code(500).send({ 
      error: 'Failed to create manufacturing order',
      requestId
    });
  } finally {
    client.release();
  }
});

// PATCH /mo/:id/confirm - Confirm a Manufacturing Order
app.patch('/mo/:id/confirm', async (req, reply) => {
  const { id } = req.params;
  const requestId = req.headers['x-request-id'];
  const { idempotencyKey } = req.body;
  
  // Check for idempotency if key provided
  if (idempotencyKey) {
    try {
      const existingResult = await pool.query(
        'SELECT * FROM manufacturing_orders WHERE id = $1 AND idempotency_key_confirm = $2',
        [id, idempotencyKey]
      );
      
      if (existingResult.rows.length > 0) {
        const existingMo = existingResult.rows[0];
        app.log.info({ requestId, idempotencyKey }, 'MO confirm idempotency hit');
        return reply.code(200).send({ ...existingMo, idempotent: true });
      }
    } catch (error) {
      app.log.error({ requestId, error }, 'Error checking confirm idempotency key');
    }
  }
  
  const client = await pool.connect();
  try {
    // 1. Begin transaction
    await client.query('BEGIN');
    
    // 2. Update MO status and updated_at
    const moResult = await client.query(
      `UPDATE manufacturing_orders 
       SET status = 'CONFIRMED', updated_at = now(), idempotency_key_confirm = $2
       WHERE id = $1
       RETURNING *`,
      [id, idempotencyKey || null]
    );
    
    // If MO id not found, return 404
    if (moResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return reply.code(404).send({ 
        error: `Manufacturing order not found: ${id}`,
        requestId
      });
    }
    
    const mo = moResult.rows[0];
    
    // 3. Insert outbox event
    const outboxResult = await client.query(
      `INSERT INTO outbox 
       (aggregate_type, aggregate_id, event_type, payload) 
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['MANUFACTURING_ORDER', mo.id, 'MO_CONFIRMED', { id: mo.id, status: mo.status }]
    );
    
    // Add outbox ID to the response
    mo.outbox_event_id = outboxResult.rows[0].id;
    
    // 4. Commit and return updated MO
    await client.query('COMMIT');
    
    app.log.info({ requestId, moId: mo.id }, 'Manufacturing order confirmed');
    
    return reply.send(mo);
    
  } catch (error) {
    await client.query('ROLLBACK');
    app.log.error({ requestId, error }, 'Error confirming manufacturing order');
    return reply.code(500).send({ 
      error: 'Failed to confirm manufacturing order',
      requestId 
    });
  } finally {
    client.release();
  }
});

// PATCH /mo/:id/block - Mark an MO as BLOCKED
app.patch('/mo/:id/block', async (req, reply) => {
  const { id } = req.params;
  const { reason } = req.body;
  const requestId = req.headers['x-request-id'];
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update MO status to BLOCKED
    const moResult = await client.query(
      `UPDATE manufacturing_orders 
       SET status = 'BLOCKED', reason = $2, updated_at = now() 
       WHERE id = $1
       RETURNING *`,
      [id, reason || null]
    );
    
    if (moResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return reply.code(404).send({ 
        error: `Manufacturing order not found: ${id}`,
        requestId
      });
    }
    
    const mo = moResult.rows[0];
    
    // Insert outbox event
    await client.query(
      `INSERT INTO outbox 
       (aggregate_type, aggregate_id, event_type, payload) 
       VALUES ($1, $2, $3, $4)`,
      ['MANUFACTURING_ORDER', mo.id, 'MO_BLOCKED', { id: mo.id, status: mo.status, reason }]
    );
    
    await client.query('COMMIT');
    app.log.info({ requestId, moId: id, reason }, 'Manufacturing order blocked');
    
    return reply.send(mo);
    
  } catch (error) {
    await client.query('ROLLBACK');
    app.log.error({ requestId, error }, 'Error blocking manufacturing order');
    return reply.code(500).send({ 
      error: 'Failed to block manufacturing order',
      requestId 
    });
  } finally {
    client.release();
  }
});

// PATCH /mo/:id/unblock - Unblock an MO
app.patch('/mo/:id/unblock', async (req, reply) => {
  const { id } = req.params;
  const { note } = req.body;
  const requestId = req.headers['x-request-id'];
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update MO status from BLOCKED to PLANNED
    const moResult = await client.query(
      `UPDATE manufacturing_orders 
       SET status = 'PLANNED', reason = NULL, updated_at = now() 
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    if (moResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return reply.code(404).send({ 
        error: `Manufacturing order not found: ${id}`,
        requestId
      });
    }
    
    const mo = moResult.rows[0];
    
    // Insert outbox event
    await client.query(
      `INSERT INTO outbox 
       (aggregate_type, aggregate_id, event_type, payload) 
       VALUES ($1, $2, $3, $4)`,
      ['MANUFACTURING_ORDER', mo.id, 'MO_UNBLOCKED', { id: mo.id, status: mo.status, note: note || null }]
    );
    
    await client.query('COMMIT');
    app.log.info({ requestId, moId: id }, 'Manufacturing order unblocked');
    
    return reply.send(mo);
    
  } catch (error) {
    await client.query('ROLLBACK');
    app.log.error({ requestId, error }, 'Error unblocking manufacturing order');
    return reply.code(500).send({ 
      error: 'Failed to unblock manufacturing order',
      requestId 
    });
  } finally {
    client.release();
  }
});

// POST /mo/:id/retry-reservation - Retry reservation for an MO
app.post('/mo/:id/retry-reservation', async (req, reply) => {
  const { id } = req.params;
  const requestId = req.headers['x-request-id'];
  
  const client = await pool.connect();
  try {
    // Fetch MO with BOM snapshot
    const moResult = await client.query(
      'SELECT * FROM manufacturing_orders WHERE id = $1',
      [id]
    );
    
    if (moResult.rowCount === 0) {
      return reply.code(404).send({ 
        error: `Manufacturing order not found: ${id}`,
        requestId
      });
    }
    
    const mo = moResult.rows[0];
    const bomSnapshot = mo.bom_snapshot;
    
    // Attempt reservation for each component in BOM
    const inventoryServiceUrl = process.env.INVENTORY_SERVICE || 'http://localhost:4003';
    let allReservationsSuccessful = true;
    const reservationResults = [];
    
    if (bomSnapshot && bomSnapshot.items && bomSnapshot.items.length > 0) {
      for (const item of bomSnapshot.items) {
        const componentId = item.componentProductId || item.component_product_id;
        if (!componentId) {
          continue;
        }
        
        // Calculate required quantity
        const qtyRequired = (item.qtyPerUnit || item.qty_per_unit || 0) * mo.quantity;
        
        // Create idempotency key for this reservation
        const idempotencyKey = `mo:${mo.id}:comp:${componentId}`;
        
        try {
          const reserveResponse = await fetch(`${inventoryServiceUrl}/inventory/reserve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: componentId,
              quantity: qtyRequired,
              referenceType: 'MO',
              referenceId: mo.id,
              idempotencyKey
            })
          });
          
          const reserveResult = await reserveResponse.json();
          reservationResults.push(reserveResult);
          
          if (!reserveResponse.ok) {
            allReservationsSuccessful = false;
            app.log.warn({ requestId, moId: mo.id, componentId, error: reserveResult.error }, `Reservation failed for component ${componentId}`);
          }
        } catch (error) {
          allReservationsSuccessful = false;
          app.log.error({ requestId, moId: mo.id, componentId, error: error.message }, `Error reserving component ${componentId}`);
          reservationResults.push({ error: error.message });
        }
      }
    }
    
    // Update MO status based on reservation results
    await client.query('BEGIN');
    
    if (allReservationsSuccessful) {
      // If all reservations succeeded, update status to RESERVATION_DONE
      const updateResult = await client.query(
        `UPDATE manufacturing_orders 
         SET status = 'RESERVATION_DONE', updated_at = now() 
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      
      const updatedMo = updateResult.rows[0];
      
      // Insert outbox event for successful reservation
      await client.query(
        `INSERT INTO outbox 
         (aggregate_type, aggregate_id, event_type, payload) 
         VALUES ($1, $2, $3, $4)`,
        ['MANUFACTURING_ORDER', mo.id, 'STOCK_RESERVED', { id: mo.id, status: updatedMo.status, results: reservationResults }]
      );
      
      await client.query('COMMIT');
      app.log.info({ requestId, moId: id }, 'MO retry reservation successful');
      
      return reply.send({ 
        status: 'success',
        mo: updatedMo,
        results: reservationResults
      });
      
    } else {
      // If any reservation failed, mark as BLOCKED
      const updateResult = await client.query(
        `UPDATE manufacturing_orders 
         SET status = 'BLOCKED', reason = $2, updated_at = now() 
         WHERE id = $1
         RETURNING *`,
        [id, 'Stock reservation failed']
      );
      
      const updatedMo = updateResult.rows[0];
      
      // Insert outbox event for failed reservation
      await client.query(
        `INSERT INTO outbox 
         (aggregate_type, aggregate_id, event_type, payload) 
         VALUES ($1, $2, $3, $4)`,
        ['MANUFACTURING_ORDER', mo.id, 'MO_BLOCKED', { 
          id: mo.id, 
          status: updatedMo.status, 
          reason: 'Stock reservation failed',
          results: reservationResults
        }]
      );
      
      await client.query('COMMIT');
      app.log.warn({ requestId, moId: id }, 'MO retry reservation failed');
      
      return reply.code(400).send({ 
        status: 'failed',
        mo: updatedMo,
        error: 'One or more component reservations failed',
        results: reservationResults
      });
    }
    
  } catch (error) {
    if (client.query) {
      await client.query('ROLLBACK');
    }
    app.log.error({ requestId, error }, 'Error retrying reservation');
    return reply.code(500).send({ 
      error: 'Failed to retry reservation',
      requestId,
      details: error.message
    });
  } finally {
    if (client.release) {
      client.release();
    }
  }
});

// GET /mo - List all Manufacturing Orders
app.get('/mo', async (req, reply) => {
  const requestId = req.headers['x-request-id'];
  
  try {
    const result = await pool.query(
      'SELECT * FROM manufacturing_orders ORDER BY created_at DESC'
    );
    
    return reply.send(result.rows);
  } catch (error) {
    app.log.error({ requestId, error }, 'Error listing manufacturing orders');
    return reply.code(500).send({ 
      error: 'Failed to list manufacturing orders',
      requestId
    });
  }
});

// GET /outbox - List Outbox entries (for testing UI only)
app.get('/outbox', async (req, reply) => {
  const requestId = req.headers['x-request-id'];
  
  try {
    const result = await pool.query(
      `SELECT id, event_type, payload, created_at 
       FROM outbox 
       WHERE aggregate_type='MANUFACTURING_ORDER' 
       ORDER BY created_at DESC 
       LIMIT 20`
    );
    
    return reply.send(result.rows);
  } catch (error) {
    app.log.error({ requestId, error }, 'Error listing outbox events');
    return reply.code(500).send({ 
      error: 'Failed to list outbox events',
      requestId
    });
  }
});

// Start the server
const port = process.env.PORT || 4002;
app.listen({ port, host: '0.0.0.0' }, (err) => { 
  if (err) throw err; 
  app.log.info(`MO service listening on ${port}`); 
});
