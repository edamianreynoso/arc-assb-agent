# Relationship to OMEGA — honest disclosure

## The short version

Paper #2 deploys the Affective Regulation Core (Paper #1) inside a real cognitive agent called **OMEGA Gen 3.0 "PROMETHEUS"**. OMEGA is a ~4 000-line `ConsciousnessCoordinator` integrating autopoiesis, active inference, strange-loops, DMN, cluster voting, and an ego-identity module. **OMEGA remains a private codebase**.

This repository does not ship OMEGA. It ships:

1. The ARC controller (Paper #1 — already open-source at [`arc-assb-controller`](https://github.com/edamianreynoso/arc-assb-controller)) re-vendored here for self-containment.
2. The state-mapping adapter that translates between OMEGA's coordinator interface and the paper's 10-D `ARCState`.
3. The stressor harness that runs the 20-seed × 6-scenario × 3-mode experiments of Paper #2.
4. A **~150-line `ConsciousnessCoordinator` stub** that implements exactly the three interface methods the harness touches:
   * `coordinator.autopoiesis.getState() / injectStateOverride(deltas)`
   * `coordinator.activeInference.recordPrediction() / reportOutcome()`
   * `coordinator.getState()` → `{homeostasis, freeEnergy, stats}` snapshot

## Why this split exists

OMEGA in full form contains:

* 54 cognitive modules organised into 5 clusters (Limbic, Executive, Temporal, Social, Specialized)
* Multi-provider LLM routing (Claude · OpenAI · Gemini · Z.AI · Ollama local)
* Bridges to Telegram / Discord / WhatsApp / CLI
* Tool registry with 138 live tools
* An ego-identity module with a specific persona
* Commercial-intent sub-systems that are not ready for public release

None of that is required to verify this repository's public numerical pipeline. The scientific contribution tested here is narrower than a full OMEGA deployment claim: **the ARC controller can be mapped into an agent-style coordinator interface and evaluated under reproducible signal-injection stressors**. What makes this observation testable is the *ARC adapter + harness + signal set*, not the private host.

Publishing the full OMEGA codebase before its research/commercial path is clear would:

* distract reviewers from the paper's actual claim (control-theoretic regulation)
* force readers to reason about 54 modules most of which are orthogonal to ARC
* compromise privacy of production sub-systems we're not ready to release

Publishing just the experimental surface, with a transparent stub, is the scientifically honest middle ground.

## What the stub CAN faithfully reproduce

| Paper #2 claim | Reproduced here? | Evidence |
|---|---|---|
| ARC Robust reduces RI on `sustained_contradiction` and `adversarial_coupling` | ✅ | `npm run probe:default` corrected run |
| `gaslighting` is near-threshold / mixed under corrected plant dynamics | ✅ | `npm run probe:default` corrected run |
| Welch/Cohen summary for corrected runs | ✅ | `python analysis/option_d_stats.py` |
| Pareto complement between ARC v1 and ARC Robust | ✅ | `npm run probe:default` shows both modes |
| Experiment B: effect invariant to nominal init | ✅ | `npm run probe:nominal_init` |
| Experiment C: effect robust to 3× stochastic jitter | ✅ | `npm run probe:triple_jitter` |
| Experiment D2: no degradation under no-stressor control | ✅ | `npm run probe:creativity` |

## What the stub CANNOT reproduce

Any claim that depends on OMEGA's emergent cognition is out of scope here:

* DMN thought-stream dynamics
* Strange-loop self-monitoring
* Cluster-voting divergence / agreement
* Ego-identity stability under adversarial pressure
* Conversation-level behaviour with real LLM responses
* Multi-axis control interactions (only *u*<sub>dmg</sub> is wired in Paper #2's production deployment, and even that is outside the scope of this stub — the harness applies all five axes as homeostatic deltas, matching Paper #2's §4 `ARCAdapter`)

Future work will validate ARC against real LLM-authored conversational stressors and/or open-weight model internals. That is a different validity target from Paper #2 and will be reported separately.

## Methodological argument for what the stub validates

Paper #2 Section 5.5 ("Experiment B - Nominal-init replication") tests whether the corrected RI-reduction signature survives a different coordinator operating point. The public stub is calibrated to the same interface and operating point, so it lets reviewers independently verify the controller, adapter, stressor definitions, metrics, statistics, and corrected frozen artefacts without needing the private OMEGA runtime.

Stated differently: the stub validates the public numerical pipeline and the interface contract. It does not prove anything about OMEGA's full emergent behaviour beyond the single-axis signal-injection claim reported in Paper #2. Conversation-level behaviour, live thought-stream dynamics, and full-agent cognition remain separate empirical questions.

## If you want to port ARC into your own agent

`src/arc-adapter.ts` is the template. It reads a coordinator snapshot with the shape

```ts
{
  homeostasis: { arousal, certainty, energy, integrity, curiosity },
  freeEnergy: number,
  stats: { predictionAccuracy, averageSurprise }
}
```

and produces the paper's 10-D `ARCState`. If your agent can expose those fields (even as a light adaptation layer), the same ARC controllers will regulate it without code changes. See `docs/EXTENDING.md` for a worked example (to be added in v1.1).

## Questions

Open an issue at <https://github.com/edamianreynoso/arc-assb-agent/issues> or email <edamianreynoso@gmail.com>. Reviewers validating Paper #2 are especially welcome.
