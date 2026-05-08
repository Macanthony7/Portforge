import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface NmapPort { port: number; protocol: string; state: string; service: string; version: string }
interface NmapHost { ip: string; hostname: string; status: string; os: string; ports: NmapPort[] }

function parseNmap(xml: string): { hosts: NmapHost[]; scanArgs: string; summary: string } {
  const hosts: NmapHost[] = []
  const scanArgs = xml.match(/args="([^"]*)"/)?.[1] || ''
  const summary = xml.match(/<finished[^>]*summary="([^"]*)"/)?.[1] || ''

  for (const block of xml.match(/<host[\s\S]*?<\/host>/g) || []) {
    const ip = block.match(/<address addr="([^"]*)" addrtype="ipv4"/)?.[1] || ''
    const hostname = block.match(/<hostname name="([^"]*)"/)?.[1] || ''
    const status = block.match(/<status state="([^"]*)"/)?.[1] || 'unknown'
    const os = block.match(/<osmatch name="([^"]*)"/)?.[1] || ''
    const ports: NmapPort[] = []

    for (const pb of block.match(/<port[\s\S]*?<\/port>/g) || []) {
      const portNum = pb.match(/portid="(\d+)"/)?.[1]
      if (!portNum) continue
      ports.push({
        port: parseInt(portNum),
        protocol: pb.match(/protocol="([^"]*)"/)?.[1] || 'tcp',
        state: pb.match(/<state state="([^"]*)"/)?.[1] || 'unknown',
        service: pb.match(/<service name="([^"]*)"/)?.[1] || '',
        version: [pb.match(/product="([^"]*)"/)?.[1], pb.match(/version="([^"]*)"/)?.[1]].filter(Boolean).join(' '),
      })
    }

    if (ip) hosts.push({ ip, hostname, status, os, ports })
  }

  return { hosts, scanArgs, summary }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const xml = await file.text()
    if (!xml.includes('<nmaprun')) return NextResponse.json({ error: 'Not a valid Nmap XML file' }, { status: 400 })

    const { hosts, scanArgs, summary } = parseNmap(xml)
    const live = hosts.filter(h => h.status === 'up')

    const scopeText = live.map(h => `${h.ip}${h.hostname ? ` (${h.hostname})` : ''}${h.os ? ` — ${h.os}` : ''}`).join('\n')
    const portsText = live.map(h => {
      const open = h.ports.filter(p => p.state === 'open')
      if (!open.length) return null
      return `${h.ip}:\n${open.map(p => `  ${p.port}/${p.protocol} — ${p.service}${p.version ? ` (${p.version})` : ''}`).join('\n')}`
    }).filter(Boolean).join('\n\n')

    const autoAnswers: Record<string, string> = {
      q1: `${live.map(h => h.ip).join(', ')} — ${live.length} live host${live.length !== 1 ? 's' : ''} discovered`,
      q2: 'Network penetration test — Nmap discovery scan',
      nmap_scope: scopeText,
      nmap_ports: portsText,
      nmap_args: scanArgs,
      nmap_summary: summary,
    }

    return NextResponse.json({ hosts: live, totalHosts: live.length, scanArgs, summary, autoAnswers })
  } catch (err) {
    console.error('Nmap parse error:', err)
    return NextResponse.json({ error: 'Failed to parse Nmap XML' }, { status: 500 })
  }
}
