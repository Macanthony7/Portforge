'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getTemplatesByTrack, getThemesByTrack } from '@/lib/templates'
import { TRACK_LABELS, TRACK_ICONS, TRACK_COLORS, cn } from '@/lib/utils'
import type { CareerTrack } from '@/types'

const TRACKS: CareerTrack[] = ['cybersecurity', 'software_dev', 'devops_cloud']
const STEPS = ['Career track', 'Template', 'Design', 'Name it']

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [track, setTrack] = useState<CareerTrack | null>(null)
  const [templateId, setTemplateId] = useState('')
  const [themeId, setThemeId] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const templates = track ? getTemplatesByTrack(track) : []
  const themes = track ? getThemesByTrack(track) : []

  async function handleCreate() {
    if (!track || !templateId || !title.trim()) return
    setLoading(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { count } = await supabase
      .from('projects').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('career_track', track)

    const { data: profile } = await supabase
      .from('profiles').select('subscription_tier').eq('id', user.id).single()

    if (profile?.subscription_tier === 'free' && (count ?? 0) >= 2) {
      setError('Free tier limit reached for this track. Upgrade to Pro for unlimited projects.')
      setLoading(false); return
    }

    const { data: project, error: err } = await supabase
      .from('projects')
      .insert({ user_id: user.id, title: title.trim(), career_track: track,
        template_id: templateId, design_theme: themeId || 'blank', status: 'draft', content: {} })
      .select().single()

    if (err || !project) { setError('Failed to create project.'); setLoading(false); return }
    router.push(`/dashboard/project/${project.id}`)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all',
              i < step ? 'bg-forge-purple text-white' :
              i === step ? 'bg-forge-purple text-white ring-2 ring-forge-purple/30' :
              'bg-white/5 text-white/20'
            )}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={cn('text-sm', i === step ? 'text-white' : 'text-white/30')}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-white/10 mx-1"/>}
          </div>
        ))}
      </div>

      {/* Step 0 — Career track */}
      {step === 0 && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold mb-2">What are you documenting?</h1>
          <p className="text-sm text-white/40 mb-8">Choose your career track — you'll only see templates relevant to your field.</p>
          <div className="flex flex-col gap-4">
            {TRACKS.map(t => {
              const colors = TRACK_COLORS[t]
              return (
                <button key={t} onClick={() => { setTrack(t); setStep(1) }}
                  className="forge-card p-6 text-left hover:border-white/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <span className={cn('text-2xl w-12 h-12 rounded-xl flex items-center justify-center border', colors.bg, colors.border)}>
                      {TRACK_ICONS[t]}
                    </span>
                    <div>
                      <h2 className="font-medium group-hover:text-forge-lilac transition-colors">{TRACK_LABELS[t]}</h2>
                      <p className="text-sm text-white/40 mt-0.5">
                        {t === 'cybersecurity' && 'CTF write-ups, pentest reports, security lab docs'}
                        {t === 'software_dev' && 'READMEs, case studies, API documentation'}
                        {t === 'devops_cloud' && 'CI/CD pipelines, IaC docs, incident reports, cloud arch'}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 1 — Template */}
      {step === 1 && track && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold mb-2">Choose a template</h1>
          <p className="text-sm text-white/40 mb-8">Select the type of document you want to create.</p>
          <div className="flex flex-col gap-3">
            {templates.map(t => (
              <button key={t.id} onClick={() => { setTemplateId(t.id); setStep(2) }}
                className={cn('forge-card p-5 text-left hover:border-white/20 transition-all',
                  templateId === t.id && 'border-forge-purple/50 bg-forge-purple/5')}>
                <h3 className="font-medium mb-1">{t.name}</h3>
                <p className="text-sm text-white/40">{t.description}</p>
                <p className="text-xs text-white/20 mt-2">{t.question_schema.length} guided questions</p>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(0)} className="forge-btn-secondary mt-4">← Back</button>
        </div>
      )}

      {/* Step 2 — Design theme */}
      {step === 2 && track && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold mb-2">Choose a design</h1>
          <p className="text-sm text-white/40 mb-8">Pick how your exported document will look.</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {themes.map(theme => (
              <button key={theme.id} onClick={() => setThemeId(theme.id)}
                className={cn('forge-card p-4 text-left hover:border-white/20 transition-all',
                  themeId === theme.id && 'border-forge-purple/50 bg-forge-purple/5')}>
                <div className="flex gap-1.5 mb-3">
                  {theme.preview_colors.map(c => (
                    <div key={c} className="w-6 h-6 rounded-md border border-white/10" style={{ background: c }}/>
                  ))}
                </div>
                <h3 className="text-sm font-medium mb-1">{theme.name}</h3>
                <p className="text-xs text-white/40">{theme.description}</p>
              </button>
            ))}
            <button onClick={() => setThemeId('blank')}
              className={cn('forge-card p-4 text-left hover:border-white/20 transition-all',
                themeId === 'blank' && 'border-forge-purple/50 bg-forge-purple/5')}>
              <div className="w-6 h-6 rounded-md border border-white/10 bg-white/5 flex items-center justify-center mb-3">
                <span className="text-white/30 text-xs">+</span>
              </div>
              <h3 className="text-sm font-medium mb-1">Blank page</h3>
              <p className="text-xs text-white/40">No styling — your structure</p>
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="forge-btn-secondary">← Back</button>
            <button onClick={() => setStep(3)} disabled={!themeId} className="forge-btn-primary">Continue →</button>
          </div>
        </div>
      )}

      {/* Step 3 — Name */}
      {step === 3 && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold mb-2">Name your project</h1>
          <p className="text-sm text-white/40 mb-8">You can always rename it later.</p>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. HackTheBox — Lame machine writeup"
            className="forge-input text-base py-3 mb-4" autoFocus
            onKeyDown={e => e.key === 'Enter' && title.trim() && handleCreate()}/>
          {error && (
            <div className="bg-red-950/40 border border-red-900/40 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="forge-btn-secondary">← Back</button>
            <button onClick={handleCreate} disabled={!title.trim() || loading} className="forge-btn-primary">
              {loading ? 'Creating…' : 'Create project →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
