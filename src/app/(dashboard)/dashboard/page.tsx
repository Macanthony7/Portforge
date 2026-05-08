import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TRACK_LABELS, TRACK_ICONS, TRACK_COLORS, formatDate, truncate } from '@/lib/utils'
import { getCompanyTemplate } from '@/lib/company/templates'
import type { CareerTrack, Project } from '@/types'
import type { CompanyDocType } from '@/lib/company/templates'

const COMPANY_DOC_ICONS: Record<CompanyDocType, string> = {
  user_guide: '📖', api_docs: '⚡', whitepaper: '📜',
  audit_report: '🔍', full_suite: '📦',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const [{ data: portfolioProjects }, { data: companyProjects }] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('company_projects').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
  ])

  const portfolio = (portfolioProjects || []) as Project[]
  const company = (companyProjects || []) as Array<{
    id: string; name: string; doc_type: CompanyDocType; status: string;
    updated_at: string; pr_sync_enabled: boolean; pr_sync_status: string
  }>
  const firstName = profile?.full_name?.split(' ')[0] || ''

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold mb-1">
            {firstName ? `Good to see you, ${firstName}.` : 'Your workspace'}
          </h1>
          <p className="text-sm text-white/40">Portfolio projects & company documentation</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/company/new" className="forge-btn-secondary flex items-center gap-2 text-sm">
            📦 New company docs
          </Link>
          <Link href="/dashboard/new" className="forge-btn-primary flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New portfolio project
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Portfolio projects', value: portfolio.length },
          { label: 'Company docs', value: company.length },
          { label: 'Complete', value: portfolio.filter(p => p.status === 'complete').length + company.filter(p => p.status === 'complete').length },
          { label: 'PR sync active', value: company.filter(p => p.pr_sync_enabled).length },
        ].map(stat => (
          <div key={stat.label} className="forge-card p-5">
            <p className="text-3xl font-semibold mb-1">{stat.value}</p>
            <p className="text-xs text-white/40">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Company docs section */}
      {company.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="forge-label">Company documentation</h2>
            <Link href="/dashboard/company/new" className="text-xs text-forge-lilac hover:text-white transition-colors">+ New</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {company.map(proj => {
              const tmpl = getCompanyTemplate(proj.doc_type)
              return (
                <Link key={proj.id} href={`/dashboard/company/${proj.id}`}
                  className="forge-card p-5 hover:border-white/10 transition-all group block">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{COMPANY_DOC_ICONS[proj.doc_type]}</span>
                      <span className="text-xs text-white/40">{tmpl?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {proj.pr_sync_enabled && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          proj.pr_sync_status === 'pending_review'
                            ? 'bg-amber-950/30 text-amber-400 border-amber-900/40'
                            : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40'
                        }`}>
                          {proj.pr_sync_status === 'pending_review' ? '⚠ review needed' : '⬡ PR sync'}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        proj.status === 'complete' ? 'bg-emerald-950/30 text-emerald-400' : 'bg-white/5 text-white/30'
                      }`}>{proj.status}</span>
                    </div>
                  </div>
                  <h3 className="font-medium group-hover:text-forge-lilac transition-colors">{truncate(proj.name, 50)}</h3>
                  <p className="text-xs text-white/30 mt-1">{formatDate(proj.updated_at)}</p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Portfolio projects section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="forge-label">Portfolio projects</h2>
          <Link href="/dashboard/new" className="text-xs text-forge-lilac hover:text-white transition-colors">+ New</Link>
        </div>

        {portfolio.length === 0 ? (
          <div className="forge-card p-12 text-center">
            <div className="text-4xl mb-4">⬡</div>
            <h2 className="font-medium mb-2">No portfolio projects yet</h2>
            <p className="text-sm text-white/40 mb-6">Document your CTF write-ups, case studies, CI/CD pipelines and more.</p>
            <Link href="/dashboard/new" className="forge-btn-primary inline-flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create first project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolio.map(project => {
              const track = project.career_track as CareerTrack
              const colors = TRACK_COLORS[track]
              return (
                <Link key={project.id} href={`/dashboard/project/${project.id}`}
                  className="forge-card p-5 hover:border-white/10 transition-all group block">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${colors.bg} ${colors.text} ${colors.border}`}>
                      {TRACK_ICONS[track]} {TRACK_LABELS[track]}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      project.status === 'complete' ? 'bg-emerald-950/30 text-emerald-400' : 'bg-white/5 text-white/30'
                    }`}>{project.status}</span>
                  </div>
                  <h3 className="font-medium mb-1 group-hover:text-forge-lilac transition-colors">{truncate(project.title, 50)}</h3>
                  <p className="text-xs text-white/30">{formatDate(project.updated_at)}</p>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Empty state when nothing at all */}
      {portfolio.length === 0 && company.length === 0 && (
        <div className="mt-8 forge-card p-6 border-forge-purple/20 bg-forge-purple/5">
          <h3 className="font-medium mb-2">What would you like to do?</h3>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Link href="/dashboard/new" className="forge-card p-4 hover:border-forge-purple/30 transition-all">
              <div className="text-lg mb-2">🎯</div>
              <h4 className="text-sm font-medium mb-1">Build my portfolio</h4>
              <p className="text-xs text-white/40">CTF write-ups, case studies, pentest reports, CI/CD docs</p>
            </Link>
            <Link href="/dashboard/company/new" className="forge-card p-4 hover:border-forge-purple/30 transition-all">
              <div className="text-lg mb-2">🏢</div>
              <h4 className="text-sm font-medium mb-1">Document my project</h4>
              <p className="text-xs text-white/40">User guides, API docs, whitepapers, audit reports</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
