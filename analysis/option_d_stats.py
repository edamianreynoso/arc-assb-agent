#!/usr/bin/env python3
"""
Generate statistical-report tables for the default Paper #2 run and the
Option-D experimental additions:
  A (default), B (nominal_init), C (triple_jitter), D2 (creativity_baseline).

Reads the manifest.json of each run, computes per-(scenario, mode, metric)
aggregates plus Welch t-tests and Cohen's d for the primary baseline-vs-ARC
contrasts, and emits a Markdown table the paper LaTeX can be built from.
"""

from __future__ import annotations

import json
import math
import os
import sys
from pathlib import Path


def welch_t(a: list[float], b: list[float]) -> tuple[float, float, float]:
    """Return (t, df, p_approx) for Welch's two-sample t-test.

    Uses Welch-Satterthwaite df and a two-sided normal approximation for p
    (accurate enough for |t| > 3; for very large t we clamp to 1e-300)."""
    na, nb = len(a), len(b)
    if na < 2 or nb < 2:
        return (float("nan"), float("nan"), float("nan"))
    ma = sum(a) / na
    mb = sum(b) / nb
    va = sum((x - ma) ** 2 for x in a) / (na - 1) if na > 1 else 0.0
    vb = sum((x - mb) ** 2 for x in b) / (nb - 1) if nb > 1 else 0.0
    se2 = va / na + vb / nb
    if se2 <= 0:
        if ma == mb:
            return (0.0, float("nan"), 1.0)
        return (float("inf"), float("nan"), 1e-300)
    t = (ma - mb) / math.sqrt(se2)
    num = (va / na + vb / nb) ** 2
    denom = (va * va) / (na * na * (na - 1)) + (vb * vb) / (nb * nb * (nb - 1))
    df = num / denom if denom > 0 else float("nan")
    # Normal-approximation two-sided p-value
    try:
        z = abs(t)
        p = 2 * (1.0 - 0.5 * (1 + math.erf(z / math.sqrt(2))))
        p = max(p, 1e-300)
    except Exception:
        p = float("nan")
    return (t, df, p)


def cohens_d(a: list[float], b: list[float]) -> float:
    na, nb = len(a), len(b)
    if na < 2 or nb < 2:
        return float("nan")
    ma = sum(a) / na
    mb = sum(b) / nb
    va = sum((x - ma) ** 2 for x in a) / (na - 1)
    vb = sum((x - mb) ** 2 for x in b) / (nb - 1)
    s = ((na - 1) * va + (nb - 1) * vb) / (na + nb - 2)
    if s <= 0:
        return float("inf") if ma != mb else 0.0
    return (ma - mb) / math.sqrt(s)


def group_by(summaries: list[dict], *keys: str) -> dict[tuple, list[dict]]:
    out: dict[tuple, list[dict]] = {}
    for s in summaries:
        k = tuple(s[x] for x in keys)
        out.setdefault(k, []).append(s)
    return out


def fmt(x: float, prec: int = 3) -> str:
    if isinstance(x, float):
        if math.isnan(x):
            return "—"
        if not math.isfinite(x):
            return "∞"
        if abs(x) < 10 ** (-prec) and x != 0:
            return f"{x:.2e}"
        return f"{x:.{prec}f}"
    return str(x)


def analyze_run(run_dir: Path, label: str) -> list[str]:
    manifest_path = run_dir / "manifest.json"
    if not manifest_path.exists():
        return [f"(missing manifest: {manifest_path})"]
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    summaries = manifest["summaries"]
    by = group_by(summaries, "scenario", "mode")

    scenarios = sorted({s["scenario"] for s in summaries})
    modes = [m for m in ["baseline", "arc_v1", "arc_robust"]
             if any(s["mode"] == m for s in summaries)]

    lines = [f"### {label}", ""]
    lines.append("| Scenario | Metric | Baseline | ARC v1 | ARC Robust | d(baseline vs arc_robust) | p (Welch, approx) |")
    lines.append("|---|---|---|---|---|---|---|")
    for sc in scenarios:
        for metric_label, metric_key in [
            ("PerfMean", "perfMean"),
            ("RI", "ruminationIndex"),
            ("Effort", "controlEffort"),
        ]:
            base_vals = [s[metric_key] for s in by.get((sc, "baseline"), [])]
            v1_vals = [s[metric_key] for s in by.get((sc, "arc_v1"), [])]
            robust_vals = [s[metric_key] for s in by.get((sc, "arc_robust"), [])]
            base_m = sum(base_vals) / len(base_vals) if base_vals else float("nan")
            v1_m = sum(v1_vals) / len(v1_vals) if v1_vals else float("nan")
            robust_m = sum(robust_vals) / len(robust_vals) if robust_vals else float("nan")
            d = cohens_d(base_vals, robust_vals)
            _, _, p = welch_t(base_vals, robust_vals)
            lines.append(
                f"| {sc} | {metric_label} | {fmt(base_m)} | {fmt(v1_m)} | {fmt(robust_m)} | {fmt(d, 2)} | {fmt(p, 3)} |"
            )
    lines.append("")
    return lines


def main() -> int:
    root = Path(__file__).resolve().parent.parent  # experiments/arc-assb-agent
    runs_dir = root / "runs"
    targets = [
        ("runs/default", "A - Default corrected harness"),
        ("runs/nominal_init", "B - Nominal Coordinator Init (Paper #1 operating point)"),
        ("runs/triple_jitter", "C - Triple Jitter Sigma (sensitivity study)"),
        ("runs/creativity_baseline", "D2 - Creativity Baseline (no stressor)"),
    ]
    out_lines = ["# Paper #2 experimental statistical summary", ""]
    for subdir, label in targets:
        base = root / subdir
        if not base.exists():
            out_lines.append(f"(directory missing: {subdir})")
            continue
        # newest run subdir under `base`
        runs = sorted([p for p in base.iterdir() if p.is_dir()])
        if not runs:
            out_lines.append(f"(no runs under {subdir})")
            continue
        latest = runs[-1]
        out_lines.extend(analyze_run(latest, label))

    report = "\n".join(out_lines)
    out_path = root / "analysis" / "option_d_summary.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(report, encoding="utf-8")
    print(report)
    print(f"\nWrote {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
