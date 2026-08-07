// React Testing Library 확장을 가져옵니다
import '@testing-library/jest-dom';

// API route modules read this value when they are imported. CI does not load
// the local .env file, so provide a deterministic base URL for mocked fetches.
process.env.NXOPEN_API_URL ||= 'https://open.api.nexon.com';

// 테스트에서 Next.js의 useRouter 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// IntersectionObserver 모킹 (사용하는 경우)
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
}

global.IntersectionObserver = MockIntersectionObserver;
