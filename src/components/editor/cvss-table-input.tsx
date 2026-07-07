'use client'
import { useState, useCallback } from 'react'
import { CVSSCalculator } from '@/components/cvss/cvss-calculator'

import type { CVSSFinding } from '@/types'
import type { CVSSResult } from '@/lib/cvss/calculator'

interface CVSSTableInputProps {
  findings: CVSSFinding[]
  onChange: (findings: CVSSFinding[]) => void
}

export function CVSSTableInput({ findings, onChange }: CVSSTableInputProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const addFinding = () => {
    const newFinding: CVSSFinding = {
      id: `finding_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      severity: 'Medium',
      cvssScore: 0,
      cvssVector: '',
      impact: '',
      remediation: '',
    }
    onChange([...findings, newFinding])
    setEditingIndex(findings.length)
  }

  const updateFinding = useCallback((index: number, updates: Partial<CVSSFinding>) => {
    onChange(findings.map((f, i) => i === index ? { ...f, ...updates } : f))
  }, [findings, onChange])

  const removeFinding = useCallback((index: number) => {
    onChange(findings.filter((_, i) => i !== index))
  }, [findings, onChange])

  const handleCVSSResult = (index: number, result: CVSSResult) => {
    updateFinding(index, { cvssScore: result.score, cvssVector: result.vector, severity: result.severity })
    setEditingIndex(null)
  }

  const severityColor: Record<string, string> = {
    Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    None: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  return (
    <div className="space-y-4">
      {findings.map((finding, index) => (
        <div key={finding.id} className="bg-ui-05 border border-ui-10 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <input
                type="text"
                value={finding.name}
                onChange={e => updateFinding(index, { name: e.target.value })}
                placeholder="Finding name (e.g. SQL Injection)"
                className="w-full bg-transparent text-sm font-medium text-white placeholder:text-white/30 focus:outline-none"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-white/30 block mb-1">CVSS Score</label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{finding.cvssScore.toFixed(1)}</span>
                    {finding.severity !== 'None' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColor[finding.severity] || ''}`}>
                        {finding.severity}
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-white/30 block mb-1">CVSS Vector</label>
                  <p className="font-mono text-xs text-white/40">{finding.cvssVector || 'Not scored yet'}</p>
                </div>
              </div>
              <textarea
                value={finding.impact}
                onChange={e => updateFinding(index, { impact: e.target.value })}
                placeholder="Describe the impact..."
                rows={2}
                className="w-full bg-ui-05 border border-ui-10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-forge-purple/60 resize-none"
              />
              <textarea
                value={finding.remediation}
                onChange={e => updateFinding(index, { remediation: e.target.value })}
                placeholder="Remediation steps..."
                rows={2}
                className="w-full bg-ui-05 border border-ui-10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-forge-purple/60 resize-none"
              />
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={() => setEditingIndex(index)}
                className="text-xs px-3 py-1.5 rounded-lg bg-ui-05 hover-bg-ui-10 border border-ui-10 transition-all">
                {finding.cvssVector ? 'Edit Score' : 'Score'}
              </button>
              <button onClick={() => removeFinding(index)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 transition-all">
                Remove
              </button>
            </div>
          </div>

          {editingIndex === index && (
            <div className="border-t border-white/10 pt-4">
              <CVSSCalculator
                initialMetrics={undefined} // Could pre-fill from existing vector if needed
                onChange={result => handleCVSSResult(index, result)}
                onClose={() => setEditingIndex(null)}
              />
            </div>
          )}
        </div>
      ))}

      <button onClick={addFinding}
        className="w-full py-3 border border-dashed border-white/20 rounded-xl text-sm text-white/40 hover:text-white hover:border-white/40 transition-all">
        + Add Finding
      </button>
    </div>
  )
}
