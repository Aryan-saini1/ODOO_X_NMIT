require('dotenv').config();
const express = require('express');
const http = require('http');
const { json } = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { WebSocketServer } = require('ws');
const { makeServer } = require('graphql-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const resolvers = require('./resolvers');
const { createContext } = require('./context');

const typeDefs = fs.readFileSync(__dirname + '/../schema.graphql', 'utf8');
const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
const httpServer = http.createServer(app);

// Set up WebSocket server
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = makeServer({ schema }, wsServer);

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
    // Query validation plugin
    {
      requestDidStart() {
        return {
          didResolveOperation({ request, context }) {
            // Check authentication
            if (context.authError) {
              throw new Error(`Authentication failed: ${context.authError}`);
            }
            
            if (!context.isAuthenticated()) {
              throw new Error('Authentication required');
            }
            
            // Check query restrictions in demo mode
            if (process.env.DEMO_MODE === 'true') {
              try {
                context.queryLoader.validateQuery(
                  request.query, 
                  request.variables, 
                  context.getUserRoles()
                );
              } catch (error) {
                throw new Error(`Query validation failed: ${error.message}`);
              }
            }
          }
        };
      }
    }
  ],
});

async function start() {
  await server.start();

  // Demo token endpoint
  app.get('/demo/tokens', (req, res) => {
    const { generateAllTokens } = require('./utils/tokenGenerator');
    const tokens = generateAllTokens();
    
    res.json({
      message: 'Demo JWT tokens generated',
      tokens: Object.entries(tokens).map(([role, token]) => ({
        role,
        token,
        usage: `Authorization: Bearer ${token}`
      })),
      note: 'Use these tokens in the Authorization header for GraphQL requests'
    });
  });

  // Demo mode info endpoint
  app.get('/demo/info', (req, res) => {
    const { queryLoader } = createContext({ headers: {} });
    const persistedQueries = queryLoader.getAllPersistedQueries();
    
    res.json({
      demoMode: process.env.DEMO_MODE === 'true',
      message: 'GraphQL Gateway Demo Mode',
      features: {
        queryRestriction: process.env.DEMO_MODE === 'true' ? 'Only persisted queries allowed' : 'All queries allowed',
        authentication: 'JWT Bearer token required',
        roleBasedAccess: 'Role-based permissions enforced'
      },
      persistedQueries: persistedQueries,
      endpoints: {
        graphql: '/graphql',
        tokens: '/demo/tokens',
        info: '/demo/info'
      }
    });
  });

  app.use(
    '/graphql',
    cors(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => createContext(req),
    })
  );

  httpServer.listen(process.env.PORT || 4000, () => {
    console.log(`GraphQL Gateway running on port ${process.env.PORT || 4000}`);
    console.log(`Demo mode: ${process.env.DEMO_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
    console.log(`Get demo tokens: http://localhost:${process.env.PORT || 4000}/demo/tokens`);
    console.log(`Demo info: http://localhost:${process.env.PORT || 4000}/demo/info`);
  });
}

start();
