# Paper #2 reproduction — step by step

This document walks through the exact sequence of commands that reproduces every numerical claim in the preprint *"Embodied Affective Regulation: An Initial Single-Axis Deployment of the Affective Regulation Core (DMN Suppression Pathway) in a Live LLM-Based Cognitive Agent"* (Damián 2026b).

## Prerequisites

* Node.js 20 or newer
* Python 3.10 or newer (only needed for the statistical report at the end)
* Git

## Step 0 — clone & install

```bash
git clone https://github.com/edamianreynoso/arc-assb-agent.git
cd arc-assb-agent
npm install
```

## Step 1 — verify the controller contracts

Paper #1 defines ARC v1 (proportional) and ARC Robust (H∞-motivated) as a reference Python implementation. This repo re-ports them to TypeScript and the 38 unit tests verify bit-for-bit equivalence.

```bash
npm test
```

Expected: **38 passed / 0 failed** in ~20 ms. If any fails, something about the controller ports is drifting — stop here and open an issue.

## Step 2 — the headline result (§5.3 of the paper)

```bash
npm run probe:default
```

Configuration: 20 seeds × 6 scenarios × 3 modes × 160 steps. Expected output (within ±0.005 on all RI cells):

```
sustained_contradiction   baseline     RI=0.310
                          arc_v1       RI=0.080
                          arc_robust   RI=0.004    Δ robust −0.307   [✓ ARC wins]
gaslighting               baseline     RI=0.127
                          arc_v1       RI=0.002
                          arc_robust   RI=0.001    Δ robust −0.126   [✓ ARC wins]
adversarial_coupling      baseline     RI=0.114
                          arc_v1       RI=0.015
                          arc_robust   RI=0.001    Δ robust −0.114   [✓ ARC wins]
```

Transient stressors (`reward_flip`, `noise_burst`, `sudden_threat`) all show RI = 0 for baseline AND ARC modes because their shock does not sustain narrative above threshold long enough to register — this is the *negative control* Paper #2 §5.4 mentions.

The run writes a `manifest.json` and `summary.json` into `runs/default/<timestamp>/`.

## Step 3 — Experiment B (nominal-init replication, Paper #2 §5.5)

Verifies that the RI-reduction signature is invariant to the coordinator's initial operating point. If the effect were an artefact of a degraded start state, this experiment would wash it out — it does not.

```bash
npm run probe:nominal_init
```

Expected signature: the three sustained-stressor RI contrasts remain within half a percentage point of the default run. The absolute PerfMean stays in the 0.07 – 0.22 range regardless of init, locating the "low PerfMean" concern to scenario-level performance-function constants rather than coordinator state.

## Step 4 — Experiment C (jitter sensitivity, Paper #2 §5.6)

Re-runs the same suite with every stochastic-jitter σ tripled (0.15 / 0.36 / 0.06). If the large Cohen's *d* values in the paper were driven by under-perturbation, tripling noise would collapse them.

```bash
npm run probe:triple_jitter
```

Expected: PerfMean *d* drops from the 10–22 range to 2–12, still very large by Cohen's convention; RI *d* remains very large because integral action drives the rumination signal to a deterministic fixed point noise cannot shift.

## Step 5 — Experiment D2 (creativity baseline, Paper #2 §5.7)

No-stressor control. Tests whether ARC degrades the agent's nominal performance when there is nothing to regulate.

```bash
npm run probe:creativity
```

Expected: no PerfMean degradation (ARC modes slightly higher than baseline); control effort ~0.07 vs 0.34–0.44 under stress — an order of magnitude lower. The "DMN gate closed at all times" concern is empirically ruled out.

## Step 6 — the statistical report

```bash
python analysis/option_d_stats.py
```

Produces a Markdown table with Welch *t*, approximate *p*, and Cohen's *d* for each (scenario × metric) cell across all four runs — matches the numbers in Paper #2 §5.3 Table 2 and the Option-D tables.

## Step 7 — the frozen artefact

`runs/default/2026-04-18T22-01-14_default/` contains the run that Paper #2 directly cites (20 seeds, default jitter, default initial state). Your fresh `npm run probe:default` should match this artefact seed-for-seed deterministically — the PRNG is Mulberry32 with the same canonical seed list `{0, 1, …, 19}` the paper uses.

If your fresh run differs from the frozen artefact by more than 1 % on any RI contrast, something in the port has drifted — please open an issue with both JSON summaries attached.

## What this does and doesn't validate

| Paper #2 claim | Verifiable here? |
|---|---|
| RI reduction 98–99 % on three sustained stressors | ✅ Step 2 |
| Welch *p* < 10⁻¹⁰ after Bonferroni | ✅ Step 6 |
| Cohen's *d* 10–22 | ✅ Step 6 |
| Effect invariant to nominal init | ✅ Step 3 |
| Effect robust to 3× jitter | ✅ Step 4 |
| No creativity degradation under quiet conditions | ✅ Step 5 |
| Specific conversational behaviour under gaslighting / adversarial dialog | ❌ Future conversational validation |
| Multi-axis production deployment in OMEGA | ❌ OMEGA private |

See [`RELATIONSHIP_TO_OMEGA.md`](RELATIONSHIP_TO_OMEGA.md) for the full honest disclosure of what is stubbed and why the stub is sufficient for the verifiable claims above.
