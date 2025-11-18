module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middlewares/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**',
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  testTimeout: 10000,
  verbose: true,
};
