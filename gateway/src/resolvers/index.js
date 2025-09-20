const fetch = require('node-fetch');
const pubsub = require('../pubsub');

module.exports = {
  Query: {
    manufacturingOrders: async (_, { status, limit }, ctx) => {
      // Check permissions - allow admin, manager, operator, viewer
      if (!ctx.hasPermission(['admin', 'manager', 'operator', 'viewer'])) {
        throw new Error('Insufficient permissions to view manufacturing orders');
      }
      
      const res = await fetch(`${process.env.MO_SERVICE}/mo?status=${status || ''}&limit=${limit || 50}`, {
        headers: { 'x-request-id': ctx.requestId }
      });
      return await res.json();
    },
    product: async (_, { id }, ctx) => {
      // Check permissions - allow all authenticated users
      if (!ctx.hasPermission(['admin', 'manager', 'operator', 'viewer'])) {
        throw new Error('Insufficient permissions to view products');
      }
      
      return ctx.loaders.product.load(id);
    },
    inventory: async (_, { productId }, ctx) => {
      // Check permissions - allow all authenticated users
      if (!ctx.hasPermission(['admin', 'manager', 'operator', 'viewer'])) {
        throw new Error('Insufficient permissions to view inventory');
      }
      
      const res = await fetch(`${process.env.INVENTORY_SERVICE}/inventory/${productId}`, {
        headers: { 'x-request-id': ctx.requestId }
      });
      return await res.json();
    },
  },

  Mutation: {
    createManufacturingOrder: async (_, { input }, ctx) => {
      // Check permissions - only admin and manager can create MOs
      if (!ctx.hasPermission(['admin', 'manager'])) {
        throw new Error('Insufficient permissions to create manufacturing orders');
      }
      
      const res = await fetch(`${process.env.MO_SERVICE}/mo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-request-id': ctx.requestId },
        body: JSON.stringify(input),
      });
      return await res.json();
    },

    confirmManufacturingOrder: async (_, { id }, ctx) => {
      // Check permissions - only admin and manager can confirm MOs
      if (!ctx.hasPermission(['admin', 'manager'])) {
        throw new Error('Insufficient permissions to confirm manufacturing orders');
      }
      
      const res = await fetch(`${process.env.MO_SERVICE}/mo/${id}/confirm`, {
        method: 'POST',
        headers: { 'x-request-id': ctx.requestId }
      });
      return await res.json();
    },

    startWorkOrder: async (_, { id }, ctx) => {
      // Check permissions - admin, manager, and operator can start work orders
      if (!ctx.hasPermission(['admin', 'manager', 'operator'])) {
        throw new Error('Insufficient permissions to start work orders');
      }
      
      const res = await fetch(`${process.env.MO_SERVICE}/workOrders/${id}/start`, {
        method: 'POST',
        headers: { 'x-request-id': ctx.requestId }
      });
      return await res.json();
    },

    completeWorkOrder: async (_, { id }, ctx) => {
      // Check permissions - admin, manager, and operator can complete work orders
      if (!ctx.hasPermission(['admin', 'manager', 'operator'])) {
        throw new Error('Insufficient permissions to complete work orders');
      }
      
      const res = await fetch(`${process.env.MO_SERVICE}/workOrders/${id}/complete`, {
        method: 'POST',
        headers: { 'x-request-id': ctx.requestId }
      });
      const workOrder = await res.json();
      pubsub.publish('WO_COMPLETED', { workOrderUpdated: workOrder });
      return workOrder;
    },

    reserveStock: async (_, { productId, qty }, ctx) => {
      // Check permissions - admin, manager, and operator can reserve stock
      if (!ctx.hasPermission(['admin', 'manager', 'operator'])) {
        throw new Error('Insufficient permissions to reserve stock');
      }
      
      const res = await fetch(`${process.env.INVENTORY_SERVICE}/inventory/${productId}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-request-id': ctx.requestId },
        body: JSON.stringify({ qty }),
      });
      const inventory = await res.json();
      pubsub.publish('STOCK_RESERVED', { inventoryUpdated: inventory });
      return inventory;
    },
  },

  Subscription: {
    workOrderUpdated: { 
      subscribe: (_, __, ctx) => {
        // Check permissions - allow all authenticated users to subscribe
        if (!ctx.hasPermission(['admin', 'manager', 'operator', 'viewer'])) {
          throw new Error('Insufficient permissions to subscribe to work order updates');
        }
        return pubsub.asyncIterator(['WO_COMPLETED']);
      }
    },
    inventoryUpdated: { 
      subscribe: (_, __, ctx) => {
        // Check permissions - allow all authenticated users to subscribe
        if (!ctx.hasPermission(['admin', 'manager', 'operator', 'viewer'])) {
          throw new Error('Insufficient permissions to subscribe to inventory updates');
        }
        return pubsub.asyncIterator(['STOCK_RESERVED']);
      }
    },
  },

  ManufacturingOrder: {
    product: (mo, _, ctx) => ctx.loaders.product.load(mo.productId),
  },
};
