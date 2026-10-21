import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ─── Mock Supabase client ─────────────────────────────────────────────────────
// Prevents real network calls during unit tests.
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select:  vi.fn().mockReturnThis(),
      insert:  vi.fn().mockReturnThis(),
      update:  vi.fn().mockReturnThis(),
      eq:      vi.fn().mockReturnThis(),
      gte:     vi.fn().mockReturnThis(),
      lte:     vi.fn().mockReturnThis(),
      gt:      vi.fn().mockReturnThis(),
      order:   vi.fn().mockReturnThis(),
      abortSignal: vi.fn().mockReturnThis(),
      single:  vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getSession:       vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut:          vi.fn().mockResolvedValue({}),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}))
