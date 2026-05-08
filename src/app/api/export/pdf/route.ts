import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTemplateById } from '@/lib/templates'

const THEME_CSS: Record<string, string> = {
  'cyber-dark-terminal': 'body{background:#0f0f14;color:#e0e0e0;font-family:"Courier New",monospace}h1,h2{color:#fff;border-bottom:1px solid #333}h3{color:#00ff88}code,pre{background:#1a1a1a;color:#00ff88;border:1px solid #333}table th{background:#1a1a1a;color:#00ff88}',
  'cyber-forge-dark': 'body{background:#1a1a2e;color:#d0d0e8;font-family:"Segoe UI",sans-serif}h1,h2{color:#afa9ec;border-bottom:1px solid #2a2a4e}h3{color:#534ab7}code,pre{background:#0f0f1e;color:#afa9ec;border:1px solid #2a2a4e}table th{background:#0f0f1e;color:#afa9ec}',
  'cyber-audit-light': 'body{background:#fff;color:#1a1a2e;font-family:"Segoe UI",sans-serif}h1{color:#1a1a2e;border-bottom:2px solid #534ab7}h2{color:#1a1a2e;border-bottom:1px solid #e0e0f0}h3{color:#534ab7}code,pre{background:#f0f0ff;color:#1a1a2e;border:1px solid #d0d0f0}table th{background:#1a1a2e;color:#fff}',
  'dev-github-dark': 'body{background:#0d1117;color:#c9d1d9;font-family:-apple-system,sans-serif}h1,h2{color:#e6edf3;border-bottom:1px solid #21262d}h3{color:#58a6ff}code,pre{background:#161b22;color:#79c0ff;border:1px solid #30363d}table th{background:#161b22;color:#58a6ff}',
  'dev-clean-slate': 'body{background:#fff;color:#24292f;font-family:-apple-system,sans-serif}h1{color:#24292f;border-bottom:1px solid #d0d7de}h2,h3{color:#1d9e75}code,pre{background:#f6f8fa;color:#0f6e56;border:1px solid #d0d7de}table th{background:#1d9e75;color:#fff}',
  'dev-case-study': 'body{background:#fff;color:#111827;font-family:Georgia,serif}h1{color:#111827;font-size:2em;border-bottom:3px solid #111827}h2{color:#111827}h3{color:#1d9e75}code,pre{background:#f9fafb;color:#374151;border:1px solid #e5e7eb;font-family:monospace}table th{background:#111827;color:#fff}',
  'devops-cloud-dark': 'body{background:#0a1628;color:#b8cce4;font-family:"Segoe UI",sans-serif}h1,h2{color:#85b7eb;border-bottom:1px solid #1a3050}h3{color:#378add}code,pre{background:#061020;color:#85b7eb;border:1px solid #1a3050}table th{background:#061020;color:#85b7eb}',
  'devops-blueprint': 'body{background:#eaf3fb;color:#0c447c;font-family:"Segoe UI",sans-serif}h1{color:#0c447c;border-bottom:2px solid #185fa5}h2,h3{color:#185fa5}code,pre{background:#dceefb;color:#0c447c;border:1px solid #b5d4f4}table th{background:#185fa5;color:#fff}',
  'blank': 'body{background:#fff;color:#111827;font-family:"Segoe UI",sans-serif}h1,h2,h3{color:#111827}code,pre{background:#f3f4f6;color:#374151;border:1px solid #e5e7eb}table th{background:#111827;color:#fff}',
}

function mdToHtml(md: string): string {
  let h = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---+$/gm, '<hr/>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n+/g, '</p><p>')
  return `<p>${h}</p>`.replace(/<p>(<h[1-6]|<ul|<ol|<pre|<hr)/g, '$1').replace(/(<\/h[1-6]>|<\/ul>|<\/ol>|<\/pre>)<\/p>/g, '$1').replace(/<p><\/p>/g, '')
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('subscription_tier, full_name').eq('id', user.id).single()
  if (profile?.subscription_tier === 'free') return NextResponse.json({ error: 'PDF export requires Pro plan' }, { status: 403 })

  const { projectId } = await req.json()
  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const content = project.content as Record<string, unknown>
  const markdown = (content?.edited as string) || (content?.generated as string) || ''
  if (!markdown) return NextResponse.json({ error: 'No content to export' }, { status: 400 })

  const template = getTemplateById(project.template_id)
  const css = THEME_CSS[project.design_theme] || THEME_CSS['blank']
  const body = mdToHtml(markdown)
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${project.title}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}${css}
body{padding:48px;font-size:14px;line-height:1.7}
h1{font-size:1.8em;margin:0 0 24px;padding-bottom:12px}h2{font-size:1.3em;margin:32px 0 12px;padding-bottom:8px}
h3{font-size:1.1em;margin:24px 0 8px}p{margin:8px 0}ul,ol{margin:8px 0 8px 24px}li{margin:4px 0}
code{padding:2px 6px;border-radius:4px;font-size:.875em}pre{padding:16px;border-radius:8px;margin:16px 0;overflow-x:auto}
pre code{padding:0;background:none;border:none}table{width:100%;border-collapse:collapse;margin:16px 0;font-size:.875em}
th,td{padding:8px 12px;text-align:left;border-bottom:1px solid rgba(128,128,128,.2)}hr{margin:24px 0;border:none;border-top:1px solid rgba(128,128,128,.3)}
.meta{font-size:.75em;opacity:.5;margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid rgba(128,128,128,.2)}
.footer{margin-top:48px;padding-top:16px;border-top:1px solid rgba(128,128,128,.2);font-size:.75em;opacity:.4;display:flex;justify-content:space-between}
@media print{body{padding:24px}.footer{position:fixed;bottom:16px;left:24px;right:24px}}
</style></head><body>
<div class="meta"><strong>${template?.name || 'Document'}</strong> · Portforge · ${date}${profile?.full_name ? ` · ${profile.full_name}` : ''}</div>
${body}
<div class="footer"><span>Portforge — Document your craft.</span><span>${project.title}</span></div>
</body></html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
