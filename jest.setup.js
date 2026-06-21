/**
 * Jest Setup File for @miethe/ui package tests.
 *
 * Adapted from the skillmeat/web jest.setup.js — only the parts
 * relevant to the ui package are kept (no Next.js-specific mocks).
 */

// Testing library matchers
import '@testing-library/jest-dom';

// jest-axe accessibility matchers
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// Polyfill TextEncoder/TextDecoder for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Polyfill Performance User Timing API for jsdom
if (typeof performance !== 'undefined') {
  if (typeof performance.mark !== 'function') {
    performance.mark = () => {};
  }
  if (typeof performance.measure !== 'function') {
    performance.measure = () => {};
  }
  if (typeof performance.clearMarks !== 'function') {
    performance.clearMarks = () => {};
  }
  if (typeof performance.clearMeasures !== 'function') {
    performance.clearMeasures = () => {};
  }
  if (typeof performance.getEntriesByName !== 'function') {
    performance.getEntriesByName = () => [];
  }
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
