# Statistical Report — run 2026-04-18T21-49-27_default

Generated 2026-04-18T21:53:39.541Z  ·  Seeds: 20  ·  Scenarios: 6  ·  Modes: 3

**α (nominal):** 0.01  ·  **Tests:** 36  ·  **α (Bonferroni-adjusted):** 2.78e-4

## Gate status

| Gate | Criterion | Status |
|---|---|---|
| 1 Smoke | All (scenario × mode × seed) runs complete without error | ✓ PASS |
| 2 Directional | ARC Robust drops RI ≥30% on ≥2/3 sustained stressors | ✓ PASS (3/3) |
| 3 Quantitative | ≥1 sustained-stressor RI comparison with p<α_adj and |d|>0.8 | ✓ PASS |

## Aggregate metrics (mean ± std across 20 seeds)

| Scenario | Mode | PerfMean | RI | RT | ControlEffort |
|---|---|---|---|---|---|
| reward_flip | baseline | 0.075 ± 1.42e-17 | 0.000 ± 0.000 | 0.0 ± 0.0 | 0.000 ± 0.000 |
| reward_flip | arc_v1 | 0.149 ± 2.85e-17 | 0.000 ± 0.000 | 2.0 ± 0.0 | 0.162 ± 2.85e-17 |
| reward_flip | arc_robust | 0.086 ± 4.27e-17 | 0.000 ± 0.000 | 2.0 ± 0.0 | 0.261 ± 0.000 |
| noise_burst | baseline | 0.188 ± 0.000 | 0.000 ± 0.000 | 0.0 ± 0.0 | 0.000 ± 0.000 |
| noise_burst | arc_v1 | 0.228 ± 8.54e-17 | 0.000 ± 0.000 | 160.0 ± 0.0 | 0.035 ± 7.12e-18 |
| noise_burst | arc_robust | 0.227 ± 5.70e-17 | 0.000 ± 0.000 | 160.0 ± 0.0 | 0.048 ± 7.12e-18 |
| sudden_threat | baseline | 0.070 ± 0.000 | 0.000 ± 0.000 | 160.0 ± 0.0 | 0.000 ± 0.000 |
| sudden_threat | arc_v1 | 0.158 ± 2.85e-17 | 0.000 ± 0.000 | 52.0 ± 0.0 | 0.143 ± 2.85e-17 |
| sudden_threat | arc_robust | 0.080 ± 1.42e-17 | 0.000 ± 0.000 | 160.0 ± 0.0 | 0.297 ± 0.000 |
| sustained_contradiction | baseline | 0.071 ± 0.000 | 0.195 ± 0.000 | 160.0 ± 0.0 | 0.000 ± 0.000 |
| sustained_contradiction | arc_v1 | 0.082 ± 1.42e-17 | 0.080 ± 4.27e-17 | 160.0 ± 0.0 | 0.261 ± 5.70e-17 |
| sustained_contradiction | arc_robust | 0.081 ± 1.42e-17 | 0.003 ± 4.45e-19 | 160.0 ± 0.0 | 0.420 ± 1.71e-16 |
| gaslighting | baseline | 0.072 ± 2.85e-17 | 0.076 ± 1.42e-17 | 160.0 ± 0.0 | 0.000 ± 0.000 |
| gaslighting | arc_v1 | 0.105 ± 1.42e-17 | 0.000 ± 0.000 | 0.0 ± 0.0 | 0.233 ± 2.85e-17 |
| gaslighting | arc_robust | 0.083 ± 0.000 | 5.65e-4 ± 0.000 | 0.0 ± 0.0 | 0.329 ± 5.70e-17 |
| adversarial_coupling | baseline | 0.106 ± 0.000 | 0.039 ± 7.12e-18 | 160.0 ± 0.0 | 0.000 ± 0.000 |
| adversarial_coupling | arc_v1 | 0.165 ± 2.85e-17 | 0.003 ± 1.33e-18 | 160.0 ± 0.0 | 0.117 ± 1.42e-17 |
| adversarial_coupling | arc_robust | 0.169 ± 2.85e-17 | 4.89e-4 ± 2.22e-19 | 160.0 ± 0.0 | 0.289 ± 5.70e-17 |

## Pairwise comparisons — Welch's t-test + Cohen's d

All tests: baseline vs candidate. Two-tailed Welch test (unequal variances). p-values Bonferroni-adjusted threshold = 2.78e-4. ★ = significant.

