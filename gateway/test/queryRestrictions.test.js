const request = require('supertest');
const { generateTestToken, createGraphQLRequest, expectQueryNotAllowed } = require('./utils/testHelpers');

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

describe('Query Restrictions in Demo Mode', () => {
  test('should allow persisted queries', async () => {
    const token = generateTestToken('admin');
    const query = createGraphQLRequest(
      'query { manufacturingOrders { id moNumber } }',
      {},
      token
    );
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
  });

  test('should reject non-persisted queries', async () => {
    const token = generateTestToken('admin');
    const query = createGraphQLRequest(
      'query { __schema { types { name } } }',
      {},
      token
    );
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expectQueryNotAllowed(response);
  });

  test('should reject introspection queries', async () => {
    const token = generateTestToken('admin');
    const query = createGraphQLRequest(
      'query IntrospectionQuery { __schema { queryType { name } } }',
      {},
      token
    );
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expectQueryNotAllowed(response);
  });

  test('should reject complex nested queries', async () => {
    const token = generateTestToken('admin');
    const query = createGraphQLRequest(
      'query { manufacturingOrders { id product { id } } }',
      {},
      token
    );
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expectQueryNotAllowed(response);
  });

  test('should allow exact persisted query matches', async () => {
    const token = generateTestToken('admin');
    // This should match the persisted query format
    const query = createGraphQLRequest(
      'query { product(id: "1") { id sku name } }',
      {},
      token
    );
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();
  });

  test('should reject queries with different variable names', async () => {
    const token = generateTestToken('admin');
    const query = createGraphQLRequest(
      'query { product(id: "different-id") { id sku name } }',
      {},
      token
    );
    
    const response = await request(app)
      .post('/graphql')
      .send(query);
    
    expectQueryNotAllowed(response);
  });
});
