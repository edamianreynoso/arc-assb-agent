/**
 * Tests for the ARC controller port (cortex/arc-regulator.ts).
 *
 * Verifies mathematical agreement with the paper's Python reference
 * (assb_v1/controllers/controllers.py) — not model convergence or
 * full benchmark performance (that belongs to the paper itself).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    ARCv1,
    ARCRobust,
    ARC_DEFAULT_CONFIG,
    computeRisk,
    createARC,
    type ARCState,
    type ARCAction,
    type ARCConfig,
} from '../src/arc-regulator.js';

// ────────────────────────────────────────────────────────────────────────
// Test fixtures
// ────────────────────────────────────────────────────────────────────────

const BASELINE_STATE: ARCState = {
    phi: 0.75, g: 0.75, p: 0.75, i: 0.70,
    s: 0.30, v: 0.55, a: 0.30, mf: 0.25, ms: 0.20, u: 0.20,
};

/** Shock state: high arousal, high narrative, high uncertainty — the stressor the paper tests against. */
const SHOCK_STATE: ARCState = {
    phi: 0.50, g: 0.50, p: 0.50, i: 0.60,
    s: 0.85, v: 0.30, a: 0.85, mf: 0.30, ms: 0.30, u: 0.65,
};

const CFG: ARCConfig = { ...ARC_DEFAULT_CONFIG };

function expectBounded01(action: ARCAction): void {
    for (const k of ['u_dmg', 'u_att', 'u_mem', 'u_calm', 'u_reapp'] as const) {
        expect(action[k]).toBeGreaterThanOrEqual(0);
        expect(action[k]).toBeLessThanOrEqual(1);
    }
}

// ────────────────────────────────────────────────────────────────────────
// computeRisk — paper Eq. 5
// ────────────────────────────────────────────────────────────────────────

describe('computeRisk', () => {
    it('is zero when state is at setpoints and U = 0', () => {
        const st: ARCState = { ...BASELINE_STATE, u: 0, a: CFG.a_safe, s: CFG.s_safe };
        expect(computeRisk(st, CFG)).toBe(0);
    });

    it('sums weighted contributions from U, A excess and S excess', () => {
        const st: ARCState = { ...BASELINE_STATE, u: 0.5, a: 0.80, s: 0.75 };
        // Expected: 0.40·0.5 + 0.40·(0.80-0.60) + 0.35·(0.75-0.55)
        //         = 0.20 + 0.08 + 0.07 = 0.35
        expect(computeRisk(st, CFG)).toBeCloseTo(0.35, 6);
    });

    it('returns max of 0.7175 when all inputs saturate (0.40·1 + 0.40·0.40 + 0.35·0.45)', () => {
        // Subtle: even at U=A=S=1, risk cannot exceed 0.7175 because excess is
        // measured against a_safe=0.60, s_safe=0.55 — not the full value.
        // The clip01 is defensive; in this param regime it never activates.
        const st: ARCState = { ...BASELINE_STATE, u: 1.0, a: 1.0, s: 1.0 };
        expect(computeRisk(st, CFG)).toBeCloseTo(0.7175, 6);
    });

    it('activates the clip01 safety ceiling only when weights exceed unity budget', () => {
        // Example: synthetic config with inflated weights → formula can exceed 1.
        const inflated: ARCConfig = { ...CFG, arc_w_u: 1.5, arc_w_a: 1.5, arc_w_s: 1.5 };
        const st: ARCState = { ...BASELINE_STATE, u: 0.8, a: 0.9, s: 0.9 };
        expect(computeRisk(st, inflated)).toBe(1.0);
    });

    it('clamps negative excess to zero (never subtracts when below setpoint)', () => {
        const st: ARCState = { ...BASELINE_STATE, u: 0, a: 0.10, s: 0.10 };
        expect(computeRisk(st, CFG)).toBe(0);
    });
});

// ────────────────────────────────────────────────────────────────────────
// ARCv1 — paper §4.3.1
// ────────────────────────────────────────────────────────────────────────

