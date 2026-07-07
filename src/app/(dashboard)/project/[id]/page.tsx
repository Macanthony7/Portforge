'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getProjectById, updateProject } from '@/lib/db'
import { getTemplateById } from '@/lib/templates'
import { createLLMClient } from '@/lib/llm/client'
import { getStoredApiKey } from '@/lib/llm/config'
import { buildDocumentPrompt, buildRegeneratePrompt } from '@/lib/prompts'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import type { Project, Template, QuestionSchema, LLMProvider } from '@/types'

type Stage = 'loading' | 'questionnaire' | 'generating' | 'reviewing'

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [stage, setStage] = useState<Stage>('loading')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [generatedDoc, setGeneratedDoc] = useState('')
  const [editedDoc, setEditedDoc] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [rewriteMode, setRewriteMode] = useState(false)
  const [rewriteFeedback, setRewriteFeedback] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const proj = await getProjectById(id)
      if (!proj) { router.push('/dashboard'); return }
      setProject(proj)
      const tmpl = getTemplateById(proj.template_id)
      if (!tmpl) { router.push('/dashboard'); return }
      setTemplate(tmpl)

      const content = proj.content as Record<string, unknown>
      if (content?.generated || content?.edited) {
        const doc = (content.edited as string) || (content.generated as string) || ''
        setGeneratedDoc(doc)
        setEditedDoc(doc)
        setStage('reviewing')
      } else {
        setStage('questionnaire')
      }
    }
    load()
  }, [id, router])

  const questions = template?.question_schema || []
  const currentQuestion: QuestionSchema | undefined = questions[currentQ]
  const progress = questions.length > 0 ? Math.round((currentQ / questions.length) * 100) : 0

  async function saveEdited(content: string) {
    setEditedDoc(content)
    await updateProject(id, { content: { generated: generatedDoc, edited: content }, status: 'complete' })
  }

  function handleNext() {
    if (!currentQuestion) return
    const newAnswers = { ...answers, [currentQuestion.id]: currentAnswer }
    setAnswers(newAnswers)
    setCurrentAnswer('')
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      generateDocument(newAnswers)
    }
  }

  function goBack() {
    if (currentQ > 0) {
      const prevQ = questions[currentQ - 1]
      setCurrentQ(currentQ - 1)
      setCurrentAnswer(answers[prevQ.id] || '')
    }
  }

  async function generateDocument(finalAnswers: Record<string, string>) {
    setStage('generating')
    setStreaming(true)
    setError('')
    setGeneratedDoc('')

    try {
      const provider = (localStorage.getItem('portforge_provider') as LLMProvider) || 'anthropic'
      const model = localStorage.getItem('portforge_model') || ''
      const apiKey = getStoredApiKey(provider)

      if (!apiKey) {
        setError('No API key configured. Go to Settings → LLM Configuration to add your key.')
        setStreaming(false)
        setStage('questionnaire')
        return
      }

      const client = createLLMClient({ provider, model, apiKey })
      const prompt = buildDocumentPrompt(template!, finalAnswers)

      let doc = ''
      await client.generateText({
        prompt,
        maxTokens: 4096,
        onChunk: (ch) => {
          doc += ch
          setGeneratedDoc(prev => prev + ch)
        }
      })

      await updateProject(id, { content: { generated: doc, edited: doc }, status: 'complete' })
      setEditedDoc(doc)
      setStage('reviewing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setStreaming(false)
      setStage('questionnaire')
    } finally {
      setStreaming(false)
    }
  }

  async function handleRewrite() {
    if (!rewriteFeedback.trim()) return
    setStreaming(true)
    setRewriteMode(false)
    setError('')
    setGeneratedDoc('')

    try {
      const provider = (localStorage.getItem('portforge_provider') as LLMProvider) || 'anthropic'
      const model = localStorage.getItem('portforge_model') || ''
      const apiKey = getStoredApiKey(provider)

      if (!apiKey) {
        setError('No API key configured.')
        setStreaming(false)
        return
      }

      const client = createLLMClient({ provider, model, apiKey })
      const prompt = buildRegeneratePrompt(editedDoc || generatedDoc, rewriteFeedback)

      let doc = ''
      await client.generateText({
        prompt,
        maxTokens: 4096,
        onChunk: (ch) => {
          doc += ch
          setGeneratedDoc(prev => prev + ch)
        }
      })

      setEditedDoc(doc)
      await updateProject(id, { content: { generated: doc, edited: doc }, status: 'complete' })
      setRewriteFeedback('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rewrite failed')
    } finally {
      setStreaming(false)
    }
  }

  async function handleExportMd() {
    const content = editedDoc || generatedDoc
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([content], { type: 'text/markdown' })),
      download: `${project?.title.replace(/\s+/g, '-').toLowerCase()}.md`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (stage === 'loading' || !project || !template) {
    return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-forge-purple/30 border-t-forge-purple rounded-full animate-spin"/></div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0 bg-transparent">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-white/40 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-medium text-white">{project.title}</h1>
            <p className="text-xs text-white/30">Cybersecurity · {template.name}</p>
          </div>
        </div>
        {stage === 'reviewing' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setRewriteMode(true)} disabled={streaming} className="forge-btn-secondary text-xs py-2">✦ Rewrite</button>
            <button onClick={handleExportMd} className="forge-btn-secondary text-xs py-2">↓ Markdown</button>
          </div>
        )}
      </header>

      {/* Error */}
      {error && (
        <div className="bg-red-950/40 border border-red-900/40 text-red-400 text-sm px-4 py-3 mx-6 mt-4 rounded-lg">
          {error}
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
            <h2 className="text-xl font-medium mb-2 text-white">{currentQuestion.question}</h2>
            {currentQuestion.hint && <p className="text-sm text-white/40 mb-6">{currentQuestion.hint}</p>}
            <textarea
              value={currentAnswer}
              onChange={e => setCurrentAnswer(e.target.value)}
              placeholder={currentQuestion.input_type === 'code' ? 'Paste your code here...' : currentQuestion.input_type === 'list' ? 'One item per line...' : 'Type your answer…'}
              rows={currentQuestion.input_type === 'code' ? 10 : 6}
              className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-forge-purple/60 resize-none ${currentQuestion.input_type === 'code' ? 'font-mono text-xs' : ''}`}
              autoFocus
            />
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {currentQ > 0 && (
                <button onClick={goBack} className="forge-btn-secondary">← Back</button>
              )}
              {!currentQuestion.required && (
                <button onClick={() => { setCurrentAnswer(''); if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1); else generateDocument(answers) }}
                  className="forge-btn-secondary text-white/30">Skip</button>
              )}
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
              <h3 className="text-sm font-medium mb-3 text-white">✦ Rewrite instructions</h3>
              <textarea value={rewriteFeedback} onChange={e => setRewriteFeedback(e.target.value)}
                placeholder="e.g. Make the executive summary shorter, add more technical detail to the findings section…"
                rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-forge-purple/60 resize-none mb-3" autoFocus/>
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
