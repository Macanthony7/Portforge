'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  reason?: string
}

const PLANS = [
  {
    id: 'pro', name: 'Pro', price: '$12', period: '/month',
    description: 'For students building their portfolio',
    features: ['Unlimited projects (all tracks)', 'Clean themed PDF export', 'Custom branding on docs', 'Public portfolio page', 'Markdown export'],
    cta: 'Upgrade to Pro', highlight: false,
  },
  {
    id: 'audit', name: 'Audit Mode', price: '$28', period: '/month',
    description: 'For freelancers delivering client work',
    features: ['Everything in Pro', 'GitHub repo integration', 'Nmap XML import', 'Burp Suite import', 'CVSS scoring', 'Client-ready encrypted exports'],
    cta: 'Upgrade to Audit Mode', highlight: true,
  },
]

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleUpgrade(plan: 'pro' | 'audit') {
    setLoading(plan)
    const res = await fetch('/api/payments/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) { window.location.href = data.url }
    else { setLoading(null); alert('Failed to start checkout. Please try again.') }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="forge-card p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Upgrade Portforge</h2>
              {reason && <p className="text-sm text-white/40">{reason}</p>}
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {PLANS.map(plan => (
              <div key={plan.id} className={cn('rounded-xl border p-5 relative',
                plan.highlight ? 'border-forge-purple/50 bg-forge-purple/5' : 'border-white/10 bg-white/[0.02]')}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-4 bg-forge-purple text-white text-xs px-3 py-1 rounded-full font-medium">Most popular</div>
                )}
                <h3 className="font-semibold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-semibold">{plan.price}</span>
                  <span className="text-white/40 text-sm">{plan.period}</span>
                </div>
                <p className="text-xs text-white/40 mb-4">{plan.description}</p>
                <ul className="space-y-2 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-white/60">
                      <span className="text-forge-purple mt-0.5 shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleUpgrade(plan.id as 'pro' | 'audit')} disabled={loading !== null}
                  className={cn('w-full py-2.5 rounded-lg text-sm font-medium transition-all',
                    plan.highlight ? 'forge-btn-primary' : 'forge-btn-secondary')}>
                  {loading === plan.id ? 'Redirecting…' : plan.cta}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/20">Secured by LemonSqueezy · Cancel any time · All prices USD</p>
        </div>
      </div>
    </div>
  )
}
