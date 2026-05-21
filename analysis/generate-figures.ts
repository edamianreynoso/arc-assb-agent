#!/usr/bin/env node
/**
 * Figure generator for Paper #2 (Damián 2026b).
 *
 * Produces 4 publication-quality SVG figures from a frozen run artefact:
 *   1. fig1_ri_trajectory.svg     — RI over time, 3 modes, on sustained_contradiction
 *   2. fig2_perfmean_bars.svg     — PerfMean bar chart across 6 scenarios × 3 modes
 *   3. fig3_integration.svg       — Integration architecture diagram
 *   4. fig4_effect_heatmap.svg    — Effect-size heatmap (scenarios × metric × mode)
 *
 * SVG is chosen over PNG for three reasons: (i) no native dependencies
 * (matplotlib/canvas require Python or libuv build chain); (ii) infinite
 * zoom preserves quality when embedded in LaTeX via `\includegraphics`;
 * (iii) every academic publisher accepts SVG.
 *
 * Usage:
 *   npx tsx experiments/arc-assb-agent/analysis/generate-figures.ts \
 *       --run experiments/arc-assb-agent/runs/default/<runId>
 *
 * Outputs are written to `<runDir>/figures/`.
 */

import fs from 'node:fs';
import path from 'node:path';

// ────────────────────────────────────────────────────────────────────────
// DATA MODEL
// ────────────────────────────────────────────────────────────────────────

interface RunSummary {
    scenario: string;
    mode: string;
    seed: number;
    perfMean: number;
    ruminationIndex: number;
    recoveryTime: number;
    controlEffort: number;
    tickCount: number;
}

interface StepRecord {
    t: number;
    state: { s: number; a: number; u: number; phi: number; g: number; p: number; i: number; v: number; mf: number; ms: number };
    action: { u_dmg: number; u_att: number; u_mem: number; u_calm: number; u_reapp: number };
    perf: number;
    rumination: number;
}

interface Manifest {
    runId: string;
    config: {
        name: string;
        seeds: number[];
        horizon: number;
        shockT: number;
        burstLen: number;
        modes: string[];
        scenarios: string[];
    };
    summaries: RunSummary[];
}

// ────────────────────────────────────────────────────────────────────────
// STATS HELPERS
// ────────────────────────────────────────────────────────────────────────

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const std  = (xs: number[]) => {
    if (xs.length < 2) return 0;
    const m = mean(xs);
    return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};

/** Aggregate per (scenario, mode): mean and std across seeds. */
function aggregate(summaries: RunSummary[]) {
    const groups = new Map<string, RunSummary[]>();
    for (const s of summaries) {
        const k = `${s.scenario}|${s.mode}`;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(s);
    }
    const out = new Map<string, { meanRI: number; stdRI: number; meanPerf: number; stdPerf: number }>();
    for (const [k, g] of groups.entries()) {
        const ri = g.map((x) => x.ruminationIndex);
        const pf = g.map((x) => x.perfMean);
        out.set(k, { meanRI: mean(ri), stdRI: std(ri), meanPerf: mean(pf), stdPerf: std(pf) });
    }
    return out;
}

// ────────────────────────────────────────────────────────────────────────
// SVG primitives
// ────────────────────────────────────────────────────────────────────────

