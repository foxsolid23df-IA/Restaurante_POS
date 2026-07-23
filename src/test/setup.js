import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock de Supabase global
vi.mock('@/lib/supabase', () => {
  const chainable = () => {
    const methods = {
      select: vi.fn(() => methods),
      insert: vi.fn(() => methods),
      update: vi.fn(() => methods),
      delete: vi.fn(() => methods),
      eq: vi.fn(() => methods),
      neq: vi.fn(() => methods),
      order: vi.fn(() => methods),
      limit: vi.fn(() => methods),
      single: vi.fn(() => methods),
      gte: vi.fn(() => methods),
      lte: vi.fn(() => methods),
      mockResolvedValue: vi.fn(() => methods),
    }
    return methods
  }
  return {
    supabase: {
      from: vi.fn(chainable),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      })),
      auth: {
        getSession: vi.fn(),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
      rpc: vi.fn(),
      removeChannel: vi.fn(),
    },
  }
})

// Cleanup after each test
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
