# arc-assb-agent

**Reproducibility package for Damián (2026b)** — public ARC controller/adapter harness for a minimal cognitive-coordinator stub.

This repository lets you **re-run the public numerical pipeline** for Paper #2 against a minimal public coordinator stub that exposes the interface the ARC harness depends on. It does *not* publish the full OMEGA Gen 3.0 cognitive agent — see [`docs/RELATIONSHIP_TO_OMEGA.md`](docs/RELATIONSHIP_TO_OMEGA.md) for an honest account of what's simulated and what isn't.

Methodology note: this repo includes a post-review correction that removes a direct `u_dmg -> infraStress` control path. See [`docs/METHODOLOGY_AMENDMENT_2026-05-23.md`](docs/METHODOLOGY_AMENDMENT_2026-05-23.md).

> 📄 **Companion paper #1** (theory + 10-D simulation benchmark): [Damián (2026a) on Zenodo — DOI 10.5281/zenodo.19667778](https://doi.org/10.5281/zenodo.19667778) · code at [`edamianreynoso/arc-assb-controller`](https://github.com/edamianreynoso/arc-assb-controller)
>
> 📄 **Paper #2** (this repo's target): *to be uploaded on TechRxiv / Zenodo; DOI will be added here on release.*

---

## TL;DR — what this repo produces

Running `npm run probe:default` on this repo reproduces the corrected post-review harness. The key methodological change is that `u_dmg` no longer overwrites `infraStress` directly; it updates a latent DMN-suppression gate, while narrative pressure evolves through autonomous plant dynamics.

| Scenario | RI baseline | RI ARC Robust | Interpretation |
|---|---|---|---|
| `sustained_contradiction` | 0.147 | 0.024 | Primary positive RI reduction: **83.4 %** |
| `adversarial_coupling` | 0.030 | 0.003 | Primary positive RI reduction: **89.2 %** |
| `gaslighting` | 0.00010 | 0.00000 | Near-threshold / mixed: not primary RI evidence |
| `reward_flip` · `noise_burst` · `sudden_threat` | 0.000 | 0.000 | Transient negative controls |

Three supplementary experiments from Paper #2 (`Option D`) are included:

* `nominal_init` — re-runs with the coordinator initialised to the Paper #1 nominal operating point
* `triple_jitter` — 3 × stochastic-perturbation σ sensitivity
* `creativity_baseline` — no-stressor control

## Quick start

```bash
git clone https://github.com/edamianreynoso/arc-assb-agent.git
cd arc-assb-agent
npm install

# 1) 39-test unit suite — controller and adapter contract checks
npm test

# 2) smoke: 1 seed × 3 scenarios × 2 modes (finishes in ~1 second)
npm run probe:smoke

# 3) default: 20 seeds × 6 scenarios × 3 modes (finishes in ~1 second on the stub)
npm run probe:default

# 4) Paper #2 supplementary experiments
npm run probe:nominal_init
npm run probe:triple_jitter
npm run probe:creativity

# 5) statistical report (Welch / Cohen's d) over the latest runs/
python analysis/option_d_stats.py
```

## What's in this repo

```
src/
  arc-regulator.ts          # ARC v1 (proportional) + ARC Robust (H∞-motivated)
                            # — ported verbatim from Paper #1, 0 internal deps
  arc-adapter.ts            # ConsciousnessSnapshot → 10-D ARCState mapping
  consciousness-stub/       # 150-line minimal stub of the coordinator interface
                            # (see docs/RELATIONSHIP_TO_OMEGA.md)
  harness/
    live-harness.ts         # 20-seed × N-scenario × M-mode experiment runner
    run-live.ts             # CLI entry-point
  logger.ts                 # inlined scoped logger (no OMEGA runtime dependency)

configs/                    # experiment configurations (see Paper #2 §5)
  default.json
  smoke.json
  nominal_init.json         # Experiment B
  triple_jitter.json        # Experiment C
  creativity_baseline.json  # Experiment D2

scenarios/                  # stressor definitions (Paper #1 §5.1 / Paper #2 §3)
  reward_flip.json · noise_burst.json · sudden_threat.json
  sustained_contradiction.json · gaslighting.json · adversarial_coupling.json
  nominal_quiet.json        # control for Experiment D2

analysis/
  option_d_stats.py         # Welch + Cohen's d for latest run artefacts
  generate-figures.ts       # SVG figure generator used in Paper #2
  statistical-report.ts
  svg-to-pdf.ts

tests/
  arc-regulator.test.ts     # 19 tests — matches Paper #1's Python reference
  arc-adapter.test.ts       # 20 tests — adapter contract

runs/                       # corrected frozen artefacts for the public harness
```

## Citation

```bibtex
@software{Damian2026arc-agent,
  author  = {Dami{\'a}n Reynoso, J. Eduardo},
  title   = {{arc-assb-agent}: minimal reproducibility harness for
             Affective Regulation Core deployment in a cognitive-coordinator stub},
  year    = {2026},
  version = {1.0.0},
  url     = {https://github.com/edamianreynoso/arc-assb-agent},
  note    = {Companion code for Damián (2026b). DOI to be added on release.}
}

@article{Damian2026a,
  author  = {Dami{\'a}n Reynoso, J. Eduardo},
  title   = {Affective Regulation Core: A Homeostatic Control Framework
             for Stable and Safe AI Agents},
  year    = {2026},
  journal = {Zenodo preprint},
  doi     = {10.5281/zenodo.19667778},
  url     = {https://doi.org/10.5281/zenodo.19667778}
}
```

## License

Apache 2.0 — see [`LICENSE`](LICENSE).

## Honest disclosure

This repository publishes the *experimental surface* of Paper #2 (controller + adapter + harness + scenarios + frozen run artefacts + analysis). It does **not** publish the full [OMEGA Gen 3.0 "PROMETHEUS"](https://github.com/edamianreynoso) cognitive agent that Paper #2 deploys ARC into. Instead, it ships a **minimal coordinator stub** (~150 lines) that exposes the methods the harness needs — enough to reproduce the public numerical pipeline and interface contract, but **not** enough to observe the live agent's emergent cognition, DMN thought stream, cluster-voting dynamics, or ego-identity behaviour.

The rationale for this split, and what it does and does not imply about the paper's claims, is documented in [`docs/RELATIONSHIP_TO_OMEGA.md`](docs/RELATIONSHIP_TO_OMEGA.md). The stub validates the public numerical pipeline and the interface contract; it does not expose or validate OMEGA's full emergent cognition.

Future work will validate ARC against real LLM-authored conversational stressors and/or open-weight model internals.
