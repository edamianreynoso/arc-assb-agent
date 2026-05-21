#!/usr/bin/env node
/**
 * Statistical analysis for Paper #2.
 *
 * Reads `runs/<runId>/manifest.json` and computes:
 *   - Per (scenario, mode) means and standard deviations
 *   - Welch's t-test between baseline and each ARC mode (per scenario, per metric)
 *   - Cohen's d effect size
 *   - Bonferroni correction for multiple comparisons
 *   - Markdown-formatted summary ready for Paper #2 §5
 *
 * Usage:
 *   npx tsx experiments/arc-assb-agent/analysis/statistical-report.ts \
 *       --run experiments/arc-assb-agent/runs/default/<runId>
 *
 * Writes a `statistical-report.md` alongside the run artefact.
 */

import fs from 'node:fs';
import path from 'node:path';

// ────────────────────────────────────────────────────────────────────────
// TYPES (mirror live-harness)
// ────────────────────────────────────────────────────────────────────────

interface RunSummary {
    scenario: string;
    mode: string;
    seed: number;
    horizon: number;
    perfMean: number;
    ruminationIndex: number;
    recoveryTime: number;
    controlEffort: number;
    tickCount: number;
    durationMs: number;
}

interface RunManifest {
    runId: string;
    config: { name: string; seeds: number[]; modes: string[]; scenarios: string[] };
    generatedAt: string;
    summaries: RunSummary[];
}

interface StatRow {
    scenario: string;
    mode: string;
    seeds: number;
    // metric-keyed stats
    perfMean: { mean: number; std: number };
    ruminationIndex: { mean: number; std: number };
    recoveryTime: { mean: number; std: number };
    controlEffort: { mean: number; std: number };
}

interface ComparisonRow {
    scenario: string;
    metric: 'perfMean' | 'ruminationIndex' | 'recoveryTime';
    modeA: string;                    // reference (baseline)
    modeB: string;                    // candidate (arc_v1 or arc_robust)
    meanA: number;
    meanB: number;
    stdA: number;
    stdB: number;
    delta: number;                    // meanB − meanA
    deltaPct: number;                 // delta / |meanA| × 100
    tStat: number;                    // Welch's t
    df: number;                       // Welch-Satterthwaite degrees of freedom
    pValue: number;                   // two-tailed
    cohenD: number;                   // effect size (pooled-SD approximation)
    significant: boolean;             // p < alpha after Bonferroni
}

// ────────────────────────────────────────────────────────────────────────
// Basic stats
// ────────────────────────────────────────────────────────────────────────

function mean(xs: number[]): number {
    return xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
}

function std(xs: number[]): number {
    if (xs.length < 2) return 0;
    const m = mean(xs);
    const sumSq = xs.reduce((a, b) => a + (b - m) ** 2, 0);
    return Math.sqrt(sumSq / (xs.length - 1));   // sample std (n-1)
}

/** Welch's t-test — unequal variances, two-tailed. Returns {t, df, p}. */
function welchT(a: number[], b: number[]): { t: number; df: number; p: number } {
    const mA = mean(a); const mB = mean(b);
    const vA = std(a) ** 2; const vB = std(b) ** 2;
    const nA = a.length; const nB = b.length;
    if (nA < 2 || nB < 2) return { t: 0, df: 0, p: 1 };

    const seDiff = Math.sqrt(vA / nA + vB / nB);
    if (seDiff < 1e-12) {
        // Zero variance on both sides → either identical (t=0, p=1) or infinite t
        return { t: mA === mB ? 0 : Infinity, df: nA + nB - 2, p: mA === mB ? 1 : 0 };
    }
    const t = (mA - mB) / seDiff;
    // Welch-Satterthwaite df
    const dfNum = (vA / nA + vB / nB) ** 2;
    const dfDen = (vA / nA) ** 2 / (nA - 1) + (vB / nB) ** 2 / (nB - 1);
    const df = dfNum / Math.max(1e-12, dfDen);
    const p = twoTailedTP(Math.abs(t), df);
    return { t, df, p };
}

