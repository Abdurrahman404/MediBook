import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export function makeSession(id = 'patient-1'): Session {
  return {
    access_token: 'test-access-token', refresh_token: 'test-refresh-token',
    expires_in: 3600, token_type: 'bearer',
    user: {
      id, email: `${id}@example.test`, aud: 'authenticated', role: 'authenticated',
      app_metadata: {}, user_metadata: {}, created_at: '2026-10-19T00:00:00Z',
    },
  }
}

export function makeProfile(id = 'patient-1', role: Profile['role'] = 'patient'): Profile {
  return { id, role, email: `${id}@example.test`, full_name: 'Test Patient', phone: null, created_at: '2026-10-19T00:00:00Z' }
}

export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
