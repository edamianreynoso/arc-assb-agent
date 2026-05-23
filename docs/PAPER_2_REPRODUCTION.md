# Paper #2 reproduction — step by step

This document walks through the exact sequence of commands that reproduces the corrected public numerical pipeline for the Paper #2 preprint draft *"Embodied Affective Regulation: An Initial Single-Axis Deployment of the Affective Regulation Core (DMN Suppression Pathway) in a Live LLM-Based Cognitive Agent"* (Damián 2026b).

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

Paper #1 defines ARC v1 (proportional) and ARC Robust (H∞-motivated) as a reference Python implementation. This repo re-ports them to TypeScript and the 39 unit tests verify controller and adapter contracts.

```bash
npm test
```

Expected: **39 passed / 0 failed**. If any fails, something about the controller ports or adapter mapping is drifting — stop here and open an issue.

## Step 2 — the corrected headline result (§5.3 of the paper draft)

```bash
npm run probe:default
```

Configuration: 20 seeds × 6 scenarios × 3 modes × 160 steps. Expected output (within ±0.005 on all RI cells):

```
sustained_contradiction   baseline     RI=0.147
                          arc_v1       RI=0.075
                          arc_robust   RI=0.024    Δ robust -0.123   [primary positive]
adversarial_coupling      baseline     RI=0.030
                          arc_v1       RI=0.005
                          arc_robust   RI=0.003    Δ robust -0.027   [primary positive]
gaslighting               baseline     RI=0.00010
                          arc_v1       RI=0.00000
                          arc_robust   RI=0.00000 [near-threshold / mixed]
```

Transient stressors (`reward_flip`, `noise_burst`, `sudden_threat`) all show RI = 0 for baseline AND ARC modes because their shock does not sustain narrative above threshold long enough to register — this is the negative control. The oscillating `gaslighting` scenario is now treated as near-threshold rather than primary RI evidence.

The run writes a `manifest.json` and `summary.json` into `runs/default/<timestamp>/`.

## Step 3 — Experiment B (nominal-init replication, Paper #2 §5.5)

Verifies whether the corrected RI-reduction signature survives a different coordinator initial operating point. The two primary RI positives (`sustained_contradiction`, `adversarial_coupling`) remain positive.

```bash
npm run probe:nominal_init
```

Expected signature: `sustained_contradiction` stays near 0.147 -> 0.024 RI and `adversarial_coupling` near 0.030 -> 0.003 RI. Absolute PerfMean is higher under nominal init, so PerfMean should be interpreted as a host/scenario proxy rather than an external task-performance measure.

## Step 4 — Experiment C (jitter sensitivity, Paper #2 §5.6)

Re-runs the same suite with every stochastic-jitter σ tripled (0.15 / 0.36 / 0.06). This checks whether the corrected RI pattern survives materially stronger perturbation.

```bash
npm run probe:triple_jitter
```

Expected: the two primary RI positives survive under tripled jitter, but effect sizes are lower. In the corrected harness, this is a sensitivity check, not evidence for 98-99% complete separation.

## Step 5 — Experiment D2 (creativity baseline, Paper #2 §5.7)

No-stressor control. Tests whether ARC degrades the agent's nominal performance when there is nothing to regulate.

```bash
npm run probe:creativity
```

Expected: no RI appears under quiet conditions. ARC modes may show modest PerfMean differences because PerfMean is a synthetic state-derived proxy; the important control check is that the no-stressor run does not create sustained rumination.

## Step 6 — the statistical report

```bash
python analysis/option_d_stats.py
```

Produces a Markdown table with Welch *t*, approximate *p*, and Cohen's *d* for the newest default, nominal-init, triple-jitter, and creativity runs.

## Step 7 — the frozen artefact

`runs/default/2026-05-23T02-09-20_default/` contains the corrected default run (20 seeds, default jitter, default initial state). Your fresh `npm run probe:default` should match this artefact seed-for-seed deterministically except for the timestamped run directory name — the PRNG is Mulberry32 with the same canonical seed list `{0, 1, …, 19}`.

If your fresh run differs from the corrected artefact by more than 1 % on any primary RI contrast, something in the port has drifted — please open an issue with both JSON summaries attached.

## What this does and doesn't validate

| Paper #2 claim | Verifiable here? |
|---|---|
| RI reduction on `sustained_contradiction` and `adversarial_coupling` | ✅ Step 2 |
| `gaslighting` near-threshold / mixed under corrected plant dynamics | ✅ Step 2 |
| Welch/Cohen summary for corrected runs | ✅ Step 6 |
| Effect invariant to nominal init | ✅ Step 3 |
| Effect robust to 3× jitter | ✅ Step 4 |
| No creativity degradation under quiet conditions | ✅ Step 5 |
| Specific conversational behaviour under gaslighting / adversarial dialog | ❌ Future conversational validation |
| Multi-axis production deployment in OMEGA | ❌ OMEGA private |

See [`RELATIONSHIP_TO_OMEGA.md`](RELATIONSHIP_TO_OMEGA.md) for the full honest disclosure of what is stubbed and why the stub is sufficient for the verifiable claims above.
