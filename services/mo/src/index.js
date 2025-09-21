const Fastify = require('fastify');
const fetch = require('node-fetch');
const pool = require('./db');
require('dotenv').config({ path: '../.env' });

const app = Fastify({ 
  logger: true,
  requestIdHeader: 'x-request-id',
  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID()
});
app.register(require('@fastify/formbody'));

// POST /mo - Create a new Manufacturing Order
app.post('/mo', async (req, reply) => {
  const { productId, quantity, createdBy } = req.body;
  const requestId = req.headers['x-request-id'];
  
  if (!productId || !quantity) {
    return reply.code(400).send({ 
      error: 'productId and quantity are required',
      requestId
    });
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
    
    // 3. Insert MO with status='PLANNED'
    const moResult = await client.query(
      `INSERT INTO manufacturing_orders 
       (product_id, quantity, bom_snapshot, status, created_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [productId, quantity, bom, 'PLANNED', createdBy || null]
    );
    
    const mo = moResult.rows[0];
    
    // 4. Insert outbox entry
    await client.query(
      `INSERT INTO outbox 
       (aggregate_type, aggregate_id, event_type, payload) 
       VALUES ($1, $2, $3, $4)`,
      ['MANUFACTURING_ORDER', mo.id, 'MO_CREATED', mo]
    );
    
    // 5. Commit and return created MO
    await client.query('COMMIT');
    
    app.log.info({ requestId, moId: mo.id }, 'Manufacturing order created');
    
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
  
  const client = await pool.connect();
  try {
    // 1. Begin transaction
    await client.query('BEGIN');
    
    // 2. Update MO status and updated_at
    const moResult = await client.query(
      `UPDATE manufacturing_orders 
       SET status = 'CONFIRMED', updated_at = now() 
       WHERE id = $1
       RETURNING *`,
      [id]
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
    await client.query(
      `INSERT INTO outbox 
       (aggregate_type, aggregate_id, event_type, payload) 
       VALUES ($1, $2, $3, $4)`,
      ['MANUFACTURING_ORDER', mo.id, 'MO_CONFIRMED', { id: mo.id, status: mo.status }]
    );
    
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

// Start the server
const port = process.env.PORT || 4002;
app.listen({ port }, (err) => { 
  if (err) throw err; 
  console.log(`MO service listening on ${port}`); 
});
