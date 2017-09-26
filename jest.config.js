module.exports = {
  testPathIgnorePatterns: [
    '/dist/'
  ],
  coveragePathIgnorePatterns: [
    '/dist/'
  ],
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 80,
      functions: 95,
      lines: 95
    }
  }
};
