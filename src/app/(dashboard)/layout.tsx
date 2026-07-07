import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-forge-black flex">
      <aside className="w-60 border-r border-white/5 flex flex-col p-4 shrink-0 bg-forge-black">
        <Link href="/" className="flex items-center gap-2 px-2 py-2 mb-6">
          <div className="w-7 h-7 bg-forge-purple rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="7" rx="1" fill="#EEEDFE"/>
              <rect x="8" y="1" width="5" height="4" rx="1" fill="#AFA9EC"/>
              <rect x="1" y="10" width="5" height="3" rx="1" fill="#AFA9EC"/>
              <rect x="8" y="7" width="5" height="6" rx="1" fill="#EEEDFE"/>
            </svg>
          </div>
          <span className="font-semibold tracking-tight text-sm text-white">Portforge</span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {[
            { href: '/dashboard', label: 'Dashboard', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h ebp9zM3 14h7v7H3z' },
            { href: '/dashboard/settings', label: 'Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon}/>
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/5 pt-4 mt-4">
          <div className="px-2 flex items-center justify-between">
            <p className="text-xs text-white/30">Local-first · Data stays on device</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
