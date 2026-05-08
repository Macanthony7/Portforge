import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { repoUrl } = await req.json()
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })

  const [, owner, repo] = match
  const cleanRepo = repo.replace(/\.git$/, '')

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Portforge/1.0',
  }
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`

  try {
    const [repoRes, langsRes, commitsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/languages`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/commits?per_page=5`, { headers }),
    ])

    if (!repoRes.ok) return NextResponse.json({ error: 'Repository not found or is private' }, { status: 404 })

    const [repoData, langsData, commitsData] = await Promise.all([
      repoRes.json(), langsRes.json(), commitsRes.json(),
    ])

    let readme = ''
    try {
      const readmeRes = await fetch(
        `https://api.github.com/repos/${owner}/${cleanRepo}/readme`,
        { headers: { ...headers, 'Accept': 'application/vnd.github.raw' } }
      )
      if (readmeRes.ok) readme = (await readmeRes.text()).slice(0, 2000)
    } catch {}

    const languages = Object.keys(langsData)
    const commits = Array.isArray(commitsData)
      ? commitsData.map((c: { commit: { message: string; author: { date: string } } }) => ({
          message: c.commit.message.split('\n')[0],
          date: c.commit.author.date,
        }))
      : []

    const extracted = {
      name: repoData.name,
      description: repoData.description || '',
      languages,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      topics: repoData.topics || [],
      url: repoData.html_url,
      commits,
      readme,
    }

    const autoAnswers: Record<string, string> = {
      q1: extracted.name,
      q2: extracted.description,
      q7: languages.join('\n'),
    }
    if (readme) autoAnswers['readme_raw'] = readme

    return NextResponse.json({ extracted, autoAnswers })
  } catch (err) {
    console.error('GitHub error:', err)
    return NextResponse.json({ error: 'Failed to fetch repository data' }, { status: 500 })
  }
}
