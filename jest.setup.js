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

// Stub window.matchMedia (jsdom does not implement it).
//
// Deliberately a PLAIN function, not `jest.fn().mockImplementation(...)`. This config sets
// `resetMocks: true`, which resets every mock before each test and strips the implementation
// off a jest.fn — so the mocked form returned `undefined`, and any caller doing
// `window.matchMedia(q).matches` (e.g. theme.ts `prefersDark()`) threw
// "Cannot read properties of undefined (reading 'matches')". A plain function is immune to
// mock resetting, which is the property we actually want from a jsdom polyfill.
//
// The listener members stay plain no-ops for the same reason. If a test ever needs to assert
// on matchMedia calls, it should spy locally (`jest.spyOn(window, 'matchMedia')`) rather than
// making the global polyfill resettable again.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
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
