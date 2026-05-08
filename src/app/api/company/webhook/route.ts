import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODELS } from '@/lib/anthropic/client'
import { buildSectionUpdatePrompt } from '@/lib/company/prompts'
import type { CompanyDocType } from '@/lib/company/templates'

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const signature = req.headers.get('x-hub-signature-256')
  const event = req.headers.get('x-github-event')

  // Only handle PR merge events
  if (event !== 'pull_request') return NextResponse.json({ ok: true })

  const body = JSON.parse(payload)
  if (body.action !== 'closed' || !body.pull_request?.merged) {
    return NextResponse.json({ ok: true })
  }

  // Find which company project this webhook belongs to
  const supabase = await createClient()
  const repoFullName = body.repository?.full_name

  const { data: projects } = await supabase
    .from('company_projects')
    .select('*')
    .eq('pr_sync_enabled', true)
    .ilike('repo_url', `%${repoFullName}%`)

  if (!projects || projects.length === 0) return NextResponse.json({ ok: true })

  for (const project of projects) {
    // Verify webhook secret
    if (project.webhook_secret && signature) {
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(project.webhook_secret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
      )
      const sigBytes = Buffer.from(signature.replace('sha256=', ''), 'hex')
      const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload))
      if (!isValid) continue
    }

    // Mark as syncing
    await supabase.from('company_projects')
      .update({ pr_sync_status: 'syncing' })
      .eq('id', project.id)

    try {
      // Fetch the PR diff
      const prNumber = body.pull_request.number
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Portforge/1.0',
      }
      if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`

      const diffRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/pulls/${prNumber}/files`,
        { headers }
      )
      const changedFiles = await diffRes.json()

      // Build a summary diff string
      const diffSummary = Array.isArray(changedFiles)
        ? changedFiles.map((f: { filename: string; status: string; patch?: string }) =>
            `File: ${f.filename} (${f.status})\n${f.patch ? f.patch.slice(0, 500) : 'No patch available'}`
          ).join('\n\n').slice(0, 4000)
        : 'Diff unavailable'

      // Check each section for relevance and update if needed
      const sections = (project.sections || []) as Array<{
        id: string; title: string; content: string; order: number;
        needs_review: boolean; last_synced_at: string | null
      }>

      const updatedSections = [...sections]
      const reviewNeeded: string[] = []

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]

        // Ask AI if this section needs updating
        const relevanceCheck = await anthropic.messages.create({
          model: MODELS.standard,
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Does this git diff affect the "${section.title}" section of documentation? Answer only "yes" or "no".\n\nDIFF:\n${diffSummary}`,
          }],
        })

        const isRelevant = relevanceCheck.content[0].type === 'text' &&
          relevanceCheck.content[0].text.toLowerCase().includes('yes')

        if (!isRelevant) continue

        // Update the section
        const updatePrompt = buildSectionUpdatePrompt({
          sectionTitle: section.title,
          currentContent: section.content,
          prDiff: diffSummary,
          docType: project.doc_type as CompanyDocType,
        })

        const updateResp = await anthropic.messages.create({
          model: MODELS.standard,
          max_tokens: 2048,
          messages: [{ role: 'user', content: updatePrompt }],
        })

        const newContent = updateResp.content[0].type === 'text'
          ? updateResp.content[0].text
          : section.content

        updatedSections[i] = {
          ...section,
          content: newContent,
          needs_review: true,
          last_synced_at: new Date().toISOString(),
        }

        reviewNeeded.push(section.title)
      }

      // Save updated sections + set status to pending_review
      await supabase.from('company_projects').update({
        sections: updatedSections,
        pr_sync_status: reviewNeeded.length > 0 ? 'pending_review' : 'idle',
        updated_at: new Date().toISOString(),
      }).eq('id', project.id)

    } catch (err) {
      console.error('PR sync error:', err)
      await supabase.from('company_projects')
        .update({ pr_sync_status: 'error' })
        .eq('id', project.id)
    }
  }

  return NextResponse.json({ ok: true })
}
