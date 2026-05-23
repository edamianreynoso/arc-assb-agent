# Statistical Report — run 2026-05-23T02-09-20_default

Generated 2026-05-23T02:18:06.235Z  ·  Seeds: 20  ·  Scenarios: 6  ·  Modes: 3

**α (nominal):** 0.01  ·  **Tests:** 36  ·  **α (Bonferroni-adjusted):** 2.78e-4

## Gate status

| Gate | Criterion | Status |
|---|---|---|
| 1 Smoke | All (scenario × mode × seed) runs complete without error | ✓ PASS |
| 2 Directional | ARC Robust drops RI >=30% on >=2 sustained stressors with baseline RI >=0.01 | PASS (2/3) |
| 3 Quantitative | >=1 meaningful sustained-stressor RI comparison with p<alpha_adj and |d|>0.8 | PASS |

## Aggregate metrics (mean ± std across 20 seeds)

| Scenario | Mode | PerfMean | RI | RT | ControlEffort |
|---|---|---|---|---|---|
| reward_flip | baseline | 0.215 ± 0.024 | 0.000 ± 0.000 | 0.0 ± 0.0 | 0.000 ± 0.000 |
| reward_flip | arc_v1 | 0.307 ± 0.024 | 0.000 ± 0.000 | 30.6 ± 22.3 | 0.173 ± 0.002 |
| reward_flip | arc_robust | 0.242 ± 0.024 | 0.000 ± 0.000 | 106.3 ± 67.8 | 0.278 ± 0.003 |
| noise_burst | baseline | 0.269 ± 0.031 | 0.000 ± 0.000 | 0.0 ± 0.0 | 0.000 ± 0.000 |
| noise_burst | arc_v1 | 0.363 ± 0.030 | 0.000 ± 0.000 | 43.0 ± 69.3 | 0.048 ± 0.002 |
| noise_burst | arc_robust | 0.359 ± 0.030 | 0.000 ± 0.000 | 43.0 ± 69.3 | 0.069 ± 0.004 |
| sudden_threat | baseline | 0.145 ± 0.025 | 0.000 ± 0.000 | 160.0 ± 0.0 | 0.000 ± 0.000 |
| sudden_threat | arc_v1 | 0.308 ± 0.024 | 0.000 ± 0.000 | 35.5 ± 1.6 | 0.154 ± 0.002 |
| sudden_threat | arc_robust | 0.229 ± 0.024 | 0.000 ± 0.000 | 160.0 ± 0.0 | 0.314 ± 0.003 |
| sustained_contradiction | baseline | 0.341 ± 0.044 | 0.147 ± 0.004 | 116.8 ± 67.8 | 0.000 ± 0.000 |
| sustained_contradiction | arc_v1 | 0.386 ± 0.042 | 0.075 ± 0.004 | 160.0 ± 0.0 | 0.263 ± 0.002 |
| sustained_contradiction | arc_robust | 0.375 ± 0.042 | 0.024 ± 0.002 | 153.4 ± 29.5 | 0.402 ± 0.005 |
| gaslighting | baseline | 0.224 ± 0.026 | 1.02e-4 ± 1.50e-4 | 128.0 ± 65.7 | 0.000 ± 0.000 |
| gaslighting | arc_v1 | 0.274 ± 0.025 | 0.000 ± 0.000 | 1.4 ± 0.5 | 0.242 ± 0.002 |
| gaslighting | arc_robust | 0.250 ± 0.025 | 0.000 ± 0.000 | 9.1 ± 35.5 | 0.283 ± 0.003 |
| adversarial_coupling | baseline | 0.228 ± 0.029 | 0.030 ± 0.004 | 160.0 ± 0.0 | 0.000 ± 0.000 |
| adversarial_coupling | arc_v1 | 0.337 ± 0.025 | 0.005 ± 0.002 | 0.1 ± 0.3 | 0.125 ± 0.002 |
| adversarial_coupling | arc_robust | 0.338 ± 0.025 | 0.003 ± 7.89e-4 | 0.1 ± 0.2 | 0.221 ± 0.004 |

## Pairwise comparisons — Welch's t-test + Cohen's d

All tests: baseline vs candidate. Two-tailed Welch test (unequal variances). p-values Bonferroni-adjusted threshold = 2.78e-4. ★ = significant.

