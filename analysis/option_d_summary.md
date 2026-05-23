# Paper #2 experimental statistical summary

### A - Default corrected harness

| Scenario | Metric | Baseline | ARC v1 | ARC Robust | d(baseline vs arc_robust) | p (Welch, approx) |
|---|---|---|---|---|---|---|
| adversarial_coupling | PerfMean | 0.228 | 0.337 | 0.338 | -4.01 | 1.00e-300 |
| adversarial_coupling | RI | 0.030 | 0.005 | 0.003 | 8.58 | 1.00e-300 |
| adversarial_coupling | Effort | 0.000 | 0.125 | 0.221 | -75.72 | 1.00e-300 |
| gaslighting | PerfMean | 0.224 | 0.274 | 0.250 | -1.01 | 0.001 |
| gaslighting | RI | 1.02e-04 | 0.000 | 0.000 | 0.96 | 0.002 |
| gaslighting | Effort | 0.000 | 0.242 | 0.283 | -122.12 | 1.00e-300 |
| noise_burst | PerfMean | 0.269 | 0.363 | 0.359 | -2.98 | 1.00e-300 |
| noise_burst | RI | 0.000 | 0.000 | 0.000 | 0.00 | 1.000 |
| noise_burst | Effort | 0.000 | 0.048 | 0.069 | -25.09 | 1.00e-300 |
| reward_flip | PerfMean | 0.215 | 0.307 | 0.242 | -1.16 | 2.49e-04 |
| reward_flip | RI | 0.000 | 0.000 | 0.000 | 0.00 | 1.000 |
| reward_flip | Effort | 0.000 | 0.173 | 0.278 | -119.01 | 1.00e-300 |
| sudden_threat | PerfMean | 0.145 | 0.308 | 0.229 | -3.43 | 1.00e-300 |
| sudden_threat | RI | 0.000 | 0.000 | 0.000 | 0.00 | 1.000 |
| sudden_threat | Effort | 0.000 | 0.154 | 0.314 | -137.88 | 1.00e-300 |
| sustained_contradiction | PerfMean | 0.341 | 0.386 | 0.375 | -0.79 | 0.012 |
| sustained_contradiction | RI | 0.147 | 0.075 | 0.024 | 36.83 | 1.00e-300 |
| sustained_contradiction | Effort | 0.000 | 0.263 | 0.402 | -120.36 | 1.00e-300 |

### B - Nominal Coordinator Init (Paper #1 operating point)

| Scenario | Metric | Baseline | ARC v1 | ARC Robust | d(baseline vs arc_robust) | p (Welch, approx) |
|---|---|---|---|---|---|---|
| adversarial_coupling | PerfMean | 0.289 | 0.398 | 0.398 | -3.52 | 1.00e-300 |
| adversarial_coupling | RI | 0.030 | 0.005 | 0.003 | 8.58 | 1.00e-300 |
| adversarial_coupling | Effort | 0.000 | 0.125 | 0.221 | -75.72 | 1.00e-300 |
| gaslighting | PerfMean | 0.284 | 0.333 | 0.309 | -0.86 | 0.006 |
| gaslighting | RI | 1.02e-04 | 0.000 | 0.000 | 0.96 | 0.002 |
| gaslighting | Effort | 0.000 | 0.242 | 0.283 | -122.12 | 1.00e-300 |
| noise_burst | PerfMean | 0.317 | 0.411 | 0.407 | -2.47 | 5.33e-15 |
| noise_burst | RI | 0.000 | 0.000 | 0.000 | 0.00 | 1.000 |
| noise_burst | Effort | 0.000 | 0.048 | 0.069 | -25.09 | 1.00e-300 |
| reward_flip | PerfMean | 0.270 | 0.362 | 0.298 | -0.98 | 0.002 |
| reward_flip | RI | 0.000 | 0.000 | 0.000 | 0.00 | 1.000 |
| reward_flip | Effort | 0.000 | 0.173 | 0.278 | -119.01 | 1.00e-300 |
| sudden_threat | PerfMean | 0.203 | 0.365 | 0.286 | -2.97 | 1.00e-300 |
| sudden_threat | RI | 0.000 | 0.000 | 0.000 | 0.00 | 1.000 |
| sudden_threat | Effort | 0.000 | 0.154 | 0.314 | -137.88 | 1.00e-300 |
| sustained_contradiction | PerfMean | 0.448 | 0.491 | 0.478 | -0.61 | 0.052 |
| sustained_contradiction | RI | 0.147 | 0.075 | 0.024 | 36.83 | 1.00e-300 |
| sustained_contradiction | Effort | 0.000 | 0.263 | 0.402 | -120.36 | 1.00e-300 |

### C - Triple Jitter Sigma (sensitivity study)

| Scenario | Metric | Baseline | ARC v1 | ARC Robust | d(baseline vs arc_robust) | p (Welch, approx) |
|---|---|---|---|---|---|---|
| adversarial_coupling | PerfMean | 0.287 | 0.395 | 0.396 | -1.33 | 2.50e-05 |
| adversarial_coupling | RI | 0.037 | 0.014 | 0.009 | 3.73 | 1.00e-300 |
| adversarial_coupling | Effort | 0.000 | 0.126 | 0.231 | -26.40 | 1.00e-300 |
| gaslighting | PerfMean | 0.275 | 0.331 | 0.307 | -0.43 | 0.175 |
| gaslighting | RI | 0.002 | 1.44e-04 | 1.26e-04 | 1.54 | 1.18e-06 |
| gaslighting | Effort | 0.000 | 0.242 | 0.283 | -37.64 | 1.00e-300 |
| noise_burst | PerfMean | 0.300 | 0.398 | 0.396 | -1.35 | 2.11e-05 |
| noise_burst | RI | 0.000 | 0.000 | 0.000 | 0.00 | 1.000 |
| noise_burst | Effort | 0.000 | 0.049 | 0.069 | -8.06 | 1.00e-300 |
| reward_flip | PerfMean | 0.225 | 0.323 | 0.260 | -0.57 | 0.072 |
| reward_flip | RI | 0.000 | 0.000 | 0.000 | 0.00 | 1.000 |
| reward_flip | Effort | 0.000 | 0.174 | 0.278 | -38.80 | 1.00e-300 |
| sudden_threat | PerfMean | 0.201 | 0.364 | 0.286 | -1.15 | 2.78e-04 |
| sudden_threat | RI | 0.000 | 0.000 | 0.000 | 0.00 | 1.000 |
| sudden_threat | Effort | 0.000 | 0.154 | 0.314 | -44.56 | 1.00e-300 |
| sustained_contradiction | PerfMean | 0.334 | 0.386 | 0.375 | -0.40 | 0.211 |
| sustained_contradiction | RI | 0.132 | 0.062 | 0.024 | 13.79 | 1.00e-300 |
| sustained_contradiction | Effort | 0.000 | 0.262 | 0.393 | -43.72 | 1.00e-300 |

### D2 - Creativity Baseline (no stressor)

| Scenario | Metric | Baseline | ARC v1 | ARC Robust | d(baseline vs arc_robust) | p (Welch, approx) |
|---|---|---|---|---|---|---|
| nominal_quiet | PerfMean | 0.351 | 0.446 | 0.442 | -3.10 | 1.00e-300 |
| nominal_quiet | RI | 0.000 | 0.000 | 0.000 | 0.00 | 1.000 |
| nominal_quiet | Effort | 0.000 | 0.048 | 0.069 | -25.09 | 1.00e-300 |
