import { useAuth } from '@/contexts/AuthContext'

export function AuthNotice() {
  const { error, retryAuth } = useAuth()
  if (!error) return null
  return (
    <div role="alert" className="mx-auto my-4 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <p>{error}</p>
      <button type="button" onClick={retryAuth} className="rounded px-2 py-1 font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-700">Try again</button>
    </div>
  )
}
