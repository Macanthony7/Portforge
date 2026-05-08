import type { Template, DesignTheme, CareerTrack } from '@/types'

export const TEMPLATES: Template[] = [
  // ── CYBERSECURITY ──────────────────────────────────────────────
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
      { id: 'q7', section: 'Remediation', question: 'What are your remediation recommendations for each finding?', hint: 'Be specific — patch versions, config changes, code fixes', input_type: 'text', required: true },
      { id: 'q8', section: 'Summary', question: 'Write a brief executive summary of the overall security posture.', hint: 'Non-technical overview suitable for a manager or client', input_type: 'text', required: true },
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

  // ── SOFTWARE DEV ────────────────────────────────────────────────
  {
    id: 'dev-readme',
    career_track: 'software_dev',
    name: 'README Generator',
    description: 'Generate a professional, structured README for any software project.',
    question_schema: [
      { id: 'q1', section: 'Project', question: 'What is the name of your project?', hint: 'The exact name as it appears on GitHub', input_type: 'text', required: true },
      { id: 'q2', section: 'Project', question: 'In one or two sentences, what does it do?', hint: 'Plain English — what problem does it solve?', input_type: 'text', required: true },
      { id: 'q3', section: 'Features', question: 'What are the main features?', hint: 'One feature per line', input_type: 'list', required: true },
      { id: 'q4', section: 'Setup', question: 'What are the prerequisites to run this project?', hint: 'e.g. Node.js 18+, Python 3.10+, Docker', input_type: 'list', required: true },
      { id: 'q5', section: 'Setup', question: 'Walk me through the installation steps.', hint: 'Clone, install dependencies, configure env, run', input_type: 'text', required: true },
      { id: 'q6', section: 'Usage', question: 'How do you run or use it? Include key commands.', hint: 'npm run dev, python main.py, docker-compose up, etc.', input_type: 'code', required: true },
      { id: 'q7', section: 'Tech Stack', question: 'What technologies and frameworks does it use?', hint: 'e.g. Next.js, PostgreSQL, Tailwind, Docker — one per line', input_type: 'list', required: true },
      { id: 'q8', section: 'License', question: 'What license is this project under?', hint: 'e.g. MIT, Apache 2.0, GPL-3.0, or "All rights reserved"', input_type: 'text', required: false },
    ],
    output_structure: [
      { id: 'header', title: 'Project Header & Description', order: 1 },
      { id: 'features', title: 'Features', order: 2 },
      { id: 'tech-stack', title: 'Tech Stack', order: 3 },
      { id: 'prerequisites', title: 'Prerequisites', order: 4 },
      { id: 'installation', title: 'Installation', order: 5 },
      { id: 'usage', title: 'Usage', order: 6 },
      { id: 'license', title: 'License', order: 7 },
    ],
  },
  {
    id: 'dev-case-study',
    career_track: 'software_dev',
    name: 'Project Case Study',
    description: 'A recruiter-ready deep-dive: problem → solution → architecture → results.',
    question_schema: [
      { id: 'q1', section: 'Overview', question: 'What is the project name and what does it do?', hint: 'One confident paragraph', input_type: 'text', required: true },
      { id: 'q2', section: 'Problem', question: 'What problem were you solving? Why did it need to exist?', hint: 'Context is everything — explain the pain point', input_type: 'text', required: true },
      { id: 'q3', section: 'Solution', question: 'How did your solution address the problem?', hint: 'High-level approach before technical details', input_type: 'text', required: true },
      { id: 'q4', section: 'Architecture', question: 'Describe the system architecture.', hint: 'Frontend, backend, database, APIs, third-party services', input_type: 'text', required: true },
      { id: 'q5', section: 'Tech Stack', question: 'What was your tech stack and why did you choose it?', hint: 'Justify your choices — shows engineering maturity', input_type: 'list', required: true },
      { id: 'q6', section: 'Challenges', question: 'What were the hardest technical challenges you faced?', hint: 'Be honest — recruiters respect candour over perfection', input_type: 'text', required: true },
      { id: 'q7', section: 'Results', question: 'What were the results or outcomes?', hint: 'Users, performance metrics, uptime, time saved — quantify', input_type: 'text', required: true },
      { id: 'q8', section: 'Code', question: 'Share a key code snippet that illustrates your approach.', hint: 'Pick something that shows your thinking, not just complexity', input_type: 'code', required: false },
    ],
    output_structure: [
      { id: 'overview', title: 'Project Overview', order: 1 },
      { id: 'problem', title: 'The Problem', order: 2 },
      { id: 'solution', title: 'The Solution', order: 3 },
      { id: 'architecture', title: 'Architecture & Design', order: 4 },
      { id: 'tech-stack', title: 'Tech Stack', order: 5 },
      { id: 'challenges', title: 'Challenges & How I Solved Them', order: 6 },
      { id: 'results', title: 'Results & Impact', order: 7 },
    ],
  },
  {
    id: 'dev-api-docs',
    career_track: 'software_dev',
    name: 'API Documentation',
    description: 'Clear, structured API reference documentation for any REST or GraphQL API.',
    question_schema: [
      { id: 'q1', section: 'Overview', question: 'What is this API and what does it do?', hint: 'Purpose, what systems or developers it serves', input_type: 'text', required: true },
      { id: 'q2', section: 'Auth', question: 'How does authentication work?', hint: 'API keys, OAuth, JWT — include header examples', input_type: 'text', required: true },
      { id: 'q3', section: 'Base URL', question: 'What is the base URL and versioning scheme?', hint: 'e.g. https://api.example.com/v1', input_type: 'text', required: true },
      { id: 'q4', section: 'Endpoints', question: 'List each endpoint with method, path, description, request body and response.', hint: 'Go through each endpoint systematically', input_type: 'text', required: true },
      { id: 'q5', section: 'Endpoints', question: 'Paste example request and response JSON for key endpoints.', hint: 'Real examples are the most useful part of API docs', input_type: 'code', required: true },
      { id: 'q6', section: 'Errors', question: 'What error codes and messages does your API return?', hint: 'e.g. 400 Bad Request, 401 Unauthorized, 404 Not Found', input_type: 'text', required: true },
      { id: 'q7', section: 'Rate Limits', question: 'Are there rate limits? How are they communicated?', hint: 'Requests per minute/hour, headers returned, backoff guidance', input_type: 'text', required: false },
    ],
    output_structure: [
      { id: 'overview', title: 'API Overview', order: 1 },
      { id: 'auth', title: 'Authentication', order: 2 },
      { id: 'endpoints', title: 'Endpoints Reference', order: 3 },
      { id: 'errors', title: 'Error Handling', order: 4 },
      { id: 'rate-limits', title: 'Rate Limits', order: 5 },
    ],
  },

  // ── DEVOPS / CLOUD ──────────────────────────────────────────────
  {
    id: 'devops-cicd',
    career_track: 'devops_cloud',
    name: 'CI/CD Pipeline Documentation',
    description: 'Document a continuous integration and deployment pipeline end to end.',
    question_schema: [
      { id: 'q1', section: 'Overview', question: 'What project or service does this pipeline serve?', hint: 'Name, tech stack, deployment target', input_type: 'text', required: true },
      { id: 'q2', section: 'Tools', question: 'What CI/CD tools and platforms are used?', hint: 'e.g. GitHub Actions, Jenkins, CircleCI, ArgoCD — one per line', input_type: 'list', required: true },
      { id: 'q3', section: 'Stages', question: 'Walk through each stage of the pipeline.', hint: 'Trigger → Build → Test → Security scan → Deploy → Notify', input_type: 'text', required: true },
      { id: 'q4', section: 'Config', question: 'Paste your pipeline config file (YAML or equivalent).', hint: '.github/workflows/ci.yml, Jenkinsfile, .gitlab-ci.yml, etc.', input_type: 'code', required: false },
      { id: 'q5', section: 'Environments', question: 'What environments does this pipeline deploy to?', hint: 'e.g. dev → staging → production, with promotion logic', input_type: 'text', required: true },
      { id: 'q6', section: 'Secrets', question: 'How are secrets and environment variables managed?', hint: 'GitHub Secrets, HashiCorp Vault, AWS SSM, etc.', input_type: 'text', required: true },
      { id: 'q7', section: 'Monitoring', question: 'How is pipeline health monitored and failures alerted?', hint: 'Slack notifications, PagerDuty, email, dashboards', input_type: 'text', required: false },
    ],
    output_structure: [
      { id: 'overview', title: 'Pipeline Overview', order: 1 },
      { id: 'stages', title: 'Pipeline Stages', order: 2 },
      { id: 'environments', title: 'Environments & Promotion', order: 3 },
      { id: 'config', title: 'Configuration Reference', order: 4 },
      { id: 'secrets', title: 'Secrets Management', order: 5 },
      { id: 'monitoring', title: 'Monitoring & Alerting', order: 6 },
    ],
  },
  {
    id: 'devops-iac',
    career_track: 'devops_cloud',
    name: 'IaC Project Write-up',
    description: 'Document an Infrastructure-as-Code project (Terraform, Pulumi, CDK, etc.).',
    question_schema: [
      { id: 'q1', section: 'Overview', question: 'What infrastructure does this IaC project provision?', hint: 'Cloud provider, services, purpose', input_type: 'text', required: true },
      { id: 'q2', section: 'Tools', question: 'What IaC tool and version are used?', hint: 'Terraform 1.x, Pulumi, AWS CDK, Ansible, etc.', input_type: 'text', required: true },
      { id: 'q3', section: 'Architecture', question: 'Describe the architecture that is provisioned.', hint: 'VPCs, subnets, compute, databases, load balancers, IAM', input_type: 'text', required: true },
      { id: 'q4', section: 'Code', question: 'Paste a representative snippet of your IaC code.', hint: 'A module, resource block, or stack definition', input_type: 'code', required: false },
      { id: 'q5', section: 'Deployment', question: 'How is this infrastructure deployed and updated?', hint: 'terraform apply workflow, state management, remote backend', input_type: 'text', required: true },
      { id: 'q6', section: 'Design Decisions', question: 'What key design decisions did you make and why?', hint: 'Modularity, naming conventions, security choices, cost trade-offs', input_type: 'text', required: true },
    ],
    output_structure: [
      { id: 'overview', title: 'Project Overview', order: 1 },
      { id: 'architecture', title: 'Infrastructure Architecture', order: 2 },
      { id: 'tools', title: 'Tools & Technologies', order: 3 },
      { id: 'deployment', title: 'Deployment Process', order: 4 },
      { id: 'design', title: 'Design Decisions', order: 5 },
    ],
  },
  {
    id: 'devops-incident',
    career_track: 'devops_cloud',
    name: 'Incident / Postmortem Report',
    description: 'A blameless postmortem documenting root cause, timeline and action items.',
    question_schema: [
      { id: 'q1', section: 'Incident', question: 'Briefly describe the incident. What broke and what was the user impact?', hint: 'Service down, data unavailable, performance degraded — be specific', input_type: 'text', required: true },
      { id: 'q2', section: 'Timeline', question: 'Provide a timeline of the incident from detection to resolution.', hint: 'HH:MM — Event. e.g. 14:03 — Alert fired. 14:07 — Engineer paged.', input_type: 'text', required: true },
      { id: 'q3', section: 'Root Cause', question: 'What was the root cause of the incident?', hint: 'Be specific and blameless — focus on systems, not people', input_type: 'text', required: true },
      { id: 'q4', section: 'Resolution', question: 'How was the incident resolved?', hint: 'Immediate fix, rollback, config change, hotfix deployed', input_type: 'text', required: true },
      { id: 'q5', section: 'Impact', question: 'What was the total impact? Duration, affected users, data loss?', hint: 'Quantify where possible — X users affected for Y minutes', input_type: 'text', required: true },
      { id: 'q6', section: 'Action Items', question: 'What action items will prevent this happening again?', hint: 'Specific, assignable tasks with owners and deadlines', input_type: 'list', required: true },
    ],
    output_structure: [
      { id: 'summary', title: 'Incident Summary', order: 1 },
      { id: 'impact', title: 'Impact Assessment', order: 2 },
      { id: 'timeline', title: 'Timeline', order: 3 },
      { id: 'root-cause', title: 'Root Cause Analysis', order: 4 },
      { id: 'resolution', title: 'Resolution', order: 5 },
      { id: 'action-items', title: 'Action Items', order: 6 },
    ],
  },
  {
    id: 'devops-cloud-arch',
    career_track: 'devops_cloud',
    name: 'Cloud Architecture Design Doc',
    description: 'Document a cloud architecture with design goals, components and trade-offs.',
    question_schema: [
      { id: 'q1', section: 'Goals', question: 'What are the design goals and requirements?', hint: 'Availability target, performance SLA, compliance, cost budget', input_type: 'text', required: true },
      { id: 'q2', section: 'Architecture', question: 'Describe the overall architecture and its components.', hint: 'Regions, AZs, compute, storage, networking, CDN', input_type: 'text', required: true },
      { id: 'q3', section: 'Services', question: 'List the cloud services used and justify each choice.', hint: 'e.g. Why S3 over EFS, why RDS over DynamoDB for this use case', input_type: 'text', required: true },
      { id: 'q4', section: 'Security', question: 'How is security handled at each layer?', hint: 'IAM, encryption at rest/transit, network security groups, WAF', input_type: 'text', required: true },
      { id: 'q5', section: 'Trade-offs', question: 'What trade-offs were made and why?', hint: 'Cost vs performance, simplicity vs resilience, speed vs security', input_type: 'text', required: true },
      { id: 'q6', section: 'Cost', question: 'What is the estimated monthly cost and how is it optimised?', hint: 'Reserved instances, spot, auto-scaling, right-sizing decisions', input_type: 'text', required: false },
    ],
    output_structure: [
      { id: 'goals', title: 'Design Goals & Requirements', order: 1 },
      { id: 'architecture', title: 'Architecture Overview', order: 2 },
      { id: 'services', title: 'Services & Justifications', order: 3 },
      { id: 'security', title: 'Security Design', order: 4 },
      { id: 'tradeoffs', title: 'Trade-offs & Decisions', order: 5 },
      { id: 'cost', title: 'Cost Analysis', order: 6 },
    ],
  },
]

