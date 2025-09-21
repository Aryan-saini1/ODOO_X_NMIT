const request = require('supertest');
const { generateTestToken, createGraphQLRequest, expectUnauthorized, expectInsufficientPermissions } = require('./utils/testHelpers');

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

describe('Authentication Tests', () => {
  test('should reject requests without authorization header', async () => {
    const query = createGraphQLRequest('query { manufacturingOrders { id } }');
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expectUnauthorized(response);
  });

  test('should reject requests with invalid token', async () => {
    const query = createGraphQLRequest('query { manufacturingOrders { id } }', {}, 'invalid-token');
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('Authentication failed');
  });

  test('should accept requests with valid admin token', async () => {
    const token = generateTestToken('admin');
    const query = createGraphQLRequest('query { manufacturingOrders { id } }', {}, token);
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
  });

  test('should accept requests with valid manager token', async () => {
    const token = generateTestToken('manager');
    const query = createGraphQLRequest('query { manufacturingOrders { id } }', {}, token);
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
  });

  test('should accept requests with valid operator token', async () => {
    const token = generateTestToken('operator');
    const query = createGraphQLRequest('query { manufacturingOrders { id } }', {}, token);
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
  });

  test('should accept requests with valid viewer token', async () => {
    const token = generateTestToken('viewer');
    const query = createGraphQLRequest('query { manufacturingOrders { id } }', {}, token);
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
  });
});

describe('Role-Based Access Control Tests', () => {
  test('should allow admin to create manufacturing orders', async () => {
    const token = generateTestToken('admin');
    const query = createGraphQLRequest(
      'mutation { createManufacturingOrder(input: {productId: "1", quantity: 10}) { id } }',
      {},
      token
    );
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
  });

  test('should allow manager to create manufacturing orders', async () => {
    const token = generateTestToken('manager');
    const query = createGraphQLRequest(
      'mutation { createManufacturingOrder(input: {productId: "1", quantity: 10}) { id } }',
      {},
      token
    );
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
  });

  test('should deny operator from creating manufacturing orders', async () => {
    const token = generateTestToken('operator');
    const query = createGraphQLRequest(
      'mutation { createManufacturingOrder(input: {productId: "1", quantity: 10}) { id } }',
      {},
      token
    );
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expectInsufficientPermissions(response);
  });

  test('should deny viewer from creating manufacturing orders', async () => {
    const token = generateTestToken('viewer');
    const query = createGraphQLRequest(
      'mutation { createManufacturingOrder(input: {productId: "1", quantity: 10}) { id } }',
      {},
      token
    );
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expectInsufficientPermissions(response);
  });

  test('should allow operator to start work orders', async () => {
    const token = generateTestToken('operator');
    const query = createGraphQLRequest(
      'mutation { startWorkOrder(id: "WO-001") { id } }',
      {},
      token
    );
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
  });

  test('should deny viewer from starting work orders', async () => {
    const token = generateTestToken('viewer');
    const query = createGraphQLRequest(
      'mutation { startWorkOrder(id: "WO-001") { id } }',
      {},
      token
    );
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expectInsufficientPermissions(response);
  });
});
