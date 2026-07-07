"use client";

import React from "react";

export default function TacticalTerminal() {
  return (
    <section id="terminal" className="relative z-20 py-32 px-8 max-w-5xl mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="headline text-4xl mb-4">The Interface</h2>
        <p className="text-muted text-sm uppercase tracking-widest">Security Docs / AI Generated</p>
      </div>

      <div className="bg-[#0A0A0F] border-tactical terminal-glow rounded-sm overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-slate-900 px-4 py-2 border-b border-tactical flex justify-between items-center">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50 origin-center"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
          <div className="text-[10px] text-muted uppercase tracking-widest">portforge --generate-report v0.3.0</div>
          <div className="w-12"></div>
        </div>
        {/* Terminal Body */}
        <div className="p-6 font-mono text-xs leading-relaxed overflow-x-auto">
          <div className="flex gap-3 mb-2">
            <span className="text-accent">user@portforge:~$</span>
            <span className="text-[#C0C0C0]">portforge generate --template pentest</span>
          </div>
          <div className="text-muted mb-4">[+] Initializing AI engine...</div>
          <div className="text-muted mb-4">[+] Loading template: Pentest Report...</div>

          <div className="grid grid-cols-1 gap-1 mb-6">
            <div className="flex justify-between border-b border-slate-800 py-1">
              <span>Executive Summary</span>
              <span className="text-green">GENERATED</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 py-1">
              <span>Scope & Objectives</span>
              <span className="text-green">GENERATED</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 py-1">
              <span>Vulnerability Findings</span>
              <span className="text-green">GENERATED</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 py-1">
              <span>CVSS Scoring</span>
              <span className="text-red">9.8 CRITICAL</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 py-1">
              <span>Remediation Recommendations</span>
              <span className="text-green">GENERATED</span>
            </div>
          </div>

          <div className="text-muted mb-2">[*] Rendering Markdown output...</div>
          <div className="text-[#C0C0C0] mb-4 pl-4">
            &gt; Report length: 2,847 words<br />
            &gt; Provider: Claude 3.5 Sonnet<br />
            &gt; Export: ./pentest-report.md
          </div>

          <div className="flex gap-3">
            <span className="text-accent">user@portforge:~$</span>
            <span className="cursor-blink"></span>
          </div>
        </div>
      </div>
    </section>
  );
}