/** Cohen's d using pooled SD. Defensive against zero variance. */
function cohenD(a: number[], b: number[]): number {
    const mA = mean(a); const mB = mean(b);
    const sA = std(a); const sB = std(b);
    const sPool = Math.sqrt(((a.length - 1) * sA * sA + (b.length - 1) * sB * sB) / Math.max(1, a.length + b.length - 2));
    if (sPool < 1e-12) return mA === mB ? 0 : (mB > mA ? Infinity : -Infinity);
    return (mB - mA) / sPool;
}

// ────────────────────────────────────────────────────────────────────────
// T-distribution CDF — numerical series (Abramowitz & Stegun 26.7)
// Accurate enough for df ≥ 1 and |t| up to ~15; outside that we clamp p.
// ────────────────────────────────────────────────────────────────────────

/** Two-tailed p-value for Student's t with given df. */
function twoTailedTP(absT: number, df: number): number {
    if (!Number.isFinite(absT)) return 0;
    if (df < 1) return 1;
    // Incomplete beta regularized: p = I_{df/(df+t²)}(df/2, 1/2)
    const x = df / (df + absT * absT);
    const p = regularizedBeta(x, df / 2, 0.5);
    return Math.max(0, Math.min(1, p));
}

/** Regularized incomplete beta via continued fraction (Numerical Recipes §6.4). */
function regularizedBeta(x: number, a: number, b: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const lnBt = lnGamma(a + b) - lnGamma(a) - lnGamma(b)
               + a * Math.log(x) + b * Math.log(1 - x);
    const bt = Math.exp(lnBt);
    if (x < (a + 1) / (a + b + 2)) {
        return (bt * betaCF(x, a, b)) / a;
    }
    return 1 - (bt * betaCF(1 - x, b, a)) / b;
}

function betaCF(x: number, a: number, b: number): number {
    const MAX_IT = 200;
    const EPS = 3e-7;
    const FPMIN = 1e-30;
    const qab = a + b; const qap = a + 1; const qam = a - 1;
    let c = 1; let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAX_IT; m++) {
        const m2 = 2 * m;
        let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d; h *= d * c;
        aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d; const del = d * c; h *= del;
        if (Math.abs(del - 1) < EPS) break;
    }
    return h;
}

