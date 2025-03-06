const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Next.js 앱 경로를 제공하여 next.config.js와 .env 파일을 로드합니다
  dir: './',
});

// Jest에 전달할 커스텀 설정
/** @type {import('jest').Config} */
const customJestConfig = {
  displayName: 'erinn.me',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
  ],
};

// createJestConfig를 내보내 Next.js가 비동기 설정을 위해 사용할 수 있도록 합니다
module.exports = createJestConfig(customJestConfig); 