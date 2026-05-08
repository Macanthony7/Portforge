import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { TRACK_LABELS, TRACK_ICONS, TRACK_COLORS, formatDate, truncate } from '@/lib/utils'
import { getTemplateById } from '@/lib/templates'
import type { CareerTrack, Project } from '@/types'

interface Props { params: Promise<{ username: string }> }

export default async function PublicPortfolioPage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, username, bio, career_track, created_at, portfolio_public')
    .eq('username', username)
    .single()

  if (!profile || !profile.portfolio_public) notFound()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', profile.id)
    .eq('status', 'complete')
    .eq('public', true)
    .order('updated_at', { ascending: false })

  const projectList = (projects || []) as Project[]

  return (
    <div className="min-h-screen bg-forge-black">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-forge-purple rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="7" rx="1" fill="#EEEDFE"/>
              <rect x="8" y="1" width="5" height="4" rx="1" fill="#AFA9EC"/>
              <rect x="1" y="10" width="5" height="3" rx="1" fill="#AFA9EC"/>
              <rect x="8" y="7" width="5" height="6" rx="1" fill="#EEEDFE"/>
            </svg>
          </div>
          <span className="font-semibold tracking-tight text-sm">Portforge</span>
        </Link>
        <Link href="/signup" className="forge-btn-primary text-xs py-2">Create your portfolio →</Link>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-12">
        {/* Profile header */}
        <div className="flex items-start gap-6 mb-12">
          <div className="w-16 h-16 rounded-2xl bg-forge-purple/20 border border-forge-purple/30 flex items-center justify-center text-2xl font-semibold text-forge-lilac shrink-0">
            {(profile.full_name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-semibold mb-2">{profile.full_name}</h1>
            {profile.bio && <p className="text-sm text-white/50 mb-3 max-w-lg">{profile.bio}</p>}
            <div className="flex items-center gap-3 flex-wrap">
              {profile.career_track && (
                <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border font-medium
                  ${TRACK_COLORS[profile.career_track as CareerTrack].bg}
                  ${TRACK_COLORS[profile.career_track as CareerTrack].text}
                  ${TRACK_COLORS[profile.career_track as CareerTrack].border}`}>
                  {TRACK_ICONS[profile.career_track as CareerTrack]}
                  {TRACK_LABELS[profile.career_track as CareerTrack]}
                </span>
              )}
              <span className="text-xs text-white/30">
                {projectList.length} public project{projectList.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Projects */}
        {projectList.length === 0 ? (
          <div className="forge-card p-12 text-center">
            <p className="text-white/30 text-sm">No public projects yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {projectList.map(project => {
              const track = project.career_track as CareerTrack
              const template = getTemplateById(project.template_id)
              const content = project.content as Record<string, unknown>
              const doc = (content?.edited as string) || (content?.generated as string) || ''
              const preview = doc.slice(0, 1200)

              return (
                <div key={project.id} className="forge-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border
                          ${TRACK_COLORS[track].bg} ${TRACK_COLORS[track].text} ${TRACK_COLORS[track].border}`}>
                          {TRACK_ICONS[track]} {TRACK_LABELS[track]}
                        </span>
                        {template && <span className="text-xs text-white/30">{template.name}</span>}
                      </div>
                      <h2 className="text-lg font-medium">{project.title}</h2>
                      <p className="text-xs text-white/30 mt-1">{formatDate(project.updated_at)}</p>
                    </div>
                  </div>
                  {preview && (
                    <div className="border-t border-white/5 pt-5 mt-2">
                      <MarkdownRenderer content={preview}/>
                      {doc.length > 1200 && (
                        <p className="text-xs text-white/20 mt-4 italic text-center">— document continues —</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 px-8 py-5 mt-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-xs text-white/20">Powered by Portforge</span>
          <Link href="/signup" className="text-xs text-forge-lilac hover:text-white transition-colors">Create your portfolio →</Link>
        </div>
      </footer>
    </div>
  )
}
