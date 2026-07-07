'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/lib/db'
import { TEMPLATES, DESIGN_THEMES } from '@/lib/templates'

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [title, setTitle] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedTheme, setSelectedTheme] = useState<string>('cyber-dark-terminal')
  const [creating, setCreating] = useState(false)

  const templates = TEMPLATES
  const themes = DESIGN_THEMES

  async function handleCreate() {
    if (!title.trim() || !selectedTemplate) return
    setCreating(true)
    const template = templates.find(t => t.id === selectedTemplate)
    if (!template) { setCreating(false); return }

    const project = await createProject({
      title: title.trim(),
      career_track: 'cybersecurity',
      template_id: template.id,
      design_theme: selectedTheme,
      status: 'draft',
      public: false,
      content: {},
    })

    router.push(`/project/${project.id}`)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-8 text-white">New Project</h1>

      <div className="flex items-center gap-1 mb-8 border-b border-white/5">
        {[
          { id: 1 as const, label: 'Name it' },
          { id: 2 as const, label: 'Template' },
          { id: 3 as const, label: 'Theme' },
        ].map(s => (
          <div key={s.id} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            step === s.id ? 'border-forge-purple text-white' : 'border-transparent text-white/40'
          }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === s.id ? 'bg-forge-purple' : s.id < step ? 'bg-forge-purple/30' : 'bg-ui-05'
            }`}>{s.id < step ? '✓' : s.id}</div>
            {s.label}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="forge-label block mb-2">Project Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Web App Pentest Report"
              autoFocus
              className="forge-input text-lg"
            />
          </div>
          <div className="flex justify-end">
            <button onClick={() => title.trim() && setStep(2)} disabled={!title.trim()}
              className="forge-btn-primary text-white">Next →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-3">
            {templates.map(t => (
              <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedTemplate === t.id ? 'border-forge-purple bg-forge-purple/10' : 'border-ui-10 bg-ui-05 hover:border-ui-10'
                  }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔐</span>
                  <div>
                    <h3 className="font-medium text-white">{t.name}</h3>
                    <p className="text-sm text-white/40">{t.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="forge-btn-secondary">← Back</button>
            <button onClick={() => selectedTemplate && setStep(3)} disabled={!selectedTemplate}
              className="forge-btn-primary text-white">Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {themes.map(theme => (
              <button key={theme.id} onClick={() => setSelectedTheme(theme.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedTheme === theme.id ? 'border-forge-purple bg-forge-purple/10' : 'border-ui-10 bg-ui-05 hover:border-ui-10'
                }`}>
                <div className="flex gap-1.5 mb-3">
                  {theme.preview_colors.map(c => (
                    <div key={c} className="w-6 h-6 rounded-md border border-white/10" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <h3 className="text-sm font-medium text-white">{theme.name}</h3>
                <p className="text-xs text-white/40">{theme.description}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="forge-btn-secondary">← Back</button>
            <button onClick={handleCreate} disabled={creating}
              className="forge-btn-primary text-white">
              {creating ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
