// const pool = require('../db'); // Uncomment this when you connect to your database

// --- MOCK DATA (for demonstration until DB is connected) ---
const mockOrders = [
    { id: 1, reference: 'MO-000001', start_date: '2025-09-20', finished_product: 'Dining Table', component_status: 'Not Available', quantity: 5.00, uom: 'Units', state: 'Confirmed', assignee_id: 9 },
    { id: 2, reference: 'MO-000002', start_date: '2025-09-22', finished_product: 'Bookshelf', component_status: 'Available', quantity: 2.00, uom: 'Units', state: 'In-Progress', assignee_id: 9 },
    { id: 3, reference: 'MO-000003', start_date: '2025-09-25', finished_product: 'Office Chair', component_status: 'Available', quantity: 10.00, uom: 'Units', state: 'Draft', assignee_id: null },
    { id: 4, reference: 'MO-000004', start_date: '2025-09-18', finished_product: 'Side Table', component_status: 'Available', quantity: 3.00, uom: 'Units', state: 'Confirmed', assignee_id: 2 },
    { id: 5, reference: 'MO-000005', start_date: '2025-09-28', finished_product: 'Wardrobe', component_status: 'Not Available', quantity: 1.00, uom: 'Units', state: 'To Close', assignee_id: 9 },
];

const mockStats = { all: 5, draft: 1, confirmed: 2, inProgress: 1, toClose: 1, notAssigned: 1, late: 1, my: { all: 3, confirmed: 1, inProgress: 1, toClose: 1, } };

/**
 * @desc    Get dashboard summary statistics
 * @route   GET /api/dashboard/stats
 * @access  Private (requires token)
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // TODO: Replace mockStats with real SQL queries.
        // const userId = req.user.id;
        // Example Query: const confirmedCount = await pool.query("SELECT COUNT(*) FROM orders WHERE state = 'Confirmed'");
        console.log('Fetching dashboard stats for user:', req.user.userId);
        res.json(mockStats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * @desc    Get manufacturing orders with filtering
 * @route   GET /api/dashboard/orders
 * @access  Private (requires token)
 */
exports.getManufacturingOrders = async (req, res) => {
    const { filter, scope, searchTerm } = req.query;
    const userId = req.user.userId;

    console.log(`Fetching orders for user ${userId} with filter: ${filter}, scope: ${scope}, search: ${searchTerm}`);

    try {
        let results = mockOrders;
        // Filter by scope (my/all)
        if (scope === 'my') {
            console.log(`Filtering orders for userId: ${userId}, available assignee_ids:`, mockOrders.map(o => o.assignee_id));
            results = results.filter(o => o.assignee_id === userId);
            console.log(`Found ${results.length} orders for user ${userId}`);
        }
        // Filter by state (filter)
        if (filter && filter !== 'all') {
            // Normalize state for comparison
            results = results.filter(o => {
                const stateKey = o.state.replace(/[-\s]/g, '').toLowerCase();
                return stateKey === filter.replace(/[-\s]/g, '').toLowerCase();
            });
        }
        // Filter by searchTerm (reference or finished_product)
        if (searchTerm && searchTerm.trim() !== '') {
            const term = searchTerm.trim().toLowerCase();
            results = results.filter(o =>
                o.reference.toLowerCase().includes(term) ||
                (o.finished_product && o.finished_product.toLowerCase().includes(term))
            );
        }
        console.log(`Returning ${results.length} orders after filtering.`);
        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