function svgOpen(w: number, h: number, title: string): string {
    return [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        // Explicit width/height + viewBox so the SVG sizes correctly both when
        // embedded inline in HTML and when included as a standalone image in LaTeX.
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="-apple-system, 'Segoe UI', system-ui, sans-serif" font-size="11">`,
        `<title>${title}</title>`,
        // Paper-ready light background + subtle grid color palette
        `<defs>`,
        `  <style>`,
        `    .title { font-size: 13px; font-weight: 600; fill: #111; }`,
        `    .subtitle { font-size: 10px; fill: #555; }`,
        `    .axis { stroke: #333; stroke-width: 1; fill: none; }`,
        `    .grid { stroke: #eaeaea; stroke-width: 0.5; fill: none; }`,
        `    .label { fill: #333; }`,
        `    .tick { font-size: 9px; fill: #666; }`,
        `    .legend-text { font-size: 10px; fill: #222; }`,
        `    .annotation { font-size: 9px; fill: #7a5a00; font-style: italic; }`,
        `  </style>`,
        `</defs>`,
        `<rect width="${w}" height="${h}" fill="white"/>`,
    ].join('\n');
}

function svgClose(): string { return `</svg>`; }

/** Polyline from (x,y) pairs in data space, projected to SVG space. */
function polyline(
    pts: Array<[number, number]>,
    xScale: (x: number) => number,
    yScale: (y: number) => number,
    stroke: string,
    strokeWidth: number,
    extra: string = '',
): string {
    const d = pts.map(([x, y]) => `${xScale(x).toFixed(1)},${yScale(y).toFixed(1)}`).join(' ');
    return `<polyline points="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}

// ────────────────────────────────────────────────────────────────────────
// FIGURE 1 — RI trajectory on sustained_contradiction
// ────────────────────────────────────────────────────────────────────────

function fig1_RIT(runDir: string, manifest: Manifest): string {
    const horizon = manifest.config.horizon;
    const shockT = manifest.config.shockT;
    const w = 640, h = 360;
    const pad = { left: 60, right: 140, top: 50, bottom: 40 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const xScale = (t: number) => pad.left + (t / horizon) * plotW;
    const yMax = 0.5;
    const yScale = (y: number) => pad.top + (1 - Math.min(yMax, y) / yMax) * plotH;

    // Average RI trajectory across seeds for each mode
    const modeColors: Record<string, string> = {
        baseline: '#d23f5a',
        arc_v1: '#f2a43c',
        arc_robust: '#2b8ea7',
    };
    const modes = ['baseline', 'arc_v1', 'arc_robust'];
    const scenario = 'sustained_contradiction';

    const lines: string[] = [svgOpen(w, h, 'ARC RI trajectory — sustained_contradiction')];

    // Title
    lines.push(`<text class="title" x="${pad.left}" y="22">Rumination Index over time — sustained_contradiction</text>`);
    lines.push(`<text class="subtitle" x="${pad.left}" y="38">Mean across 20 seeds · shock at t=${shockT} · live ConsciousnessCoordinator</text>`);

    // Grid
    for (let yi = 0; yi <= 5; yi++) {
        const yVal = (yi / 5) * yMax;
        const y = yScale(yVal);
        lines.push(`<line class="grid" x1="${pad.left}" y1="${y.toFixed(1)}" x2="${pad.left + plotW}" y2="${y.toFixed(1)}"/>`);
        lines.push(`<text class="tick" x="${pad.left - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end">${yVal.toFixed(2)}</text>`);
    }
    for (let xi = 0; xi <= 8; xi++) {
        const xVal = (xi / 8) * horizon;
        const x = xScale(xVal);
        lines.push(`<line class="grid" x1="${x.toFixed(1)}" y1="${pad.top}" x2="${x.toFixed(1)}" y2="${pad.top + plotH}"/>`);
        lines.push(`<text class="tick" x="${x.toFixed(1)}" y="${pad.top + plotH + 14}" text-anchor="middle">${xVal.toFixed(0)}</text>`);
    }

    // Shock annotation line
    const xShock = xScale(shockT);
    lines.push(`<line x1="${xShock.toFixed(1)}" y1="${pad.top}" x2="${xShock.toFixed(1)}" y2="${pad.top + plotH}" stroke="#999" stroke-width="1" stroke-dasharray="3,3"/>`);
    lines.push(`<text class="annotation" x="${(xShock + 5).toFixed(1)}" y="${(pad.top + 12).toFixed(1)}">shock onset</text>`);

    // For each mode, compute step-averaged rumination across seeds
    for (const mode of modes) {
        const perSeedSeries: number[][] = [];
        for (const seed of manifest.config.seeds) {
            const tsPath = path.join(runDir, `timeseries_${scenario}_${mode}_seed-${seed}.json`);
            if (!fs.existsSync(tsPath)) continue;
            const ts = JSON.parse(fs.readFileSync(tsPath, 'utf-8')) as StepRecord[];
            perSeedSeries.push(ts.map((s) => s.rumination));
        }
        if (perSeedSeries.length === 0) continue;
        // Transpose: for each t, average across seeds
        const stepAvg: Array<[number, number]> = [];
        for (let t = 0; t < horizon; t++) {
            const vals = perSeedSeries.map((s) => s[t] ?? 0);
            stepAvg.push([t, mean(vals)]);
        }
        lines.push(polyline(stepAvg, xScale, yScale, modeColors[mode], 1.8, 'opacity="0.95"'));
    }

    // Axis labels
    lines.push(`<text class="label" x="${pad.left + plotW / 2}" y="${h - 8}" text-anchor="middle">time step (t)</text>`);
    lines.push(`<text class="label" x="${pad.left - 42}" y="${pad.top + plotH / 2}" text-anchor="middle" transform="rotate(-90 ${pad.left - 42} ${pad.top + plotH / 2})">Rumination = [S − s_rum_τ]⁺</text>`);

    // Legend (right column)
    const lx = pad.left + plotW + 16;
    const ly0 = pad.top + 10;
    modes.forEach((mode, i) => {
        const ly = ly0 + i * 20;
        lines.push(`<line x1="${lx}" y1="${ly}" x2="${lx + 18}" y2="${ly}" stroke="${modeColors[mode]}" stroke-width="2.5"/>`);
        lines.push(`<text class="legend-text" x="${lx + 24}" y="${ly + 4}">${mode}</text>`);
    });

    // Box
    lines.push(`<rect class="axis" x="${pad.left}" y="${pad.top}" width="${plotW}" height="${plotH}"/>`);

    lines.push(svgClose());
    return lines.join('\n');
}

// ────────────────────────────────────────────────────────────────────────
// FIGURE 2 — PerfMean bar chart, grouped by scenario
// ────────────────────────────────────────────────────────────────────────

function fig2_perfBars(manifest: Manifest): string {
    const w = 760, h = 380;
    const pad = { left: 60, right: 140, top: 50, bottom: 80 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const scenarios = manifest.config.scenarios;
    const modes = ['baseline', 'arc_v1', 'arc_robust'];
    const modeColors: Record<string, string> = {
        baseline: '#d23f5a',
        arc_v1: '#f2a43c',
        arc_robust: '#2b8ea7',
    };

    const agg = aggregate(manifest.summaries);
    const yMax = 0.25;  // perfMean is in 0.07–0.22 range → 0.25 safe ceiling
    const yScale = (y: number) => pad.top + (1 - Math.min(yMax, y) / yMax) * plotH;

    const groupW = plotW / scenarios.length;
    const barW = (groupW * 0.7) / modes.length;
    const barGap = (groupW * 0.3) / 2;

    const lines: string[] = [svgOpen(w, h, 'ARC PerfMean bars')];
    lines.push(`<text class="title" x="${pad.left}" y="22">PerfMean across ASSB stressors — 20 seeds per cell</text>`);
    lines.push(`<text class="subtitle" x="${pad.left}" y="38">Error bars: ±1 SD · live ConsciousnessCoordinator · ARC Robust = H∞-inspired (Damián 2026a §4.3.6)</text>`);

    // Y grid + ticks
    for (let yi = 0; yi <= 5; yi++) {
        const yVal = (yi / 5) * yMax;
        const y = yScale(yVal);
        lines.push(`<line class="grid" x1="${pad.left}" y1="${y.toFixed(1)}" x2="${pad.left + plotW}" y2="${y.toFixed(1)}"/>`);
        lines.push(`<text class="tick" x="${pad.left - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end">${yVal.toFixed(2)}</text>`);
    }

    // Bars
    scenarios.forEach((scen, si) => {
        const gx = pad.left + si * groupW;
        modes.forEach((mode, mi) => {
            const k = `${scen}|${mode}`;
            const s = agg.get(k);
            if (!s) return;
            const bx = gx + barGap + mi * barW;
            const bh = (Math.min(yMax, s.meanPerf) / yMax) * plotH;
            const by = pad.top + plotH - bh;
            lines.push(`<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${(barW - 1).toFixed(1)}" height="${bh.toFixed(1)}" fill="${modeColors[mode]}" opacity="0.9"/>`);
            // Error bar
            const ebTop = yScale(s.meanPerf + s.stdPerf);
            const ebBot = yScale(Math.max(0, s.meanPerf - s.stdPerf));
            const ebX = bx + (barW - 1) / 2;
            lines.push(`<line x1="${ebX.toFixed(1)}" y1="${ebTop.toFixed(1)}" x2="${ebX.toFixed(1)}" y2="${ebBot.toFixed(1)}" stroke="#111" stroke-width="0.8"/>`);
            lines.push(`<line x1="${(ebX - 3).toFixed(1)}" y1="${ebTop.toFixed(1)}" x2="${(ebX + 3).toFixed(1)}" y2="${ebTop.toFixed(1)}" stroke="#111" stroke-width="0.8"/>`);
            lines.push(`<line x1="${(ebX - 3).toFixed(1)}" y1="${ebBot.toFixed(1)}" x2="${(ebX + 3).toFixed(1)}" y2="${ebBot.toFixed(1)}" stroke="#111" stroke-width="0.8"/>`);
        });
        // Scenario label (rotated, abbreviated)
        const labelX = gx + groupW / 2;
        const labelY = pad.top + plotH + 12;
        const abbr = scen.length > 14 ? scen.slice(0, 12) + '…' : scen;
        lines.push(`<text class="tick" x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="end" transform="rotate(-35 ${labelX.toFixed(1)} ${labelY.toFixed(1)})">${abbr}</text>`);
    });

    // Legend
    const lx = pad.left + plotW + 16;
    const ly0 = pad.top + 10;
    modes.forEach((mode, i) => {
        const ly = ly0 + i * 22;
        lines.push(`<rect x="${lx}" y="${ly - 8}" width="14" height="12" fill="${modeColors[mode]}" opacity="0.9"/>`);
        lines.push(`<text class="legend-text" x="${lx + 20}" y="${ly + 2}">${mode}</text>`);
    });

    // Labels + box
    lines.push(`<text class="label" x="${pad.left - 42}" y="${pad.top + plotH / 2}" text-anchor="middle" transform="rotate(-90 ${pad.left - 42} ${pad.top + plotH / 2})">PerfMean</text>`);
    lines.push(`<rect class="axis" x="${pad.left}" y="${pad.top}" width="${plotW}" height="${plotH}"/>`);

    lines.push(svgClose());
    return lines.join('\n');
}

