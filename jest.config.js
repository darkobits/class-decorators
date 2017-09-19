module.exports = {
  testPathIgnorePatterns: [
    '/dist/'
  ],
  coveragePathIgnorePatterns: [
    '/dist/'
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 80,
      functions: 90,
      lines: 90
    }
  }
};
