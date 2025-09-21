import React, { useState, useEffect } from 'react';

function ProductBom() {
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState({});
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', uom: '' });
  const [newBom, setNewBom] = useState({ productId: '', items: [] });
  const [createBomResult, setCreateBomResult] = useState(null);
  const [lastCreatedProduct, setLastCreatedProduct] = useState(null);
  const [createProductError, setCreateProductError] = useState(null);

  useEffect(() => {
    // You might want to fetch initial products here
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setCreateProductError(null);
    setLastCreatedProduct(null);
    try {
      const response = await fetch('/api/product-bom/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      const data = await response.json();
      if (response.ok) {
        setProducts([...products, data]);
        setLastCreatedProduct(data);
        setNewProduct({ sku: '', name: '', uom: '' });
        // Auto-fill the product ID in BOM creation form
        setNewBom({ ...newBom, productId: data.id });
      } else {
        // Check for duplicate SKU error
        if (data.message && data.message.includes('duplicate key')) {
          setCreateProductError(`SKU "${newProduct.sku}" already exists. Please use a different SKU.`);
        } else {
          setCreateProductError(data.error || data.message || 'Failed to create product');
        }
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setCreateProductError('Network error: Failed to create product');
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

  const handleCreateBom = async (e) => {
    e.preventDefault();
    setCreateBomResult(null);
    
    try {
      // Map simple numbers to product UUIDs
      const mappedItems = [];
      for (const item of newBom.items) {
        let componentId = item.componentProductId;
        
        // If it's a simple number, try to map it to a product
        if (/^\d+$/.test(componentId)) {
          const index = parseInt(componentId, 10) - 1; // Convert to 0-based index
          if (index >= 0 && index < products.length) {
            componentId = products[index].id;
          } else {
            setCreateBomResult({ 
              error: `Product #${componentId} not found. You have ${products.length} products (use numbers 1-${products.length}).` 
            });
            return;
          }
        } else {
          // If it's not a simple number, assume it's a UUID and validate it exists
          const productExists = products.find(p => p.id === componentId);
          if (!productExists) {
            setCreateBomResult({ 
              error: `Product with ID "${componentId}" not found. Use simple numbers (1, 2, 3...) or ensure the UUID exists in your products list.` 
            });
            return;
          }
        }
        
        mappedItems.push({
          componentProductId: componentId,
          qtyPerUnit: parseInt(item.qtyPerUnit, 10),
          operationSequence: parseInt(item.operationSequence, 10) || 0,
        });
      }
      
      const response = await fetch('/api/product-bom/boms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: newBom.productId,
          items: mappedItems,
        }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setCreateBomResult(data);
        // Reset the form but keep the product ID
        setNewBom({ ...newBom, items: [] });
      } else {
        setCreateBomResult({ error: data.message || data.error || 'Failed to create BOM' });
      }
    } catch (error) {
      console.error('Error creating BOM:', error);
      setCreateBomResult({ error: 'Failed to create BOM: ' + error.message });
    }
  };

  const handleBomItemChange = (index, field, value) => {
    const updatedItems = [...newBom.items];
    updatedItems[index][field] = value;
    setNewBom({ ...newBom, items: updatedItems });
  };

  const addBomItem = () => {
    setNewBom({ ...newBom, items: [...newBom.items, { componentProductId: '', qtyPerUnit: '', operationSequence: '' }] });
  };

  const removeBomItem = (index) => {
    const updatedItems = [...newBom.items];
    updatedItems.splice(index, 1);
    setNewBom({ ...newBom, items: updatedItems });
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
        
        {lastCreatedProduct && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#10b981',
            color: 'white',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}>
            ✅ Product Created Successfully!
            <div style={{ marginTop: '0.5rem' }}>
              <div>Product ID: <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{lastCreatedProduct.id}</span></div>
              <div>SKU: {lastCreatedProduct.sku}</div>
              <div>Name: {lastCreatedProduct.name}</div>
            </div>
          </div>
        )}
        
        {createProductError && (
          <div className="error">
            ❌ {createProductError}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Create Bill of Materials</h3>
        <form onSubmit={handleCreateBom}>
          <input 
            type="text" 
            placeholder="Product ID for BOM (paste the UUID from above)" 
            value={newBom.productId} 
            onChange={(e) => setNewBom({ ...newBom, productId: e.target.value })} 
            required 
            style={{ fontFamily: 'monospace' }}
          />
          
          <h4>BOM Components (Optional)</h4>
          <div style={{ 
            background: '#e0f2fe', 
            padding: '0.75rem', 
            borderRadius: '6px', 
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: '#075985'
          }}>
            💡 <strong>Tip:</strong> Use simple numbers (1, 2, 3...) to reference products by their position in the list below. 
            This is much easier than copying long UUIDs! Leave empty for a BOM without components.
          </div>
          
          {products.length > 0 && (
            <div style={{
              background: '#f8fafc',
              padding: '0.75rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              <strong>Available Products for Components:</strong>
              {products.map((p, index) => (
                <div key={p.id} style={{ marginTop: '0.25rem', fontFamily: 'monospace' }}>
                  #{index + 1}: {p.name} (SKU: {p.sku})
                </div>
              ))}
            </div>
          )}
          
          {newBom.items.length === 0 ? (
            <div style={{ 
              padding: '1rem', 
              background: '#f0f4f8', 
              borderRadius: '6px',
              textAlign: 'center',
              color: '#4a5568'
            }}>
              No components - this will create an empty BOM
            </div>
          ) : (
            newBom.items.map((item, index) => {
              // Show which product this component number refers to
              let productInfo = '';
              if (/^\d+$/.test(item.componentProductId)) {
                const productIndex = parseInt(item.componentProductId, 10) - 1;
                if (productIndex >= 0 && productIndex < products.length) {
                  const product = products[productIndex];
                  productInfo = ` → ${product.name} (${product.sku})`;
                } else {
                  productInfo = ` → Invalid product number`;
                }
              }
              
              return (
                <div key={index} className="bom-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Component # (e.g., 1, 2, 3...)" 
                      value={item.componentProductId} 
                      onChange={(e) => handleBomItemChange(index, 'componentProductId', e.target.value)} 
                      required 
                      style={{ fontSize: '0.875rem' }}
                    />
                    {productInfo && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: productInfo.includes('Invalid') ? '#ef4444' : '#059669',
                        fontWeight: '500'
                      }}>
                        {productInfo}
                      </span>
                    )}
                  </div>
                  <input 
                    type="number" 
                    placeholder="Qty Per Unit" 
                    value={item.qtyPerUnit} 
                    onChange={(e) => handleBomItemChange(index, 'qtyPerUnit', e.target.value)} 
                    required 
                  />
                  <input 
                    type="number" 
                    placeholder="Sequence (optional)" 
                    value={item.operationSequence} 
                    onChange={(e) => handleBomItemChange(index, 'operationSequence', e.target.value)} 
                  />
                  <button type="button" onClick={() => removeBomItem(index)} style={{ background: '#ef4444' }}>Remove</button>
                </div>
              );
            })
          )}
          <button type="button" onClick={addBomItem}>Add Component Item</button>
          <button type="submit">Create BOM</button>
        </form>
        {createBomResult && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: createBomResult.error ? '#fee' : '#e6ffed',
            borderRadius: '6px',
            border: `1px solid ${createBomResult.error ? '#fcc' : '#b7e4c7'}`
          }}>
            {createBomResult.error ? '❌ Error:' : '✅ BOM Created:'} 
            <pre style={{ 
              background: 'transparent', 
              padding: '0.5rem 0', 
              color: 'inherit' 
            }}>{JSON.stringify(createBomResult, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Products List ({products.length} products)</h3>
        {products.length === 0 ? (
          <p style={{ color: '#718096', fontStyle: 'italic' }}>No products created yet. Create your first product above!</p>
        ) : (
          <ul>
            {products.map((p) => (
              <li key={p.id} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{p.name}</strong> (SKU: {p.sku}, UOM: {p.uom})
                    <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: '0.25rem' }}>
                      ID: <span style={{ fontFamily: 'monospace', background: '#e2e8f0', padding: '2px 4px', borderRadius: '3px' }}>{p.id}</span>
                    </div>
                  </div>
                  <button onClick={() => fetchBomForProduct(p.id)} style={{ marginLeft: 'auto' }}>Get BOM</button>
                </div>
                {boms[p.id] && (
                  <pre style={{ width: '100%', marginTop: '0.5rem' }}>{JSON.stringify(boms[p.id], null, 2)}</pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ProductBom;
