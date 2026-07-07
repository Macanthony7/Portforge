'use client'
import { useState } from 'react'
import { QUICK_PRESETS } from '@/lib/cvss/calculator'
import { CVSSCalculator } from './cvss-calculator'
import type { CVSSResult } from '@/lib/cvss/calculator'

interface CVSSQuickSelectProps {
  onSelect?: (result: CVSSResult) => void
  className?: string
}

export function CVSSQuickSelect({ onSelect, className = '' }: CVSSQuickSelectProps) {
  const [showCalculator, setShowCalculator] = useState(false)

  const severities = [
    { label: 'Critical', className: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30', desc: 'Score 9.0–10.0' },
    { label: 'High', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30', desc: 'Score 7.0–8.9' },
    { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30', desc: 'Score 4.0–6.9' },
    { label: 'Low', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30', desc: 'Score 0.1–3.9' },
    { label: 'Custom', className: 'bg-forge-purple/20 text-forge-lilac border-forge-purple/30 hover:bg-forge-purple/30', desc: 'Open calculator' },
  ]

  const handleQuickSelect = (label: string) => {
    if (label === 'Custom') {
      setShowCalculator(true)
      return
    }
    const preset = QUICK_PRESETS.find(p => p.name === label)
    if (preset && onSelect) {
      const result = { ...preset, color: '', colorClass: '' } as unknown as CVSSResult
      // will be calculated properly by the calculator
      onSelect(result)
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {severities.map(s => (
          <button key={s.label} onClick={() => handleQuickSelect(s.label)}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${s.className}`}>
            {s.label}
          </button>
        ))}
      </div>
      {showCalculator && (
        <div className="mt-4">
          <CVSSCalculator
            onChange={result => { onSelect?.(result); setShowCalculator(false) }}
            onClose={() => setShowCalculator(false)}
          />
        </div>
      )}
    </div>
  )
}
