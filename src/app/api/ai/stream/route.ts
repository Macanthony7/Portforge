import { NextRequest } from 'next/server'
import { anthropic, MODELS } from '@/lib/anthropic/client'
import { buildDocumentPrompt, buildRegeneratePrompt } from '@/lib/anthropic/prompts'
import { getTemplateById } from '@/lib/templates'
import { createClient } from '@/lib/supabase/server'
import type { CareerTrack } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  const { projectId, answers, mode, currentContent, userFeedback } = body

  const { data: project } = await supabase
    .from('projects').select('*').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return new Response('Project not found', { status: 404 })

  const template = getTemplateById(project.template_id)
  if (!template) return new Response('Template not found', { status: 404 })

  const prompt = mode === 'regenerate'
    ? buildRegeneratePrompt('Full document', currentContent, userFeedback, project.career_track as CareerTrack)
    : buildDocumentPrompt(template, answers, project.career_track as CareerTrack)

  if (mode !== 'regenerate') {
    await supabase.from('ai_sessions').upsert({ project_id: projectId, answers, completed: false })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let fullContent = ''

      const streamResp = await anthropic.messages.stream({
        model: MODELS.standard,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })

      for await (const chunk of streamResp) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullContent += chunk.delta.text
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
        }
      }

      if (mode !== 'regenerate') {
        await supabase.from('ai_sessions')
          .update({ generated_content: fullContent, completed: true })
          .eq('project_id', projectId)
        await supabase.from('projects')
          .update({ content: { generated: fullContent }, status: 'complete', updated_at: new Date().toISOString() })
          .eq('id', projectId)
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  })
}
