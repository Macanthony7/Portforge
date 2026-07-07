'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

import { getAllProjects, deleteProject } from '@/lib/db'
import { getTemplateById } from '@/lib/templates'
import type { Project } from '@/types'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    const all = await getAllProjects()
    setProjects(all)
    setLoading(false)
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this project? This cannot be undone.')) return
    await deleteProject(id)
    await loadProjects()
  }

  const stats = [
    { label: 'Projects', value: projects.length },
    { label: 'Complete', value: projects.filter(p => p.status === 'complete').length },
    { label: 'Draft', value: projects.filter(p => p.status === 'draft').length },
    { label: 'Exported', value: projects.filter(p => p.status === 'exported').length },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-forge-purple/30 border-t-forge-purple rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold mb-1 text-white">Dashboard</h1>
          <p className="text-sm text-white/40">Your security documentation projects</p>
        </div>
        <Link href="/dashboard/new" className="forge-btn-primary flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New project
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map(stat => (
          <div key={stat.label} className="forge-card p-5">
            <p className="text-3xl font-semibold mb-1 text-white">{stat.value}</p>
            <p className="text-xs text-white/40">{stat.label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="forge-label">Projects</h2>
          <Link href="/dashboard/new" className="text-xs text-forge-lilac hover:text-white transition-colors">+ New</Link>
        </div>

        {projects.length === 0 ? (
          <div className="forge-card p-12 text-center">
            <div className="text-4xl mb-4">⬡</div>
            <h2 className="font-medium mb-2 text-white">No projects yet</h2>
            <p className="text-sm text-white/40 mb-6">Document your CTF write-ups, pentest reports, and lab walkthroughs.</p>
            <Link href="/dashboard/new" className="forge-btn-primary inline-flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create first project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="forge-card p-5 block hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-medium text-white truncate">{project.title}</h3>
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    className="text-xs text-white/30 hover:text-red-400 transition-colors shrink-0"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-white/40 mb-3">
                  {getTemplateById(project.template_id ?? '')?.name ?? 'Unknown'} · {new Date(project.created_at).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    project.status === 'complete'
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      : project.status === 'exported'
                        ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                        : 'border-white/10 text-white/40 bg-white/5'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
