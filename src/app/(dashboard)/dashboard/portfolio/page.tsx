'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TRACK_LABELS, TRACK_ICONS, TRACK_COLORS, formatDate, truncate } from '@/lib/utils'
import type { Project, CareerTrack } from '@/types'

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profile }, { data: projectData }] = await Promise.all([
        supabase.from('profiles').select('username, full_name').eq('id', user.id).single(),
        supabase.from('projects').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
      ])

      setUsername(profile?.username || '')
      setProjects((projectData || []) as Project[])
      setLoading(false)
    }
    load()
  }, [])

  async function togglePublic(projectId: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('projects').update({ public: !current }).eq('id', projectId)
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, public: !current } : p))
  }

  function copyPortfolioLink() {
    if (!username) return
    const url = `${window.location.origin}/u/${username}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const portfolioUrl = username ? `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${username}` : null
  const publicProjects = projects.filter(p => p.public)
  const completeProjects = projects.filter(p => p.status === 'complete')

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Portfolio</h1>
          <p className="text-sm text-white/40">Manage your public portfolio page</p>
        </div>
        {portfolioUrl ? (
          <div className="flex items-center gap-2">
            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="forge-btn-secondary text-xs py-2">
              View portfolio ↗
            </a>
            <button onClick={copyPortfolioLink} className="forge-btn-primary text-xs py-2">
              {copied ? '✓ Copied!' : 'Copy link'}
            </button>
          </div>
        ) : (
          <Link href="/dashboard/settings" className="forge-btn-secondary text-xs py-2">
            Set username to get portfolio link →
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total projects', value: projects.length },
          { label: 'Complete & ready', value: completeProjects.length },
          { label: 'Public on portfolio', value: publicProjects.length },
        ].map(s => (
          <div key={s.label} className="forge-card p-5">
            <p className="text-3xl font-semibold mb-1">{s.value}</p>
            <p className="text-xs text-white/40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Portfolio URL */}
      {portfolioUrl && (
        <div className="forge-card p-4 mb-8 flex items-center gap-4">
          <div className="w-8 h-8 bg-forge-purple/20 border border-forge-purple/30 rounded-lg flex items-center justify-center text-sm shrink-0">⬡</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40 mb-0.5">Your portfolio URL</p>
            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm text-forge-lilac hover:underline truncate block">{portfolioUrl}</a>
          </div>
          <button onClick={copyPortfolioLink} className="forge-btn-secondary text-xs py-1.5 shrink-0">
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
      )}

      {/* Projects list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-forge-purple/30 border-t-forge-purple rounded-full animate-spin"/>
        </div>
      ) : completeProjects.length === 0 ? (
        <div className="forge-card p-12 text-center">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="font-medium mb-2">No complete projects yet</h2>
          <p className="text-sm text-white/40 mb-6">Complete a project to add it to your portfolio.</p>
          <Link href="/dashboard/new" className="forge-btn-primary inline-flex items-center gap-2">
            Create a project →
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="forge-label mb-4">Your projects</h2>
          <div className="space-y-3">
            {projects.map(project => {
              const track = project.career_track as CareerTrack
              const colors = TRACK_COLORS[track]
              const isComplete = project.status === 'complete'
              return (
                <div key={project.id} className="forge-card p-5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                        {TRACK_ICONS[track]} {TRACK_LABELS[track]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isComplete ? 'bg-emerald-950/30 text-emerald-400' : 'bg-white/5 text-white/30'
                      }`}>{project.status}</span>
                    </div>
                    <h3 className="font-medium text-sm">{truncate(project.title, 60)}</h3>
                    <p className="text-xs text-white/30 mt-0.5">{formatDate(project.updated_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isComplete && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30">{project.public ? 'Public' : 'Private'}</span>
                        <button onClick={() => togglePublic(project.id, project.public ?? false)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${project.public ? 'bg-forge-purple' : 'bg-white/10'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${project.public ? 'translate-x-4' : 'translate-x-0.5'}`}/>
                        </button>
                      </div>
                    )}
                    <Link href={`/dashboard/project/${project.id}`} className="forge-btn-secondary text-xs py-1.5">
                      Open
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-white/20 mt-4 text-center">Toggle projects on/off to control what appears on your public portfolio page.</p>
        </div>
      )}
    </div>
  )
}
