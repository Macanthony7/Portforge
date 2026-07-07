'use client'
import { useState, useCallback, useEffect } from 'react'
import { calculateCVSS, type CVSSResult, QUICK_PRESETS } from '@/lib/cvss/calculator'
import type { CVSSMetrics } from '@/types'

interface CVSSCalculatorProps {
  initialMetrics?: CVSSMetrics
  onChange?: (result: CVSSResult) => void
  onClose?: () => void
}

const defaultMetrics: CVSSMetrics = { AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'H', I: 'H', A: 'H' }

export function CVSSCalculator({ initialMetrics, onChange, onClose }: CVSSCalculatorProps) {
  const [metrics, setMetrics] = useState<CVSSMetrics>(initialMetrics || defaultMetrics)
  const [result, setResult] = useState<CVSSResult>(calculateCVSS(initialMetrics || defaultMetrics))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const res = calculateCVSS(metrics)
    setResult(res)
    onChange?.(res)
  }, [metrics, onChange])

  const updateMetric = useCallback(<K extends keyof CVSSMetrics>(key: K, value: CVSSMetrics[K]) => {
    setMetrics(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(`${result.vector} (Score: ${result.score.toFixed(1)}, Severity: ${result.severity})`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectPreset = (preset: typeof QUICK_PRESETS[number]) => {
    setMetrics(preset.metrics)
  }

  const options = {
    AV: [
      { value: 'N', label: 'Network (N)', desc: 'Vulnerable component is bound to the network stack' },
      { value: 'A', label: 'Adjacent (A)', desc: 'Vulnerable component is bound to the network stack, but attack is limited to the same protocol layer' },
      { value: 'L', label: 'Local (L)', desc: 'Vulnerable component is not bound to the network stack' },
      { value: 'P', label: 'Physical (P)', desc: 'Attack requires physical access to the vulnerable component' },
    ],
    AC: [
      { value: 'L', label: 'Low (L)', desc: 'No specialized conditions exist for the attack' },
      { value: 'H', label: 'High (H)', desc: 'A successful attack depends on conditions beyond the attacker\'s control' },
    ],
    PR: [
      { value: 'N', label: 'None (N)', desc: 'The attacker is unauthorized prior to attack' },
      { value: 'L', label: 'Low (L)', desc: 'The attacker requires privileges that provide basic user capabilities' },
      { value: 'H', label: 'High (H)', desc: 'The attacker requires privileges that provide significant control over the vulnerable component' },
    ],
    UI: [
      { value: 'N', label: 'None (N)', desc: 'The vulnerable system can be exploited without interaction from any user' },
      { value: 'R', label: 'Required (R)', desc: 'Successful exploitation requires a user to take some action before the vulnerability can be exploited' },
    ],
    S: [
      { value: 'U', label: 'Unchanged (U)', desc: 'An exploited vulnerability can only affect resources managed by the same authority' },
      { value: 'C', label: 'Changed (C)', desc: 'An exploited vulnerability can affect resources beyond the scope of the vulnerable component' },
    ],
    C: [
      { value: 'N', label: 'None (N)', desc: 'There is no loss of confidentiality within the impacted component' },
      { value: 'L', label: 'Low (L)', desc: 'There is some loss of confidentiality, but not all' },
      { value: 'H', label: 'High (H)', desc: 'There is total loss of confidentiality, resulting in all resources within the impacted component being divulged' },
    ],
    I: [
      { value: 'N', label: 'None (N)', desc: 'There is no loss of integrity within the impacted component' },
      { value: 'L', label: 'Low (L)', desc: 'Modification of some data, but not all' },
      { value: 'H', label: 'High (H)', desc: 'There is a total loss of integrity, or a complete loss of protection' },
    ],
    A: [
      { value: 'N', label: 'None (N)', desc: 'There is no impact to availability within the impacted component' },
      { value: 'L', label: 'Low (L)', desc: 'Performance is reduced or there are interruptions in resource availability' },
      { value: 'H', label: 'High (H)', desc: 'There is a total loss of availability, resulting in the attacker being able to fully deny availability' },
    ],
  } as const

  return (
    <div className="bg-forge-navy/80 border border-white/10 rounded-xl p-6 max-w-2xl w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">CVSS v3.1 Calculator</h2>
        {onClose && (
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Presets */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-white/40 mr-1">Quick select:</span>
        {QUICK_PRESETS.map(p => (
          <button key={p.name} onClick={() => selectPreset(p)}
            className="text-xs px-3 py-1.5 rounded-lg bg-ui-05 hover-bg-ui-10 border border-ui-10 transition-all">
            {p.name} ({p.score})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {(Object.keys(options) as Array<keyof typeof options>).map(key => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-white/40">
              {key === 'AV' ? 'Attack Vector' : key === 'AC' ? 'Attack Complexity' : key === 'PR' ? 'Privileges Required' : key === 'UI' ? 'User Interaction' : key === 'S' ? 'Scope' : key === 'C' ? 'Confidentiality' : key === 'I' ? 'Integrity' : 'Availability'}
            </label>
            <select
              value={metrics[key]}
              onChange={e => updateMetric(key, e.target.value as CVSSMetrics[typeof key])}
              className="w-full bg-ui-05 border border-ui-10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-forge-purple/60 transition-colors appearance-none"
            >
              {options[key].map(opt => (
                <option key={opt.value} value={opt.value} className="bg-forge-navy text-white">
                  {opt.label} — {opt.desc.slice(0, 50)}...
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Result */}
      <div className="bg-ui-05 border border-ui-10 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-lg font-bold px-4 py-1.5 rounded-full ${result.colorClass}`}>
              {result.severity}
            </span>
            <span className="text-3xl font-bold text-white">{result.score.toFixed(1)}</span>
          </div>
          <p className="font-mono text-xs text-white/40 break-all">{result.vector}</p>
        </div>
        <button onClick={handleCopy} className="forge-btn-secondary text-xs shrink-0 ml-4">
          {copied ? 'Copied!' : 'Copy Vector'}
        </button>
      </div>
    </div>
  )
}
