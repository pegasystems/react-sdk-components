module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/packages/react-sdk-components/tests/unit/'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: {
          verbatimModuleSyntax: false,
          types: ['jest', 'node', '@testing-library/jest-dom']
        }
      }
    ]
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/packages/react-sdk-components/tests/setupTests.js'],
  coverageDirectory: 'tests/coverage'
};
