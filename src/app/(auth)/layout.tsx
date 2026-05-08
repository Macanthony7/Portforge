import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-forge-black flex flex-col">
      <nav className="flex items-center px-8 py-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-forge-purple rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="7" rx="1" fill="#EEEDFE"/>
              <rect x="8" y="1" width="5" height="4" rx="1" fill="#AFA9EC"/>
              <rect x="1" y="10" width="5" height="3" rx="1" fill="#AFA9EC"/>
              <rect x="8" y="7" width="5" height="6" rx="1" fill="#EEEDFE"/>
            </svg>
          </div>
          <span className="font-semibold tracking-tight">Portforge</span>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 py-12">{children}</div>
    </div>
  )
}
