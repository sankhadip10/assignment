import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Setup for tests
beforeEach(() => {
  jest.clearAllMocks();
});