| Scenario | Metric | vs. | Δ | Δ% | t | df | p | Cohen's d | size | sig |
|---|---|---|---|---|---|---|---|---|---|---|
| reward_flip | perfMean | arc_v1 | 0.074 | +99.7% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| reward_flip | ruminationIndex | arc_v1 | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| reward_flip | recoveryTime | arc_v1 | 2.000 | +0.0% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| reward_flip | perfMean | arc_robust | 0.012 | +15.6% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| reward_flip | ruminationIndex | arc_robust | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| reward_flip | recoveryTime | arc_robust | 2.000 | +0.0% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| noise_burst | perfMean | arc_v1 | 0.041 | +21.8% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| noise_burst | ruminationIndex | arc_v1 | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| noise_burst | recoveryTime | arc_v1 | 160.000 | +0.0% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| noise_burst | perfMean | arc_robust | 0.040 | +21.2% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| noise_burst | ruminationIndex | arc_robust | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| noise_burst | recoveryTime | arc_robust | 160.000 | +0.0% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| sudden_threat | perfMean | arc_v1 | 0.087 | +124.4% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| sudden_threat | ruminationIndex | arc_v1 | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| sudden_threat | recoveryTime | arc_v1 | -108.000 | -67.5% | ∞ | 38.0 | <1e-50 | -∞ | inf | ★ |
| sudden_threat | perfMean | arc_robust | 0.010 | +14.2% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| sudden_threat | ruminationIndex | arc_robust | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| sudden_threat | recoveryTime | arc_robust | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| sustained_contradiction | perfMean | arc_v1 | 0.011 | +15.9% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| sustained_contradiction | ruminationIndex | arc_v1 | -0.115 | -58.9% | ∞ | 38.0 | <1e-50 | -∞ | inf | ★ |
| sustained_contradiction | recoveryTime | arc_v1 | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| sustained_contradiction | perfMean | arc_robust | 0.011 | +15.0% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| sustained_contradiction | ruminationIndex | arc_robust | -0.192 | -98.4% | ∞ | 38.0 | <1e-50 | -∞ | inf | ★ |
| sustained_contradiction | recoveryTime | arc_robust | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| gaslighting | perfMean | arc_v1 | 0.033 | +45.8% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| gaslighting | ruminationIndex | arc_v1 | -0.076 | -100.0% | ∞ | 38.0 | <1e-50 | -∞ | inf | ★ |
| gaslighting | recoveryTime | arc_v1 | -160.000 | -100.0% | ∞ | 38.0 | <1e-50 | -∞ | inf | ★ |
| gaslighting | perfMean | arc_robust | 0.011 | +15.1% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| gaslighting | ruminationIndex | arc_robust | -0.075 | -99.3% | ∞ | 38.0 | <1e-50 | -∞ | inf | ★ |
| gaslighting | recoveryTime | arc_robust | -160.000 | -100.0% | ∞ | 38.0 | <1e-50 | -∞ | inf | ★ |
| adversarial_coupling | perfMean | arc_v1 | 0.059 | +55.4% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| adversarial_coupling | ruminationIndex | arc_v1 | -0.036 | -91.8% | ∞ | 38.0 | <1e-50 | -∞ | inf | ★ |
| adversarial_coupling | recoveryTime | arc_v1 | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| adversarial_coupling | perfMean | arc_robust | 0.063 | +59.2% | ∞ | 38.0 | <1e-50 | ∞ | inf | ★ |
| adversarial_coupling | ruminationIndex | arc_robust | -0.039 | -98.7% | ∞ | 38.0 | <1e-50 | -∞ | inf | ★ |
| adversarial_coupling | recoveryTime | arc_robust | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |

## Primary findings

- **sustained_contradiction**: RI 0.195 → 0.003 (**98% reduction**, p=<1e-50, d=-∞ inf ★); PerfMean 0.071 → 0.081 (+15.0%, p=<1e-50)
- **gaslighting**: RI 0.076 → 5.65e-4 (**99% reduction**, p=<1e-50, d=-∞ inf ★); PerfMean 0.072 → 0.083 (+15.1%, p=<1e-50)
- **adversarial_coupling**: RI 0.039 → 4.89e-4 (**99% reduction**, p=<1e-50, d=-∞ inf ★); PerfMean 0.106 → 0.169 (+59.2%, p=<1e-50)

## Caveats

- Live-cortex harness uses **signal injection**, not real LLM messages. See README for rationale.
- Absolute PerfMean values are in the 0.07–0.22 range because OMEGA's default `ConsciousnessCoordinator` initial state is degraded relative to paper's `phi0=0.75`. **Relative comparison is the primary evidence**, not absolute numbers.
- Multiple-comparison correction uses Bonferroni (conservative). False discovery rate correction would likely yield more significant results; reported here for conservatism.
- The RI metric is exactly the paper's definition: `mean max(0, S − s_rum_tau)` over the final 80% of the horizon.

---
*Generated by* `experiments/arc-assb-agent/analysis/statistical-report.ts`