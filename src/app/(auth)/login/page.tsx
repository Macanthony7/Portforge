'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
        <p className="text-sm text-white/40">Sign in to your Portforge account</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="forge-label block mb-2">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required className="forge-input"/>
        </div>
        <div>
          <label className="forge-label block mb-2">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required className="forge-input"/>
        </div>
        {error && <div className="bg-red-950/40 border border-red-900/40 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}
        <button type="submit" disabled={loading} className="forge-btn-primary w-full py-3 mt-2">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-center text-sm text-white/40 mt-6">
        No account?{' '}
        <Link href="/signup" className="text-forge-lilac hover:text-white transition-colors">Create one free</Link>
      </p>
    </div>
  )
}
