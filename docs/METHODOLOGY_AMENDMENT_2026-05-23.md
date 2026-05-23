# Methodology Amendment - 2026-05-23

This repository was revised after an internal scientific review identified a
tautological control path in the first public Paper #2 harness.

## What changed

- Removed the direct update `infraStress = infraStress - u_dmg * 0.4 * infraStress`.
- Replaced it with an autonomous narrative-pressure plant. `u_dmg` now updates a
  latent DMN-suppression gate, and that gate affects later narrative dynamics.
- Replaced inert `mf = 0.5` and `ms = 0.5` adapter dimensions with documented
  memory-health proxies derived from available runtime state, while still
  allowing explicit memory signals when a host exposes them.
- Regenerated the default, nominal-init, triple-jitter, and creativity artefacts.
- Removed the earlier April 2026 frozen runs, including the degenerate
  zero-variance artefact.

## Scientific consequence

The corrected harness no longer supports the old "98-99% RI reduction on three
sustained stressors" wording. The defensible result is narrower:

- `sustained_contradiction`: RI 0.147 -> 0.024 with ARC Robust.
- `adversarial_coupling`: RI 0.030 -> 0.003 with ARC Robust.
- `gaslighting`: near-threshold / mixed; not primary RI evidence.

This is a weaker but more credible claim. The public repo now validates the
controller/adapter/harness pipeline and the interface contract. It does not
validate full OMEGA emergent cognition or real conversational behavior.
