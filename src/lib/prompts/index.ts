import type { Template, CareerTrack } from '@/types'

const TRACK_CONTEXT: Record<CareerTrack, string> = {
  cybersecurity: 'cybersecurity professional, penetration tester, or security researcher',
}

export function buildDocumentPrompt(
  template: Template,
  answers: Record<string, string>
): string {
  const answersText = template.question_schema
    .map(q => {
      const answer = answers[q.id]
      if (!answer) return null
      return `### ${q.section} — ${q.question}\n${answer}`
    })
    .filter(Boolean)
    .join('\n\n')

  return `You are an expert technical writer creating professional documentation for a ${TRACK_CONTEXT.cybersecurity}.

Using the information provided below, write a COMPLETE, polished, professional document following the "${template.name}" format.

CRITICAL INSTRUCTIONS:
- Write the COMPLETE document — not a template, not placeholders, not instructions
- Use professional tone appropriate for a ${TRACK_CONTEXT.cybersecurity}'s portfolio or client deliverable
- Structure the document with clear markdown headings (##, ###)
- Where code was provided, include it in proper code blocks with language tags
- Where information is sparse, infer professionally — never leave sections empty
- The document must be immediately shareable with a recruiter or client
- Use markdown: headings, code blocks, bold, tables, bullet lists
- When a CVSS vector string is present, include it in the findings table

OUTPUT SECTIONS TO INCLUDE:
${template.output_structure.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}

USER PROVIDED INFORMATION:
${answersText}

Now write the complete, professional document in markdown format:`
}

export function buildRegeneratePrompt(
  currentContent: string,
  userFeedback: string
): string {
  return `You are rewriting a professional technical document for a ${TRACK_CONTEXT.cybersecurity}.

CURRENT DOCUMENT:
${currentContent}

USER INSTRUCTIONS:
${userFeedback}

Rewrite the ENTIRE document based on the feedback above. Keep the same professional standard. Return only the rewritten document content in markdown, no preamble or explanation.`
}
