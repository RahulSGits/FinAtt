'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, ArrowRight, Building2, Briefcase, Phone, UserCircle2 } from 'lucide-react'
import { register } from '../actions'
import Link from 'next/link'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    // Validate password match
    if (formData.get('password') !== formData.get('confirmPassword')) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    
    const res = await register(formData)
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-white/10"
      >
        <div className="p-8 sm:p-12">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <UserPlus size={28} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create an account
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Join FinAtt to manage your workforce
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <UserCircle2 size={18} />
                  </div>
                  <input
                    name="fullName"
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Phone size={18} />
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+1 234 567 890"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Account Role</label>
                <select
                  name="role"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800 appearance-none"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR Manager</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Building2 size={18} />
                  </div>
                  <input
                    name="department"
                    type="text"
                    required
                    placeholder="Engineering"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Designation</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Briefcase size={18} />
                  </div>
                  <input
                    name="designation"
                    type="text"
                    required
                    placeholder="Software Engineer"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-70 mt-4"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/5 py-4 px-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
