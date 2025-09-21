import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Calendar, User, Plus, X, Play, Pause, CheckSquare, Search, List, Link, Copy, Trash2 } from 'lucide-react';

// --- Main App Component ---
export default function App() {
  const [activePopup, setActivePopup] = useState(null);

  const openPopup = (popupName) => {
    setActivePopup(popupName);
    document.body.style.overflow = 'hidden';
  };

  const closePopup = () => {
    setActivePopup(null);
    document.body.style.overflow = 'unset';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Manufacturing & Inventory Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureButton
            title="Manufacturing Order"
            onClick={() => openPopup('manufacturing')}
            color="bg-blue-500"
          />
          <FeatureButton
            title="Work Center"
            onClick={() => openPopup('workcenter')}
            color="bg-green-500"
          />
          <FeatureButton
            title="Stock Ledger"
            onClick={() => openPopup('stock')}
            color="bg-indigo-500"
          />
        </div>
      </div>

      {activePopup === 'manufacturing' && <ManufacturingOrderPopup isOpen={true} onClose={closePopup} />}
      {activePopup === 'workcenter' && <WorkCenterPopup onClose={closePopup} />}
      {activePopup === 'stock' && <StockLedgerPopup onClose={closePopup} />}
    </div>
  );
}

const FeatureButton = ({ title, onClick, color }) => (
  <button
    onClick={onClick}
    className={`px-8 py-4 text-white font-bold rounded-lg shadow-lg hover:${color.replace('bg-', 'bg-darker-')} transition-transform transform hover:scale-105 ${color}`}
  >
    {title}
  </button>
);


