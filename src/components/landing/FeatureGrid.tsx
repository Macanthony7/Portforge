"use client";

import React from "react";
import { Activity, Zap, EyeOff, Cpu } from "lucide-react";

const features = [
  {
    id: "01 // PRIVACY",
    title: "Privacy-First",
    desc: "All data stored locally via IndexedDB — no server required. API keys stay in your browser, never touch our servers.",
    icon: Activity,
    span: "md:col-span-7",
    bg: "bg-[#0A0A0F]",
    tags: ["IndexedDB", "Dexie.js", "Offline"],
  },
  {
    id: "02 // LLM",
    title: "Multi-Model AI Support",
    desc: "Adapters for Anthropic, OpenAI, Google, NVIDIA NIM, Groq, Moonshot, Z-ai (GLM), and Minimax. Bring your own API key.",
    icon: Zap,
    span: "md:col-span-5",
    bg: "bg-[#050507]",
    tags: ["8 Providers", "BYO Key"],
  },
  {
    id: "03 // CVSS",
    title: "CVSS v3.1 Calculator",
    desc: "Built-in CVSS v3.1 scoring compliant with FIRST.org. Severity badges, color-coded risk indicators, and quick presets.",
    icon: EyeOff,
    span: "md:col-span-5",
    bg: "bg-[#050507]",
    tags: ["FIRST.org", "Scoring"],
  },
  {
    id: "04 // TEMPLATES",
    title: "Security Templates",
    desc: "Ready-made templates for Pentest Reports, CTF Write-ups, and Lab Walkthroughs. Structured, professional output every time.",
    icon: Cpu,
    span: "md:col-span-7",
    bg: "bg-[#0A0A0F]",
    tags: ["Pentest", "CTF", "Labs"],
  },
  {
    id: "05 // EXPORT",
    title: "Markdown & PDF Export",
    desc: "Export your projects to Markdown for version control, or generate PDFs for client deliverables. Export history tracking per project.",
    icon: Activity,
    span: "md:col-span-7",
    bg: "bg-[#0A0A0F]",
    tags: ["Markdown", "PDF", "History"],
  },
  {
    id: "06 // LOCAL",
    title: "Local-First Architecture",
    desc: "Run entirely in the browser with no backend required. Optional Supabase integration for cloud-backed workflows when you need it.",
    icon: Zap,
    span: "md:col-span-5",
    bg: "bg-[#050507]",
    tags: ["No-Backend", "Optional Cloud"],
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="relative z-20 py-32 px-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end mb-20">
        <h2 className="headline text-4xl md:text-6xl leading-none">
          Platform<br />
          <span className="text-muted">Capabilities</span>
        </h2>
        <div className="text-xs text-muted text-right uppercase tracking-widest hidden md:block">
          Ref: PF-2024-X1<br />
          Sector: Security Documentation
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.id}
              className={`${f.span} border-tactical p-8 ${f.bg} relative overflow-hidden group hover:border-accent transition-colors`}
            >
              <div className="absolute top-0 right-0 p-2 text-[10px] text-muted group-hover:text-accent transition-colors">
                {f.id}
              </div>
              <Icon className="text-accent mb-6 w-8 h-8" />
              <h3 className="headline text-2xl mb-4">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed max-w-sm">
                {f.desc}
              </p>
              {f.tags.length > 0 && (
                <div className="mt-8 flex gap-2">
                  {f.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-1 border border-muted text-muted uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
