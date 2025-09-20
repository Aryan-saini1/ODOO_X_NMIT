const fastify = require('fastify')({ logger: true });
const db = require('./db');
const formbody = require('@fastify/formbody');

fastify.register(formbody);

// Create product
fastify.post('/products', async (req, reply) => {
  const { sku, name, uom } = req.body;
  const r = await db.query(
    'INSERT INTO products (sku,name,uom) VALUES ($1,$2,$3) RETURNING *',
    [sku, name, uom]
  );
  reply.code(201).send(r.rows[0]);
});

// Batch products for DataLoader
fastify.post('/products/batch', async (req, reply) => {
  const ids = req.body.ids || [];
  const res = await db.query('SELECT * FROM products WHERE id = ANY($1::uuid[])', [ids]);
  reply.send(res.rows);
});

// Get BOM for product
fastify.get('/boms/:productId', async (req, reply) => {
  const { productId } = req.params;
  const b = await db.query('SELECT * FROM boms WHERE product_id = $1 AND is_active = true', [productId]);
  if (!b.rows[0]) return reply.code(404).send({ error: 'no active bom' });
  const items = await db.query('SELECT * FROM bom_items WHERE bom_id = $1 ORDER BY operation_sequence', [b.rows[0].id]);
  reply.send({ ...b.rows[0], items: items.rows });
});

fastify.post('/boms', async (req, reply) => {
  const { productId, items } = req.body; // items = [{componentProductId, qtyPerUnit, operationSequence}]
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query('INSERT INTO boms (product_id) VALUES ($1) RETURNING *', [productId]);
    const bomId = r.rows[0].id;
    for (const it of items) {
      await client.query(
        'INSERT INTO bom_items (bom_id, component_product_id, qty_per_unit, operation_sequence) VALUES ($1,$2,$3,$4)',
        [bomId, it.componentProductId, it.qtyPerUnit, it.operationSequence || 0]
      );
    }
    await client.query('COMMIT');
    reply.code(201).send({ id: bomId });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally { client.release(); }
});

// start
const port = process.env.PORT || 4001;
const host = process.env.HOST_BIND || '127.0.0.1';
fastify.listen({ port, host }, (err) => { if (err) throw err; console.log(`product-bom listening on ${host}:${port}`); });
