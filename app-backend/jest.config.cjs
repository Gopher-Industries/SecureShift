module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  moduleFileExtensions: ["js", "json", "node"],
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],
  testPathIgnorePatterns: ["/node_modules/"],
  transformIgnorePatterns: [
    "/node_modules/(?!(chalk|ansi-styles|strip-ansi|...) )",
  ],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
  ],
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  verbose: true, // maybe or not
  maxWorkers: "50%",
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};