| Scenario | Metric | vs. | Δ | Δ% | t | df | p | Cohen's d | size | sig |
|---|---|---|---|---|---|---|---|---|---|---|
| reward_flip | perfMean | arc_v1 | 0.092 | +42.8% | -12.15 | 38.0 | <1e-50 | 3.84 | very large | ★ |
| reward_flip | ruminationIndex | arc_v1 | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| reward_flip | recoveryTime | arc_v1 | 30.550 | +0.0% | -6.13 | 19.0 | 8.91e-10 | 1.94 | very large | ★ |
| reward_flip | perfMean | arc_robust | 0.028 | +12.9% | -3.66 | 38.0 | 2.49e-4 | 1.16 | large | ★ |
| reward_flip | ruminationIndex | arc_robust | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| reward_flip | recoveryTime | arc_robust | 106.250 | +0.0% | -7.01 | 19.0 | <1e-10 | 2.22 | very large | ★ |
| noise_burst | perfMean | arc_v1 | 0.095 | +35.2% | -9.79 | 38.0 | <1e-50 | 3.10 | very large | ★ |
| noise_burst | ruminationIndex | arc_v1 | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| noise_burst | recoveryTime | arc_v1 | 42.950 | +0.0% | -2.77 | 19.0 | 0.0056 | 0.88 | large | — |
| noise_burst | perfMean | arc_robust | 0.091 | +33.7% | -9.43 | 37.9 | <1e-50 | 2.98 | very large | ★ |
| noise_burst | ruminationIndex | arc_robust | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| noise_burst | recoveryTime | arc_robust | 42.950 | +0.0% | -2.77 | 19.0 | 0.0056 | 0.88 | large | — |
| sudden_threat | perfMean | arc_v1 | 0.163 | +112.3% | -21.20 | 37.9 | <1e-50 | 6.70 | very large | ★ |
| sudden_threat | ruminationIndex | arc_v1 | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| sudden_threat | recoveryTime | arc_v1 | -124.450 | -77.8% | 339.87 | 19.0 | <1e-50 | -107.48 | very large | ★ |
| sudden_threat | perfMean | arc_robust | 0.084 | +57.8% | -10.85 | 37.9 | <1e-50 | 3.43 | very large | ★ |
| sudden_threat | ruminationIndex | arc_robust | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| sudden_threat | recoveryTime | arc_robust | 0.000 | +0.0% | 0.00 | 38.0 | 1.0000 | 0.00 | negligible | — |
| sustained_contradiction | perfMean | arc_v1 | 0.045 | +13.3% | -3.32 | 37.9 | 9.01e-4 | 1.05 | large | — |
| sustained_contradiction | ruminationIndex | arc_v1 | -0.072 | -49.2% | 57.36 | 2.5 | <1e-50 | -18.14 | very large | ★ |
| sustained_contradiction | recoveryTime | arc_v1 | 43.150 | +36.9% | -2.85 | 19.0 | 0.0044 | 0.90 | large | — |
| sustained_contradiction | perfMean | arc_robust | 0.034 | +10.0% | -2.51 | 37.9 | 0.0120 | 0.79 | medium | — |
| sustained_contradiction | ruminationIndex | arc_robust | -0.123 | -83.4% | 116.46 | 1.2 | <1e-50 | -36.83 | very large | ★ |
| sustained_contradiction | recoveryTime | arc_robust | 36.550 | +31.3% | -2.21 | 26.0 | 0.0270 | 0.70 | medium | — |
| gaslighting | perfMean | arc_v1 | 0.049 | +22.0% | -6.22 | 37.9 | 5.04e-10 | 1.97 | very large | ★ |
| gaslighting | ruminationIndex | arc_v1 | -1.02e-4 | -100.0% | 3.04 | 1.26e-6 | 0.0023 | -0.96 | large | — |
| gaslighting | recoveryTime | arc_v1 | -126.600 | -98.9% | 8.62 | 19.0 | <1e-50 | -2.73 | very large | ★ |
| gaslighting | perfMean | arc_robust | 0.025 | +11.3% | -3.19 | 37.9 | 0.0014 | 1.01 | large | — |
| gaslighting | ruminationIndex | arc_robust | -1.02e-4 | -100.0% | 3.04 | 1.26e-6 | 0.0023 | -0.96 | large | — |
| gaslighting | recoveryTime | arc_robust | -118.900 | -92.9% | 7.12 | 29.2 | <1e-10 | -2.25 | very large | ★ |
| adversarial_coupling | perfMean | arc_v1 | 0.109 | +48.0% | -12.63 | 37.1 | <1e-50 | 3.99 | very large | ★ |
| adversarial_coupling | ruminationIndex | arc_v1 | -0.025 | -83.2% | 24.02 | 1.2 | <1e-50 | -7.60 | very large | ★ |
| adversarial_coupling | recoveryTime | arc_v1 | -159.900 | -99.9% | 2323.29 | 19.0 | <1e-50 | -734.69 | very large | ★ |
| adversarial_coupling | perfMean | arc_robust | 0.110 | +48.2% | -12.68 | 37.1 | <1e-50 | 4.01 | very large | ★ |
| adversarial_coupling | ruminationIndex | arc_robust | -0.027 | -89.2% | 27.12 | 1.0 | <1e-50 | -8.58 | very large | ★ |
| adversarial_coupling | recoveryTime | arc_robust | -159.950 | -100.0% | 3199.00 | 19.0 | <1e-50 | -1011.61 | very large | ★ |

## Primary findings

- **sustained_contradiction**: RI 0.147 -> 0.024 (**83% reduction**, p=<1e-50, d=-36.83 very large *); PerfMean 0.341 -> 0.375 (+10.0%, p=0.0120)
- **gaslighting**: RI baseline is near threshold (1.02e-4 -> 0.000), so this is not primary RI evidence; PerfMean 0.224 -> 0.250 (+11.3%, p=0.0014)
- **adversarial_coupling**: RI 0.030 -> 0.003 (**89% reduction**, p=<1e-50, d=-8.58 very large *); PerfMean 0.228 -> 0.338 (+48.2%, p=<1e-50)

## Caveats

- Live-cortex harness uses **signal injection**, not real LLM messages. See README for rationale.
- PerfMean is a synthetic state-derived proxy in this public stub, not an external task score. Treat relative comparisons as diagnostic, not as evidence of live task performance.
- Multiple-comparison correction uses Bonferroni (conservative). False discovery rate correction would likely yield more significant results; reported here for conservatism.
- The RI metric is exactly the paper's definition: `mean max(0, S − s_rum_tau)` over the final 80% of the horizon.

---
*Generated by* `experiments/arc-assb-agent/analysis/statistical-report.ts`