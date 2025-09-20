import React, { useState, useMemo, useEffect } from 'react';

// --- SVG Icons ---
// Using inline SVGs is a great practice for single-file components
// as it avoids the need for external file dependencies.

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-red-600 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


// --- Sample Data ---
// This data will populate the stock ledger table.
const initialProducts = [
  { id: 1, name: 'Dining Table', unit: 'Unit', unitCost: 1200, totalValue: 600000, onHand: 500, freeToUse: 270, incoming: 0, outgoing: 230 },
  { id: 2, name: 'Work Center', unit: 'Unit', unitCost: 2000, totalValue: 54000, onHand: 50, freeToUse: 20, incoming: 0, outgoing: 30 },
  { id: 3, name: 'Drawer', unit: 'Unit', unitCost: 100, totalValue: 2000, onHand: 20, freeToUse: 20, incoming: 0, outgoing: 0 },
  { id: 4, name: 'Office Chair', unit: 'Unit', unitCost: 350, totalValue: 35000, onHand: 100, freeToUse: 80, incoming: 20, outgoing: 40 },
  { id: 5, name: 'Bookshelf', unit: 'Unit', unitCost: 450, totalValue: 22500, onHand: 50, freeToUse: 50, incoming: 0, outgoing: 0 },
];

// --- New Product Form Component ---
function NewProductForm({ onSave, onBack }) {
    const [product, setProduct] = useState({
        name: '',
        unitCost: '',
        unit: 'Unit',
        onHand: '',
        freeToUse: '',
        outgoing: '',
        incoming: ''
    });

    const totalValue = useMemo(() => {
        const onHand = parseFloat(product.onHand) || 0;
        const unitCost = parseFloat(product.unitCost) || 0;
        return onHand * unitCost;
    }, [product.onHand, product.unitCost]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        // Basic validation
        if (!product.name || !product.unitCost || !product.onHand) {
            alert("Please fill in at least Product Name, Unit Cost, and On Hand fields.");
            return;
        }
        onSave({
            ...product,
            id: Date.now(), // simple unique id
            totalValue: totalValue,
            unitCost: parseFloat(product.unitCost),
            onHand: parseInt(product.onHand, 10),
            freeToUse: parseInt(product.freeToUse, 10) || 0,
            outgoing: parseInt(product.outgoing, 10) || 0,
            incoming: parseInt(product.incoming, 10) || 0,
        });
    };

    const inputClass = "w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#E7D4B5]";
    const labelClass = "block text-sm font-semibold text-[#3D3B37] mb-1";

    return (
        <div className="p-8 flex-grow overflow-auto bg-[#FDF8F0]">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="bg-white border border-gray-300 text-[#3D3B37] font-semibold px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                    Back
                </button>
                <button onClick={handleSave} className="bg-[#E7D4B5] text-[#3D3B37] font-semibold px-5 py-2 rounded-lg hover:bg-[#DBC1A4] transition-colors shadow-sm">
                    Save
                </button>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {/* Left Column */}
                <div className="space-y-4">
                    <div>
                        <label className={labelClass}>Product</label>
                        <input type="text" name="name" value={product.name} onChange={handleChange} className={inputClass} />
                    </div>
                     <div>
                        <label className={labelClass}>Unit Cost</label>
                        <input type="number" name="unitCost" value={product.unitCost} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Unit</label>
                        <input type="text" name="unit" value={product.unit} onChange={handleChange} className={inputClass} />
                    </div>
                     <div>
                        <label className={labelClass}>Total Value</label>
                        <div className="w-full bg-gray-200 border border-gray-300 rounded-lg px-4 py-2 text-gray-600">
                           Rs {totalValue.toLocaleString()}
                        </div>
                         <p className="text-xs text-gray-500 mt-1">Read-only: On Hand * Unit Cost</p>
                    </div>
                </div>
                {/* Right Column */}
                <div className="space-y-4">
                    <div>
                        <label className={labelClass}>On Hand</label>
                        <input type="number" name="onHand" value={product.onHand} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Free to Use</label>
                        <input type="number" name="freeToUse" value={product.freeToUse} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Outgoing</label>
                        <input type="number" name="outgoing" value={product.outgoing} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Incoming</label>
                        <input type="number" name="incoming" value={product.incoming} onChange={handleChange} className={inputClass} />
                    </div>
                </div>
            </form>
        </div>
    );
}

// --- Custom Confirmation Modal ---
function ConfirmModal({ isOpen, onClose, onConfirm, title, children }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm w-full animate-fade-in">
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                <div className="mt-2 text-sm text-gray-600">
                    {children}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}


