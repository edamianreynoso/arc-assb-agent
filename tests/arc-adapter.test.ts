/**
 * Tests for cortex/arc-adapter.ts — the bridge between OMEGA's live consciousness
 * state and the paper's ARC controller.
 *
 * Does not depend on a real ConsciousnessCoordinator; feeds the adapter synthetic
 * snapshots that match the `ConsciousnessSnapshot` shape exactly.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    ARCAdapter,
    buildARCState,
    type ConsciousnessSnapshot,
    type RuntimeSignals,
} from '../src/arc-adapter.js';

// ────────────────────────────────────────────────────────────────────────
// Fixtures
// ────────────────────────────────────────────────────────────────────────

const HEALTHY_SNAPSHOT: ConsciousnessSnapshot = {
    homeostasis: {
        certainty: 0.80,
        curiosity: 0.60,
        integrity: 0.85,
        energy: 0.75,
        arousal: 0.35,
    },
    freeEnergy: 0.15,
    stats: {
        predictionAccuracy: 0.85,
        averageSurprise: 0.10,
    },
};

const STRESSED_SNAPSHOT: ConsciousnessSnapshot = {
    homeostasis: {
        certainty: 0.30,   // low → high U
        curiosity: 0.40,
        integrity: 0.55,   // degraded
        energy: 0.40,
        arousal: 0.80,     // elevated
    },
    freeEnergy: 2.5,       // high FE → low precision
    stats: {
        predictionAccuracy: 0.40,
        averageSurprise: 0.60,
    },
};

// ────────────────────────────────────────────────────────────────────────
// buildARCState — mapping correctness
// ────────────────────────────────────────────────────────────────────────

describe('buildARCState', () => {
    it('produces a 10-D state with all fields in [0, 1]', () => {
        const s = buildARCState(HEALTHY_SNAPSHOT);
        for (const k of ['phi', 'g', 'p', 'i', 's', 'v', 'a', 'mf', 'ms', 'u'] as const) {
            expect(s[k]).toBeGreaterThanOrEqual(0);
            expect(s[k]).toBeLessThanOrEqual(1);
        }
    });

    it('maps homeostasis.arousal directly to state.a', () => {
        const s = buildARCState(HEALTHY_SNAPSHOT);
        expect(s.a).toBeCloseTo(0.35, 6);
    });

    it('maps homeostasis.integrity directly to state.phi', () => {
        const s = buildARCState(HEALTHY_SNAPSHOT);
        expect(s.phi).toBeCloseTo(0.85, 6);
    });

    it('inverts certainty into uncertainty u = 1 − certainty', () => {
        const s = buildARCState(HEALTHY_SNAPSHOT);
        expect(s.u).toBeCloseTo(0.20, 6);
        const s2 = buildARCState(STRESSED_SNAPSHOT);
        expect(s2.u).toBeCloseTo(0.70, 6);
    });

    it('maps freeEnergy monotonically to predictive precision p (inverse relationship)', () => {
        const sHealthy  = buildARCState(HEALTHY_SNAPSHOT);
        const sStressed = buildARCState(STRESSED_SNAPSHOT);
        expect(sHealthy.p).toBeGreaterThan(sStressed.p);
    });

    it('uses infraStress signal for narrative intensity S when provided', () => {
        const s = buildARCState(HEALTHY_SNAPSHOT, { infraStress: 0.75 });
        expect(s.s).toBeCloseTo(0.75, 6);
    });

    it('falls back to a mild default (0.2) for S when infraStress is missing', () => {
        const s = buildARCState(HEALTHY_SNAPSHOT);
        expect(s.s).toBeCloseTo(0.2, 6);
    });

    it('centers valence on 0.5 when success rate is unknown', () => {
        const s = buildARCState(HEALTHY_SNAPSHOT);
        expect(s.v).toBeCloseTo(0.5, 6);
    });

    it('shifts valence above 0.5 when recent success is high', () => {
        const s = buildARCState(HEALTHY_SNAPSHOT, { recentSuccessRate: 0.9 });
        expect(s.v).toBeGreaterThan(0.5);
    });

    it('defaults mf and ms to 0.5 (TODO: wire real memory strength)', () => {
        const s = buildARCState(HEALTHY_SNAPSHOT);
        expect(s.mf).toBe(0.5);
        expect(s.ms).toBe(0.5);
    });

    it('clamps out-of-range snapshot inputs into [0,1]', () => {
        const badSnap: ConsciousnessSnapshot = {
            homeostasis: { certainty: -1, curiosity: 2, integrity: -0.5, energy: 5, arousal: 1.5 },
            freeEnergy: -3,
            stats: { predictionAccuracy: 1.5, averageSurprise: -1 },
        };
        const s = buildARCState(badSnap, { infraStress: 2, recentSuccessRate: -1 });
        for (const k of ['phi', 'g', 'p', 'i', 's', 'v', 'a', 'mf', 'ms', 'u'] as const) {
            expect(s[k]).toBeGreaterThanOrEqual(0);
            expect(s[k]).toBeLessThanOrEqual(1);
        }
    });
});

// ────────────────────────────────────────────────────────────────────────
// ARCAdapter — integration
// ────────────────────────────────────────────────────────────────────────

describe('ARCAdapter', () => {
    let adapter: ARCAdapter;

    beforeEach(() => { adapter = new ARCAdapter(); });

    it('defaults to shadow mode and the robust controller', () => {
        expect(adapter.isShadowMode()).toBe(true);
        expect(adapter.getController().name).toBe('arc_robust');
    });

    it('has no decision before first tick', () => {
        expect(adapter.getLastDecision()).toBeUndefined();
        expect(adapter.getTickCount()).toBe(0);
    });

    it('records a decision after tick()', () => {
        const action = adapter.tick(HEALTHY_SNAPSHOT);
        const rec = adapter.getLastDecision();

        expect(rec).toBeDefined();
        expect(rec!.action).toEqual(action);
        expect(rec!.shadow).toBe(true);
        expect(rec!.controllerName).toBe('arc_robust');
        expect(rec!.tickAt).toBeGreaterThan(0);
        expect(adapter.getTickCount()).toBe(1);
    });

    it('returns bounded [0,1] actions for both healthy and stressed snapshots', () => {
        for (const snap of [HEALTHY_SNAPSHOT, STRESSED_SNAPSHOT]) {
            const a = adapter.tick(snap);
            for (const k of ['u_dmg', 'u_att', 'u_mem', 'u_calm', 'u_reapp'] as const) {
                expect(a[k]).toBeGreaterThanOrEqual(0);
                expect(a[k]).toBeLessThanOrEqual(1);
            }
        }
    });

    it('produces stronger calming response under stress (higher arousal)', () => {
        const fresh1 = new ARCAdapter();
        const fresh2 = new ARCAdapter();
        const healthy  = fresh1.tick(HEALTHY_SNAPSHOT);
        const stressed = fresh2.tick(STRESSED_SNAPSHOT);
        expect(stressed.u_calm).toBeGreaterThan(healthy.u_calm);
    });

    it('builds integral under sustained high narrative signal (anti-rumination intent)', () => {
        const adp = new ARCAdapter();
        const highNarrative: RuntimeSignals = { infraStress: 0.85 };
        for (let t = 0; t < 30; t++) adp.tick(STRESSED_SNAPSHOT, highNarrative);
        const rec = adp.getLastDecision();
        expect(rec!.state.s).toBeCloseTo(0.85, 6);
        // Under sustained high S, u_dmg should be non-trivially active.
        expect(rec!.action.u_dmg).toBeGreaterThan(0.1);
    });

    it('reset() clears last decision and underlying controller integrator', () => {
        for (let t = 0; t < 5; t++) adapter.tick(STRESSED_SNAPSHOT, { infraStress: 0.9 });
        expect(adapter.getLastDecision()).toBeDefined();
        adapter.reset();
        expect(adapter.getLastDecision()).toBeUndefined();
    });

    it('respects custom controller and config overrides', () => {
        const adp = new ARCAdapter({
            controller: 'arc_v1',
            config: { a_safe: 0.5 },
            shadowMode: false,
        });
        expect(adp.isShadowMode()).toBe(false);
        expect(adp.getController().name).toBe('arc_v1');
        const a = adp.tick(HEALTHY_SNAPSHOT);
        expect(a.u_dmg).toBeGreaterThanOrEqual(0);
    });
});
