'use client'
import { useState, useEffect, useCallback } from 'react'
import { getProviderName, getSuggestedModels, PROVIDER_CONFIGS } from '@/lib/llm/config'
import { createLLMClient } from '@/lib/llm/client'
import type { LLMProvider } from '@/types'

const PROVIDERS = Object.keys(PROVIDER_CONFIGS) as LLMProvider[]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'llm' | 'preferences' | 'about'>('llm')
  const [provider, setProvider] = useState<LLMProvider>('anthropic')
  const [model, setModel] = useState('')
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testError, setTestError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('portforge_provider')
    const next = PROVIDERS.includes(saved as LLMProvider) ? (saved as LLMProvider) : 'anthropic'
    const nextModel = localStorage.getItem('portforge_model') || getSuggestedModels(next)[0] || ''
    setProvider(next)
    setModel(nextModel)
    localStorage.setItem('portforge_provider', next)
    localStorage.setItem('portforge_model', nextModel)
  }, [])

  const handleTestConnection = useCallback(async () => {
    setTestStatus('testing')
    setTestError('')
    try {
      const client = createLLMClient({ provider, model })
      const result = await client.testConnection()
      setTestStatus(result.success ? 'success' : 'error')
      if (!result.success) setTestError(result.error || 'Connection failed')
    } catch (err) {
      setTestStatus('error')
      setTestError(err instanceof Error ? err.message : 'Connection failed')
    }
  }, [provider, model])

  const handleProviderChange = (next: LLMProvider) => {
    setProvider(next)
    localStorage.setItem('portforge_provider', next)
    const nextModel = getSuggestedModels(next)[0] || ''
    setModel(nextModel)
    localStorage.setItem('portforge_model', nextModel)
    setTestStatus('idle')
    setTestError('')
  }

  const handleModelChange = (value: string) => {
    setModel(value)
    localStorage.setItem('portforge_model', value)
    setTestStatus('idle')
    setTestError('')
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-8 text-white">Settings</h1>

      <div className="flex items-center gap-1 mb-8 border-b border-white/5">
        {[
          { id: 'llm' as const, label: 'LLM Configuration' },
          { id: 'preferences' as const, label: 'Preferences' },
          { id: 'about' as const, label: 'About' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id ? 'border-forge-purple text-white' : 'border-transparent text-white/40 hover:text-white/60'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'llm' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="llm-api-style" className="forge-label block mb-2">API Style</label>
              <select
                id="llm-api-style"
                value={provider}
                onChange={e => handleProviderChange(e.target.value as LLMProvider)}
                className="forge-input"
              >
                {PROVIDERS.map(p => (
                  <option key={p} value={p}>{getProviderName(p)}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="llm-model" className="forge-label block mb-2">Model</label>
              <input
                id="llm-model"
                list="model-suggestions"
                value={model}
                onChange={e => handleModelChange(e.target.value)}
                placeholder="Enter a model id"
                className="forge-input"
              />
              <datalist id="model-suggestions">
                {getSuggestedModels(provider).map(m => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              <p className="text-xs text-white/30 mt-1">Pick a suggestion or enter any model id your endpoint accepts.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleTestConnection} disabled={testStatus === 'testing'}
                className="forge-btn-primary">
                {testStatus === 'testing' ? 'Testing…' : 'Test Connection'}
              </button>

              {testStatus === 'success' && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Connected
                </span>
              )
              }
              {testStatus === 'error' && (
                <span className="flex items-center gap-1.5 text-sm text-red-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  {testError || 'Connection failed'}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-2">
            <p className="text-sm text-white/60">
              Keys stay on the server and are never sent to the browser. The proxy reads them from the server environment:
            </p>
            <ul className="text-xs text-white/40 space-y-1 font-mono">
              {PROVIDERS.map(p => (
                <li key={p}>{PROVIDER_CONFIGS[p].keyEnv} / {PROVIDER_CONFIGS[p].baseUrlEnv}</li>
              ))}
            </ul>
            <p className="text-xs text-white/30">
              Point a style at a gateway by setting its base URL env var. No keys are stored or read in the browser.
            </p>
          </div>
        </div>
      )
      }

      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div>
            <label className="forge-label block mb-2">Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'cyber-dark-terminal', name: 'Dark Terminal', desc: 'Black bg · monospace accents' },
                { id: 'cyber-forge-dark', name: 'Forge Dark', desc: 'Navy bg · purple accents' },
                { id: 'cyber-audit-light', name: 'Audit Light', desc: 'White bg · client-ready' },
              ].map(theme => (
                <div key={theme.id} className="forge-card p-4 cursor-pointer hover:border-white/20 transition-all">
                  <h3 className="text-sm font-medium mb-1 text-white">{theme.name}</h3>
                  <p className="text-xs text-white/40">{theme.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <label className="forge-label block mb-2">Data Management</label>
            <p className="text-sm text-white/40 mb-3">All project data is stored in this browser via IndexedDB.</p>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-white/30">No cloud sync. Your projects stay on this device.</p>
            </div>
          </div>
        </div>
      )
      }

      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-forge-purple rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="7" rx="1" fill="#EEEDFE"/>
                <rect x="8" y="1" width="5" height="4" rx="1" fill="#AFA9EC"/>
                <rect x="1" y="10" width="5" height="3" rx="1" fill="#AFA9EC"/>
                <rect x="8" y="7" width="5" height="6" rx="1" fill="#EEEDFE"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Portforge Cyber</h2>
              <p className="text-sm text-white/40">Version 0.3.0 — Local-first edition</p>
            </div>
          </div>

          <p className="text-sm text-white/60 leading-relaxed">
            Portforge Cyber is an open-source security documentation platform for penetration testers,
            students, and security professionals. Generate professional pentest reports, CTF write-ups,
            and lab documentation with multi-model LLM support.
          </p>

          <div className="border-t border-white/5 pt-6 space-y-3">
            <h3 className="text-sm font-medium text-white">Links</h3>
            <div className="space-y-2">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-forge-lilac hover:text-white transition-colors block">GitHub Repository</a>
              <a href="#" className="text-sm text-forge-lilac hover:text-white transition-colors block">Documentation</a>
              <a href="#" className="text-sm text-forge-lilac hover:text-white transition-colors block">License (MIT)</a>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-white/30">Data is stored locally. LLM keys stay on the server.</p>
          </div>
        </div>
      )
      }
    </div>
  )
}
