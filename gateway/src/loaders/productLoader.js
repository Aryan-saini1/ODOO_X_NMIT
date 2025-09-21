const DataLoader = require('dataloader');
const fetch = require('node-fetch');

module.exports = () => new DataLoader(async (ids) => {
  const res = await fetch(`${process.env.PRODUCT_SERVICE}/products/batch`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
    headers: { 'Content-Type': 'application/json' },
  });
  const products = await res.json();
  const map = new Map(products.map(p => [p.id, p]));
  return ids.map(id => map.get(id) || null);
});
