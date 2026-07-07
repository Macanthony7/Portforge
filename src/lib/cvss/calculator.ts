import type { CVSSMetrics } from '@/types'

/** CVSS v3.1 Base Score Calculator (First.org specification)
 *  See: https://www.first.org/cvss/v3.1/specification-document
 */

// Metric weights per CVSS v3.1 spec
const AV_WEIGHTS: Record<CVSSMetrics['AV'], number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 }
const AC_WEIGHTS: Record<CVSSMetrics['AC'], number> = { L: 0.77, H: 0.44 }
const PR_WEIGHTS_U: Record<CVSSMetrics['PR'], number> = { N: 0.85, L: 0.62, H: 0.27 }
const PR_WEIGHTS_C: Record<CVSSMetrics['PR'], number> = { N: 0.85, L: 0.68, H: 0.5 }
const UI_WEIGHTS: Record<CVSSMetrics['UI'], number> = { N: 0.85, R: 0.62 }
const CIA_WEIGHTS: Record<CVSSMetrics['C' | 'I' | 'A'], number> = { N: 0, L: 0.22, H: 0.56 }

export interface CVSSResult {
  score: number
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'None'
  vector: string
  color: string
  colorClass: string
}

export function calculateCVSS(metrics: CVSSMetrics): CVSSResult {
  const av = AV_WEIGHTS[metrics.AV]
  const ac = AC_WEIGHTS[metrics.AC]
  const ui = UI_WEIGHTS[metrics.UI]
  const c = CIA_WEIGHTS[metrics.C]
  const i = CIA_WEIGHTS[metrics.I]
  const a = CIA_WEIGHTS[metrics.A]

  const prWeights = metrics.S === 'U' ? PR_WEIGHTS_U : PR_WEIGHTS_C
  const pr = prWeights[metrics.PR]

  const iss = 1 - (1 - c) * (1 - i) * (1 - a)

  let impact: number
  if (metrics.S === 'U') {
    impact = iss < 0 ? 0 : 6.42 * iss
  } else {
    impact = iss < 0 ? 0 : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15)
    if (impact > 10) impact = 10
    if (impact < 0) impact = 0
  }

  const exploitability = 8.22 * av * ac * pr * ui

  let baseScore: number
  if (impact <= 0) {
    baseScore = 0
  } else {
    if (metrics.S === 'U') {
      baseScore = Math.min(impact + exploitability, 10)
    } else {
      baseScore = Math.min(1.08 * (impact + exploitability), 10)
    }
  }

  // Round to 1 decimal place
  const score = Math.round(baseScore * 10) / 10

  // Severity rating
  let severity: CVSSResult['severity']
  if (score >= 9.0) severity = 'Critical'
  else if (score >= 7.0) severity = 'High'
  else if (score >= 4.0) severity = 'Medium'
  else if (score >= 0.1) severity = 'Low'
  else severity = 'None'

  // Color mapping
  const colorMap: Record<string, { color: string; colorClass: string }> = {
    Critical: { color: '#EF4444', colorClass: 'bg-red-500 text-white' },
    High: { color: '#F97316', colorClass: 'bg-orange-500 text-white' },
    Medium: { color: '#EAB308', colorClass: 'bg-yellow-500 text-black' },
    Low: { color: '#3B82F6', colorClass: 'bg-blue-500 text-white' },
    None: { color: '#6B7280', colorClass: 'bg-gray-500 text-white' },
  }

  const { color, colorClass } = colorMap[severity]

  // Vector string
  const vector = `CVSS:3.1/AV:${metrics.AV}/AC:${metrics.AC}/PR:${metrics.PR}/UI:${metrics.UI}/S:${metrics.S}/C:${metrics.C}/I:${metrics.I}/A:${metrics.A}`

  return { score, severity, vector, color, colorClass }
}

export function vectorToMetrics(vector: string): CVSSMetrics | null {
  const regex = /AV:([NALP])\/AC:([LH])\/PR:([NLH])\/UI:([NR])\/S:([UC])\/C:([NLH])\/I:([NLH])\/A:([NLH])/
  const match = vector.match(regex)
  if (!match) return null

  return {
    AV: match[1] as CVSSMetrics['AV'],
    AC: match[2] as CVSSMetrics['AC'],
    PR: match[3] as CVSSMetrics['PR'],
    UI: match[4] as CVSSMetrics['UI'],
    S: match[5] as CVSSMetrics['S'],
    C: match[6] as CVSSMetrics['C'],
    I: match[7] as CVSSMetrics['I'],
    A: match[8] as CVSSMetrics['A'],
  }
}

export const QUICK_PRESETS: Array<{ name: string; metrics: CVSSMetrics; score: number; severity: CVSSResult['severity'] }> = [
  {
    name: 'Critical',
    metrics: { AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'H', I: 'H', A: 'H' },
    score: 9.8,
    severity: 'Critical',
  },
  {
    name: 'High',
    metrics: { AV: 'N', AC: 'L', PR: 'L', UI: 'N', S: 'U', C: 'H', I: 'H', A: 'N' },
    score: 8.1,
    severity: 'High',
  },
  {
    name: 'Medium',
    metrics: { AV: 'N', AC: 'H', PR: 'L', UI: 'R', S: 'U', C: 'L', I: 'L', A: 'N' },
    score: 5.0,
    severity: 'Medium',
  },
  {
    name: 'Low',
    metrics: { AV: 'L', AC: 'H', PR: 'H', UI: 'R', S: 'U', C: 'N', I: 'L', A: 'N' },
    score: 1.6,
    severity: 'Low',
  },
]
