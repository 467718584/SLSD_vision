import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// 每个测试后清理
afterEach(() => {
  cleanup()
})

// Mock fetch API - 返回有效的Promise
const mockFetch = vi.fn().mockImplementation((url) => {
  // 模拟API响应
  if (url.includes('/charts')) {
    return Promise.resolve({
      json: () => Promise.resolve({ detail: null }),
      ok: true
    })
  }
  if (url.includes('/datasets')) {
    return Promise.resolve({
      json: () => Promise.resolve([]),
      ok: true
    })
  }
  if (url.includes('/models')) {
    return Promise.resolve({
      json: () => Promise.resolve([]),
      ok: true
    })
  }
  if (url.includes('/stats')) {
    return Promise.resolve({
      json: () => Promise.resolve({ datasets: {}, models: {} }),
      ok: true
    })
  }
  if (url.includes('/settings')) {
    return Promise.resolve({
      json: () => Promise.resolve({ algo_types: [], tech_methods: [], sites: [] }),
      ok: true
    })
  }
  if (url.includes('/auth/me')) {
    return Promise.resolve({
      json: () => Promise.resolve({ success: false, error: 'Not authenticated' }),
      ok: true
    })
  }
  // 默认返回成功响应
  return Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true
  })
})

global.fetch = mockFetch

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock crypto.randomUUID
if (!global.crypto) {
  global.crypto = {}
}
global.crypto.randomUUID = vi.fn().mockReturnValue('test-uuid')

// Mock console.error in tests to reduce noise
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.('Warning:')) return
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