// ────────────────────────────────────────────────────────────────────────
// FIGURE 3 — Integration architecture diagram
// ────────────────────────────────────────────────────────────────────────

function fig3_integration(): string {
    const w = 720, h = 360;
    const lines: string[] = [svgOpen(w, h, 'ARC adapter integration in OMEGA')];
    lines.push(`<text class="title" x="20" y="22">ARC adapter integration in OMEGA Gen 3.0 — Phase 2 active (u_dmg routed)</text>`);
    lines.push(`<text class="subtitle" x="20" y="38">Opt-in via OMEGA_ARC_APPLY=1; other action axes observed but not yet routed.</text>`);

    // Box colors per group
    const colors = {
        omega: '#2b8ea7',
        ctrl: '#f2a43c',
        sub: '#6c47a6',
        data: '#7c7c7c',
    };

    // Helper: rounded box
    const box = (x: number, y: number, w: number, h: number, color: string, label: string, sub?: string) => {
        const out: string[] = [];
        out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" ry="6" fill="${color}" opacity="0.12" stroke="${color}" stroke-width="1.5"/>`);
        out.push(`<text x="${x + w / 2}" y="${y + 18}" text-anchor="middle" font-weight="600" fill="${color}" font-size="11">${label}</text>`);
        if (sub) out.push(`<text x="${x + w / 2}" y="${y + 34}" text-anchor="middle" fill="#444" font-size="9">${sub}</text>`);
        return out.join('\n');
    };

    const arrow = (x1: number, y1: number, x2: number, y2: number, color: string, label?: string) => {
        const out: string[] = [];
        out.push(`<defs><marker id="arr-${color.replace('#','')}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${color}"/></marker></defs>`);
        out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.6" marker-end="url(#arr-${color.replace('#','')})"/>`);
        if (label) {
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            out.push(`<rect x="${mx - 24}" y="${my - 14}" width="48" height="14" rx="3" ry="3" fill="white" opacity="0.9"/>`);
            out.push(`<text x="${mx}" y="${my - 3}" text-anchor="middle" font-size="9" fill="${color}">${label}</text>`);
        }
        return out.join('\n');
    };

    // Left: OMEGA state
    lines.push(box(30, 80, 210, 100, colors.omega, 'ConsciousnessCoordinator',
        'homeostasis · freeEnergy · stats'));
    lines.push(`<text x="135" y="130" text-anchor="middle" font-size="10" fill="#333">Φ G P I S V A</text>`);
    lines.push(`<text x="135" y="148" text-anchor="middle" font-size="10" fill="#333">Mf Ms U</text>`);
    lines.push(`<text x="135" y="170" text-anchor="middle" font-size="9" fill="#999">(OMEGA runtime state)</text>`);

    // Middle: Adapter
    lines.push(box(290, 60, 150, 90, colors.data, 'ARCAdapter', 'buildARCState()'));
    lines.push(`<text x="365" y="120" text-anchor="middle" font-size="9" fill="#555">shadow | active</text>`);
    lines.push(`<text x="365" y="135" text-anchor="middle" font-size="9" fill="#555">getLastDecision()</text>`);

    // Middle-right: Controller
    lines.push(box(290, 200, 150, 90, colors.ctrl, 'ARC Controller',
        'v1 (P) | robust (H∞+I)'));
    lines.push(`<text x="365" y="260" text-anchor="middle" font-size="10" fill="#333">u_dmg · u_att · u_mem</text>`);
    lines.push(`<text x="365" y="277" text-anchor="middle" font-size="10" fill="#333">u_calm · u_reapp</text>`);

    // Right: DMN subsystem
    lines.push(box(500, 60, 190, 110, colors.sub, 'DefaultModeNetwork',
        'setARCSuppressionLevel(u)'));
    lines.push(`<text x="595" y="120" text-anchor="middle" font-size="9" fill="#555">graded prob. gate on</text>`);
    lines.push(`<text x="595" y="135" text-anchor="middle" font-size="9" fill="#555">generateSpontaneousThought()</text>`);
    lines.push(`<text x="595" y="152" text-anchor="middle" font-size="9" fill="#7a5a00" font-style="italic">Phase 2 — active</text>`);

    // Right lower: other subsystems (observed only)
    lines.push(box(500, 200, 190, 100, '#aaa', 'Other subsystems',
        'arousal · memory · attention'));
    lines.push(`<text x="595" y="260" text-anchor="middle" font-size="9" fill="#555">observed via decision record</text>`);
    lines.push(`<text x="595" y="275" text-anchor="middle" font-size="9" fill="#999" font-style="italic">(Phase 3+ wiring)</text>`);

    // Arrows
    lines.push(arrow(240, 120, 290, 105, '#2b8ea7', 'state'));
    lines.push(arrow(365, 150, 365, 200, '#7c7c7c'));
    lines.push(arrow(440, 245, 500, 245, '#6c47a6', 'u_* (obs)'));
    lines.push(arrow(440, 220, 500, 110, '#f2a43c', 'u_dmg (active)'));

    // Footer annotation
    lines.push(`<text x="20" y="${h - 14}" font-size="9" fill="#666">OMEGA_ARC_APPLY=1 → adapter.applyAction(action) routes u_dmg to setARCSuppressionLevel; remaining four axes continue observe-only.</text>`);

    lines.push(svgClose());
    return lines.join('\n');
}

// ────────────────────────────────────────────────────────────────────────
// FIGURE 4 — Effect-size heatmap (scenarios × metrics × modes)
// ────────────────────────────────────────────────────────────────────────

function fig4_effectHeatmap(manifest: Manifest): string {
    const w = 680, h = 370;
    const pad = { left: 170, right: 80, top: 95, bottom: 30 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const scenarios = manifest.config.scenarios;
    const modes = ['arc_v1', 'arc_robust'];  // 2 candidate modes vs baseline
    const metrics = ['perfMean', 'ruminationIndex'];  // primary 2

    // Compute Cohen's d per cell (scenario × metric × mode)
    const summaries = manifest.summaries;
    const getVals = (scn: string, mode: string, metric: string) =>
        summaries.filter((s) => s.scenario === scn && s.mode === mode).map((s) => (s as any)[metric] as number);
    const pooledSD = (a: number[], b: number[]) => {
        if (a.length < 2 || b.length < 2) return 0;
        const sA = std(a), sB = std(b);
        return Math.sqrt(((a.length - 1) * sA * sA + (b.length - 1) * sB * sB) / (a.length + b.length - 2));
    };

    const dCells: Array<{ scn: string; col: string; d: number }> = [];
    for (const scn of scenarios) {
        for (const metric of metrics) {
            for (const mode of modes) {
                const aVals = getVals(scn, 'baseline', metric);
                const bVals = getVals(scn, mode, metric);
                const s = pooledSD(aVals, bVals);
                const d = s < 1e-12 ? 0 : (mean(bVals) - mean(aVals)) / s;
                dCells.push({ scn, col: `${metric}/${mode}`, d });
            }
        }
    }

    const cols = metrics.flatMap((m) => modes.map((mode) => `${m}/${mode}`));

    // Determine color scale — we want to highlight RI reduction (negative d = good on RI)
    // and PerfMean gain (positive d = good on Perf)
    // Use signed cap at ±20 (clamp very-large values for visual clarity).
    const CLAMP = 20;
    const color = (d: number): string => {
        const v = Math.max(-CLAMP, Math.min(CLAMP, d)) / CLAMP;
        // Positive → teal, negative → red. But context matters: on RI, negative d is good (blue); on Perf, positive d is good (blue).
        // For simplicity, color by absolute magnitude with + in blue, − in red.
        if (v >= 0) {
            const t = Math.min(1, v);
            return `rgb(${Math.round(255 - t * 180)}, ${Math.round(255 - t * 60)}, ${Math.round(255 - t * 30)})`; // white → teal
        } else {
            const t = Math.min(1, -v);
            return `rgb(${Math.round(255 - t * 40)}, ${Math.round(255 - t * 140)}, ${Math.round(255 - t * 150)})`; // white → red
        }
    };

    const cellW = plotW / cols.length;
    const cellH = plotH / scenarios.length;

    const lines: string[] = [svgOpen(w, h, 'Effect-size heatmap')];
    lines.push(`<text class="title" x="20" y="22">Cohen's d (ARC candidate vs. baseline) — 20 seeds</text>`);
    lines.push(`<text class="subtitle" x="20" y="38">On PerfMean: positive d = ARC improves. On RI: negative d = ARC reduces rumination (desired).</text>`);
    lines.push(`<text class="subtitle" x="20" y="54" font-style="italic">Color: blue = positive d, red = negative d; magnitudes &gt;20 clamped.</text>`);

    // Column headers
    cols.forEach((c, ci) => {
        const cx = pad.left + ci * cellW + cellW / 2;
        const cy = pad.top - 28;
        const [metric, mode] = c.split('/');
        const header = `${metric}\n${mode}`;
        lines.push(`<text x="${cx}" y="${cy}" text-anchor="middle" font-size="10" font-weight="600" fill="#222">${metric}</text>`);
        lines.push(`<text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="9" fill="#555">${mode}</text>`);
    });

    // Row labels + cells
    scenarios.forEach((scn, si) => {
        const ry = pad.top + si * cellH + cellH / 2 + 3;
        lines.push(`<text x="${pad.left - 8}" y="${ry}" text-anchor="end" font-size="10" fill="#222">${scn}</text>`);
        cols.forEach((col, ci) => {
            const cell = dCells.find((d) => d.scn === scn && d.col === col);
            if (!cell) return;
            const x = pad.left + ci * cellW;
            const y = pad.top + si * cellH;
            lines.push(`<rect x="${x + 1}" y="${y + 1}" width="${cellW - 2}" height="${cellH - 2}" fill="${color(cell.d)}" stroke="#ccc" stroke-width="0.5"/>`);
            const label = Math.abs(cell.d) > 100 ? '≫' : cell.d.toFixed(1);
            lines.push(`<text x="${x + cellW / 2}" y="${y + cellH / 2 + 3}" text-anchor="middle" font-size="9" fill="#111">${label}</text>`);
        });
    });

    // Simple color legend at right
    const lgX = w - 60;
    const lgY0 = pad.top;
    const lgH = plotH;
    const stops = 20;
    for (let i = 0; i < stops; i++) {
        const t = (i / (stops - 1)) * 2 - 1;  // -1..1
        const lgY = lgY0 + (i / stops) * lgH;
        lines.push(`<rect x="${lgX}" y="${lgY.toFixed(1)}" width="16" height="${(lgH / stops + 0.5).toFixed(1)}" fill="${color(-t * CLAMP)}"/>`);
    }
    lines.push(`<text x="${lgX + 22}" y="${lgY0 + 6}" font-size="9" fill="#555">+${CLAMP}</text>`);
    lines.push(`<text x="${lgX + 22}" y="${lgY0 + lgH / 2 + 3}" font-size="9" fill="#555">0</text>`);
    lines.push(`<text x="${lgX + 22}" y="${lgY0 + lgH - 1}" font-size="9" fill="#555">−${CLAMP}</text>`);
    lines.push(`<text x="${lgX}" y="${lgY0 - 8}" font-size="9" fill="#333">Cohen's d</text>`);

    lines.push(svgClose());
    return lines.join('\n');
}

// ────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): { runDir: string } {
    const i = argv.indexOf('--run');
    if (i < 0 || !argv[i + 1]) {
        console.error('Usage: generate-figures.ts --run <path-to-run-folder>');
        process.exit(1);
    }
    return { runDir: path.resolve(process.cwd(), argv[i + 1]) };
}

async function main() {
    const { runDir } = parseArgs(process.argv.slice(2));
    const manifestPath = path.join(runDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        console.error(`Manifest not found: ${manifestPath}`);
        process.exit(1);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Manifest;
    const outDir = path.join(runDir, 'figures');
    fs.mkdirSync(outDir, { recursive: true });

    const figures: Array<[string, () => string]> = [
        ['fig1_ri_trajectory.svg', () => fig1_RIT(runDir, manifest)],
        ['fig2_perfmean_bars.svg', () => fig2_perfBars(manifest)],
        ['fig3_integration.svg',   () => fig3_integration()],
        ['fig4_effect_heatmap.svg',() => fig4_effectHeatmap(manifest)],
    ];

    for (const [name, fn] of figures) {
        const svg = fn();
        const out = path.join(outDir, name);
        fs.writeFileSync(out, svg);
        console.log(`✓ wrote ${path.relative(process.cwd(), out)} (${svg.length} bytes)`);
    }
    console.log(`\n4 figures generated in ${path.relative(process.cwd(), outDir)}`);
}

main().catch((err) => {
    console.error('FATAL:', err instanceof Error ? err.stack : String(err));
    process.exit(2);
});
