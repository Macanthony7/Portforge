import type { Template, DesignTheme } from '@/types'

export const TEMPLATES: Template[] = [
  {
    id: 'cyber-ctf-writeup',
    career_track: 'cybersecurity',
    name: 'CTF Write-up',
    description: 'Document a Capture The Flag challenge from recon to flag capture.',
    question_schema: [
      { id: 'q1', section: 'Overview', question: 'What is the name and platform of this CTF challenge?', hint: 'e.g. "PicoCTF 2024 — Binary Exploit: buffer overflow"', input_type: 'text', required: true },
      { id: 'q2', section: 'Overview', question: 'What category is this challenge?', hint: 'e.g. Web Exploitation, Reverse Engineering, Forensics, Cryptography', input_type: 'text', required: true },
      { id: 'q3', section: 'Overview', question: 'What was the difficulty and point value?', hint: 'e.g. Medium — 300 points', input_type: 'text', required: false },
      { id: 'q4', section: 'Recon', question: 'What did your initial reconnaissance reveal?', hint: 'Describe what you found first — source code, endpoints, file types, services', input_type: 'text', required: true },
      { id: 'q5', section: 'Tools', question: 'What tools did you use?', hint: 'e.g. Burp Suite, GDB, Ghidra, nmap, Python scripts — one per line', input_type: 'list', required: true },
      { id: 'q6', section: 'Methodology', question: 'Walk through your step-by-step approach to solving the challenge.', hint: 'Be detailed — what worked, what failed, pivots you made', input_type: 'text', required: true },
      { id: 'q7', section: 'Exploit', question: 'Paste your final exploit code or payload.', hint: 'Include the script or command that captured the flag', input_type: 'code', required: false },
      { id: 'q8', section: 'Flag', question: 'What was the flag?', hint: 'e.g. picoCTF{s0m3_fl4g_h3r3}', input_type: 'text', required: true },
      { id: 'q9', section: 'Lessons', question: 'What did you learn from this challenge?', hint: 'Key takeaways, new techniques, or concepts discovered', input_type: 'text', required: false },
    ],
    output_structure: [
      { id: 'overview', title: 'Challenge Overview', order: 1 },
      { id: 'recon', title: 'Reconnaissance', order: 2 },
      { id: 'methodology', title: 'Methodology & Approach', order: 3 },
      { id: 'exploit', title: 'Exploit / Solution', order: 4 },
      { id: 'flag', title: 'Flag Capture', order: 5 },
      { id: 'lessons', title: 'Lessons Learned', order: 6 },
    ],
  },
  {
    id: 'cyber-pentest-report',
    career_track: 'cybersecurity',
    name: 'Vulnerability Audit Report',
    description: 'Professional penetration test report with findings, CVSS ratings and remediation.',
    question_schema: [
      { id: 'q1', section: 'Scope', question: 'What was the scope of this assessment?', hint: 'Target systems, IP ranges, domains, applications in scope', input_type: 'text', required: true },
      { id: 'q2', section: 'Scope', question: 'What type of assessment was conducted?', hint: 'e.g. Black box web app test, Grey box network pentest, Red team engagement', input_type: 'text', required: true },
      { id: 'q3', section: 'Scope', question: 'What were the dates of the assessment?', hint: 'Start date — End date', input_type: 'text', required: false },
      { id: 'q4', section: 'Methodology', question: 'What methodology or framework was followed?', hint: 'e.g. OWASP Testing Guide, PTES, NIST, custom approach', input_type: 'text', required: true },
      { id: 'q5', section: 'Methodology', question: 'What tools were used during the assessment?', hint: 'e.g. Nmap, Burp Suite, Metasploit, Nikto — one per line', input_type: 'list', required: true },
      { id: 'q6', section: 'Findings', question: 'List each vulnerability found. For each include: name, severity (Critical/High/Medium/Low), description, and evidence.', hint: 'Be as detailed as possible — this is the core of the report', input_type: 'text', required: true },
      { id: 'q7', section: 'CVSS', question: 'Provide CVSS vector strings and scores for each finding.', hint: 'e.g. CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H (Score: 9.8)', input_type: 'cvss-table', required: false },
      { id: 'q8', section: 'Remediation', question: 'What are your remediation recommendations for each finding?', hint: 'Be specific — patch versions, config changes, code fixes', input_type: 'text', required: true },
      { id: 'q9', section: 'Summary', question: 'Write a brief executive summary of the overall security posture.', hint: 'Non-technical overview suitable for a manager or client', input_type: 'text', required: true },
    ],
    output_structure: [
      { id: 'exec-summary', title: 'Executive Summary', order: 1 },
      { id: 'scope', title: 'Scope & Objectives', order: 2 },
      { id: 'methodology', title: 'Methodology', order: 3 },
      { id: 'findings', title: 'Vulnerability Findings', order: 4 },
      { id: 'remediation', title: 'Remediation Recommendations', order: 5 },
      { id: 'conclusion', title: 'Conclusion', order: 6 },
    ],
  },
  {
    id: 'cyber-lab-doc',
    career_track: 'cybersecurity',
    name: 'Security Lab Documentation',
    description: 'Document a home lab, TryHackMe room, or Hack The Box machine walkthrough.',
    question_schema: [
      { id: 'q1', section: 'Lab Overview', question: 'What is the name and platform of this lab or machine?', hint: 'e.g. TryHackMe — "Blue" room, HackTheBox — "Lame" machine', input_type: 'text', required: true },
      { id: 'q2', section: 'Lab Overview', question: 'What were your objectives for this lab?', hint: 'Skills you wanted to practice, techniques to learn', input_type: 'text', required: true },
      { id: 'q3', section: 'Environment', question: 'Describe your lab environment and setup.', hint: 'OS, VMs, network config, tools installed', input_type: 'text', required: true },
      { id: 'q4', section: 'Walkthrough', question: 'Walk through what you did step by step.', hint: 'Enumeration → exploitation → privilege escalation → flags', input_type: 'text', required: true },
      { id: 'q5', section: 'Walkthrough', question: 'Paste key commands or scripts used.', hint: 'Include the commands that made the difference', input_type: 'code', required: false },
      { id: 'q6', section: 'Results', question: 'What was the outcome? What flags or access did you achieve?', hint: 'Root/user flags, level of access gained', input_type: 'text', required: true },
      { id: 'q7', section: 'Lessons', question: 'What did you learn? What would you do differently?', hint: 'Honest reflection makes this more valuable for your portfolio', input_type: 'text', required: false },
    ],
    output_structure: [
      { id: 'overview', title: 'Lab Overview', order: 1 },
      { id: 'environment', title: 'Environment Setup', order: 2 },
      { id: 'walkthrough', title: 'Step-by-Step Walkthrough', order: 3 },
      { id: 'results', title: 'Results & Findings', order: 4 },
      { id: 'lessons', title: 'Lessons Learned', order: 5 },
    ],
  },
]

export const DESIGN_THEMES: DesignTheme[] = [
  { id: 'cyber-dark-terminal', career_track: 'cybersecurity', name: 'Dark Terminal', description: 'Black bg · monospace accents · red severity badges', preview_colors: ['#0F0F14', '#FF4444', '#00FF88'] },
  { id: 'cyber-forge-dark', career_track: 'cybersecurity', name: 'Forge Dark', description: 'Navy bg · purple accents · structured findings table', preview_colors: ['#1A1A2E', '#534AB7', '#AFA9EC'] },
  { id: 'cyber-audit-light', career_track: 'cybersecurity', name: 'Audit Light', description: 'White bg · structured layout · client-deliverable ready', preview_colors: ['#FFFFFF', '#1A1A2E', '#534AB7'] },
]

export function getTemplatesByTrack(): Template[] {
  return TEMPLATES
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id)
}

export function getThemesByTrack(): DesignTheme[] {
  return DESIGN_THEMES
}
