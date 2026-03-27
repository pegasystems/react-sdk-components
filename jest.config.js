// eslint-disable-next-line strict
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/packages/react-sdk-components/tests/unit/'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }]
  },
  setupFilesAfterEnv: ['<rootDir>/packages/react-sdk-components/tests/setupTests.js'],
  coverageDirectory: 'tests/coverage'
};
