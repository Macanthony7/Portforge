'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    })
    if (error) { setError(error.message); setLoading(false) }
    else setDone(true)
  }

  if (done) return (
    <div className="w-full max-w-sm text-center animate-fade-in">
      <div className="w-14 h-14 bg-forge-purple/20 border border-forge-purple/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#AFA9EC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
      <p className="text-sm text-white/40 leading-relaxed">
        We sent a confirmation link to <span className="text-white/70">{email}</span>.
      </p>
    </div>
  )

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
        <p className="text-sm text-white/40">Free to start — no card required</p>
      </div>
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="forge-label block mb-2">Full name</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Ada Lovelace" required className="forge-input"/>
        </div>
        <div>
          <label className="forge-label block mb-2">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required className="forge-input"/>
        </div>
        <div>
          <label className="forge-label block mb-2">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Min. 8 characters" minLength={8} required className="forge-input"/>
        </div>
        {error && <div className="bg-red-950/40 border border-red-900/40 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}
        <button type="submit" disabled={loading} className="forge-btn-primary w-full py-3 mt-2">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-center text-sm text-white/40 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-forge-lilac hover:text-white transition-colors">Sign in</Link>
      </p>
    </div>
  )
}
