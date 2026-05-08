import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-forge-black flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-forge-purple rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="7" rx="1" fill="#EEEDFE"/>
              <rect x="8" y="1" width="5" height="4" rx="1" fill="#AFA9EC"/>
              <rect x="1" y="10" width="5" height="3" rx="1" fill="#AFA9EC"/>
              <rect x="8" y="7" width="5" height="6" rx="1" fill="#EEEDFE"/>
            </svg>
          </div>
          <span className="font-semibold tracking-tight">Portforge</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">Log in</Link>
          <Link href="/signup" className="forge-btn-primary">Get started free</Link>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-forge-purple/10 border border-forge-purple/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 bg-forge-purple rounded-full animate-pulse"/>
          <span className="text-xs text-forge-lilac font-medium">Now in beta — free to start</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight max-w-4xl leading-[1.05] mb-6">
          Document your<br/><span className="text-forge-lilac">craft.</span>
        </h1>
        <p className="text-lg text-white/50 max-w-xl mb-10 leading-relaxed">
          AI-generated, recruiter-ready documentation for cybersecurity,
          software development, and DevOps careers.
        </p>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link href="/signup" className="forge-btn-primary px-6 py-3 text-base">Start for free →</Link>
          <Link href="/login" className="forge-btn-secondary px-6 py-3 text-base">Sign in</Link>
        </div>
        <div className="flex items-center gap-3 mt-16 flex-wrap justify-center">
          {[
            { icon: '🔐', label: 'Cybersecurity', color: 'border-red-900/40 text-red-400 bg-red-950/20' },
            { icon: '💻', label: 'Software Dev', color: 'border-emerald-900/40 text-emerald-400 bg-emerald-950/20' },
            { icon: '☁️', label: 'DevOps / Cloud', color: 'border-blue-900/40 text-blue-400 bg-blue-950/20' },
          ].map(t => (
            <span key={t.label} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${t.color}`}>
              {t.icon} {t.label}
            </span>
          ))}
        </div>
      </section>

      <section className="px-8 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '✦', title: 'AI writes the full doc', desc: 'Answer a few questions. Get a complete professional document — not a template to fill in.' },
            { icon: '⬡', title: 'Career-track aware', desc: 'Pentest reports look different to CI/CD docs. Every template is purpose-built for your field.' },
            { icon: '⬛', title: 'Export anywhere', desc: 'Download a PDF, share a public link, or export to markdown. Your work, your format.' },
          ].map(f => (
            <div key={f.title} className="forge-card p-6">
              <div className="text-forge-purple text-xl mb-4">{f.icon}</div>
              <h3 className="font-medium mb-2">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 px-8 py-5 flex items-center justify-between">
        <span className="text-xs text-white/20">© 2026 Portforge</span>
        <span className="text-xs text-white/20">Document your craft.</span>
      </footer>
    </main>
  )
}
