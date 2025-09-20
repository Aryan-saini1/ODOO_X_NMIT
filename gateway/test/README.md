# GraphQL Gateway Test Suite

This directory contains comprehensive tests for the GraphQL Gateway, including authentication, authorization, query restrictions, and workflow verification.

## 🧪 Test Structure

### Test Files

- **`auth.test.js`** - Authentication and role-based access control tests
- **`queryRestrictions.test.js`** - Demo mode query restriction tests  
- **`workflow.test.js`** - Manufacturing workflow and demo queries verification
- **`subscriptions.test.js`** - Real-time subscription tests

### Test Utilities

- **`utils/testHelpers.js`** - Common test utilities and assertions
- **`setup.js`** - Jest setup and environment configuration
- **`jest.config.js`** - Jest configuration
- **`demo-queries.json`** - Demo queries for verification
- **`run-tests.js`** - Custom test runner script

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
npm run test:auth          # Authentication tests
npm run test:workflow      # Workflow tests  
npm run test:subscriptions # Subscription tests
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run in Watch Mode
```bash
npm run test:watch
```

### Custom Test Runner
```bash
node gateway/test/run-tests.js
```

## 📋 Test Categories

### 1. Authentication Tests (`auth.test.js`)

Tests JWT authentication and role-based access control:

- ✅ Rejects requests without authorization header
- ✅ Rejects requests with invalid tokens
- ✅ Accepts requests with valid tokens (admin, manager, operator, viewer)
- ✅ Enforces role-based permissions for mutations
- ✅ Prevents unauthorized access to restricted operations

**Roles Tested:**
- `admin` - Full access to all operations
- `manager` - Can create/manage manufacturing orders
- `operator` - Can execute work orders and reserve stock
- `viewer` - Read-only access

### 2. Query Restrictions Tests (`queryRestrictions.test.js`)

Tests demo mode query restrictions:

- ✅ Allows persisted queries
- ✅ Rejects non-persisted queries
- ✅ Rejects introspection queries
- ✅ Rejects complex nested queries
- ✅ Validates exact query matches

### 3. Workflow Tests (`workflow.test.js`)

Tests the complete manufacturing workflow and verifies demo queries:

#### Demo Queries Verification:
- ✅ **createMO** → returns MO with id and moNumber
- ✅ **confirmMO** → returns MO with status: CONFIRMED  
- ✅ **startWO** → triggers work order subscription
- ✅ **completeWO** → triggers inventoryUpdated subscription

#### Complete Workflow:
1. Create Manufacturing Order (admin/manager)
2. Confirm Manufacturing Order (admin/manager)
3. Start Work Order (admin/manager/operator)
4. Complete Work Order (admin/manager/operator)

#### Additional Tests:
- Product and inventory queries
- Stock reservation operations
- Error handling and validation

### 4. Subscription Tests (`subscriptions.test.js`)

Tests real-time subscriptions and triggers:

- ✅ Work order update subscriptions
- ✅ Inventory update subscriptions
- ✅ Role-based subscription access
- ✅ Subscription data structure validation
- ✅ Mutation-triggered subscription events

## 🔧 Test Configuration

### Environment Variables
```bash
NODE_ENV=test
DEMO_MODE=true
JWT_SECRET=test-secret
MO_SERVICE=http://localhost:3001
INVENTORY_SERVICE=http://localhost:3002
PRODUCT_SERVICE=http://localhost:3003
```

### Mock Services
Tests use mocked external services to ensure:
- Consistent test results
- No dependency on external services
- Fast test execution
- Isolated test environment

## 📊 Demo Queries Verification

The test suite verifies the specific demo queries defined in `demo-queries.json`:

```json
{
  "createMO": "mutation { createManufacturingOrder(input:{productId:\"1\",quantity:10}) { id moNumber } }",
  "confirmMO": "mutation { confirmManufacturingOrder(id:\"MO-001\") { id moNumber status } }",
  "startWO": "mutation { startWorkOrder(id:\"WO-001\") { id moId status } }",
  "completeWO": "mutation { completeWorkOrder(id:\"WO-001\") { id moId status } }"
}
```

### Verification Criteria:
1. **createMO** → Returns manufacturing order with id and moNumber
2. **confirmMO** → Returns manufacturing order with status: CONFIRMED
3. **startWO** → Triggers work order subscription
4. **completeWO** → Triggers inventoryUpdated subscription

## 🎯 Test Coverage

The test suite covers:
- ✅ Authentication and authorization
- ✅ Query restrictions in demo mode
- ✅ Role-based access control
- ✅ Manufacturing workflow
- ✅ Real-time subscriptions
- ✅ Error handling
- ✅ Data validation
- ✅ Demo query verification

## 🐛 Debugging Tests

### Verbose Output
```bash
npm test -- --verbose
```

### Run Single Test
```bash
npx jest auth.test.js --config gateway/test/jest.config.js
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📝 Adding New Tests

1. Create test file in `gateway/test/`
2. Import test utilities from `utils/testHelpers.js`
3. Follow existing test patterns
4. Update this README with new test descriptions
5. Add test script to `package.json` if needed

## 🔍 Test Assertions

Common test assertions available in `testHelpers.js`:

- `expectGraphQLSuccess(response)` - Validates successful GraphQL response
- `expectUnauthorized(response)` - Validates authentication failure
- `expectInsufficientPermissions(response)` - Validates permission denial
- `expectQueryNotAllowed(response)` - Validates query restriction
- `expectGraphQLError(response, message)` - Validates GraphQL error

## 🚨 Troubleshooting

### Common Issues:

1. **Port conflicts**: Ensure test port (4000) is not in use
2. **Mock failures**: Check mock implementations in `setup.js`
3. **Token issues**: Verify JWT secret matches between test and server
4. **Timeout errors**: Increase timeout in `jest.config.js`

### Test Environment:
- Node.js 16+
- Jest 30+
- Supertest for HTTP testing
- Mocked external services
