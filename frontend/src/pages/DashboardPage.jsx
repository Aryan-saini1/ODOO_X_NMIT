import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- ICONS (as simple functional components) ---
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd" />
    </svg>
);
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// --- API HELPER FUNCTION ---
const API_BASE_URL = 'http://localhost:5001/api';

const fetchFromAPI = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login'; 
        throw new Error('No token found');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

const DashboardPage = () => {
    const navigate = useNavigate();
    
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ all: {}, my: {} });
    const [activeScope, setActiveScope] = useState('all');
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMasterMenu, setShowMasterMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        const getDashboardData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [statsData, ordersData] = await Promise.all([
                    fetchFromAPI('/dashboard/stats'),
                    fetchFromAPI(`/dashboard/orders?scope=${activeScope}&filter=${activeFilter}&searchTerm=${searchTerm}`)
                ]);
                setStats(statsData);
                setOrders(ordersData);
            } catch (err) {
                setError('Failed to fetch data. Please check if the backend server is running.');
                console.error("Fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        getDashboardData();
    }, [activeScope, activeFilter, searchTerm]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };
    
    const formatFilterKey = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    const getStateColor = (state) => {
        switch (state?.toLowerCase()) {
            case 'in-progress': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'to close': return 'bg-green-100 text-green-800';
            case 'draft': return 'bg-gray-100 text-gray-800';
            default: return 'bg-red-100 text-red-800';
        }
    };

    const masterMenuItems = [
        { name: 'Manufacturing Orders', icon: '📋' },
        { name: 'Work Orders', icon: '⚙️' },
        { name: 'Bills of Materials', icon: '📄' },
        { name: 'Work Centre', icon: '🏭' },
        { name: 'Stock Ledger', icon: '📊' }
    ];

    const profileMenuItems = [
        { name: 'My Profile', icon: '👤' },
        { name: 'My Reports', icon: '📈' }
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF5] text-[#333] font-sans">
            <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-black/10 fixed top-0 left-0 right-0 z-10">
                <button className="p-2" onClick={() => setShowMasterMenu(true)}><MenuIcon /></button>
                <div className="text-xl font-bold tracking-wider">🛒O R D O</div>
                <button className="p-2" onClick={() => setShowProfileMenu(true)}><UserIcon /></button>
            </header>

            {/* Master Menu Overlay */}
            {showMasterMenu && (
                <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMasterMenu(false)}>
                    <div 
                        className="fixed left-0 top-0 h-full w-80 bg-[#C8A882] shadow-2xl transform transition-transform duration-300 ease-in-out"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-black/20">
                            <h2 className="text-xl font-bold text-black">master menu</h2>
                            <button 
                                onClick={() => setShowMasterMenu(false)}
                                className="p-1 hover:bg-black/10 rounded"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="py-2">
                            {masterMenuItems.map((item, index) => (
                                <button
                                    key={index}
                                    className="w-full px-6 py-4 text-left hover:bg-black/10 transition-colors border-b border-black/20 flex items-center gap-3"
                                    onClick={() => {
                                        console.log(`Navigating to ${item.name}`);
                                        setShowMasterMenu(false);
                                    }}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="text-black font-medium">{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Menu Overlay */}
            {showProfileMenu && (
                <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowProfileMenu(false)}>
                    <div 
                        className="fixed right-0 top-0 h-full w-80 bg-[#C8A882] shadow-2xl transform transition-transform duration-300 ease-in-out"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-black/20">
                            <h2 className="text-xl font-bold text-black">profile setup</h2>
                            <button 
                                onClick={() => setShowProfileMenu(false)}
                                className="p-1 hover:bg-black/10 rounded"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="py-2">
                            {profileMenuItems.map((item, index) => (
                                <button
                                    key={index}
                                    className="w-full px-6 py-4 text-left hover:bg-black/10 transition-colors border-b border-black/20 flex items-center gap-3"
                                    onClick={() => {
                                        if (item.name === 'My Profile') {
                                            console.log('Opening My Profile');
                                        } else if (item.name === 'My Reports') {
                                            console.log('Opening My Reports');
                                        }
                                        setShowProfileMenu(false);
                                    }}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="text-black font-medium">{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <main className="pt-24 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button className="px-4 py-2 border border-black/30 rounded-lg font-semibold bg-white/80 hover:bg-black/10 transition">New Manufacturing Order</button>
                        <h1 className="text-2xl font-semibold ml-2">Manufacturing Order</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 border border-black/20 rounded hover:bg-black/10"><svg width="20" height="20" fill="none" stroke="currentColor"><rect x="3" y="5" width="14" height="10" rx="2"/><line x1="3" y1="9" x2="17" y2="9"/></svg></button>
                        <button className="p-2 border border-black/20 rounded hover:bg-black/10"><svg width="20" height="20" fill="none" stroke="currentColor"><rect x="4" y="4" width="5" height="5" rx="1"/><rect x="11" y="4" width="5" height="5" rx="1"/><rect x="4" y="11" width="5" height="5" rx="1"/><rect x="11" y="11" width="5" height="5" rx="1"/></svg></button>
                        <div className="relative w-full sm:w-auto ml-2">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><SearchIcon /></span>
                            <input
                                type="text"
                                placeholder="Search Bar"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-black/20 rounded-full focus:ring-2 focus:ring-black focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    {/* All Section */}
                    <div className="flex-1">
                        <h2 className="text-lg font-bold uppercase mb-2">All</h2>
                        <div className="flex flex-wrap gap-2">
                            {stats && stats.all && Object.entries(stats.all).map(([filterKey, count]) => (
                                <button
                                    key={filterKey}
                                    onClick={() => { setActiveScope('all'); setActiveFilter(filterKey); }}
                                    className={`px-4 py-1.5 text-sm font-medium border rounded-full transition-colors duration-200 ${activeScope === 'all' && activeFilter === filterKey ? 'bg-black text-white border-black' : 'bg-white/50 border-black/20 hover:bg-black/5 hover:border-black/40'}`}
                                >
                                    <span className="opacity-70 mr-1.5">&lt;&gt;</span>
                                    {formatFilterKey(filterKey)}
                                    <span className="ml-2 bg-black/10 text-black/60 text-xs font-bold px-1.5 py-0.5 rounded-full">{count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* My Section */}
                    <div className="flex-1">
                        <h2 className="text-lg font-bold uppercase mb-2">My</h2>
                        <div className="flex flex-wrap gap-2">
                            {stats && stats.my && Object.entries(stats.my).map(([filterKey, count]) => (
                                <button
                                    key={filterKey}
                                    onClick={() => { setActiveScope('my'); setActiveFilter(filterKey); }}
                                    className={`px-4 py-1.5 text-sm font-medium border rounded-full transition-colors duration-200 ${activeScope === 'my' && activeFilter === filterKey ? 'bg-black text-white border-black' : 'bg-white/50 border-black/20 hover:bg-black/5 hover:border-black/40'}`}
                                >
                                    <span className="opacity-70 mr-1.5">&lt;&gt;</span>
                                    {formatFilterKey(filterKey)}
                                    <span className="ml-2 bg-black/10 text-black/60 text-xs font-bold px-1.5 py-0.5 rounded-full">{count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-black/10 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="border-b border-black/10">
                            <tr>
                                <th className="p-3"><input type="checkbox" className="rounded-sm border-gray-400" /></th>
                                {["Reference", "Start Date", "Finished Product", "Component Status", "Quantity", "Unit", "State"].map(header => (
                                    <th key={header} className="p-3 font-semibold uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr><td colSpan="8" className="text-center p-8">Loading orders...</td></tr>
                            )}
                            {error && !isLoading && (
                                <tr><td colSpan="8" className="text-center p-8 text-red-600 bg-red-50">{error}</td></tr>
                            )}
                            {!isLoading && !error && orders.length === 0 && (
                                <tr><td colSpan="8" className="text-center p-8">No orders found for this filter.</td></tr>
                            )}
                            {!isLoading && !error && orders.map((order, index) => (
                                <tr key={order.id} className="border-b border-black/10 last:border-b-0 hover:bg-black/5">
                                    <td className="p-3"><input type="checkbox" className="rounded-sm border-gray-400" /></td>
                                    <td className="p-3 font-mono">{order.reference}</td>
                                    <td className="p-3">{new Date(order.start_date).toLocaleDateString()}</td>
                                    <td className="p-3">{order.finished_product}</td>
                                    <td className="p-3">{order.component_status}</td>
                                    <td className="p-3 text-right">{order.quantity.toFixed(2)}</td>
                                    <td className="p-3">{order.uom}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(order.state)}`}>
                                            {order.state}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

// --- THIS IS THE FIX ---
// This line makes the component available for default imports.
export default DashboardPage;

