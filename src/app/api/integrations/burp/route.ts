import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Information'
const SEV_ORDER: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, Information: 4 }
const VALID_SEV = ['Critical', 'High', 'Medium', 'Low', 'Information']

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getCdata(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([^<]*)</${tag}>`))
  return m ? (m[1] || m[2] || '').trim() : ''
}

function parseBurp(xml: string) {
  return (xml.match(/<issue>[\s\S]*?<\/issue>/g) || []).map(block => {
    const sevRaw = getCdata(block, 'severity')
    const severity: Severity = VALID_SEV.includes(sevRaw) ? sevRaw as Severity : 'Information'
    return {
      name: getCdata(block, 'name'),
      severity,
      host: block.match(/<host[^>]*>([^<]*)<\/host>/)?.[1]?.trim() || '',
      path: block.match(/<path[^>]*>([^<]*)<\/path>/)?.[1]?.trim() || '',
      description: stripHtml(getCdata(block, 'issueDetail') || getCdata(block, 'issueBackground')),
      remediation: stripHtml(getCdata(block, 'remediationDetail') || getCdata(block, 'remediationBackground')),
    }
  }).sort((a, b) => (SEV_ORDER[a.severity] ?? 5) - (SEV_ORDER[b.severity] ?? 5))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const xml = await file.text()
    if (!xml.includes('<issue>')) return NextResponse.json({ error: 'Not a valid Burp Suite XML export' }, { status: 400 })

    const findings = parseBurp(xml)
    const counts = Object.fromEntries(VALID_SEV.map(s => [s, findings.filter(f => f.severity === s).length]))

    const findingsText = findings.filter(f => f.severity !== 'Information')
      .map(f => `**${f.name}** (${f.severity})\nHost: ${f.host}${f.path}\nDescription: ${f.description}\nRemediation: ${f.remediation}`)
      .join('\n\n---\n\n')

    const remediationText = findings.filter(f => f.severity !== 'Information')
      .map(f => `**${f.name}**: ${f.remediation || 'Refer to OWASP guidance.'}`)
      .join('\n\n')

    const autoAnswers: Record<string, string> = {
      q6: findingsText,
      q7: remediationText,
      burp_summary: `${findings.length} total findings — ${counts.Critical} Critical, ${counts.High} High, ${counts.Medium} Medium, ${counts.Low} Low`,
    }

    return NextResponse.json({ findings, counts, total: findings.length, autoAnswers })
  } catch (err) {
    console.error('Burp parse error:', err)
    return NextResponse.json({ error: 'Failed to parse Burp Suite XML' }, { status: 500 })
  }
}
