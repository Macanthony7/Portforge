"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import FeatureGrid from "@/components/landing/FeatureGrid";
import TacticalTerminal from "@/components/landing/TacticalTerminal";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 grid-overlay z-0 pointer-events-none"></div>
      <div className="fixed inset-0 scanline z-10 pointer-events-none"></div>

      <Navbar />

      <main className="relative z-20">
        <Hero />
        <FeatureGrid />
        <TacticalTerminal />

        {/* Footer */}
        <footer className="relative z-20 py-20 px-8 border-t border-tactical max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-5 h-5 bg-purple-600 rotate-45 border border-white"></div>
                <span className="headline text-lg tracking-tighter">Portforge</span>
              </div>
              <p className="text-muted text-xs max-w-xs leading-relaxed">
                AI-powered, professional security documentation — right from your browser. Pentest reports, CTF write-ups, and lab walkthroughs.
              </p>
            </div>
            <div>
              <h4 className="headline text-xs mb-6 text-silver">Product</h4>
              <ul className="text-muted text-xs space-y-4 uppercase tracking-widest">
                <li><a href="/dashboard" className="hover:text-accent transition-colors">Dashboard</a></li>
                <li><a href="#features" className="hover:text-accent transition-colors">Features</a></li>
                <li><a href="#terminal" className="hover:text-accent transition-colors">Templates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="headline text-xs mb-6 text-silver">Resources</h4>
              <ul className="text-muted text-xs space-y-4 uppercase tracking-widest">
                <li><a href="#" className="hover:text-accent transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">LLM Providers</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">CVSS Guide</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-slate-800 flex justify-between items-center text-[10px] text-muted uppercase tracking-widest">
            <div>© 2024 Portforge Cyber. All rights reserved.</div>
            <div className="flex gap-4">
              <span>MIT License</span>
              <span>Local-First</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
