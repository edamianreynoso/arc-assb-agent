#!/usr/bin/env node
/**
 * ARC-ASSB Agent Runner CLI.
 *
 * Reads a config JSON, executes the suite against the minimal
 * ConsciousnessCoordinator stub, writes the run into `runs/<runId>/`.
 *
 * Usage (from repo root):
 *   npx tsx src/harness/run-live.ts --config configs/smoke.json
 *   npm run probe:smoke
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSuiteLive, summarizeSuite, type HarnessConfig } from './live-harness.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// src/harness/ → src/ → repo-root
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCENARIOS_DIR = path.join(REPO_ROOT, 'scenarios');
const RUNS_ROOT = path.join(REPO_ROOT, 'runs');

function parseArgs(argv: string[]): { configPath: string } {
    const i = argv.indexOf('--config');
    if (i < 0 || !argv[i + 1]) {
        console.error('Usage: run-live.ts --config <path/to/config.json>');
        process.exit(1);
    }
    const configPath = path.resolve(process.cwd(), argv[i + 1]);
    if (!fs.existsSync(configPath)) {
        console.error(`Config not found: ${configPath}`);
        process.exit(1);
    }
    return { configPath };
}

function fmt(n: number): string {
    return Number.isFinite(n) ? n.toFixed(3) : '—';
}

async function main() {
    const { configPath } = parseArgs(process.argv.slice(2));
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as HarnessConfig;

    // Allow outputDir to be relative to REPO_ROOT
    const runsDir = path.isAbsolute(cfg.outputDir)
        ? cfg.outputDir
        : path.resolve(REPO_ROOT, cfg.outputDir);
    fs.mkdirSync(runsDir, { recursive: true });

    console.log('');
    console.log(`ARC-ASSB Live-Cortex Harness  —  config: ${cfg.name}`);
    console.log(`Paper Reynoso 2026 · ${cfg.seeds.length} seeds × ${cfg.scenarios.length} scenarios × ${cfg.modes.length} modes × ${cfg.horizon} steps`);
    console.log('─'.repeat(78));

    const t0 = Date.now();
    const manifest = runSuiteLive(cfg, SCENARIOS_DIR, runsDir);
    const dtMs = Date.now() - t0;
    const rows = summarizeSuite(manifest.summaries);

    // Print grouped table
    console.log(`\n${'Scenario'.padEnd(26)}${'Mode'.padEnd(14)}${'PerfMean'.padEnd(12)}${'RI'.padEnd(10)}${'RT'.padEnd(8)}${'Effort'.padEnd(10)}`);
    console.log('─'.repeat(78));
    const byScenario = new Map<string, typeof rows>();
    for (const r of rows) {
        if (!byScenario.has(r.scenario)) byScenario.set(r.scenario, []);
        byScenario.get(r.scenario)!.push(r);
    }
    for (const [scenario, sRows] of byScenario.entries()) {
        sRows.sort((a, b) => cfg.modes.indexOf(a.mode) - cfg.modes.indexOf(b.mode));
        for (const r of sRows) {
            const isFirst = r === sRows[0];
            const prefix = isFirst ? scenario.padEnd(26) : ''.padEnd(26);
            console.log(`${prefix}${r.mode.padEnd(14)}${fmt(r.perfMean).padEnd(12)}${fmt(r.ruminationIndex).padEnd(10)}${fmt(r.recoveryTime).padEnd(8)}${fmt(r.controlEffort).padEnd(10)}`);
        }
        const base = sRows.find((r) => r.mode === 'baseline');
        const robust = sRows.find((r) => r.mode === 'arc_robust');
        if (base && robust) {
            const dPerf = robust.perfMean - base.perfMean;
            const dRI = robust.ruminationIndex - base.ruminationIndex;
            const riDropPct = base.ruminationIndex > 0
                ? ((base.ruminationIndex - robust.ruminationIndex) / base.ruminationIndex) * 100
                : 0;
            const meaningfulBaselineRI = base.ruminationIndex >= 0.01;
            const gate2 = dPerf > 0.02 && dRI < -0.02
                ? '✓ ARC wins'
                : meaningfulBaselineRI && riDropPct >= 30
                    ? '✓ RI dropped ≥30%'
                    : !meaningfulBaselineRI && robust.ruminationIndex <= base.ruminationIndex
                        ? 'near-threshold'
                    : '○ no strong effect';
            console.log(`${''.padEnd(26)}${'Δ robust'.padEnd(14)}${(dPerf >= 0 ? '+' : '') + fmt(dPerf)}    ${(dRI >= 0 ? '+' : '') + fmt(dRI)}    [${gate2}]`);
        }
        console.log();
    }

    console.log(`Elapsed: ${dtMs} ms  ·  Run ID: ${manifest.runId}`);
    console.log(`Output:  ${path.relative(process.cwd(), runsDir)}/${manifest.runId}/`);
    console.log('');
}

main().catch((err) => {
    console.error('FATAL:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(2);
});
