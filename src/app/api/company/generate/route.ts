import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODELS } from '@/lib/anthropic/client'
import { buildCompanyDocPrompt } from '@/lib/company/prompts'
import { getCompanyTemplate } from '@/lib/company/templates'
import type { CompanyDocType } from '@/lib/company/templates'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { projectId, answers } = await req.json()

  const { data: project } = await supabase
    .from('company_projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return new Response('Project not found', { status: 404 })

  const template = getCompanyTemplate(project.doc_type as CompanyDocType)
  if (!template) return new Response('Template not found', { status: 404 })

  const prompt = buildCompanyDocPrompt({
    template,
    answers,
    repoData: project.repo_data || {},
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let fullContent = ''

      const streamResp = await anthropic.messages.stream({
        model: MODELS.standard,
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      })

      for await (const chunk of streamResp) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullContent += chunk.delta.text
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`
          ))
        }
      }

      // Parse sections from the generated content
      const sections = parseDocSections(fullContent, template.sections)

      // Save to project
      await supabase.from('company_projects').update({
        sections,
        answers,
        status: 'complete',
        updated_at: new Date().toISOString(),
      }).eq('id', projectId)

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

function parseDocSections(
  content: string,
  templateSections: { id: string; title: string; order: number }[]
): { id: string; title: string; content: string; order: number; needs_review: boolean; last_synced_at: string | null }[] {
  const now = new Date().toISOString()
  const sections = []

  for (let i = 0; i < templateSections.length; i++) {
    const section = templateSections[i]
    const nextSection = templateSections[i + 1]

    // Try to extract section content between headings
    const headingPattern = new RegExp(
      `##\\s+${escapeRegex(section.title)}([\\s\\S]*?)${nextSection ? `##\\s+${escapeRegex(nextSection.title)}` : '$'}`,
      'i'
    )
    const match = content.match(headingPattern)

    sections.push({
      id: section.id,
      title: section.title,
      content: match ? `## ${section.title}${match[1].trimEnd()}` : extractFallback(content, section.title),
      order: section.order,
      needs_review: false,
      last_synced_at: now,
    })
  }

  // If parsing failed, put everything in the first section
  if (sections.every(s => !s.content || s.content.trim() === `## ${s.title}`)) {
    sections[0].content = content
  }

  return sections
}

function extractFallback(content: string, title: string): string {
  // Try case-insensitive match with ## or ###
  const patterns = [
    new RegExp(`###+\\s*${escapeRegex(title)}\\s*\\n([\\s\\S]*?)(?=##|$)`, 'i'),
  ]
  for (const p of patterns) {
    const m = content.match(p)
    if (m) return `## ${title}\n${m[1].trim()}`
  }
  return `## ${title}\n\n*Section content — review and edit as needed.*`
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
