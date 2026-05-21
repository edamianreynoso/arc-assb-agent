# Option-D experimental additions — statistical summary

### B — Nominal Coordinator Init (Paper #1 operating point)

| Scenario | Metric | Baseline | ARC v1 | ARC Robust | d(baseline vs arc_robust) | p (Welch, approx) |
|---|---|---|---|---|---|---|
| adversarial_coupling | PerfMean | 0.047 | 0.155 | 0.158 | -28.91 | 1.00e-300 |
| adversarial_coupling | RI | 0.114 | 0.015 | 8.28e-04 | 14.61 | 1.00e-300 |
| adversarial_coupling | Effort | 0.000 | 0.130 | 0.314 | -60.00 | 1.00e-300 |
| gaslighting | PerfMean | 0.048 | 0.098 | 0.074 | -7.09 | 1.00e-300 |
| gaslighting | RI | 0.127 | 0.002 | 6.77e-04 | 10.69 | 1.00e-300 |
| gaslighting | Effort | 0.000 | 0.243 | 0.352 | -73.27 | 1.00e-300 |
| noise_burst | PerfMean | 0.126 | 0.221 | 0.217 | -9.87 | 1.00e-300 |
| noise_burst | RI | 0.000 | 0.000 | 0.000 | 0.00 | 0.000 |
| noise_burst | Effort | 0.000 | 0.048 | 0.069 | -25.09 | 1.00e-300 |
| reward_flip | PerfMean | 0.050 | 0.142 | 0.078 | -7.25 | 1.00e-300 |
| reward_flip | RI | 0.000 | 0.000 | 0.000 | 0.00 | 0.000 |
| reward_flip | Effort | 0.000 | 0.173 | 0.278 | -119.53 | 1.00e-300 |
| sudden_threat | PerfMean | 0.047 | 0.151 | 0.072 | -6.83 | 1.00e-300 |
| sudden_threat | RI | 0.000 | 0.000 | 0.000 | 0.00 | 0.000 |
| sudden_threat | Effort | 0.000 | 0.154 | 0.314 | -137.80 | 1.00e-300 |
| sustained_contradiction | PerfMean | 0.047 | 0.077 | 0.073 | -7.02 | 1.00e-300 |
| sustained_contradiction | RI | 0.310 | 0.080 | 0.004 | 22.07 | 1.00e-300 |
| sustained_contradiction | Effort | 0.000 | 0.272 | 0.436 | -173.01 | 1.00e-300 |

### C — Triple Jitter Sigma (sensitivity study)

| Scenario | Metric | Baseline | ARC v1 | ARC Robust | d(baseline vs arc_robust) | p (Welch, approx) |
|---|---|---|---|---|---|---|
| adversarial_coupling | PerfMean | 0.045 | 0.148 | 0.158 | -9.07 | 1.00e-300 |
| adversarial_coupling | RI | 0.264 | 0.055 | 0.002 | 11.96 | 1.00e-300 |
| adversarial_coupling | Effort | 0.000 | 0.135 | 0.339 | -36.27 | 1.00e-300 |
| gaslighting | PerfMean | 0.045 | 0.096 | 0.074 | -2.41 | 2.24e-14 |
| gaslighting | RI | 0.243 | 0.010 | 0.002 | 9.69 | 1.00e-300 |
| gaslighting | Effort | 0.000 | 0.244 | 0.381 | -32.74 | 1.00e-300 |
| noise_burst | PerfMean | 0.119 | 0.219 | 0.216 | -3.30 | 1.00e-300 |
| noise_burst | RI | 0.000 | 0.000 | 0.000 | 0.00 | 0.000 |
| noise_burst | Effort | 0.000 | 0.049 | 0.069 | -8.06 | 1.00e-300 |
| reward_flip | PerfMean | 0.047 | 0.141 | 0.077 | -2.46 | 6.44e-15 |
| reward_flip | RI | 0.000 | 0.000 | 0.000 | 0.00 | 0.000 |
| reward_flip | Effort | 0.000 | 0.173 | 0.278 | -39.01 | 1.00e-300 |
| sudden_threat | PerfMean | 0.045 | 0.151 | 0.072 | -2.34 | 1.53e-13 |
| sudden_threat | RI | 0.000 | 0.000 | 0.000 | 0.00 | 0.000 |
| sudden_threat | Effort | 0.000 | 0.154 | 0.313 | -45.07 | 1.00e-300 |
| sustained_contradiction | PerfMean | 0.045 | 0.077 | 0.072 | -2.37 | 5.93e-14 |
| sustained_contradiction | RI | 0.346 | 0.092 | 0.011 | 80.86 | 1.00e-300 |
| sustained_contradiction | Effort | 0.000 | 0.273 | 0.436 | -59.69 | 1.00e-300 |

### D2 — Creativity Baseline (no stressor)

| Scenario | Metric | Baseline | ARC v1 | ARC Robust | d(baseline vs arc_robust) | p (Welch, approx) |
|---|---|---|---|---|---|---|
| nominal_quiet | PerfMean | 0.126 | 0.221 | 0.217 | -9.87 | 1.00e-300 |
| nominal_quiet | RI | 0.000 | 0.000 | 0.000 | 0.00 | 0.000 |
| nominal_quiet | Effort | 0.000 | 0.048 | 0.069 | -25.09 | 1.00e-300 |
