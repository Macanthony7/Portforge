'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COMPANY_DOC_TEMPLATES, getCompanyTemplate } from '@/lib/company/templates'
import { anthropic } from '@/lib/anthropic/client'
import { cn } from '@/lib/utils'
import type { CompanyDocType, CompanyDocQuestion } from '@/lib/company/templates'

const STEPS = ['Doc type', 'Connect repo', 'Details', 'Name it']

export default function NewCompanyDocPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [docType, setDocType] = useState<CompanyDocType | null>(null)
  const [repoUrl, setRepoUrl] = useState('')
  const [repoData, setRepoData] = useState<Record<string, unknown>>({})
  const [repoLoading, setRepoLoading] = useState(false)
  const [repoError, setRepoError] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [projectName, setProjectName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const template = docType ? getCompanyTemplate(docType) : null
  const allQuestions = template
    ? [...(repoData && Object.keys(repoData).length > 0 ? template.repoQuestions : template.repoQuestions), ...template.questions]
    : []
  const currentQuestion: CompanyDocQuestion | undefined = allQuestions[currentQ]
  const progress = allQuestions.length > 0 ? Math.round((currentQ / allQuestions.length) * 100) : 0

  async function handleRepoConnect() {
    if (!repoUrl.trim()) { setStep(2); return }
    setRepoLoading(true); setRepoError('')
    try {
      const res = await fetch('/api/integrations/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      })
      const data = await res.json()
      if (data.extracted) {
        setRepoData(data.extracted)
        // Auto-fill answers from repo
        if (data.autoAnswers) {
          setAnswers(prev => ({ ...prev, ...data.autoAnswers }))
        }
        setProjectName(data.extracted.name || '')
      } else {
        setRepoError(data.error || 'Could not fetch repository. Continue without it?')
      }
    } catch {
      setRepoError('Network error. You can continue without a repo.')
    }
    setRepoLoading(false)
    setStep(2)
  }

  function handleNext() {
    if (!currentQuestion) return
    const newAnswers = { ...answers, [currentQuestion.id]: currentAnswer }
    setAnswers(newAnswers); setCurrentAnswer('')
    if (currentQ < allQuestions.length - 1) setCurrentQ(currentQ + 1)
    else setStep(3)
  }

  async function handleCreate() {
    if (!docType || !projectName.trim()) return
    setCreating(true); setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Check free tier limit (1 company project on free)
    const { count } = await supabase
      .from('company_projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { data: profile } = await supabase
      .from('profiles').select('subscription_tier').eq('id', user.id).single()

    if (profile?.subscription_tier === 'free' && (count ?? 0) >= 1) {
      setError('Free tier allows 1 company docs project. Upgrade to Pro for unlimited.')
      setCreating(false); return
    }

    // Generate a slug from project name
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const { data: project, error: err } = await supabase
      .from('company_projects')
      .insert({
        user_id: user.id,
        name: projectName.trim(),
        doc_type: docType,
        repo_url: repoUrl || null,
        repo_data: repoData,
        slug,
        answers,
        sections: [],
        status: 'draft',
        hosting_active: false, // HOSTING_ACTIVE: flip this to true when ready
      })
      .select().single()

    if (err || !project) {
      setError('Failed to create project. Please try again.')
      setCreating(false); return
    }

    router.push(`/dashboard/company/${project.id}`)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Progress */}
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

      {/* Step 0 — Doc type */}
      {step === 0 && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold mb-2">What do you need to document?</h1>
          <p className="text-sm text-white/40 mb-8">AI will write the complete document — you review and edit every section.</p>
          <div className="grid grid-cols-1 gap-3">
            {COMPANY_DOC_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { setDocType(t.id); setStep(1) }}
                className="forge-card p-5 text-left hover:border-white/20 transition-all group">
                <div className="flex items-start gap-4">
                  <span className="text-2xl w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 shrink-0">
                    {t.icon}
                  </span>
                  <div>
                    <h3 className="font-medium group-hover:text-forge-lilac transition-colors mb-0.5">{t.name}</h3>
                    <p className="text-sm text-white/40">{t.description}</p>
                    <p className="text-xs text-white/20 mt-1">For: {t.audience}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1 — Connect repo */}
      {step === 1 && template && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold mb-2">Connect your GitHub repo</h1>
          <p className="text-sm text-white/40 mb-2">
            AI will scan your code, README and structure to pre-fill as much as possible.
          </p>
          <p className="text-xs text-white/30 mb-8">No repo? Skip this step — you can still generate great docs.</p>
          <div className="forge-card p-5 mb-4">
            <label className="forge-label block mb-2">Repository URL</label>
            <input type="url" value={repoUrl} onChange={e => setRepoUrl(e.target.value)}
              placeholder="https://github.com/your-org/your-repo"
              className="forge-input mb-3"/>
            {repoError && (
              <p className="text-xs text-amber-400 mb-3">{repoError}</p>
            )}
            <div className="flex gap-3">
              <button onClick={handleRepoConnect} disabled={repoLoading}
                className="forge-btn-primary text-sm">
                {repoLoading ? 'Scanning repo…' : 'Connect & scan →'}
              </button>
              <button onClick={() => setStep(2)} className="forge-btn-secondary text-sm">
                Skip →
              </button>
            </div>
          </div>
          <button onClick={() => setStep(0)} className="forge-btn-secondary text-xs">← Back</button>
        </div>
      )}

      {/* Step 2 — Questions */}
      {step === 2 && template && currentQuestion && (
        <div className="animate-fade-in">
          <div className="w-full mb-8">
            <div className="flex justify-between text-xs text-white/30 mb-2">
              <span>{currentQuestion.section}</span>
              <span>{currentQ + 1} / {allQuestions.length}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-forge-purple rounded-full transition-all duration-500" style={{ width: `${progress}%` }}/>
            </div>
          </div>
          <h2 className="text-xl font-medium mb-2">{currentQuestion.question}</h2>
          {currentQuestion.hint && <p className="text-sm text-white/40 mb-6">{currentQuestion.hint}</p>}

          {/* Pre-filled notice */}
          {answers[currentQuestion.id] && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-3 py-2 rounded-lg mb-3">
              <span>✓</span> Pre-filled from your repository — review and edit if needed
            </div>
          )}

          <textarea
            value={currentAnswer || answers[currentQuestion.id] || ''}
            onChange={e => setCurrentAnswer(e.target.value)}
            onFocus={e => { if (!currentAnswer && answers[currentQuestion.id]) setCurrentAnswer(answers[currentQuestion.id]) }}
            placeholder={currentQuestion.input_type === 'code' ? 'Paste code here...' : currentQuestion.input_type === 'list' ? 'One item per line...' : 'Type your answer…'}
            rows={currentQuestion.input_type === 'code' ? 10 : 6}
            className={cn('forge-input resize-none', currentQuestion.input_type === 'code' && 'font-mono text-xs')}
            autoFocus
          />
          <div className="flex items-center gap-3 mt-4">
            {currentQ > 0 && (
              <button onClick={() => { setCurrentQ(currentQ - 1); setCurrentAnswer(answers[allQuestions[currentQ - 1]?.id] || '') }}
                className="forge-btn-secondary">← Back</button>
            )}
            {!currentQuestion.required && (
              <button onClick={() => { if (currentQ < allQuestions.length - 1) setCurrentQ(currentQ + 1); else setStep(3) }}
                className="forge-btn-secondary text-white/30">Skip</button>
            )}
            <button onClick={handleNext}
              disabled={currentQuestion.required && !(currentAnswer || answers[currentQuestion.id])?.trim()}
              className="forge-btn-primary ml-auto">
              {currentQ < allQuestions.length - 1 ? 'Next →' : 'Continue →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 fallback - no questions */}
      {step === 2 && template && !currentQuestion && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold mb-2">Ready to generate</h1>
          <p className="text-sm text-white/40 mb-8">All information collected. Name your project and AI will write the complete documentation.</p>
          <button onClick={() => setStep(3)} className="forge-btn-primary">Continue →</button>
        </div>
      )}

      {/* Step 3 — Name */}
      {step === 3 && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold mb-2">Name your project</h1>
          <p className="text-sm text-white/40 mb-8">This is your project name in Portforge — shown on your dashboard.</p>
          <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
            placeholder="e.g. Acme API Documentation" className="forge-input text-base py-3 mb-4"
            autoFocus onKeyDown={e => e.key === 'Enter' && projectName.trim() && handleCreate()}/>
          {error && (
            <div className="bg-red-950/40 border border-red-900/40 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="forge-btn-secondary">← Back</button>
            <button onClick={handleCreate} disabled={!projectName.trim() || creating} className="forge-btn-primary">
              {creating ? 'Creating…' : 'Create & generate →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
