# CVSS v3.1 Calculator

Portforge includes a built-in CVSS v3.1 Base Score Calculator compliant with the [FIRST.org specification](https://www.first.org/cvss/v3.1/specification-document). It is available both as a standalone UI component and as a programmatic TypeScript API.

---

## Table of Contents

- [What is CVSS?](#what-is-cvss)
- [Using the Calculator in the UI](#using-the-calculator-in-the-ui)
- [Metric Reference](#metric-reference)
- [Severity Ratings](#severity-ratings)
- [Quick Presets](#quick-presets)
- [CVSS in Pentest Reports](#cvss-in-pentest-reports)
- [Programmatic Usage](#programmatic-usage)

---

## What is CVSS?

The Common Vulnerability Scoring System (CVSS) v3.1 is an open framework for communicating the characteristics and severity of software vulnerabilities. A CVSS Base Score reflects the intrinsic qualities of a vulnerability independent of time or environment.

Scores range from **0.0 to 10.0** and map to five severity levels.

---

## Using the Calculator in the UI

The CVSS calculator is accessible in two places:

1. **Standalone** — navigate to the CVSS calculator from the dashboard.
2. **Inline in a pentest report** — when answering the CVSS question in the `cyber-pentest-report` template, a CVSS table input appears directly in the questionnaire.

### Steps

1. Select a value for each of the 8 metrics (see [Metric Reference](#metric-reference) below).
2. The score and severity badge update in real time.
3. The vector string (e.g. `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`) is generated automatically.
4. Use **Quick Presets** to jump to a typical score for rapid assessment.
5. To import an existing vector string, paste it into the vector field — the metrics will populate automatically.

---

## Metric Reference

### Attack Vector (AV)

How the vulnerability is exploited.

| Value | Label | Weight | Description |
|-------|-------|--------|-------------|
| `N` | Network | 0.85 | Exploitable remotely over the internet |
| `A` | Adjacent | 0.62 | Requires access to the same network segment |
| `L` | Local | 0.55 | Requires local access (e.g. logged-in user) |
| `P` | Physical | 0.20 | Requires physical access to the device |

### Attack Complexity (AC)

Conditions beyond the attacker's control that must exist.

| Value | Label | Weight | Description |
|-------|-------|--------|-------------|
| `L` | Low | 0.77 | No special conditions required |
| `H` | High | 0.44 | Specific conditions must exist (race condition, config, etc.) |

### Privileges Required (PR)

Level of privileges the attacker must have before exploiting.

| Value | Label | Weight (Scope Unchanged) | Weight (Scope Changed) |
|-------|-------|--------------------------|------------------------|
| `N` | None | 0.85 | 0.85 |
| `L` | Low | 0.62 | 0.68 |
| `H` | High | 0.27 | 0.50 |

### User Interaction (UI)

Whether a user other than the attacker must participate.

| Value | Label | Weight | Description |
|-------|-------|--------|-------------|
| `N` | None | 0.85 | No user interaction required |
| `R` | Required | 0.62 | A user must take some action (click a link, open a file, etc.) |

### Scope (S)

Whether a vulnerability in one component impacts resources beyond its security scope.

| Value | Label | Description |
|-------|-------|-------------|
| `U` | Unchanged | Impact is limited to the vulnerable component |
| `C` | Changed | Impact extends to other components (e.g. hypervisor escape) |

### Confidentiality Impact (C)

Impact on the confidentiality of information.

| Value | Label | Weight | Description |
|-------|-------|--------|-------------|
| `N` | None | 0.00 | No impact |
| `L` | Low | 0.22 | Some restricted information is disclosed |
| `H` | High | 0.56 | All information is disclosed or attacker has full read access |

### Integrity Impact (I)

Impact on the integrity of information.

| Value | Label | Weight | Description |
|-------|-------|--------|-------------|
| `N` | None | 0.00 | No impact |
| `L` | Low | 0.22 | Modification of some data is possible |
| `H` | High | 0.56 | Complete loss of integrity or attacker has full write access |

### Availability Impact (A)

Impact on the availability of the affected component.

| Value | Label | Weight | Description |
|-------|-------|--------|-------------|
| `N` | None | 0.00 | No impact |
| `L` | Low | 0.22 | Reduced performance or interruptions |
| `H` | High | 0.56 | Complete loss of availability |

---

## Severity Ratings

| Score Range | Severity | Color |
|-------------|----------|-------|
| 9.0 – 10.0 | Critical | Red |
| 7.0 – 8.9 | High | Orange |
| 4.0 – 6.9 | Medium | Yellow |
| 0.1 – 3.9 | Low | Blue |
| 0.0 | None | Gray |

---

## Quick Presets

Four presets are available for rapid assessment:

| Preset | AV | AC | PR | UI | S | C | I | A | Score |
|--------|----|----|----|----|---|---|---|---|-------|
| Critical | N | L | N | N | U | H | H | H | 9.8 |
| High | N | L | L | N | U | H | H | N | 8.1 |
| Medium | N | H | L | R | U | L | L | N | 5.0 |
| Low | L | H | H | R | U | N | L | N | 1.6 |

Clicking a preset populates all 8 metrics and updates the score instantly.

---

## CVSS in Pentest Reports

When using the **Vulnerability Audit Report** template, the CVSS question (`q7`) renders a `cvss-table` input. This lets you add multiple findings, each with:

- Finding name
- CVSS metrics (via the calculator)
- Auto-calculated score and severity
- Vector string
- Impact description
- Remediation recommendation

The AI will include the CVSS table in the generated report's **Vulnerability Findings** section, formatted as a markdown table.

### Example Vector Strings

```
# Critical — Remote Code Execution
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H  →  9.8 Critical

# High — Authenticated SQL Injection
CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N  →  8.1 High

# Medium — Stored XSS
CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N  →  5.4 Medium

# Low — Information Disclosure
CVSS:3.1/AV:N/AC:H/PR:L/UI:R/S:U/C:L/I:N/A:N  →  2.6 Low
```

---

## Programmatic Usage

See the [API Reference — CVSS Calculator](./api-reference.md#cvss-calculator) for the full function signatures.

### Basic Example

```ts
import { calculateCVSS, vectorToMetrics } from '@/lib/cvss/calculator'

// Calculate from metrics
const result = calculateCVSS({
  AV: 'N', AC: 'L', PR: 'N', UI: 'N',
  S: 'U', C: 'H', I: 'H', A: 'H',
})
console.log(result.score)     // 9.8
console.log(result.severity)  // "Critical"
console.log(result.vector)    // "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"

// Parse a vector string
const metrics = vectorToMetrics('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')
console.log(metrics?.AV)  // "N"
```
