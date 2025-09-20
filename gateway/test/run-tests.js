#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 GraphQL Gateway Test Suite');
console.log('============================\n');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'true';
process.env.JWT_SECRET = 'test-secret';

const testFiles = [
  'auth.test.js',
  'queryRestrictions.test.js', 
  'workflow.test.js',
  'subscriptions.test.js'
];

const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

async function runTests() {
  console.log('📋 Running Test Categories:\n');
  
  for (const testFile of testFiles) {
    const testPath = path.join(__dirname, testFile);
    
    if (!fs.existsSync(testPath)) {
      console.log(`❌ Test file not found: ${testFile}`);
      continue;
    }
    
    console.log(`🔍 Running ${testFile}...`);
    
    try {
      const output = execSync(`npx jest ${testPath} --config ${path.join(__dirname, 'jest.config.js')} --verbose`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log(`✅ ${testFile} - PASSED\n`);
      testResults.passed++;
      
    } catch (error) {
      console.log(`❌ ${testFile} - FAILED`);
      console.log(error.stdout || error.message);
      console.log('');
      testResults.failed++;
    }
    
    testResults.total++;
  }
  
  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed. Please check the output above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

// Demo queries verification
function verifyDemoQueries() {
  console.log('🔍 Verifying Demo Queries...\n');
  
  const demoQueriesPath = path.join(__dirname, 'demo-queries.json');
  
  if (!fs.existsSync(demoQueriesPath)) {
    console.log('❌ demo-queries.json not found');
    return false;
  }
  
  const demoQueries = JSON.parse(fs.readFileSync(demoQueriesPath, 'utf8'));
  
  const requiredQueries = [
    'createMO',
    'confirmMO', 
    'startWO',
    'completeWO'
  ];
  
  let allPresent = true;
  
  for (const query of requiredQueries) {
    if (demoQueries[query]) {
      console.log(`✅ ${query} - Present`);
    } else {
      console.log(`❌ ${query} - Missing`);
      allPresent = false;
    }
  }
  
  console.log('');
  return allPresent;
}

// Main execution
async function main() {
  console.log('🚀 Starting GraphQL Gateway Test Suite\n');
  
  // Verify demo queries first
  const queriesValid = verifyDemoQueries();
  
  if (!queriesValid) {
    console.log('❌ Demo queries verification failed');
    process.exit(1);
  }
  
  // Run tests
  await runTests();
}

main().catch(console.error);
