import React, { useState, useEffect } from 'react';

function ProductBom() {
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState({});
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', uom: '' });

  useEffect(() => {
    // You might want to fetch initial products here
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/product-bom/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      const data = await response.json();
      setProducts([...products, data]);
      setNewProduct({ sku: '', name: '', uom: '' });
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const fetchBomForProduct = async (productId) => {
    try {
      const response = await fetch(`/api/product-bom/boms/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setBoms({ ...boms, [productId]: data });
      } else {
        setBoms({ ...boms, [productId]: { error: 'No active BOM' } });
      }
    } catch (error) {
      console.error('Error fetching BOM:', error);
      setBoms({ ...boms, [productId]: { error: 'Failed to fetch' } });
    }
  };

  return (
    <div>
      <h2>Product BOM Service</h2>

      <div className="card">
        <h3>Create Product</h3>
        <form onSubmit={handleCreateProduct}>
          <input
            type="text"
            placeholder="SKU"
            value={newProduct.sku}
            onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="UOM"
            value={newProduct.uom}
            onChange={(e) => setNewProduct({ ...newProduct, uom: e.target.value })}
            required
          />
          <button type="submit">Create Product</button>
        </form>
      </div>

      <div className="card">
        <h3>Products</h3>
        <ul>
          {products.map((p) => (
            <li key={p.id}>
              {p.name} ({p.sku})
              <button onClick={() => fetchBomForProduct(p.id)}>Get BOM</button>
              {boms[p.id] && (
                <pre>{JSON.stringify(boms[p.id], null, 2)}</pre>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ProductBom;