// --- StockLedger Component ---
// This is the main component for the popup.
function StockLedgerPopup({ onClose }) {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCardView, setIsCardView] = useState(false);
  const [viewMode, setViewMode] = useState('ledger'); // 'ledger' or 'newProduct'
  const [productToDelete, setProductToDelete] = useState(null);

  // useMemo helps to optimize performance by only recalculating
  // the filtered list when products or searchTerm change.
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);
  
  const handleDeleteRequest = (productId) => {
      setProductToDelete(productId);
  };

  const handleConfirmDelete = () => {
      if (productToDelete) {
          setProducts(products.filter(p => p.id !== productToDelete));
          setProductToDelete(null); // Close modal
      }
  };
  
  const handleAddNewProduct = (newProduct) => {
      setProducts(prevProducts => [newProduct, ...prevProducts]);
      setViewMode('ledger'); // Switch back to the ledger view
  };

  return (
    // Backdrop for the popup
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center font-sans p-4 z-50">
      {/* Popup container */}
      <div className="bg-[#FEFBF6] rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-[#3D3B37]">Stock Ledger</h2>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {viewMode === 'ledger' ? (
            <>
                {/* Controls Section */}
                <div className="p-4 flex flex-wrap items-center gap-4 bg-[#FDF8F0] border-b border-gray-200">
                  <button 
                    onClick={() => setViewMode('newProduct')}
                    className="bg-[#E7D4B5] text-[#3D3B37] font-semibold px-5 py-2 rounded-lg hover:bg-[#DBC1A4] transition-colors shadow-sm">
                    New
                  </button>
                  <div className="relative flex-grow min-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">
                      <SearchIcon />
                    </span>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#E7D4B5]"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                     <button className="p-2 rounded-lg bg-white border border-gray-300 shadow-sm">
                        <ListIcon/>
                     </button>
                    <span className="text-sm font-medium text-gray-700">Card View</span>
                    <button
                      onClick={() => setIsCardView(!isCardView)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                        isCardView ? 'bg-[#A77B5A]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                          isCardView ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Content Area (Table or Card View) */}
                <div className="flex-grow overflow-auto">
                  {isCardView ? (
                     <div className="p-8 text-center text-gray-500">
                        <h3 className="text-xl">Card View is not implemented yet.</h3>
                        <p>But the toggle switch works!</p>
                     </div>
                  ) : (
                    <table className="w-full text-sm text-left text-gray-600">
                      <thead className="text-xs text-[#A77B5A] uppercase bg-[#FDF8F0] sticky top-0">
                        <tr>
                          <th scope="col" className="px-6 py-3">Product</th>
                          <th scope="col" className="px-6 py-3">Unit Cost</th>
                          <th scope="col" className="px-6 py-3">Unit</th>
                          <th scope="col" className="px-6 py-3">Total Value</th>
                          <th scope="col" className="px-6 py-3">On Hand</th>
                          <th scope="col" className="px-6 py-3">Free to Use</th>
                          <th scope="col" className="px-6 py-3">Incoming</th>
                          <th scope="col" className="px-6 py-3">Outgoing</th>
                          <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="bg-white border-b hover:bg-[#FDF8F0] transition-colors">
                            <td className="px-6 py-4 font-semibold text-gray-900">{product.name}</td>
                            <td className="px-6 py-4">Rs {product.unitCost.toLocaleString()}</td>
                            <td className="px-6 py-4">{product.unit}</td>
                            <td className="px-6 py-4">Rs {product.totalValue.toLocaleString()}</td>
                            <td className="px-6 py-4">{product.onHand}</td>
                            <td className="px-6 py-4">{product.freeToUse}</td>
                            <td className="px-6 py-4 text-green-600 font-medium">{product.incoming}</td>
                            <td className="px-6 py-4 text-red-600 font-medium">{product.outgoing}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    <CopyIcon />
                                    <div onClick={() => handleDeleteRequest(product.id)}>
                                        <DeleteIcon />
                                    </div>
                                </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
            </>
        ) : (
            <NewProductForm onSave={handleAddNewProduct} onBack={() => setViewMode('ledger')} />
        )}
      </div>
      <ConfirmModal 
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
      >
        <p>Are you sure you want to delete this item? This action cannot be undone.</p>
      </ConfirmModal>
    </div>
  );
}


// --- Main App Component ---
// This component demonstrates how to use the StockLedgerPopup.
export default function App() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Microservice Frontend Demo</h1>
        <p className="text-gray-600 mb-8">Click the button below to open the Stock Ledger.</p>
        <button
          onClick={() => setIsPopupOpen(true)}
          className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105"
        >
          Open Stock Ledger
        </button>
      </div>

      {/* Conditionally render the popup */}
      {isPopupOpen && <StockLedgerPopup onClose={() => setIsPopupOpen(false)} />}
      
      {/* Simple keyframe animation for the popup */}
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