export const DESIGN_THEMES: DesignTheme[] = [
  { id: 'cyber-dark-terminal', career_track: 'cybersecurity', name: 'Dark Terminal', description: 'Black bg · monospace accents · red severity badges', preview_colors: ['#0F0F14', '#FF4444', '#00FF88'] },
  { id: 'cyber-forge-dark', career_track: 'cybersecurity', name: 'Forge Dark', description: 'Navy bg · purple accents · structured findings table', preview_colors: ['#1A1A2E', '#534AB7', '#AFA9EC'] },
  { id: 'cyber-audit-light', career_track: 'cybersecurity', name: 'Audit Light', description: 'White bg · structured layout · client-deliverable ready', preview_colors: ['#FFFFFF', '#1A1A2E', '#534AB7'] },
  { id: 'dev-github-dark', career_track: 'software_dev', name: 'GitHub Dark', description: 'Dark charcoal · green accents · code-block friendly', preview_colors: ['#0D1117', '#238636', '#58A6FF'] },
  { id: 'dev-clean-slate', career_track: 'software_dev', name: 'Clean Slate', description: 'Minimal white · teal accents · great for READMEs', preview_colors: ['#FFFFFF', '#1D9E75', '#0F6E56'] },
  { id: 'dev-case-study', career_track: 'software_dev', name: 'Case Study', description: 'Editorial layout · strong headings · metrics-first', preview_colors: ['#FFFFFF', '#1A1A2E', '#1D9E75'] },
  { id: 'devops-cloud-dark', career_track: 'devops_cloud', name: 'Cloud Dark', description: 'Deep blue · sky accents · pipeline diagram friendly', preview_colors: ['#0A1628', '#185FA5', '#85B7EB'] },
  { id: 'devops-blueprint', career_track: 'devops_cloud', name: 'Blueprint', description: 'Light blue · structured tables · infra doc focused', preview_colors: ['#EAF3FB', '#185FA5', '#0C447C'] },
]

export function getTemplatesByTrack(track: CareerTrack): Template[] {
  return TEMPLATES.filter(t => t.career_track === track)
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id)
}

export function getThemesByTrack(track: CareerTrack): DesignTheme[] {
  return DESIGN_THEMES.filter(t => t.career_track === track)
}
