'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getTemplateById } from '@/lib/templates'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { UpgradeModal } from '@/components/ui/upgrade-modal'
import { cn, TRACK_LABELS, TRACK_ICONS } from '@/lib/utils'
import type { Project, Template, QuestionSchema, CareerTrack, SubscriptionTier } from '@/types'

type Stage = 'loading' | 'questionnaire' | 'generating' | 'reviewing'

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [stage, setStage] = useState<Stage>('loading')
  const [tier, setTier] = useState<SubscriptionTier>('free')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [generatedDoc, setGeneratedDoc] = useState('')
  const [editedDoc, setEditedDoc] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [rewriteMode, setRewriteMode] = useState(false)
  const [rewriteFeedback, setRewriteFeedback] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState('')
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [integLoading, setIntegLoading] = useState<string | null>(null)
  const [githubUrl, setGithubUrl] = useState('')
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: proj }, { data: { user } }] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.auth.getUser(),
      ])
      if (!proj) { router.push('/dashboard'); return }
      setProject(proj as Project)
      const tmpl = getTemplateById((proj as Project).template_id)
      if (!tmpl) { router.push('/dashboard'); return }
      setTemplate(tmpl)
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single()
        if (profile) setTier(profile.subscription_tier as SubscriptionTier)
      }
      const content = (proj as Project).content as Record<string, unknown>
      if (content?.generated || content?.edited) {
        const doc = (content.edited as string) || (content.generated as string) || ''
        setGeneratedDoc(doc); setEditedDoc(doc); setStage('reviewing')
      } else { setStage('questionnaire') }
    }
    load()
  }, [id, router])

  const questions = template?.question_schema || []
  const currentQuestion: QuestionSchema | undefined = questions[currentQ]
  const progress = questions.length > 0 ? Math.round((currentQ / questions.length) * 100) : 0

  async function saveEdited(content: string) {
    setEditedDoc(content)
    const supabase = createClient()
    await supabase.from('projects')
      .update({ content: { generated: generatedDoc, edited: content }, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  function handleNext() {
    if (!currentQuestion) return
    const newAnswers = { ...answers, [currentQuestion.id]: currentAnswer }
    setAnswers(newAnswers); setCurrentAnswer('')
    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1)
    else generateDocument(newAnswers)
  }

  async function generateDocument(finalAnswers: Record<string, string>) {
    setStage('generating'); setStreaming(true); setGeneratedDoc('')
    let doc = ''
    const res = await fetch('/api/ai/stream', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, answers: finalAnswers, mode: 'generate' }),
    })
    if (!res.ok || !res.body) { setStage('questionnaire'); setStreaming(false); return }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') { setStreaming(false); setStage('reviewing'); setEditedDoc(doc); break }
        try { const p = JSON.parse(data); if (p.text) { doc += p.text; setGeneratedDoc(doc) } } catch {}
      }
    }
  }

  async function handleRewrite() {
    if (!rewriteFeedback.trim()) return
    setStreaming(true); setRewriteMode(false)
    let doc = ''
    const res = await fetch('/api/ai/stream', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, mode: 'regenerate', currentContent: editedDoc || generatedDoc, userFeedback: rewriteFeedback }),
    })
    if (!res.ok || !res.body) { setStreaming(false); return }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') { setStreaming(false); setRewriteFeedback(''); setEditedDoc(doc); saveEdited(doc); break }
        try { const p = JSON.parse(data); if (p.text) { doc += p.text; setGeneratedDoc(doc) } } catch {}
      }
    }
  }

  async function handleGithubImport() {
    if (!githubUrl.trim()) return
    setIntegLoading('github')
    const res = await fetch('/api/integrations/github', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl: githubUrl }),
    })
    const data = await res.json()
    if (data.autoAnswers) {
      setAnswers(prev => ({ ...prev, ...data.autoAnswers }))
      setShowIntegrations(false)
      alert(`✓ Pulled data from ${data.extracted?.name}. Answers pre-filled — review before generating.`)
    } else alert(data.error || 'Failed to fetch repository')
    setIntegLoading(null)
  }

  async function handleFileImport(type: 'nmap' | 'burp', file: File) {
    setIntegLoading(type)
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch(`/api/integrations/${type}`, { method: 'POST', body: fd })
    const data = await res.json()
    if (data.autoAnswers) {
      setAnswers(prev => ({ ...prev, ...data.autoAnswers }))
      setShowIntegrations(false)
      alert(type === 'nmap' ? `✓ Parsed ${data.totalHosts} hosts from Nmap scan.` : `✓ Parsed ${data.total} Burp findings (${data.counts?.Critical || 0} Critical, ${data.counts?.High || 0} High).`)
    } else alert(data.error || `Failed to parse ${type} file`)
    setIntegLoading(null)
  }

  async function handleExport() {
    if (tier === 'free') { setUpgradeReason('PDF export is available on Pro and Audit Mode plans.'); setShowUpgrade(true); return }
    setExportLoading(true)
    const res = await fetch('/api/export/pdf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id }),
    })
    if (!res.ok) { alert((await res.json()).error || 'Export failed'); setExportLoading(false); return }
    const html = await res.text()
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([html], { type: 'text/html' })),
      download: `${project?.title.replace(/\s+/g, '-').toLowerCase()}.html`,
    })
    a.click(); URL.revokeObjectURL(a.href); setExportLoading(false)
  }

  function handleExportMd() {
    const content = editedDoc || generatedDoc
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([content], { type: 'text/markdown' })),
      download: `${project?.title.replace(/\s+/g, '-').toLowerCase()}.md`,
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  if (stage === 'loading' || !project || !template) {
    return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-forge-purple/30 border-t-forge-purple rounded-full animate-spin"/></div>
  }

  const track = project.career_track as CareerTrack

  return (
    <div className="min-h-screen flex flex-col">
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason={upgradeReason}/>

      {/* Topbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-white/40 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-medium">{project.title}</h1>
            <p className="text-xs text-white/30">{TRACK_ICONS[track]} {TRACK_LABELS[track]} · {template.name}</p>
          </div>
        </div>
        {stage === 'reviewing' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setRewriteMode(true)} disabled={streaming} className="forge-btn-secondary text-xs py-2">✦ Rewrite</button>
            <button onClick={handleExportMd} className="forge-btn-secondary text-xs py-2">↓ Markdown</button>
            <button onClick={handleExport} disabled={exportLoading} className="forge-btn-primary text-xs py-2">
              {exportLoading ? 'Exporting…' : tier === 'free' ? '↓ Export PDF ✦ Pro' : '↓ Export PDF'}
            </button>
          </div>
        )}
      </header>

      {/* Integrations panel */}
      {showIntegrations && stage === 'questionnaire' && (
        <div className="border-b border-white/5 bg-forge-navy/40 px-8 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">⬡ Import data from external source</h3>
            <button onClick={() => setShowIntegrations(false)} className="text-white/30 hover:text-white text-xs">Close</button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {(track === 'software_dev' || track === 'devops_cloud') && (
              <div className="forge-card p-4">
                <h4 className="text-sm font-medium mb-1">GitHub Repository</h4>
                <p className="text-xs text-white/40 mb-3">Pull repo metadata, languages, description</p>
                <input type="text" value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/user/repo" className="forge-input text-xs py-2 mb-2"/>
                <button onClick={handleGithubImport} disabled={integLoading === 'github' || !githubUrl.trim()}
                  className="forge-btn-primary text-xs py-1.5 w-full">
                  {integLoading === 'github' ? 'Fetching…' : 'Pull repo data'}
                </button>
              </div>
            )}
            {track === 'cybersecurity' && (
              <div className="forge-card p-4">
                <h4 className="text-sm font-medium mb-1">Nmap XML scan</h4>
                <p className="text-xs text-white/40 mb-3">Run: <code className="text-emerald-400">nmap -oX scan.xml target</code></p>
                <label className="forge-btn-secondary text-xs py-1.5 w-full text-center cursor-pointer block">
                  {integLoading === 'nmap' ? 'Parsing…' : 'Upload scan.xml'}
                  <input type="file" accept=".xml" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileImport('nmap', f) }}/>
                </label>
              </div>
            )}
            {track === 'cybersecurity' && (
              <div className="forge-card p-4">
                <h4 className="text-sm font-medium mb-1">Burp Suite findings</h4>
                <p className="text-xs text-white/40 mb-3">Burp: Target → Issues → Export → XML</p>
                <label className="forge-btn-secondary text-xs py-1.5 w-full text-center cursor-pointer block">
                  {integLoading === 'burp' ? 'Parsing…' : 'Upload issues.xml'}
                  <input type="file" accept=".xml,.json" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileImport('burp', f) }}/>
                </label>
              </div>
            )}
          </div>
          {tier === 'free' && (
            <p className="text-xs text-white/30 mt-3">
              ⬡ Integrations are available on <button onClick={() => { setUpgradeReason('Integrations require Audit Mode.'); setShowUpgrade(true) }} className="text-forge-lilac hover:underline">Audit Mode</button>.
            </p>
          )}
        </div>
      )}

      {/* Questionnaire */}
      {stage === 'questionnaire' && currentQuestion && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full">
          <div className="w-full mb-8">
            <div className="flex justify-between text-xs text-white/30 mb-2">
              <span>{currentQuestion.section}</span>
              <span>{currentQ + 1} / {questions.length}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-forge-purple rounded-full transition-all duration-500" style={{ width: `${progress}%` }}/>
            </div>
          </div>
          <div className="w-full animate-fade-in">
            <h2 className="text-xl font-medium mb-2">{currentQuestion.question}</h2>
            {currentQuestion.hint && <p className="text-sm text-white/40 mb-6">{currentQuestion.hint}</p>}
            <textarea
              value={currentAnswer}
              onChange={e => setCurrentAnswer(e.target.value)}
              placeholder={currentQuestion.input_type === 'code' ? 'Paste your code here...' : currentQuestion.input_type === 'list' ? 'One item per line...' : 'Type your answer…'}
              rows={currentQuestion.input_type === 'code' ? 10 : 6}
              className={cn('forge-input resize-none', currentQuestion.input_type === 'code' && 'font-mono text-xs')}
              autoFocus
            />
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {currentQ > 0 && (
                <button onClick={() => { setCurrentQ(currentQ - 1); setCurrentAnswer(answers[questions[currentQ - 1]?.id] || '') }}
                  className="forge-btn-secondary">← Back</button>
              )}
              {!currentQuestion.required && (
                <button onClick={() => { setCurrentAnswer(''); if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1); else generateDocument(answers) }}
                  className="forge-btn-secondary text-white/30">Skip</button>
              )}
              <button onClick={() => setShowIntegrations(!showIntegrations)}
                className="forge-btn-secondary text-xs">⬡ Import data</button>
              <button onClick={handleNext} disabled={currentQuestion.required && !currentAnswer.trim()}
                className="forge-btn-primary ml-auto">
                {currentQ < questions.length - 1 ? 'Next →' : 'Generate document →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generating */}
      {stage === 'generating' && (
        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-5 h-5 border-2 border-forge-purple/30 border-t-forge-purple rounded-full animate-spin"/>
            <p className="text-sm text-white/60">AI is writing your complete document…</p>
          </div>
          {generatedDoc && <div className="forge-card p-8"><MarkdownRenderer content={generatedDoc}/></div>}
        </div>
      )}

      {/* Reviewing */}
      {stage === 'reviewing' && (
        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
          {rewriteMode && (
            <div className="forge-card p-5 mb-6 border-forge-purple/30">
              <h3 className="text-sm font-medium mb-3">✦ Rewrite instructions</h3>
              <textarea value={rewriteFeedback} onChange={e => setRewriteFeedback(e.target.value)}
                placeholder="e.g. Make the executive summary shorter, add more technical detail to the findings section…"
                rows={3} className="forge-input resize-none mb-3" autoFocus/>
              <div className="flex gap-2">
                <button onClick={() => setRewriteMode(false)} className="forge-btn-secondary text-xs">Cancel</button>
                <button onClick={handleRewrite} disabled={!rewriteFeedback.trim() || streaming} className="forge-btn-primary text-xs">
                  {streaming ? 'Rewriting…' : 'Rewrite →'}
                </button>
              </div>
            </div>
          )}
          <MarkdownEditor value={editedDoc || generatedDoc} onChange={saveEdited} minHeight="600px"/>
        </div>
      )}
    </div>
  )
}