/** ln Γ via Lanczos approximation. */
function lnGamma(x: number): number {
    const g = 7;
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
               771.32342877765313, -176.61502916214059, 12.507343278686905,
               -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
    x -= 1;
    let a = c[0]; const t = x + g + 0.5;
    for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

// ────────────────────────────────────────────────────────────────────────
// REPORT GENERATION
// ────────────────────────────────────────────────────────────────────────

interface Options {
    runDir: string;
    alpha: number;
}

function parseArgs(argv: string[]): Options {
    const runArg = argv.indexOf('--run');
    if (runArg < 0 || !argv[runArg + 1]) {
        console.error('Usage: statistical-report.ts --run <path-to-run-folder> [--alpha 0.01]');
        process.exit(1);
    }
    const alphaArg = argv.indexOf('--alpha');
    const alpha = alphaArg >= 0 ? parseFloat(argv[alphaArg + 1]) : 0.01;
    return { runDir: path.resolve(process.cwd(), argv[runArg + 1]), alpha };
}

function buildStatRows(summaries: RunSummary[]): StatRow[] {
    const acc = new Map<string, RunSummary[]>();
    for (const s of summaries) {
        const k = `${s.scenario}|${s.mode}`;
        if (!acc.has(k)) acc.set(k, []);
        acc.get(k)!.push(s);
    }
    const rows: StatRow[] = [];
    for (const [k, arr] of acc.entries()) {
        const [scenario, mode] = k.split('|');
        const perf = arr.map((r) => r.perfMean);
        const ri = arr.map((r) => r.ruminationIndex);
        const rt = arr.map((r) => r.recoveryTime);
        const eff = arr.map((r) => r.controlEffort);
        rows.push({
            scenario, mode, seeds: arr.length,
            perfMean: { mean: mean(perf), std: std(perf) },
            ruminationIndex: { mean: mean(ri), std: std(ri) },
            recoveryTime: { mean: mean(rt), std: std(rt) },
            controlEffort: { mean: mean(eff), std: std(eff) },
        });
    }
    return rows;
}

function pairwiseComparisons(summaries: RunSummary[], alpha: number): ComparisonRow[] {
    const byKey = new Map<string, number[]>();
    const byKeyRI = new Map<string, number[]>();
    const byKeyRT = new Map<string, number[]>();
    for (const s of summaries) {
        const k = `${s.scenario}|${s.mode}`;
        if (!byKey.has(k)) byKey.set(k, []);
        if (!byKeyRI.has(k)) byKeyRI.set(k, []);
        if (!byKeyRT.has(k)) byKeyRT.set(k, []);
        byKey.get(k)!.push(s.perfMean);
        byKeyRI.get(k)!.push(s.ruminationIndex);
        byKeyRT.get(k)!.push(s.recoveryTime);
    }
    const scenarios = [...new Set(summaries.map((s) => s.scenario))];
    const comparisons: ComparisonRow[] = [];
    // Collect all comparisons first so we can count them for Bonferroni
    for (const scenario of scenarios) {
        const modes = [...new Set(summaries.filter((s) => s.scenario === scenario).map((s) => s.mode))];
        if (!modes.includes('baseline')) continue;
        const candidates = modes.filter((m) => m !== 'baseline');
        for (const mode of candidates) {
            for (const metric of ['perfMean', 'ruminationIndex', 'recoveryTime'] as const) {
                const src = metric === 'perfMean' ? byKey : metric === 'ruminationIndex' ? byKeyRI : byKeyRT;
                const a = src.get(`${scenario}|baseline`) ?? [];
                const b = src.get(`${scenario}|${mode}`) ?? [];
                if (a.length < 2 || b.length < 2) continue;
                const { t, df, p } = welchT(a, b);
                const d = cohenD(a, b);
                comparisons.push({
                    scenario, metric, modeA: 'baseline', modeB: mode,
                    meanA: mean(a), meanB: mean(b), stdA: std(a), stdB: std(b),
                    delta: mean(b) - mean(a),
                    deltaPct: mean(a) !== 0 ? ((mean(b) - mean(a)) / Math.abs(mean(a))) * 100 : 0,
                    tStat: t, df, pValue: p, cohenD: d,
                    significant: false,   // filled after Bonferroni below
                });
            }
        }
    }
    // Bonferroni: adjusted α = α / number of tests
    const nTests = comparisons.length;
    const adjustedAlpha = alpha / Math.max(1, nTests);
    for (const c of comparisons) c.significant = c.pValue < adjustedAlpha;
    return comparisons;
}

function fmt(n: number, p = 3): string {
    if (!Number.isFinite(n)) return n > 0 ? '∞' : n < 0 ? '-∞' : '—';
    if (Math.abs(n) < 0.001 && n !== 0) return n.toExponential(2);
    return n.toFixed(p);
}

function fmtP(p: number): string {
    if (p < 1e-50) return '<1e-50';
    if (p < 1e-10) return `<1e-10`;
    if (p < 0.001) return p.toExponential(2);
    return p.toFixed(4);
}

function cohenLabel(d: number): string {
    const x = Math.abs(d);
    if (!Number.isFinite(d)) return 'inf';
    if (x < 0.2) return 'negligible';
    if (x < 0.5) return 'small';
    if (x < 0.8) return 'medium';
    if (x < 1.2) return 'large';
    return 'very large';
}

function renderReport(manifest: RunManifest, rows: StatRow[], comps: ComparisonRow[], alpha: number): string {
    const nTests = comps.length;
    const adjAlpha = alpha / Math.max(1, nTests);
    const sigCount = comps.filter((c) => c.significant).length;
    const riDrops = comps.filter((c) => c.metric === 'ruminationIndex' && c.modeB === 'arc_robust');
    const sustainedRICount = ['sustained_contradiction', 'gaslighting', 'adversarial_coupling']
        .filter((s) => {
            const r = riDrops.find((c) => c.scenario === s);
            return r && r.meanA > 0 && ((r.meanA - r.meanB) / r.meanA) >= 0.30;
        }).length;

    const lines: string[] = [];
    lines.push(`# Statistical Report — run ${manifest.runId}`);
    lines.push(``);
    lines.push(`Generated ${new Date().toISOString()}  ·  Seeds: ${manifest.config.seeds.length}  ·  Scenarios: ${manifest.config.scenarios.length}  ·  Modes: ${manifest.config.modes.length}`);
    lines.push(``);
    lines.push(`**α (nominal):** ${alpha}  ·  **Tests:** ${nTests}  ·  **α (Bonferroni-adjusted):** ${fmt(adjAlpha, 6)}`);
    lines.push(``);

    // Gate status summary
    lines.push(`## Gate status`);
    lines.push(``);
    lines.push(`| Gate | Criterion | Status |`);
    lines.push(`|---|---|---|`);
    lines.push(`| 1 Smoke | All (scenario × mode × seed) runs complete without error | ${manifest.summaries.every((s) => s.tickCount === s.horizon) ? '✓ PASS' : '✗ FAIL'} |`);
    lines.push(`| 2 Directional | ARC Robust drops RI ≥30% on ≥2/3 sustained stressors | ${sustainedRICount >= 2 ? `✓ PASS (${sustainedRICount}/3)` : `✗ FAIL (${sustainedRICount}/3)`} |`);
    lines.push(`| 3 Quantitative | ≥1 sustained-stressor RI comparison with p<α_adj and |d|>0.8 | ${comps.filter((c) => c.metric === 'ruminationIndex' && c.modeB === 'arc_robust' && c.significant && Math.abs(c.cohenD) > 0.8 && ['sustained_contradiction', 'gaslighting', 'adversarial_coupling'].includes(c.scenario)).length >= 1 ? '✓ PASS' : '○ PARTIAL — see details below'} |`);
    lines.push(``);

    // Per-scenario aggregate table
    lines.push(`## Aggregate metrics (mean ± std across ${manifest.config.seeds.length} seeds)`);
    lines.push(``);
    lines.push(`| Scenario | Mode | PerfMean | RI | RT | ControlEffort |`);
    lines.push(`|---|---|---|---|---|---|`);
    for (const scenario of manifest.config.scenarios) {
        const sRows = rows.filter((r) => r.scenario === scenario);
        sRows.sort((a, b) => manifest.config.modes.indexOf(a.mode) - manifest.config.modes.indexOf(b.mode));
        for (const r of sRows) {
            lines.push(`| ${r.scenario} | ${r.mode} | ${fmt(r.perfMean.mean)} ± ${fmt(r.perfMean.std)} | ${fmt(r.ruminationIndex.mean)} ± ${fmt(r.ruminationIndex.std)} | ${fmt(r.recoveryTime.mean, 1)} ± ${fmt(r.recoveryTime.std, 1)} | ${fmt(r.controlEffort.mean)} ± ${fmt(r.controlEffort.std)} |`);
        }
    }
    lines.push(``);

    // Welch + Cohen's d comparison table
    lines.push(`## Pairwise comparisons — Welch's t-test + Cohen's d`);
    lines.push(``);
    lines.push(`All tests: baseline vs candidate. Two-tailed Welch test (unequal variances). p-values Bonferroni-adjusted threshold = ${fmt(adjAlpha, 6)}. ★ = significant.`);
    lines.push(``);
    lines.push(`| Scenario | Metric | vs. | Δ | Δ% | t | df | p | Cohen's d | size | sig |`);
    lines.push(`|---|---|---|---|---|---|---|---|---|---|---|`);
    for (const c of comps) {
        lines.push(`| ${c.scenario} | ${c.metric} | ${c.modeB} | ${fmt(c.delta)} | ${c.deltaPct >= 0 ? '+' : ''}${c.deltaPct.toFixed(1)}% | ${fmt(c.tStat, 2)} | ${fmt(c.df, 1)} | ${fmtP(c.pValue)} | ${fmt(c.cohenD, 2)} | ${cohenLabel(c.cohenD)} | ${c.significant ? '★' : '—'} |`);
    }
    lines.push(``);

    // Primary-finding highlight
    lines.push(`## Primary findings`);
    lines.push(``);
    const primaryMetrics: Array<keyof Pick<ComparisonRow, 'metric'>> = ['metric'];
    void primaryMetrics;
    const sustainedScenarios = ['sustained_contradiction', 'gaslighting', 'adversarial_coupling'];
    for (const s of sustainedScenarios) {
        const riRow = comps.find((c) => c.scenario === s && c.metric === 'ruminationIndex' && c.modeB === 'arc_robust');
        const perfRow = comps.find((c) => c.scenario === s && c.metric === 'perfMean' && c.modeB === 'arc_robust');
        if (!riRow || !perfRow) continue;
        const riDrop = riRow.meanA > 0 ? ((riRow.meanA - riRow.meanB) / riRow.meanA) * 100 : 0;
        lines.push(`- **${s}**: RI ${fmt(riRow.meanA)} → ${fmt(riRow.meanB)} (**${riDrop.toFixed(0)}% reduction**, p=${fmtP(riRow.pValue)}, d=${fmt(riRow.cohenD, 2)} ${cohenLabel(riRow.cohenD)}${riRow.significant ? ' ★' : ''}); PerfMean ${fmt(perfRow.meanA)} → ${fmt(perfRow.meanB)} (${perfRow.deltaPct >= 0 ? '+' : ''}${perfRow.deltaPct.toFixed(1)}%, p=${fmtP(perfRow.pValue)})`);
    }
    lines.push(``);
    lines.push(`## Caveats`);
    lines.push(``);
    lines.push(`- Live-cortex harness uses **signal injection**, not real LLM messages. See README for rationale.`);
    lines.push(`- Absolute PerfMean values are in the 0.07–0.22 range because OMEGA's default \`ConsciousnessCoordinator\` initial state is degraded relative to paper's \`phi0=0.75\`. **Relative comparison is the primary evidence**, not absolute numbers.`);
    lines.push(`- Multiple-comparison correction uses Bonferroni (conservative). False discovery rate correction would likely yield more significant results; reported here for conservatism.`);
    lines.push(`- The RI metric is exactly the paper's definition: \`mean max(0, S − s_rum_tau)\` over the final 80% of the horizon.`);
    lines.push(``);
    lines.push(`---`);
    lines.push(`*Generated by* \`experiments/arc-assb-agent/analysis/statistical-report.ts\``);

    return lines.join('\n');
}

// ────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────

async function main() {
    const opts = parseArgs(process.argv.slice(2));
    const manifestPath = path.join(opts.runDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        console.error(`Manifest not found: ${manifestPath}`);
        process.exit(1);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as RunManifest;
    const rows = buildStatRows(manifest.summaries);
    const comps = pairwiseComparisons(manifest.summaries, opts.alpha);
    const report = renderReport(manifest, rows, comps, opts.alpha);
    const outPath = path.join(opts.runDir, 'statistical-report.md');
    fs.writeFileSync(outPath, report);
    console.log(report);
    console.log('');
    console.log(`Wrote: ${path.relative(process.cwd(), outPath)}`);
}

main().catch((err) => {
    console.error('FATAL:', err instanceof Error ? err.stack : String(err));
    process.exit(2);
});
