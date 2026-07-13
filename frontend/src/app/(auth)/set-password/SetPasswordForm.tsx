'use client'

import { useState } from 'react'
import { setupPassword } from '../actions'

export default function SetPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const password = formData.get('password') as string
    const confirm = formData.get('confirmPassword') as string

    if (password !== confirm) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      setLoading(false)
      return
    }

    const result = await setupPassword(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success, the action redirects automatically
  }

  return (
    <form action={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-white" htmlFor="password">
            New Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="block w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:text-white"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-white" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="block w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:text-white"
            placeholder="••••••••"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Saving...' : 'Set Password'}
      </button>
    </form>
  )
}
