module.exports = {
  testEnvironment: 'node',

  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  extensionsToTreatAsEsm: ['.js'],

  transformIgnorePatterns: [
    '/node_modules/'
  ],

  moduleFileExtensions: ['js', 'json', 'node']
};