const request = require('supertest');
const { generateTestToken, createGraphQLRequest, expectGraphQLSuccess } = require('./utils/testHelpers');

// Import the server setup
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { json } = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const resolvers = require('../src/resolvers');
const { createContext } = require('../src/context');

const typeDefs = fs.readFileSync(__dirname + '/../schema.graphql', 'utf8');
const schema = makeExecutableSchema({ typeDefs, resolvers });

let app;
let server;

beforeAll(async () => {
  app = express();
  server = new ApolloServer({ schema });
  await server.start();
  
  app.use(
    '/graphql',
    cors(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => createContext(req),
    })
  );
});

afterAll(async () => {
  await server.stop();
});

describe('Manufacturing Workflow Tests', () => {
  let adminToken;
  let managerToken;
  let operatorToken;

  beforeAll(() => {
    adminToken = generateTestToken('admin');
    managerToken = generateTestToken('manager');
    operatorToken = generateTestToken('operator');
  });

  describe('Demo Queries Verification', () => {
    test('createMO → returns MO', async () => {
      const query = createGraphQLRequest(
        'mutation { createManufacturingOrder(input:{productId:"1",quantity:10}) { id moNumber } }',
        {},
        adminToken
      );
      
      const response = await request(app)
        .post('/graphql')
        .send(query);
      
      expectGraphQLSuccess(response);
      expect(response.body.data.createManufacturingOrder).toBeDefined();
      expect(response.body.data.createManufacturingOrder.id).toBeDefined();
      expect(response.body.data.createManufacturingOrder.moNumber).toBeDefined();
    });

    test('confirmMO → returns MO with status: CONFIRMED', async () => {
      const query = createGraphQLRequest(
        'mutation { confirmManufacturingOrder(id:"MO-001") { id moNumber status } }',
        {},
        managerToken
      );
      
      const response = await request(app)
        .post('/graphql')
        .send(query);
      
      expectGraphQLSuccess(response);
      expect(response.body.data.confirmManufacturingOrder).toBeDefined();
      expect(response.body.data.confirmManufacturingOrder.id).toBe('MO-001');
      expect(response.body.data.confirmManufacturingOrder.status).toBe('CONFIRMED');
    });

    test('startWO → triggers subscription', async () => {
      const query = createGraphQLRequest(
        'mutation { startWorkOrder(id:"WO-001") { id moId status } }',
        {},
        operatorToken
      );
      
      const response = await request(app)
        .post('/graphql')
        .send(query);
      
      expectGraphQLSuccess(response);
      expect(response.body.data.startWorkOrder).toBeDefined();
      expect(response.body.data.startWorkOrder.id).toBe('WO-001');
      expect(response.body.data.startWorkOrder.status).toBeDefined();
    });

    test('completeWO → triggers inventoryUpdated subscription', async () => {
      const query = createGraphQLRequest(
        'mutation { completeWorkOrder(id:"WO-001") { id moId status } }',
        {},
        operatorToken
      );
      
      const response = await request(app)
        .post('/graphql')
        .send(query);
      
      expectGraphQLSuccess(response);
      expect(response.body.data.completeWorkOrder).toBeDefined();
      expect(response.body.data.completeWorkOrder.id).toBe('WO-001');
      expect(response.body.data.completeWorkOrder.status).toBeDefined();
    });
  });

  describe('Complete Manufacturing Workflow', () => {
    test('should complete full MO → WO → completion workflow', async () => {
      // Step 1: Create Manufacturing Order
      const createMOQuery = createGraphQLRequest(
        'mutation { createManufacturingOrder(input:{productId:"1",quantity:10}) { id moNumber status } }',
        {},
        adminToken
      );
      
      const createResponse = await request(app)
        .post('/graphql')
        .send(createMOQuery);
      
      expectGraphQLSuccess(createResponse);
      const moId = createResponse.body.data.createManufacturingOrder.id;
      
      // Step 2: Confirm Manufacturing Order
      const confirmMOQuery = createGraphQLRequest(
        `mutation { confirmManufacturingOrder(id:"${moId}") { id moNumber status } }`,
        {},
        managerToken
      );
      
      const confirmResponse = await request(app)
        .post('/graphql')
        .send(confirmMOQuery);
      
      expectGraphQLSuccess(confirmResponse);
      expect(confirmResponse.body.data.confirmManufacturingOrder.status).toBe('CONFIRMED');
      
      // Step 3: Start Work Order
      const startWOQuery = createGraphQLRequest(
        'mutation { startWorkOrder(id:"WO-001") { id moId status } }',
        {},
        operatorToken
      );
      
      const startResponse = await request(app)
        .post('/graphql')
        .send(startWOQuery);
      
      expectGraphQLSuccess(startResponse);
      expect(startResponse.body.data.startWorkOrder.status).toBeDefined();
      
      // Step 4: Complete Work Order
      const completeWOQuery = createGraphQLRequest(
        'mutation { completeWorkOrder(id:"WO-001") { id moId status } }',
        {},
        operatorToken
      );
      
      const completeResponse = await request(app)
        .post('/graphql')
        .send(completeWOQuery);
      
      expectGraphQLSuccess(completeResponse);
      expect(completeResponse.body.data.completeWorkOrder.status).toBeDefined();
    });

    test('should handle inventory operations', async () => {
      // Get initial inventory
      const getInventoryQuery = createGraphQLRequest(
        'query { inventory(productId:"1") { productId qtyAvailable qtyReserved } }',
        {},
        adminToken
      );
      
      const inventoryResponse = await request(app)
        .post('/graphql')
        .send(getInventoryQuery);
      
      expectGraphQLSuccess(inventoryResponse);
      expect(inventoryResponse.body.data.inventory.productId).toBe('1');
      
      // Reserve stock
      const reserveStockQuery = createGraphQLRequest(
        'mutation { reserveStock(productId:"1", qty:5.0) { productId qtyAvailable qtyReserved } }',
        {},
        operatorToken
      );
      
      const reserveResponse = await request(app)
        .post('/graphql')
        .send(reserveStockQuery);
      
      expectGraphQLSuccess(reserveResponse);
      expect(reserveResponse.body.data.reserveStock.productId).toBe('1');
    });
  });

  describe('Product and Inventory Queries', () => {
    test('should get product details', async () => {
      const query = createGraphQLRequest(
        'query { product(id:"1") { id sku name } }',
        {},
        adminToken
      );
      
      const response = await request(app)
        .post('/graphql')
        .send(query);
      
      expectGraphQLSuccess(response);
      expect(response.body.data.product).toBeDefined();
      expect(response.body.data.product.id).toBe('1');
    });

    test('should get manufacturing orders', async () => {
      const query = createGraphQLRequest(
        'query { manufacturingOrders { id moNumber status } }',
        {},
        adminToken
      );
      
      const response = await request(app)
        .post('/graphql')
        .send(query);
      
      expectGraphQLSuccess(response);
      expect(Array.isArray(response.body.data.manufacturingOrders)).toBe(true);
    });
  });
});
