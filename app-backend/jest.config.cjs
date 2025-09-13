module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  transform: {
    '^.+\\.m?js$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  globals: {
    'babel-jest': {
      useESM: true,
    },
  },
  testTimeout: 20000,
};
