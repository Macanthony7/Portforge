'use client'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic text-white/80">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="font-mono text-xs bg-white/10 text-emerald-400 px-1.5 py-0.5 rounded">{part.slice(1, -1)}</code>
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/)
    if (linkMatch)
      return <a key={i} href={linkMatch[2]} className="text-forge-lilac hover:underline" target="_blank" rel="noopener noreferrer">{linkMatch[1]}</a>
    return part
  })
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  let key = 0
  const k = () => key++

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      elements.push(
        <div key={k()} className="my-4 rounded-lg overflow-hidden border border-white/10">
          {lang && <div className="px-4 py-1.5 bg-white/5 border-b border-white/10 text-xs text-white/40 font-mono">{lang}</div>}
          <pre className="p-4 overflow-x-auto bg-black/30">
            <code className="text-sm font-mono text-emerald-400 leading-relaxed">{codeLines.join('\n')}</code>
          </pre>
        </div>
      )
      i++; continue
    }

    if (line.startsWith('# ')) { elements.push(<h1 key={k()} className="text-2xl font-semibold mt-8 mb-4 text-white border-b border-white/10 pb-3">{renderInline(line.slice(2))}</h1>); i++; continue }
    if (line.startsWith('## ')) { elements.push(<h2 key={k()} className="text-xl font-semibold mt-7 mb-3 text-white">{renderInline(line.slice(3))}</h2>); i++; continue }
    if (line.startsWith('### ')) { elements.push(<h3 key={k()} className="text-base font-semibold mt-5 mb-2 text-forge-lilac">{renderInline(line.slice(4))}</h3>); i++; continue }
    if (line.startsWith('#### ')) { elements.push(<h4 key={k()} className="text-sm font-semibold mt-4 mb-2 text-white/80 uppercase tracking-wide">{renderInline(line.slice(5))}</h4>); i++; continue }
    if (line.startsWith('---') || line.startsWith('***')) { elements.push(<hr key={k()} className="my-6 border-white/10"/>); i++; continue }
    if (line.startsWith('> ')) { elements.push(<blockquote key={k()} className="border-l-2 border-forge-purple pl-4 my-3 text-white/60 italic text-sm">{renderInline(line.slice(2))}</blockquote>); i++; continue }

    // Unordered list
    if (line.match(/^[-*+] /)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*+] /)) { items.push(lines[i].slice(2)); i++ }
      elements.push(
        <ul key={k()} className="my-3 space-y-1.5 pl-4">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
              <span className="text-forge-purple mt-1.5 text-xs shrink-0">•</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\. /)) { items.push(lines[i].replace(/^\d+\. /, '')); i++ }
      elements.push(
        <ol key={k()} className="my-3 space-y-1.5 pl-4">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-white/70">
              <span className="text-forge-purple font-mono text-xs mt-1 min-w-[16px] shrink-0">{idx + 1}.</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Table
    if (line.includes('|') && lines[i + 1]?.includes('---')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].includes('|')) { tableLines.push(lines[i]); i++ }
      if (tableLines.length >= 2) {
        const headers = tableLines[0].split('|').filter(c => c.trim()).map(c => c.trim())
        const rows = tableLines.slice(2).map(row => row.split('|').filter(c => c.trim()).map(c => c.trim()))
        elements.push(
          <div key={k()} className="my-4 overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-forge-navy/80">
                  {headers.map((h, idx) => <th key={idx} className="px-4 py-2.5 text-left text-xs font-medium text-forge-lilac border-b border-white/10">{renderInline(h)}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ridx) => (
                  <tr key={ridx} className={ridx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                    {row.map((cell, cidx) => <td key={cidx} className="px-4 py-2.5 text-white/70 border-b border-white/5 text-xs">{renderInline(cell)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    if (line.trim() === '') { elements.push(<div key={k()} className="h-2"/>); i++; continue }
    elements.push(<p key={k()} className="text-sm text-white/70 leading-relaxed my-1.5">{renderInline(line)}</p>)
    i++
  }

  return <div className={cn('portforge-md', className)}>{elements}</div>
}
