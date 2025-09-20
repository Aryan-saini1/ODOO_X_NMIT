import React, { useState, useMemo } from 'react';

// --- SVG Icon Components ---
// Using inline SVGs for icons as requested.

const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const ListIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);

const LinkIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
    </svg>
);

const CopyIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const XIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);


// --- Initial Data ---
const initialWorkCenters = [
  { id: 1, name: 'Work Center - 1', cost: 50, processing: 0, hasLink: false },
  { id: 2, name: 'Work Center - 2', cost: 50, processing: null, hasLink: false },
  { id: 3, name: 'Work Center - 3', cost: 50, processing: null, hasLink: true },
  { id: 4, name: 'Work Center - 4', cost: null, processing: null, hasLink: false },
  { id: 5, name: 'Work Center - 5', cost: 50, processing: null, hasLink: true },
  { id: 6, name: 'Work Center - 6', cost: null, processing: null, hasLink: false },
];

// --- Work Center Popup Component ---
const WorkCenterPopup = ({ onClose }) => {
  const [workCenters, setWorkCenters] = useState(initialWorkCenters);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCardView, setIsCardView] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newWorkCenter, setNewWorkCenter] = useState({ name: '', cost: '' });

  const handleProcessingChange = (id, value) => {
    const newValue = parseInt(value, 10);
    if (isNaN(newValue) && value !== '') return; // Allow empty string but not non-numeric text

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
      // Simple validation: ensure name is not just spaces and cost is not empty.
      return; 
    }
    const newEntry = {
      id: Date.now(), // Using timestamp for a simple unique ID in this example
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
              <XIcon />
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
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DAC0A3] focus:outline-none transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <ListIcon />
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
                        <button className="hover:text-[#634832] transition-colors"><LinkIcon className="w-5 h-5"/></button>
                      )}
                      <button className="hover:text-[#634832] transition-colors"><CopyIcon className="w-5 h-5"/></button>
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


// --- Main App Component ---
export default function App() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  return (
    <div className="w-full min-h-screen bg-gray-100 flex justify-center items-center font-sans">
      <button
        onClick={openPopup}
        className="px-8 py-3 bg-[#634832] text-white font-bold rounded-lg shadow-lg hover:bg-[#533d2a] transform hover:-translate-y-1 transition-all duration-300"
      >
        Open Work Center
      </button>

      {isPopupOpen && <WorkCenterPopup onClose={closePopup} />}
    </div>
  );
}
