const Fastify = require('fastify');
const pool = require('./db');

const app = Fastify({ 
  logger: true,
  requestIdHeader: 'x-request-id',
  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID()
});
app.register(require('@fastify/formbody'));

// POST /wo - Create a new Work Order
app.post('/wo', async (req, reply) => {
  const { moId, operationName, sequence, workCenterId } = req.body;
  const requestId = req.headers['x-request-id'];
  
  if (!moId || !operationName || sequence === undefined) {
    return reply.code(400).send({ 
      error: 'moId, operationName, and sequence are required',
      requestId 
    });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO work_orders 
       (mo_id, operation_name, sequence, work_center_id, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [moId, operationName, sequence, workCenterId || null, 'PLANNED']
    );
    
    app.log.info({ requestId, woId: result.rows[0].id }, 'Work order created');
    
    return reply.code(201).send(result.rows[0]);
    
  } catch (error) {
    app.log.error({ requestId, error }, 'Error creating work order');
    return reply.code(500).send({ 
      error: 'Failed to create work order',
      requestId 
    });
  }
});

// GET /wo/mo/:moId - Get all Work Orders for a given MO
app.get('/wo/mo/:moId', async (req, reply) => {
  const { moId } = req.params;
  const requestId = req.headers['x-request-id'];

  try {
    const result = await pool.query(
      'SELECT * FROM work_orders WHERE mo_id = $1 ORDER BY sequence',
      [moId]
    );
    
    return reply.send(result.rows);
    
  } catch (error) {
    app.log.error({ requestId, error }, 'Error fetching work orders for MO');
    return reply.code(500).send({ 
      error: 'Failed to fetch work orders',
      requestId 
    });
  }
});

// PATCH /wo/:id/start - Start a Work Order
app.patch('/wo/:id/start', async (req, reply) => {
  const { id } = req.params;
  const { assigneeId } = req.body;
  const requestId = req.headers['x-request-id'];
  
  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Update WO status, set started_at, and assignee_id if provided
    const woResult = await client.query(
      `UPDATE work_orders 
       SET status = 'IN_PROGRESS', started_at = now(), assignee_id = $1 
       WHERE id = $2 
       RETURNING *`,
      [assigneeId || null, id]
    );
    
    // If WO id not found, return 404
    if (woResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return reply.code(404).send({ 
        error: `Work order not found: ${id}`,
        requestId 
      });
    }
    
    const wo = woResult.rows[0];
    
    // Insert outbox event
    await client.query(
      `INSERT INTO outbox 
       (aggregate_type, aggregate_id, event_type, payload) 
       VALUES ($1, $2, $3, $4)`,
      ['WORK_ORDER', wo.id, 'WO_STARTED', wo]
    );
    
    // Commit and return updated WO
    await client.query('COMMIT');
    
    app.log.info({ requestId, woId: wo.id }, 'Work order started');
    
    return reply.send(wo);
    
  } catch (error) {
    await client.query('ROLLBACK');
    app.log.error({ requestId, error }, 'Error starting work order');
    return reply.code(500).send({ 
      error: 'Failed to start work order',
      requestId 
    });
  } finally {
    client.release();
  }
});

// PATCH /wo/:id/complete - Complete a Work Order
app.patch('/wo/:id/complete', async (req, reply) => {
  const { id } = req.params;
  const requestId = req.headers['x-request-id'];
  
  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Get current WO
    const currentWoRes = await client.query(
      'SELECT * FROM work_orders WHERE id = $1',
      [id]
    );
    
    if (currentWoRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return reply.code(404).send({ 
        error: `Work order not found: ${id}`,
        requestId 
      });
    }
    
    const currentWo = currentWoRes.rows[0];
    
    // Update WO status, set completed_at, and compute actual_minutes
    const woResult = await client.query(
      `UPDATE work_orders 
       SET status = 'COMPLETED', 
           completed_at = now(),
           actual_minutes = EXTRACT(EPOCH FROM (now() - COALESCE(started_at, created_at))) / 60
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    
    const wo = woResult.rows[0];
    
    // Insert outbox event for WO_COMPLETED
    await client.query(
      `INSERT INTO outbox 
       (aggregate_type, aggregate_id, event_type, payload) 
       VALUES ($1, $2, $3, $4)`,
      ['WORK_ORDER', wo.id, 'WO_COMPLETED', wo]
    );
    
    // Check if all WOs for the MO are completed
    const pendingWosRes = await client.query(
      `SELECT COUNT(*) AS count 
       FROM work_orders 
       WHERE mo_id = $1 AND status != 'COMPLETED'`,
      [wo.mo_id]
    );
    
    if (pendingWosRes.rows[0].count === '0') {
      // All WOs completed, insert MO_COMPLETED event
      await client.query(
        `INSERT INTO outbox 
         (aggregate_type, aggregate_id, event_type, payload) 
         VALUES ($1, $2, $3, $4)`,
        ['MANUFACTURING_ORDER', wo.mo_id, 'MO_COMPLETED', { moId: wo.mo_id }]
      );
      
      app.log.info({ requestId, moId: wo.mo_id }, 'All work orders completed for MO');
    }
    
    // Commit and return updated WO
    await client.query('COMMIT');
    
    app.log.info({ requestId, woId: wo.id }, 'Work order completed');
    
    return reply.send(wo);
    
  } catch (error) {
    await client.query('ROLLBACK');
    app.log.error({ requestId, error }, 'Error completing work order');
    return reply.code(500).send({ 
      error: 'Failed to complete work order',
      requestId 
    });
  } finally {
    client.release();
  }
});

// Start the server
const port = process.env.PORT || 4004;
const host = process.env.HOST_BIND || '127.0.0.1';
app.listen({ port, host }, (err) => { 
  if (err) throw err; 
  console.log(`WO service listening on ${host}:${port}`); 
});
