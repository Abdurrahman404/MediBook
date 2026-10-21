// Read-only diagnostics; no account creation and no credentials are printed.
import { loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'

const env = loadEnv('development', fileURLToPath(new URL('../', import.meta.url)), 'VITE_')
try {
  const response = await fetch(new URL('/auth/v1/settings', env.VITE_SUPABASE_URL), {
    headers: { apikey: env.VITE_SUPABASE_ANON_KEY }, signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Auth settings returned HTTP ${response.status}`)
  const settings = await response.json()
  console.log(JSON.stringify({
    email_provider_enabled: settings.external?.email,
    signups_disabled: settings.disable_signup,
    email_auto_confirmed: settings.mailer_autoconfirm,
    minimum_password_length: settings.password_min_length,
  }, null, 2))
} catch (error) {
  console.error(`Auth settings check failed: ${error.message}`)
  process.exitCode = 1
}
