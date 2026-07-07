"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-6 left-0 right-0 z-50 px-4">
        <div className="nav-glass flex justify-between items-center px-8 py-4 max-w-7xl mx-auto w-full rounded-none border border-white/10 bg-slate-900/70">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-accent rotate-45 border border-white shadow-[0_0_10px_rgba(155,92,246,0.5)]"></div>
                <span className="headline text-xl tracking-tighter text-white">Portforge</span>
            </div>
            <div className="hidden md:flex gap-8 text-xs uppercase tracking-widest text-muted">
                <Link href="#features" className="hover:text-accent transition-colors hover:text-silver">Features</Link>
                <Link href="#terminal" className="hover:text-accent transition-colors hover:text-silver">Templates</Link>
                <Link href="#" className="hover:text-accent transition-colors hover:text-silver">Documentation</Link>
            </div>
            <div className="flex items-center gap-3">
                <Link href="/dashboard" className="btn-purple px-4 py-2 text-xs uppercase tracking-widest rounded-none">
                    Open App
                </Link>
            </div>
        </div>
    </nav>
  );
}
