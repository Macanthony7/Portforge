'use client'
import { useState, useRef } from 'react'
import { MarkdownRenderer } from './markdown-renderer'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export function MarkdownEditor({ value, onChange, placeholder, minHeight = '400px' }: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)

  function insert(before: string, after: string, defaultText: string) {
    const ta = taRef.current
    if (!ta || preview) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end) || defaultText
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(newValue)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }

  function insertLine(prefix: string, defaultText: string) {
    const ta = taRef.current
    if (!ta || preview) return
    const start = ta.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart)
    onChange(newValue)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length + defaultText.length) }, 0)
  }

  const tools = [
    { label: 'B', title: 'Bold', fn: () => insert('**', '**', 'bold text'), cls: 'font-bold' },
    { label: 'I', title: 'Italic', fn: () => insert('*', '*', 'italic text'), cls: 'italic' },
    { label: '`', title: 'Inline code', fn: () => insert('`', '`', 'code'), cls: 'font-mono text-xs' },
    { label: 'H2', title: 'Heading 2', fn: () => insertLine('## ', 'Heading'), cls: 'text-xs' },
    { label: 'H3', title: 'Heading 3', fn: () => insertLine('### ', 'Subheading'), cls: 'text-xs' },
    { label: '•', title: 'Bullet list', fn: () => insertLine('- ', 'item'), cls: '' },
    { label: '1.', title: 'Numbered list', fn: () => insertLine('1. ', 'item'), cls: 'font-mono text-xs' },
    { label: '</>', title: 'Code block', fn: () => insert('```\n', '\n```', 'code here'), cls: 'font-mono text-xs' },
  ]

  return (
    <div className="forge-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-0.5">
          {tools.map(t => (
            <button key={t.label} title={t.title} onClick={t.fn}
              className={cn('px-2.5 py-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm', t.cls, preview && 'opacity-30 cursor-not-allowed')}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setPreview(!preview)}
          className={cn('text-xs px-3 py-1.5 rounded transition-all',
            preview ? 'bg-forge-purple/20 text-forge-lilac border border-forge-purple/30' : 'text-white/40 hover:text-white hover:bg-white/10')}>
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>
      {preview ? (
        <div className="p-6 overflow-auto" style={{ minHeight }}>
          {value ? <MarkdownRenderer content={value}/> : <p className="text-white/20 text-sm italic">Nothing to preview yet.</p>}
        </div>
      ) : (
        <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'Start writing or let AI generate your document…'}
          className="w-full bg-transparent text-sm text-white/80 p-5 font-mono leading-relaxed resize-none focus:outline-none placeholder:text-white/20"
          style={{ minHeight }} spellCheck={false}/>
      )}
    </div>
  )
}
