import type { CompanyDocTemplate, CompanyDocType } from './templates'

const DOC_TYPE_CONTEXT: Record<CompanyDocType, string> = {
  user_guide: 'a comprehensive, friendly user guide written for non-technical end users',
  api_docs: 'a complete, professional API reference documentation written for developers',
  whitepaper: 'a technical whitepaper written for investors, developers, and the technical community',
  audit_report: 'a professional security audit report written for clients, investors, and public disclosure',
  full_suite: 'a complete documentation suite covering both end users and developers',
}

export function buildCompanyDocPrompt({
  template,
  answers,
  repoData,
}: {
  template: CompanyDocTemplate
  answers: Record<string, string>
  repoData: Record<string, unknown>
}): string {
  const answersText = [...template.questions, ...template.repoQuestions]
    .map(q => {
      const answer = answers[q.id]
      if (!answer) return null
      return `### ${q.section} — ${q.question}\n${answer}`
    })
    .filter(Boolean)
    .join('\n\n')

  const repoContext = repoData && Object.keys(repoData).length > 0
    ? `\n\nREPOSITORY DATA (extracted from GitHub):\n${JSON.stringify(repoData, null, 2)}`
    : ''

  const sections = template.sections.map((s, i) => `${i + 1}. ${s.title}`).join('\n')

  return `You are an expert technical writer creating ${DOC_TYPE_CONTEXT[template.id]}.

Using the information provided below, write a COMPLETE, professional, publication-ready document.

CRITICAL INSTRUCTIONS:
- Write the COMPLETE document — every section must be fully written, not summarised or placeholder
- Use professional tone appropriate for ${DOC_TYPE_CONTEXT[template.id]}
- Every section must have real, substantive content — no "coming soon" or "TBD"
- Include code examples in proper code blocks wherever relevant
- Use markdown formatting throughout: ## headings, code blocks, tables, bold, lists
- Where information is not provided, make reasonable professional inferences — never leave sections empty
- The document must be immediately usable — publishable or shareable without further editing

DOCUMENT SECTIONS (write ALL of them):
${sections}

INFORMATION PROVIDED:
${answersText}
${repoContext}

Write the complete, publication-ready document now:`
}

export function buildSectionUpdatePrompt({
  sectionTitle,
  currentContent,
  prDiff,
  docType,
}: {
  sectionTitle: string
  currentContent: string
  prDiff: string
  docType: CompanyDocType
}): string {
  return `You are updating a section of a ${DOC_TYPE_CONTEXT[docType]}.

A Pull Request was merged that changed the codebase. Review the diff and update the documentation section to reflect the changes accurately.

SECTION BEING UPDATED: "${sectionTitle}"

CURRENT CONTENT:
${currentContent}

PULL REQUEST DIFF:
${prDiff.slice(0, 3000)}

INSTRUCTIONS:
- Only update parts of the section that are directly affected by the diff
- Keep all other content exactly as it was
- If a new endpoint was added, document it
- If an endpoint was changed, update the description and examples
- If something was removed, remove it from the docs
- Return ONLY the updated section content in markdown — no preamble or explanation`
}

export function buildGapFillPrompt(
  repoData: Record<string, unknown>,
  templateId: CompanyDocType,
  existingAnswers: Record<string, string>
): string {
  return `You are analysing a GitHub repository to understand what information is already available for creating ${DOC_TYPE_CONTEXT[templateId]}.

REPOSITORY DATA:
${JSON.stringify(repoData, null, 2)}

INFORMATION ALREADY PROVIDED BY USER:
${JSON.stringify(existingAnswers, null, 2)}

Based on the repository data, extract and return a JSON object with any of the following fields you can confidently determine:
- project_name: string
- project_description: string  
- tech_stack: string[]
- api_base_url: string (if found in code/README)
- api_endpoints: string (formatted list if found)
- auth_method: string (if identifiable)
- language: string
- framework: string
- license: string
- has_webhooks: boolean
- readme_summary: string (first 500 chars of README if available)

Return ONLY valid JSON, nothing else.`
}