describe('ARCv1 (proportional risk controller)', () => {
    it('produces bounded [0,1] action for baseline state', () => {
        const ctrl = new ARCv1();
        const a = ctrl.act(BASELINE_STATE, {}, CFG);
        expectBounded01(a);
    });

    it('produces bounded [0,1] action under shock', () => {
        const ctrl = new ARCv1();
        const a = ctrl.act(SHOCK_STATE, {}, CFG);
        expectBounded01(a);
    });

    it('increases u_dmg and u_calm under shock vs baseline', () => {
        const ctrl = new ARCv1();
        const a_baseline = ctrl.act(BASELINE_STATE, {}, CFG);
        const a_shock = ctrl.act(SHOCK_STATE, {}, CFG);
        expect(a_shock.u_dmg).toBeGreaterThan(a_baseline.u_dmg);
        expect(a_shock.u_calm).toBeGreaterThan(a_baseline.u_calm);
    });

    it('closes memory gate under shock (u_mem decreases)', () => {
        const ctrl = new ARCv1();
        const a_baseline = ctrl.act(BASELINE_STATE, {}, CFG);
        const a_shock = ctrl.act(SHOCK_STATE, {}, CFG);
        expect(a_shock.u_mem).toBeLessThan(a_baseline.u_mem);
    });

    it('produces u_calm = 0 when arousal is below safe threshold', () => {
        const ctrl = new ARCv1();
        const st: ARCState = { ...BASELINE_STATE, a: 0.20 };  // below 0.60 safe
        const a = ctrl.act(st, {}, CFG);
        expect(a.u_calm).toBe(0);
    });

    it('is stateless — repeated calls produce the same output for the same input', () => {
        const ctrl = new ARCv1();
        const a1 = ctrl.act(SHOCK_STATE, {}, CFG);
        const a2 = ctrl.act(SHOCK_STATE, {}, CFG);
        expect(a2).toEqual(a1);
    });
});

// ────────────────────────────────────────────────────────────────────────
// ARC Robust — paper §4.3.6, Table 14 best
// ────────────────────────────────────────────────────────────────────────

describe('ARCRobust (H∞ with integral action)', () => {
    let ctrl: ARCRobust;
    beforeEach(() => { ctrl = new ARCRobust(); });

    it('produces bounded [0,1] action for baseline and shock states', () => {
        expectBounded01(ctrl.act(BASELINE_STATE, {}, CFG));
        expectBounded01(ctrl.act(SHOCK_STATE, {}, CFG));
    });

    it('accumulates integral_s on sustained narrative excess (anti-rumination)', () => {
        // Simulate a sustained S above rumination threshold across many steps.
        const persistent_rumination: ARCState = { ...SHOCK_STATE, s: 0.80 };
        for (let t = 0; t < 50; t++) ctrl.act(persistent_rumination, {}, CFG);
        const internal = ctrl.getInternalState();
        expect(internal.integral_s).toBeGreaterThan(0);
    });

    it('caps integral_s at the anti-windup limit (0.8) even under persistent stress', () => {
        const persistent: ARCState = { ...SHOCK_STATE, s: 0.95 };
        for (let t = 0; t < 1000; t++) ctrl.act(persistent, {}, CFG);
        const internal = ctrl.getInternalState();
        expect(internal.integral_s).toBeLessThanOrEqual(0.8 + 1e-9);
    });

    it('updates disturbance estimate via EMA (stays bounded)', () => {
        for (let t = 0; t < 30; t++) ctrl.act(SHOCK_STATE, {}, CFG);
        const internal = ctrl.getInternalState();
        expect(internal.disturbance_est).toBeGreaterThan(0);
        expect(internal.disturbance_est).toBeLessThan(5); // sanity: must not explode
    });

    it('reset() clears integral and resets disturbance estimate', () => {
        for (let t = 0; t < 20; t++) ctrl.act(SHOCK_STATE, {}, CFG);
        const before = ctrl.getInternalState();
        expect(before.integral_s).toBeGreaterThan(0);

        ctrl.reset();
        const after = ctrl.getInternalState();
        expect(after.integral_s).toBe(0);
        expect(after.disturbance_est).toBeCloseTo(0.1, 6);
    });

    it('drives u_dmg higher than ARCv1 under sustained rumination (integral effect)', () => {
        const arcv1 = new ARCv1();
        const persistent: ARCState = { ...SHOCK_STATE, s: 0.80, u: 0.5, a: 0.75 };
        // Let the integral build up
        for (let t = 0; t < 20; t++) ctrl.act(persistent, {}, CFG);
        const a_robust = ctrl.act(persistent, {}, CFG);
        const a_v1 = arcv1.act(persistent, {}, CFG);
        expect(a_robust.u_dmg).toBeGreaterThanOrEqual(a_v1.u_dmg);
    });
});

// ────────────────────────────────────────────────────────────────────────
// Factory
// ────────────────────────────────────────────────────────────────────────

describe('createARC factory', () => {
    it('builds ARC Robust by default (best overall per paper Table 14)', () => {
        const ctrl = createARC();
        expect(ctrl.name).toBe('arc_robust');
        expect(ctrl).toBeInstanceOf(ARCRobust);
    });

    it('builds the requested controller by name', () => {
        expect(createARC('arc_v1').name).toBe('arc_v1');
        expect(createARC('arc_robust').name).toBe('arc_robust');
    });
});
