'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLocalMode } from '@/hooks/use-local-mode'
import { UpgradeModal } from '@/components/ui/upgrade-modal'
import { cn, slugify } from '@/lib/utils'
import type { DocumentationMode, SubscriptionTier } from '@/types'

export default function SettingsPage() {
  const router = useRouter()
  const { isLocalMode, toggleLocalMode } = useLocalMode()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [mode, setMode] = useState<DocumentationMode>('static')
  const [portfolioPublic, setPortfolioPublic] = useState(true)
  const [tier, setTier] = useState<SubscriptionTier>('free')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles')
        .select('full_name, username, bio, documentation_mode, subscription_tier, portfolio_public')
        .eq('id', user.id).single()
      if (data) {
        setFullName(data.full_name || '')
        setUsername(data.username || '')
        setBio(data.bio || '')
        setMode(data.documentation_mode as DocumentationMode)
        setTier(data.subscription_tier as SubscriptionTier)
        setPortfolioPublic(data.portfolio_public ?? true)
      }
    }
    load()
  }, [])

  // Auto-generate username from full name if not set
  function handleNameChange(name: string) {
    setFullName(name)
    if (!username) setUsername(slugify(name))
  }

  async function handleSave() {
    setUsernameError('')
    if (username && !/^[a-z0-9-]+$/.test(username)) {
      setUsernameError('Username can only contain lowercase letters, numbers and hyphens.')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles')
      .update({ full_name: fullName, username, bio, documentation_mode: mode, portfolio_public: portfolioPublic })
      .eq('id', user.id)

    if (error?.message?.includes('unique')) {
      setUsernameError('This username is already taken. Choose another.')
      setSaving(false)
      return
    }

    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const portfolioUrl = username ? `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${username}` : null

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)}/>

      <h1 className="text-2xl font-semibold mb-8">Settings</h1>

      {/* Profile */}
      <section className="forge-card p-6 mb-5">
        <h2 className="text-sm font-medium mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="forge-label block mb-2">Full name</label>
            <input type="text" value={fullName} onChange={e => handleNameChange(e.target.value)}
              className="forge-input" placeholder="Ada Lovelace"/>
          </div>
          <div>
            <label className="forge-label block mb-2">Username</label>
            <div className="flex items-center">
              <span className="text-sm text-white/30 px-3 py-2.5 bg-white/5 border border-r-0 border-white/10 rounded-l-lg">/u/</span>
              <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="forge-input rounded-l-none flex-1" placeholder="ada-lovelace"/>
            </div>
            {usernameError && <p className="text-xs text-red-400 mt-1">{usernameError}</p>}
            {portfolioUrl && !usernameError && (
              <p className="text-xs text-white/30 mt-1">
                Portfolio: <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-forge-lilac hover:underline">{portfolioUrl}</a>
              </p>
            )}
          </div>
          <div>
            <label className="forge-label block mb-2">Bio <span className="text-white/20 normal-case font-normal">(optional)</span></label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              className="forge-input resize-none" rows={2} placeholder="Security researcher · CTF enthusiast · Building cool things"/>
          </div>
        </div>
      </section>

      {/* Portfolio visibility */}
      <section className="forge-card p-6 mb-5">
        <h2 className="text-sm font-medium mb-1">Portfolio visibility</h2>
        <p className="text-xs text-white/40 mb-4">Control who can see your public portfolio page.</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">{portfolioPublic ? 'Public' : 'Private'}</p>
            <p className="text-xs text-white/40 mt-0.5">
              {portfolioPublic ? 'Anyone with your portfolio link can view it.' : 'Your portfolio is hidden from everyone.'}
            </p>
          </div>
          <button onClick={() => setPortfolioPublic(!portfolioPublic)}
            className={cn('w-11 h-6 rounded-full transition-colors relative shrink-0', portfolioPublic ? 'bg-forge-purple' : 'bg-white/10')}>
            <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm',
              portfolioPublic ? 'translate-x-5' : 'translate-x-0.5')}/>
          </button>
        </div>
      </section>

      {/* Documentation mode */}
      <section className="forge-card p-6 mb-5">
        <h2 className="text-sm font-medium mb-1">Documentation mode</h2>
        <p className="text-xs text-white/40 mb-4">Applied to all new projects. Change any time in Settings.</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'static', label: 'Static', icon: '✦', desc: 'AI asks questions and writes the full document from your answers.' },
            { value: 'integrative', label: 'Integrative', icon: '⬡', desc: 'Connect GitHub, upload Nmap/Burp files. AI pulls data automatically.', locked: tier === 'free' },
          ] as const).map(opt => (
            <button key={opt.value}
              onClick={() => {
                if (opt.locked) { setShowUpgrade(true); return }
                setMode(opt.value as DocumentationMode)
              }}
              className={cn('p-4 rounded-xl border text-left transition-all',
                mode === opt.value && !opt.locked ? 'border-forge-purple/50 bg-forge-purple/10' : 'border-white/10 bg-white/5 hover:border-white/20',
                opt.locked && 'opacity-60')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-forge-purple">{opt.icon}</span>
                {opt.locked && <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">Audit Mode</span>}
              </div>
              <p className="text-sm font-medium mb-1">{opt.label}</p>
              <p className="text-xs text-white/40 leading-relaxed">{opt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Local mode */}
      <section className="forge-card p-6 mb-5">
        <h2 className="text-sm font-medium mb-1">Local mode</h2>
        <p className="text-xs text-white/40 mb-4">
          When enabled, projects are stored only in your browser — nothing is sent to our servers.
          Ideal for sensitive audit work.
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">{isLocalMode ? 'Local mode active' : 'Cloud mode (default)'}</p>
            <p className="text-xs text-white/40 mt-0.5">
              {isLocalMode ? 'Data stays in your browser. Export to markdown to save.' : 'Projects sync to Supabase securely.'}
            </p>
          </div>
          <button onClick={() => toggleLocalMode(!isLocalMode)}
            className={cn('w-11 h-6 rounded-full transition-colors relative shrink-0', isLocalMode ? 'bg-forge-purple' : 'bg-white/10')}>
            <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm',
              isLocalMode ? 'translate-x-5' : 'translate-x-0.5')}/>
          </button>
        </div>
        {isLocalMode && (
          <div className="mt-4 bg-amber-950/30 border border-amber-900/40 text-amber-400 text-xs px-4 py-3 rounded-lg">
            ⚠ Local mode projects are not backed up. Export to markdown regularly.
          </div>
        )}
      </section>

      {/* Subscription */}
      <section className="forge-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium mb-1">Subscription</h2>
            <p className="text-xs text-white/40">You are on the <span className="text-white/70 capitalize">{tier}</span> plan</p>
          </div>
          {tier === 'free' && (
            <button onClick={() => setShowUpgrade(true)} className="forge-btn-primary text-xs py-2">Upgrade →</button>
          )}
        </div>
        {tier === 'free' && (
          <div className="mt-4 text-xs text-white/30 space-y-1">
            <p>• 2 projects per career track on Free</p>
            <p>• Pro ($12/mo): Unlimited + PDF export + custom branding</p>
            <p>• Audit Mode ($28/mo): Everything + GitHub, Nmap & Burp integrations</p>
          </div>
        )}
      </section>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="forge-btn-primary">
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
        </button>
        <button onClick={handleSignOut} className="forge-btn-secondary text-red-400/70 hover:text-red-400">Sign out</button>
      </div>
    </div>
  )
}
