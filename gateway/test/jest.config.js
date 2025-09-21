module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    '../src/**/*.js',
    '!../src/index.js', // Exclude main server file from coverage
  ],
  setupFilesAfterEnv: ['<rootDir>/setup.js'],
  testTimeout: 10000,
  verbose: true
};
