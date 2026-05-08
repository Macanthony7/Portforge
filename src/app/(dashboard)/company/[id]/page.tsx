'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { UpgradeModal } from '@/components/ui/upgrade-modal'
import { getCompanyTemplate } from '@/lib/company/templates'
import { cn } from '@/lib/utils'
import type { CompanyDocType, CompanyDocTemplate } from '@/lib/company/templates'

interface DocSection {
  id: string
  title: string
  content: string
  order: number
  needs_review: boolean
  last_synced_at: string | null
}

interface CompanyProject {
  id: string
  name: string
  doc_type: CompanyDocType
  repo_url: string | null
  answers: Record<string, string>
  sections: DocSection[]
  status: string
  pr_sync_enabled: boolean
  pr_sync_status: string
  webhook_secret: string | null
}

export default function CompanyDocEditor() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<CompanyProject | null>(null)
  const [template, setTemplate] = useState<CompanyDocTemplate | null>(null)
  const [sections, setSections] = useState<DocSection[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [rewriteMode, setRewriteMode] = useState<string | null>(null)
  const [rewriteInstruction, setRewriteInstruction] = useState('')
  const [rewriteLoading, setRewriteLoading] = useState(false)
  const [tier, setTier] = useState<string>('free')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [showPRSetup, setShowPRSetup] = useState(false)
  const [savingSection, setSavingSection] = useState(false)
  const streamRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: proj }, { data: { user } }] = await Promise.all([
        supabase.from('company_projects').select('*').eq('id', id).single(),
        supabase.auth.getUser(),
      ])
      if (!proj) { router.push('/dashboard'); return }
      setProject(proj as CompanyProject)
      const tmpl = getCompanyTemplate(proj.doc_type as CompanyDocType)
      if (tmpl) setTemplate(tmpl)

      if (proj.sections && proj.sections.length > 0) {
        setSections(proj.sections as DocSection[])
        setActiveSection((proj.sections as DocSection[])[0]?.id || null)
      } else {
        // Auto-start generation if no sections yet
        startGeneration(proj as CompanyProject)
      }

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single()
        if (profile) setTier(profile.subscription_tier)
      }
    }
    load()
  }, [id, router])

  async function startGeneration(proj: CompanyProject) {
    setGenerating(true)
    setStreamContent('')

    const res = await fetch('/api/company/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: proj.id, answers: proj.answers }),
    })

    if (!res.ok || !res.body) { setGenerating(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') {
          setGenerating(false)
          // Reload project to get parsed sections
          const supabase = createClient()
          const { data: updated } = await supabase.from('company_projects').select('sections').eq('id', proj.id).single()
          if (updated?.sections && updated.sections.length > 0) {
            const secs = updated.sections as DocSection[]
            setSections(secs)
            setActiveSection(secs[0]?.id || null)
          }
          break
        }
        try { const p = JSON.parse(data); if (p.text) { full += p.text; setStreamContent(full) } } catch {}
      }
    }
  }

  async function handleSectionEdit(sectionId: string, newContent: string) {
    const updated = sections.map(s => s.id === sectionId ? { ...s, content: newContent } : s)
    setSections(updated)
  }

  async function saveSectionEdit(sectionId: string) {
    setSavingSection(true)
    const supabase = createClient()
    await supabase.from('company_projects').update({
      sections,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    setSavingSection(false)
    setEditingSection(null)
  }

  async function handleSectionRewrite(sectionId: string) {
    if (!rewriteInstruction.trim()) return
    setRewriteLoading(true)

    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    const res = await fetch('/api/company/update-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: id,
        sectionId,
        instruction: rewriteInstruction,
        currentContent: section.content,
      }),
    })

    if (!res.ok || !res.body) { setRewriteLoading(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let newContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') {
          const updated = sections.map(s =>
            s.id === sectionId ? { ...s, content: newContent, needs_review: false } : s
          )
          setSections(updated)
          setRewriteMode(null)
          setRewriteInstruction('')
          setRewriteLoading(false)
          break
        }
        try {
          const p = JSON.parse(data)
          if (p.text) {
            newContent += p.text
            setSections(prev => prev.map(s =>
              s.id === sectionId ? { ...s, content: newContent } : s
            ))
          }
        } catch {}
      }
    }
  }

  async function handleExport() {
    if (tier === 'free') { setShowUpgrade(true); return }
    setExportLoading(true)
    const allContent = sections.map(s => s.content).join('\n\n---\n\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([allContent], { type: 'text/markdown' })),
      download: `${project?.name.replace(/\s+/g, '-').toLowerCase()}-docs.md`,
    })
    a.click(); URL.revokeObjectURL(a.href)
    setExportLoading(false)
  }

  function handleExportMd() {
    const allContent = sections.map(s => s.content).join('\n\n---\n\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([allContent], { type: 'text/markdown' })),
      download: `${project?.name.replace(/\s+/g, '-').toLowerCase()}-docs.md`,
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  const activeDoc = sections.find(s => s.id === activeSection)
  const reviewSections = sections.filter(s => s.needs_review)

  if (!project) {
    return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-forge-purple/30 border-t-forge-purple rounded-full animate-spin"/></div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason="Full document export requires a Pro plan."/>

      {/* Topbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-white/40 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-medium">{project.name}</h1>
              {reviewSections.length > 0 && (
                <span className="text-xs bg-amber-950/40 border border-amber-900/40 text-amber-400 px-2 py-0.5 rounded-full">
                  {reviewSections.length} section{reviewSections.length > 1 ? 's' : ''} need review
                </span>
              )}
            </div>
            <p className="text-xs text-white/30">{template?.name} · Company docs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tier !== 'free' && (
            <button onClick={() => setShowPRSetup(!showPRSetup)}
              className={cn('forge-btn-secondary text-xs py-2', project.pr_sync_enabled && 'border-emerald-900/40 text-emerald-400')}>
              {project.pr_sync_enabled ? '⬡ PR sync on' : '⬡ Enable PR sync'}
            </button>
          )}
          <button onClick={handleExportMd} className="forge-btn-secondary text-xs py-2">↓ Markdown</button>
          <button onClick={handleExport} disabled={exportLoading} className="forge-btn-primary text-xs py-2">
            {exportLoading ? 'Exporting…' : tier === 'free' ? '↓ Export PDF ✦ Pro' : '↓ Export PDF'}
          </button>
        </div>
      </header>

      {/* PR sync setup panel */}
      {showPRSetup && (
        <PRSyncPanel project={project} onClose={() => setShowPRSetup(false)} onUpdate={setProject}/>
      )}

      {/* Generating state */}
      {generating && (
        <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-5 h-5 border-2 border-forge-purple/30 border-t-forge-purple rounded-full animate-spin"/>
            <p className="text-sm text-white/60">AI is writing your complete documentation…</p>
          </div>
          {streamContent && (
            <div className="forge-card p-8" ref={streamRef}>
              <MarkdownRenderer content={streamContent}/>
            </div>
          )}
        </div>
      )}

      {/* Editor — sections */}
      {!generating && sections.length > 0 && (
        <div className="flex-1 flex overflow-hidden">
          {/* Section sidebar */}
          <aside className="w-56 border-r border-white/5 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4">
              <p className="forge-label mb-3">Sections</p>
              <div className="flex flex-col gap-1">
                {sections.map(section => (
                  <button key={section.id}
                    onClick={() => { setActiveSection(section.id); setEditingSection(null) }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all',
                      activeSection === section.id
                        ? 'bg-forge-purple/20 text-forge-lilac border border-forge-purple/30'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    )}>
                    {section.needs_review && (
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0"/>
                    )}
                    <span className="truncate">{section.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Section content */}
          <main className="flex-1 overflow-auto p-8">
            {activeDoc && (
              <div>
                {/* Section header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">{activeDoc.title}</h2>
                    {activeDoc.needs_review && (
                      <span className="text-xs bg-amber-950/40 border border-amber-900/40 text-amber-400 px-2 py-1 rounded-full">
                        ⚠ Updated by PR sync — please review
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingSection === activeDoc.id ? (
                      <>
                        <button onClick={() => setEditingSection(null)} className="forge-btn-secondary text-xs py-1.5">Cancel</button>
                        <button onClick={() => saveSectionEdit(activeDoc.id)} disabled={savingSection}
                          className="forge-btn-primary text-xs py-1.5">
                          {savingSection ? 'Saving…' : 'Save'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setRewriteMode(activeDoc.id)} className="forge-btn-secondary text-xs py-1.5">✦ Rewrite</button>
                        <button onClick={() => setEditingSection(activeDoc.id)} className="forge-btn-secondary text-xs py-1.5">✏ Edit</button>
                        {activeDoc.needs_review && (
                          <button onClick={() => {
                            const updated = sections.map(s => s.id === activeDoc.id ? { ...s, needs_review: false } : s)
                            setSections(updated)
                            const supabase = createClient()
                            supabase.from('company_projects').update({ sections: updated }).eq('id', id)
                          }} className="forge-btn-secondary text-xs py-1.5 text-emerald-400">✓ Verified</button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Rewrite panel */}
                {rewriteMode === activeDoc.id && (
                  <div className="forge-card p-4 mb-6 border-forge-purple/30">
                    <h3 className="text-sm font-medium mb-3">✦ Rewrite this section</h3>
                    <textarea value={rewriteInstruction} onChange={e => setRewriteInstruction(e.target.value)}
                      placeholder="e.g. Make this more concise, add a code example for Node.js, update the endpoint URL to /v2/users…"
                      rows={3} className="forge-input resize-none mb-3" autoFocus/>
                    <div className="flex gap-2">
                      <button onClick={() => { setRewriteMode(null); setRewriteInstruction('') }} className="forge-btn-secondary text-xs">Cancel</button>
                      <button onClick={() => handleSectionRewrite(activeDoc.id)} disabled={!rewriteInstruction.trim() || rewriteLoading}
                        className="forge-btn-primary text-xs">
                        {rewriteLoading ? 'Rewriting…' : 'Rewrite →'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Section content — edit or preview */}
                {editingSection === activeDoc.id ? (
                  <MarkdownEditor
                    value={activeDoc.content}
                    onChange={val => handleSectionEdit(activeDoc.id, val)}
                    minHeight="500px"
                  />
                ) : (
                  <div className="forge-card p-8">
                    <MarkdownRenderer content={activeDoc.content}/>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  )
}

// PR Sync Setup Panel
function PRSyncPanel({
  project,
  onClose,
  onUpdate,
}: {
  project: CompanyProject
  onClose: () => void
  onUpdate: (p: CompanyProject) => void
}) {
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(project.pr_sync_enabled)

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/company/webhook`
    : '/api/company/webhook'

  async function save() {
    setSaving(true)
    const supabase = createClient()
    // Generate a webhook secret if enabling for first time
    const webhookSecret = project.webhook_secret || Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    await supabase.from('company_projects').update({
      pr_sync_enabled: enabled,
      webhook_secret: webhookSecret,
    }).eq('id', project.id)

    onUpdate({ ...project, pr_sync_enabled: enabled, webhook_secret: webhookSecret })
    setSaving(false)
    onClose()
  }

  return (
    <div className="border-b border-white/5 bg-forge-navy/40 px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">⬡ GitHub PR Auto-sync Setup</h3>
        <button onClick={onClose} className="text-white/30 hover:text-white text-xs">Close</button>
      </div>
      <div className="grid grid-cols-2 gap-6 max-w-3xl">
        <div>
          <p className="text-xs text-white/50 mb-4 leading-relaxed">
            When a PR is merged to your repo, AI automatically scans the diff, rewrites affected documentation sections, and flags them for your review.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm">Enable PR sync</span>
            <button onClick={() => setEnabled(!enabled)}
              className={cn('w-11 h-6 rounded-full transition-colors relative', enabled ? 'bg-forge-purple' : 'bg-white/10')}>
              <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm', enabled ? 'translate-x-5' : 'translate-x-0.5')}/>
            </button>
          </div>
          <button onClick={save} disabled={saving} className="forge-btn-primary text-xs py-2">
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
        <div>
          <p className="forge-label mb-2">Webhook URL (add to GitHub)</p>
          <div className="flex items-center gap-2 mb-4">
            <code className="text-xs bg-black/30 border border-white/10 px-3 py-2 rounded-lg flex-1 truncate text-forge-lilac">
              {webhookUrl}
            </code>
            <button onClick={() => navigator.clipboard.writeText(webhookUrl)}
              className="forge-btn-secondary text-xs py-2">Copy</button>
          </div>
          {project.webhook_secret && (
            <>
              <p className="forge-label mb-2">Webhook secret</p>
              <code className="text-xs bg-black/30 border border-white/10 px-3 py-2 rounded-lg block truncate text-forge-lilac">
                {project.webhook_secret}
              </code>
            </>
          )}
          <p className="text-xs text-white/30 mt-3">
            GitHub → repo Settings → Webhooks → Add webhook. Set content type to <code className="text-white/50">application/json</code>. Select event: <code className="text-white/50">Pull requests</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
