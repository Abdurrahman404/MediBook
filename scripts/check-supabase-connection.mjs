// Run: node scripts/check-supabase-connection.mjs
// Read-only public doctor query. Does not print credentials or patient data.
import { loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'

// Match the application's environment loading, including local overrides.
const settings = loadEnv('development', fileURLToPath(new URL('../', import.meta.url)), 'VITE_')
const projectUrl = settings.VITE_SUPABASE_URL
const publicKey = settings.VITE_SUPABASE_ANON_KEY

try {
  if (!projectUrl || !publicKey) {
    console.error('Environment variable names recognized:', Object.keys(settings).filter((name) => name.startsWith('VITE_SUPABASE_')).join(', ') || '(none)')
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.')
  }
  if (projectUrl.includes('your-project-id')) {
    throw new Error('Replace the placeholder VITE_SUPABASE_URL in .env.')
  }
  const response = await fetch(new URL('/rest/v1/doctors?select=id&limit=1', projectUrl), {
    headers: { apikey: publicKey, Prefer: 'count=exact' },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) {
    throw new Error(`Supabase doctor query returned HTTP ${response.status}. Check the project URL, public key, and table access.`)
  }
  const rows = await response.json()
  if (!Array.isArray(rows)) throw new Error('Unexpected response from the Supabase Data API.')
  const count = response.headers.get('content-range')?.split('/')[1] ?? 'unknown'
  console.log(`Supabase connection successful: public doctor query returned HTTP ${response.status}; doctor count: ${count}.`)
} catch (error) {
  console.error(`Connection check failed: ${error.message}`)
  process.exitCode = 1
}
