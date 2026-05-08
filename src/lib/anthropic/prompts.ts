import type { Template, CareerTrack } from '@/types'

const TRACK_CONTEXT: Record<CareerTrack, string> = {
  cybersecurity: 'cybersecurity professional, penetration tester, or security researcher',
  software_dev: 'software developer or engineer',
  devops_cloud: 'DevOps engineer or cloud architect',
}

export function buildDocumentPrompt(
  template: Template,
  answers: Record<string, string>,
  careerTrack: CareerTrack
): string {
  const answersText = template.question_schema
    .map(q => {
      const answer = answers[q.id]
      if (!answer) return null
      return `### ${q.section} — ${q.question}\n${answer}`
    })
    .filter(Boolean)
    .join('\n\n')

  // Include any integration data
  const integrationData = Object.entries(answers)
    .filter(([k]) => k.startsWith('nmap_') || k.startsWith('burp_') || k === 'readme_raw')
    .map(([k, v]) => `### Integration data (${k})\n${v}`)
    .join('\n\n')

  return `You are an expert technical writer creating professional documentation for a ${TRACK_CONTEXT[careerTrack]}.

Using the information provided below, write a COMPLETE, polished, professional document following the "${template.name}" format.

CRITICAL INSTRUCTIONS:
- Write the COMPLETE document — not a template, not placeholders, not instructions
- Use professional tone appropriate for a ${TRACK_CONTEXT[careerTrack]}'s portfolio or client deliverable
- Structure the document with clear markdown headings (##, ###)
- Where code was provided, include it in proper code blocks with language tags
- Where information is sparse, infer professionally — never leave sections empty
- The document must be immediately shareable with a recruiter or client
- Use markdown: headings, code blocks, bold, tables, bullet lists

OUTPUT SECTIONS TO INCLUDE:
${template.output_structure.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}

USER PROVIDED INFORMATION:
${answersText}

${integrationData ? `ADDITIONAL DATA FROM INTEGRATIONS:\n${integrationData}` : ''}

Now write the complete, professional document:`
}

export function buildRegeneratePrompt(
  sectionTitle: string,
  currentContent: string,
  userFeedback: string,
  careerTrack: CareerTrack
): string {
  return `You are rewriting a professional technical document for a ${TRACK_CONTEXT[careerTrack]}.

CURRENT DOCUMENT:
${currentContent}

USER INSTRUCTIONS:
${userFeedback}

Rewrite the ENTIRE document based on the feedback above. Keep the same professional standard. Return only the rewritten document content in markdown, no preamble or explanation.`
}