// --- ManufacturingOrderPopup Component ---
const ManufacturingOrderPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  const [activeStatus, setActiveStatus] = useState('Draft');
  
  const componentsData = [
    { id: 1, name: 'Component A', availability: 12, toConsume: 10, units: 'pcs', consumed: 5 },
    { id: 2, name: 'Component B', availability: 25, toConsume: 20, units: 'pcs', consumed: 15 },
  ];

  // Initial state for Work Orders, now with more detail for the 'In-progress' view
  const initialWorkOrders = [
    { id: 1, operation: 'Assembly-1', workCenter: 'Work Center-1', duration: 3600, realDuration: 0, status: 'To Do', isRunning: false },
    { id: 2, operation: 'Quality Check', workCenter: 'QC-Station', duration: 1800, realDuration: 0, status: 'To Do', isRunning: false },
  ];

  const [workOrders, setWorkOrders] = useState(initialWorkOrders);

  // Automatically update status to 'To close' when all work orders are done
  useEffect(() => {
    const allDone = workOrders.length > 0 && workOrders.every(order => order.status === 'Done');
    if (allDone && activeStatus === 'In-progress') {
      setActiveStatus('To close');
    }
  }, [workOrders, activeStatus]);


  // --- State Transition Handlers ---
  const handleConfirm = () => setActiveStatus('Confirmed');
  const handleStart = () => setActiveStatus('In-progress');
  const handleProduce = () => setActiveStatus('Done');
  const handleCancel = () => {
    setActiveStatus('Cancelled');
    // Stop all timers and mark work orders as Canceled
    setWorkOrders(currentOrders => 
      currentOrders.map(o => ({ ...o, isRunning: false, status: 'Canceled' }))
    );
  };

  // Handler to toggle the timer for a specific work order
  const handleToggleTimer = (id) => {
    // Automatically move to 'In-progress' when a timer starts
    if (activeStatus === 'Confirmed') {
        handleStart();
    }

    setWorkOrders(currentOrders =>
      currentOrders.map(order => {
        if (order.id === id) {
          const newIsRunning = !order.isRunning;
          const newStatus = order.status === 'To Do' && newIsRunning ? 'In-progress' : order.status;
          return { ...order, isRunning: newIsRunning, status: newStatus };
        }
        return order;
      })
    );
  };

  // Handler to mark a work order as done
  const handleMarkAsDone = (id) => {
     setWorkOrders(currentOrders =>
      currentOrders.map(order => 
        order.id === id ? { ...order, isRunning: false, status: 'Done' } : order
      )
    );
  };

  // Handler to update the real duration from the row component
  const setWorkOrderDuration = (id, newDuration) => {
     setWorkOrders(currentOrders =>
      currentOrders.map(order => 
        order.id === id ? { ...order, realDuration: newDuration } : order
      )
    );
  };

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={onClose}>
      {/* Popup Container */}
      <div 
        className="bg-[#F8F3EF] rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[95vh] p-6 md:p-8 flex flex-col font-sans overflow-hidden"
        onClick={e => e.stopPropagation()} // Prevent clicks inside the popup from closing it
      >
        {/* Header */}
        <header className="flex justify-between items-start pb-4 border-b border-gray-200 mb-6">
          <div> {/* Left side container */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manufacturing Order</h1>
            <span className="text-gray-500 font-mono bg-gray-200 px-3 py-1 rounded-md text-sm mt-1 inline-block">MO-000001</span>

             <div className="flex items-center gap-2 mt-4">
                {activeStatus === 'Draft' && <button onClick={handleConfirm} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">Confirm Order</button> }
                {activeStatus === 'Confirmed' && <button onClick={handleStart} className="px-4 py-2 bg-[#D3B8A8] text-white font-semibold rounded-lg hover:bg-[#C3A898] transition-colors">Start</button>}
                {activeStatus === 'To close' && <button onClick={handleProduce} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">Produce</button>}
                {(activeStatus === 'Confirmed' || activeStatus === 'In-progress') && <button onClick={handleCancel} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors">Cancel</button>}
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Back</button>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-4">
             <StatusBar currentStatus={activeStatus} />
             <button onClick={onClose} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </header>

        {/* Main Content Area (Scrollable) */}
        <main className="flex-grow overflow-y-auto pr-2 -mr-2">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Left Column: Order Details */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white/80 p-5 rounded-xl shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Order Details</h2>
                        { activeStatus === 'Draft' ? (
                            <div className="space-y-4">
                                <InputGroup label="Finished Product*" icon={<ChevronDown />} type="select" options={['Product A', 'Product B']} />
                                <InputGroup label="Quantity*" type="number" addon="Units" />
                                <InputGroup label="Bill of Materials" icon={<ChevronDown />} type="select" options={['BOM 1', 'BOM 2']} />
                                <InputGroup label="Schedule Date*" icon={<Calendar />} type="date" />
                                <InputGroup label="Assignee" icon={<ChevronDown />} type="select" options={['John Doe', 'Jane Smith']} />
                            </div>
                        ) : (
                             <div className="space-y-3">
                                <DisplayField label="Finished Product" value="Product A" />
                                <DisplayField label="Quantity" value="100 Units" />
                                <DisplayField label="Bill of Material" value="BOM 1" />
                                <DisplayField label="Schedule Date" value="2025-10-27" />
                                <DisplayField label="Assignee" value="John Doe" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Components & Work Orders */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Components Card */}
                    <div className="bg-white/80 p-5 rounded-xl shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Components</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-gray-500">
                                    <tr>
                                        <th className="pb-2 font-normal">Components</th>
                                        <th className="pb-2 font-normal text-center">Availability</th>
                                        <th className="pb-2 font-normal text-center">To Consume</th>
                                        <th className="pb-2 font-normal">Units</th>
                                        {activeStatus !== 'Draft' && <th className="pb-2 font-normal text-center">Consumed</th>}
                                        {activeStatus !== 'Draft' && <th className="pb-2 font-normal">Units</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {componentsData.map(item => (
                                        <tr key={item.id} className="border-b last:border-0 border-gray-200">
                                            <td className="py-2">{item.name}</td>
                                            <td className="py-2 text-center">{item.availability}</td>
                                            <td className="py-2 text-center">{item.toConsume}</td>
                                            <td className="py-2">{item.units}</td>
                                            {activeStatus !== 'Draft' && <td className="py-2 text-center">{item.consumed}</td>}
                                            {activeStatus !== 'Draft' && <td className="py-2">{item.units}</td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#EBCFB9] text-gray-800 font-semibold rounded-lg hover:bg-[#D3B8A8] transition-colors">
                            <Plus size={16} />
                            Add a product
                        </button>
                    </div>

                    {/* Work Orders Card */}
                    <div className="bg-white/80 p-5 rounded-xl shadow-sm">
                         <h2 className="text-lg font-semibold text-gray-700 mb-4">Work Orders</h2>
                        <div className="overflow-x-auto">
                           { activeStatus === 'In-progress' || activeStatus === 'To close' || activeStatus === 'Done' || activeStatus === 'Cancelled' ? (
                                <table className="w-full text-left text-sm">
                                    <thead className="text-gray-500">
                                        <tr>
                                            <th className="p-2 font-normal">Operations</th>
                                            <th className="p-2 font-normal">Work Center</th>
                                            <th className="p-2 font-normal">Duration</th>
                                            <th className="p-2 font-normal">Real Duration</th>
                                            <th className="p-2 font-normal">Status</th>
                                            <th className="p-2 font-normal text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workOrders.map(order => (
                                            <WorkOrderRow 
                                                key={order.id}
                                                order={order}
                                                onToggleTimer={handleToggleTimer}
                                                onMarkAsDone={handleMarkAsDone}
                                                onSetDuration={setWorkOrderDuration}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                           ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="text-gray-500">
                                        <tr>
                                            <th className="pb-2 font-normal">Work Order</th>
                                            <th className="pb-2 font-normal text-center">To Consume</th>
                                            <th className="pb-2 font-normal">Units</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {initialWorkOrders.map(item => (
                                            <tr key={item.id} className="border-b last:border-0 border-gray-200">
                                                <td className="py-2">{item.operation}</td>
                                                <td className="py-2 text-center">{item.duration / 3600}</td>
                                                <td className="py-2">hr</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                           )}
                        </div>
                        {activeStatus === 'In-progress' && (
                             <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
                                <Plus size={16} />
                                Add a line
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};

// New StatusBar component to visually represent the order's state
const StatusBar = ({ currentStatus }) => {
    const statuses = ['Draft', 'Confirmed', 'In-progress', 'To close', 'Done'];
    const currentIndex = statuses.indexOf(currentStatus);

    if (currentStatus === 'Cancelled') {
        return (
            <div className="flex items-center bg-red-200/80 rounded-lg p-1">
                <div className="px-4 py-1.5 text-sm font-semibold text-red-800 rounded-md">
                    Cancelled
                </div>
            </div>
        );
    }
    
    return (
        <div className="hidden md:flex items-center bg-gray-200/80 rounded-lg p-1">
            {statuses.map((status, index) => {
                let statusClass = 'bg-transparent text-gray-500'; // For upcoming states
                if (index < currentIndex) {
                    statusClass = 'bg-green-100 text-green-700'; // For completed states
                } else if (index === currentIndex) {
                    statusClass = 'bg-[#EBCFB9] text-gray-800 shadow-sm'; // For the current state
                }

                return (
                    <div key={status} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-300 ${statusClass}`}>
                        {status}
                    </div>
                );
            })}
        </div>
    );
};


// Helper function to format seconds into HH:MM:SS
const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

// New Component for a single Work Order row with timer logic
const WorkOrderRow = ({ order, onToggleTimer, onMarkAsDone, onSetDuration }) => {
  useEffect(() => {
    let interval;
    if (order.isRunning) {
      interval = setInterval(() => {
        onSetDuration(order.id, order.realDuration + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [order.isRunning, order.realDuration, order.id, onSetDuration]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'To Do': return 'text-gray-500';
      case 'In-progress': return 'text-blue-500';
      case 'Done': return 'text-green-500';
      case 'Canceled': return 'text-red-500';
      default: return 'text-gray-700';
    }
  };

  return (
    <tr className="border-b last:border-0 border-gray-200">
      <td className="p-2">{order.operation}</td>
      <td className="p-2">{order.workCenter}</td>
      <td className="p-2">{formatDuration(order.duration)}</td>
      <td className="p-2 font-mono">{formatDuration(order.realDuration)}</td>
      <td className={`p-2 font-semibold ${getStatusColor(order.status)}`}>{order.status}</td>
      <td className="p-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={() => onToggleTimer(order.id)} 
            className="p-1.5 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            disabled={order.status === 'Done' || order.status === 'Canceled'}
            title={order.isRunning ? 'Pause' : 'Start'}
          >
            {order.isRunning ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button 
            onClick={() => onMarkAsDone(order.id)} 
            className="p-1.5 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            disabled={order.status === 'Done' || order.status === 'Canceled'}
            title="Mark as Done"
          >
            <CheckSquare size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};


// Helper component for creating consistent read-only fields
const DisplayField = ({ label, value }) => (
    <div>
        <label className="text-sm font-medium text-gray-600 block">{label}</label>
        <p className="text-gray-800 font-semibold">{value}</p>
    </div>
);


// Helper component for creating consistent input fields
const InputGroup = ({ label, icon, type, addon, options = [] }) => {
    const commonClasses = "w-full bg-gray-100 border border-transparent rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D3B8A8] focus:border-transparent transition";

    return (
        <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">{label}</label>
            <div className="relative">
                {type === 'select' ? (
                     <select className={`${commonClasses} appearance-none pr-8`}>
                        <option>Select...</option>
                        {options.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                ) : (
                    <input type={type} placeholder={label.replace('*','')} className={`${commonClasses} ${addon ? 'pr-16' : ''}`}/>
                )}
               
                {icon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>}
                {addon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">{addon}</span>}
            </div>
        </div>
    );
};


// --- StockLedger Components ---

// Sample Data
const initialProducts = [
  { id: 1, name: 'Dining Table', unit: 'Unit', unitCost: 1200, totalValue: 600000, onHand: 500, freeToUse: 270, incoming: 0, outgoing: 230 },
  { id: 2, name: 'Work Center', unit: 'Unit', unitCost: 2000, totalValue: 54000, onHand: 50, freeToUse: 20, incoming: 0, outgoing: 30 },
  { id: 3, name: 'Drawer', unit: 'Unit', unitCost: 100, totalValue: 2000, onHand: 20, freeToUse: 20, incoming: 0, outgoing: 0 },
  { id: 4, name: 'Office Chair', unit: 'Unit', unitCost: 350, totalValue: 35000, onHand: 100, freeToUse: 80, incoming: 20, outgoing: 40 },
  { id: 5, name: 'Bookshelf', unit: 'Unit', unitCost: 450, totalValue: 22500, onHand: 50, freeToUse: 50, incoming: 0, outgoing: 0 },
];

// New Product Form Component
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

// Custom Confirmation Modal
function ConfirmModal({ isOpen, onClose, onConfirm, title, children }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm w-full">
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

// StockLedger Popup Component
function StockLedgerPopup({ onClose }) {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCardView, setIsCardView] = useState(false);
  const [viewMode, setViewMode] = useState('ledger'); // 'ledger' or 'newProduct'
  const [productToDelete, setProductToDelete] = useState(null);

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
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center font-sans p-4 z-50">
      <div className="bg-[#FEFBF6] rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-[#3D3B37]">Stock Ledger</h2>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X/>
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
                      <Search className="h-5 w-5 text-gray-400" />
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
                        <List className="h-6 w-6 text-gray-600"/>
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
                                    <Copy className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                                    <div onClick={() => handleDeleteRequest(product.id)}>
                                        <Trash2 className="h-5 w-5 text-gray-500 hover:text-red-600 cursor-pointer" />
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


// --- WorkCenter Components ---

// Initial Data
const initialWorkCenters = [
  { id: 1, name: 'Work Center - 1', cost: 50, processing: 0, hasLink: false },
  { id: 2, name: 'Work Center - 2', cost: 50, processing: null, hasLink: false },
  { id: 3, name: 'Work Center - 3', cost: 50, processing: null, hasLink: true },
  { id: 4, name: 'Work Center - 4', cost: null, processing: null, hasLink: false },
  { id: 5, name: 'Work Center - 5', cost: 50, processing: null, hasLink: true },
  { id: 6, name: 'Work Center - 6', cost: null, processing: null, hasLink: false },
];

// Work Center Popup Component
const WorkCenterPopup = ({ onClose }) => {
  const [workCenters, setWorkCenters] = useState(initialWorkCenters);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCardView, setIsCardView] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newWorkCenter, setNewWorkCenter] = useState({ name: '', cost: '' });

  const handleProcessingChange = (id, value) => {
    const newValue = parseInt(value, 10);
    if (isNaN(newValue) && value !== '') return;

    setWorkCenters(prevCenters =>
      prevCenters.map(center =>
        center.id === id ? { ...center, processing: value === '' ? '' : newValue } : center
      )
    );
  };

  const handleAddNewClick = () => {
    setIsAdding(true);
  };

  const handleNewWorkCenterChange = (e) => {
    const { name, value } = e.target;
    setNewWorkCenter(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveNew = () => {
    if (!newWorkCenter.name.trim() || !newWorkCenter.cost) {
      return; 
    }
    const newEntry = {
      id: Date.now(),
      name: newWorkCenter.name,
      cost: parseFloat(newWorkCenter.cost) || 0,
      processing: null,
      hasLink: false,
    };
    setWorkCenters(prevCenters => [newEntry, ...prevCenters]);
    setNewWorkCenter({ name: '', cost: '' });
    setIsAdding(false);
  };

  const handleCancelNew = () => {
    setNewWorkCenter({ name: '', cost: '' });
    setIsAdding(false);
  };
  
  const filteredWorkCenters = useMemo(() => {
    return workCenters.filter(center =>
        center.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [workCenters, searchTerm]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 font-sans">
      <div className="bg-[#FEFBF6] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">Work Center</h2>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X/>
        </button>
      </div>

        {/* Toolbar */}
        <div className="p-4 flex flex-wrap gap-4 items-center border-b border-gray-200">
          <button 
            onClick={handleAddNewClick}
            disabled={isAdding}
            className="bg-[#EADBC8] text-[#634832] font-semibold px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            New
          </button>
          <div className="relative flex-grow min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search />
            </span>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DAC0A3] focus:outline-none transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <List />
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600 font-medium">Card View</span>
            <button
              onClick={() => setIsCardView(!isCardView)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DAC0A3] ${isCardView ? 'bg-[#634832]' : 'bg-gray-300'}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${isCardView ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-y-auto flex-grow">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#F8F0E5]">
              <tr>
                <th className="p-4 font-semibold text-[#634832] uppercase tracking-wider text-sm">Work Center</th>
                <th className="p-4 font-semibold text-[#634832] uppercase tracking-wider text-sm">Cost per Hour</th>
                <th className="p-4 font-semibold text-[#634832] uppercase tracking-wider text-sm">Hourly Processing</th>
                <th className="p-4 font-semibold text-[#634832] uppercase tracking-wider text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isAdding && (
                <tr className="bg-[#F8F0E5]/80">
                  <td className="p-4">
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter name"
                      value={newWorkCenter.name}
                      onChange={handleNewWorkCenterChange}
                      className="w-full py-1 px-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#DAC0A3] focus:outline-none"
                      autoFocus
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      name="cost"
                      placeholder="Enter cost"
                      value={newWorkCenter.cost}
                      onChange={handleNewWorkCenterChange}
                      className="w-full py-1 px-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#DAC0A3] focus:outline-none"
                    />
                  </td>
                  <td className="p-4 text-gray-500">-</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <button onClick={handleSaveNew} className="text-green-600 hover:text-green-800 font-semibold transition-colors">Save</button>
                      <button onClick={handleCancelNew} className="text-red-600 hover:text-red-800 font-semibold transition-colors">Cancel</button>
                    </div>
                  </td>
                </tr>
              )}
              {filteredWorkCenters.map((center) => (
                <tr key={center.id} className="hover:bg-[#F8F0E5]/50 transition-colors">
                  <td className="p-4 text-gray-700">{center.name}</td>
                  <td className="p-4 text-gray-700">{center.cost !== null ? center.cost : '-'}</td>
                  <td className="p-4">
                    {center.processing !== null ? (
                      <div className="relative">
                        <input
                          type="text"
                           value={center.processing}
                           onChange={(e) => handleProcessingChange(center.id, e.target.value)}
                          className="w-32 py-1 px-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-[#DAC0A3] focus:outline-none"
                        />
                         <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">Units/Hour</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 text-gray-500">
                      {center.hasLink && (
                        <button className="hover:text-[#634832] transition-colors"><Link className="w-5 h-5"/></button>
                      )}
                      <button className="hover:text-[#634832] transition-colors"><Copy className="w-5 h-5"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
