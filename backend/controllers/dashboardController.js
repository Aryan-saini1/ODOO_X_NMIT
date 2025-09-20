// const pool = require('../db'); // Uncomment this when you connect to your database

// --- MOCK DATA (for demonstration until DB is connected) ---
const mockOrders = [
    { id: 1, reference: 'MO-000001', start_date: '2025-09-20', finished_product: 'Dining Table', component_status: 'Not Available', quantity: 5.00, uom: 'Units', state: 'Confirmed', assignee_id: 1 },
    { id: 2, reference: 'MO-000002', start_date: '2025-09-22', finished_product: 'Bookshelf', component_status: 'Available', quantity: 2.00, uom: 'Units', state: 'In-Progress', assignee_id: 1 },
    { id: 3, reference: 'MO-000003', start_date: '2025-09-25', finished_product: 'Office Chair', component_status: 'Available', quantity: 10.00, uom: 'Units', state: 'Draft', assignee_id: null },
    { id: 4, reference: 'MO-000004', start_date: '2025-09-18', finished_product: 'Side Table', component_status: 'Available', quantity: 3.00, uom: 'Units', state: 'Confirmed', assignee_id: 2 },
    { id: 5, reference: 'MO-000005', start_date: '2025-09-28', finished_product: 'Wardrobe', component_status: 'Not Available', quantity: 1.00, uom: 'Units', state: 'To Close', assignee_id: 1 },
];

const mockStats = { all: 5, draft: 1, confirmed: 2, inProgress: 1, toClose: 1, notAssigned: 1, late: 1, my: { all: 3, confirmed: 1, inProgress: 1, toClose: 1, } };
// --- END MOCK DATA ---


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
        console.log('Fetching dashboard stats for user:', req.user.id);
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
    const userId = req.user.id;

    try {
        // TODO: Replace this logic with a dynamic SQL query builder.
        console.log(`Fetching orders for user ${userId} with filter: ${filter}, scope: ${scope}, search: ${searchTerm}`);
        
        // This is a placeholder. You will replace this with a real database query
        // that uses the filter, scope, and searchTerm to return the correct data.
        let results = mockOrders;
        if (scope === 'my') {
            // In a real query, this would be `WHERE assignee_id = ${userId}`
            results = mockOrders.filter(o => o.assignee_id === 1); // Mocking user 1
        }
        
        res.json(results);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
