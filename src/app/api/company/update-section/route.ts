import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODELS } from '@/lib/anthropic/client'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { projectId, sectionId, instruction, currentContent } = await req.json()

  const { data: project } = await supabase
    .from('company_projects')
    .select('doc_type, sections')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return new Response('Project not found', { status: 404 })

  const prompt = `You are rewriting a specific section of a professional technical document.

SECTION TITLE: "${sectionId}"

CURRENT CONTENT:
${currentContent}

USER INSTRUCTIONS:
${instruction}

Rewrite this section based on the instructions above. Keep the same professional quality. Return ONLY the rewritten section content in markdown — include the ## heading. No preamble.`

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let newContent = ''

      const streamResp = await anthropic.messages.stream({
        model: MODELS.standard,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })

      for await (const chunk of streamResp) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          newContent += chunk.delta.text
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`
          ))
        }
      }

      // Update the specific section in the project
      const sections = (project.sections || []) as Array<{
        id: string; content: string; needs_review: boolean; last_synced_at: string | null
      }>

      const updatedSections = sections.map(s =>
        s.id === sectionId
          ? { ...s, content: newContent, needs_review: false, last_synced_at: new Date().toISOString() }
          : s
      )

      await supabase.from('company_projects').update({
        sections: updatedSections,
        updated_at: new Date().toISOString(),
      }).eq('id', projectId)

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  })
}
