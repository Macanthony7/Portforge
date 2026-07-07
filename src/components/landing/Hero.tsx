"use client";

import React from "react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative z-20 min-h-screen flex flex-col justify-center px-8 max-w-7xl mx-auto w-full pt-20">
      {/* Coordinate Markers */}
      <div className="absolute top-1/4 left-10 text-[10px] text-muted pointer-events-none">X: 102.4 // Y: 44.1</div>
      <div className="absolute top-1/2 right-10 text-[10px] text-muted pointer-events-none">X: 891.2 // Y: 22.9</div>
      <div className="absolute bottom-1/4 left-20 text-[10px] text-muted pointer-events-none">X: 112.0 // Y: 77.4</div>

      <div className="relative">
        <div className="absolute -top-12 -left-12 w-24 h-24 border-t-2 border-l-2 border-purple-500 opacity-30"></div>

        <h1 className="headline text-6xl md:text-9xl leading-[0.85] mb-8 max-w-4xl">
          Security Docs <br />
          <span className="text-transparent" style={{ WebkitTextStroke: "1px var(--color-text-primary)" }}>AI-Powered.</span> <br />
          <span className="text-accent">Professional.</span>
        </h1>

        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <p className="text-muted max-w-md text-sm leading-relaxed border-l-2 border-accent pl-6">
            Create professional penetration test reports, CTF write-ups, and lab walkthroughs
            with multi-model LLM support. Privacy-first. Local-first. Right from your browser.
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard" className="btn-purple px-8 py-4 uppercase tracking-widest text-sm">
              Start Documenting
            </Link>
            <a href="#features" className="border-tactical px-8 py-4 uppercase tracking-widest text-sm hover:bg-slate-800 transition-colors">
              Explore Features
            </a>
          </div>
        </div>
      </div>

      {/* Hero SVG Detail */}
      <div className="absolute right-0 bottom-0 w-1/3 h-1/2 opacity-20 pointer-events-none hidden lg:block">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 200 L100 100 L200 200" fill="none" stroke="var(--color-accent)" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="80" fill="none" stroke="var(--color-text-secondary)" strokeWidth="0.2" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="var(--color-text-primary)" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="200" y2="100" stroke="var(--color-text-secondary)" strokeWidth="0.1" />
          <line x1="100" y1="0" x2="100" y2="200" stroke="var(--color-text-secondary)" strokeWidth="0.1" />
        </svg>
      </div>
    </section>
  );
}
