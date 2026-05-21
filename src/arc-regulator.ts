/**
 * OMEGA Gen 3.0 "PROMETHEUS" - Affective Regulation Core (ARC)
 *
 * TypeScript port of the controllers from the ARC/ASSB paper
 * ("Affective Regulation Core: A Homeostatic Control Framework
 *  for Stable and Safe AI Agents", Reynoso 2026).
 *
 * Reference implementation: `assb_v1/controllers/controllers.py`
 *
 * ════════════════════════════════════════════════════════════════════════
 * Contract (matches paper Section 3):
 *   state (10-D): [Φ, G, P, I, S, V, A, Mf, Ms, U]
 *     Φ  integration (IIT proxy)     Phi
 *     G  global workspace access    [0,1]
 *     P  predictive precision       [0,1]
 *     I  introspective attention    [0,1]
 *     S  narrative intensity (DMN)  [0,1]
 *     V  valence                    [0,1]  (shifted from paper's [-1,1])
 *     A  arousal                    [0,1]
 *     Mf fast memory                [0,1]
 *     Ms slow memory                [0,1]
 *     U  uncertainty                [0,1]
 *
 *   action (5-D): {u_dmg, u_att, u_mem, u_calm, u_reapp}
 *     u_dmg    DMN suppression (anti-rumination)
 *     u_att    attention boost
 *     u_mem    memory gate (1 = open, 0 = closed under stress)
 *     u_calm   arousal damping
 *     u_reapp  cognitive reappraisal (uncertainty reduction)
 *
 * ════════════════════════════════════════════════════════════════════════
 * Ported controllers in this module:
 *   - ARCv1           : proportional reference (paper Section 4.3.1)
 *   - ARC Robust (H∞) : best overall performer from Table 14 (0.95 perf, RI=0)
 *
 * The remaining 13 controllers from the paper (PID, LQR, LQI, hierarchical,
 * meta, LQI-meta, Ultimate, Adaptive, ablations) can be added later using
 * the same `ARCController` interface — see factory `createARC()`.
 * ════════════════════════════════════════════════════════════════════════
 */

// ────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────

/** Normalized 10-D internal state (mirrors paper Table 2). */
export interface ARCState {
    phi: number;   // Integration proxy (IIT)
    g: number;     // Global workspace accessibility
    p: number;     // Predictive precision
    i: number;     // Introspective attention
    s: number;     // Narrative intensity (DMN proxy)
    v: number;     // Valence
    a: number;     // Arousal
    mf: number;    // Fast memory
    ms: number;    // Slow memory
    u: number;     // Uncertainty
}

/** Observations exogenous to internal state (reward signal, performance, prediction error). */
export interface ARCObservation {
    perf?: number;  // Current performance, for meta-controllers [0,1]
    pe?: number;    // Prediction error [0,1]
    reward?: number;
}

/** Five bounded control actions applied back to the agent's cognitive machinery. */
export interface ARCAction {
    u_dmg: number;    // DMN suppression
    u_att: number;    // Attention boost
    u_mem: number;    // Memory gate
    u_calm: number;   // Arousal damping
    u_reapp: number;  // Reappraisal
}

/** Controller hyperparameters — defaults match paper configs/v2.yaml. */
export interface ARCConfig {
    // Safe operating thresholds (Yerkes-Dodson-guided)
    a_safe: number;       // default 0.60
    s_safe: number;       // default 0.55
    s_rum_tau: number;    // default 0.55 (rumination detection threshold)

    // Risk-signal weights
    arc_w_u: number;      // default 0.40
    arc_w_a: number;      // default 0.40
    arc_w_s: number;      // default 0.35

    // Action gains
    arc_k_dmg: number;        // default 0.95
    arc_k_att: number;        // default 0.75
    arc_k_mem_block: number;  // default 0.90
    arc_k_calm: number;       // default 0.85
    arc_k_reapp: number;      // default 0.55
}

/** Default config from paper `configs/v2.yaml`. */
export const ARC_DEFAULT_CONFIG: ARCConfig = {
    a_safe: 0.60,
    s_safe: 0.55,
    s_rum_tau: 0.55,
    arc_w_u: 0.40,
    arc_w_a: 0.40,
    arc_w_s: 0.35,
    arc_k_dmg: 0.95,
    arc_k_att: 0.75,
    arc_k_mem_block: 0.90,
    arc_k_calm: 0.85,
    arc_k_reapp: 0.55,
};

/** Uniform interface for every controller — matches paper's Python `.act(st, obs, cfg)`. */
export interface ARCController {
    readonly name: string;
    act(state: ARCState, obs: ARCObservation, cfg: ARCConfig): ARCAction;
    reset(): void;
}

// ────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────

const clip01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const clip   = (x: number, lo: number, hi: number): number => (x < lo ? lo : x > hi ? hi : x);
const pos    = (x: number): number => (x > 0 ? x : 0);

/**
 * Compute the bounded risk signal used by most ARC variants.
 * Formula: `risk = w_u·U + w_a·[A - a_safe]⁺ + w_s·[S - s_safe]⁺`, clipped to [0,1].
 * (Paper Section 4.3.1, Eq. 5)
 */
export function computeRisk(state: ARCState, cfg: ARCConfig): number {
    const risk = cfg.arc_w_u * state.u
               + cfg.arc_w_a * pos(state.a - cfg.a_safe)
               + cfg.arc_w_s * pos(state.s - cfg.s_safe);
    return clip01(risk);
}

// ────────────────────────────────────────────────────────────────────────
// ARCv1 — Proportional controller (paper §4.3.1)
// ────────────────────────────────────────────────────────────────────────

/**
 * Proportional-only risk controller — the simplest ARC.
 * Reference in paper Section 4.3.1 (Eq. 5-6), Python class `ARCv1`.
 *
 * Reported performance (Table 14): PerfMean=0.93, RI=0.15, ControlEffort=0.78.
 * Stateless — `reset()` is a no-op.
 */
export class ARCv1 implements ARCController {
    readonly name = 'arc_v1';

    act(state: ARCState, _obs: ARCObservation, cfg: ARCConfig): ARCAction {
        const risk = computeRisk(state, cfg);
        const a_excess = pos(state.a - cfg.a_safe);

        const u_dmg   = clip01(cfg.arc_k_dmg * risk);
        const u_att   = clip01(cfg.arc_k_att * state.u * (1.0 - a_excess));
        const u_mem   = 1.0 - clip01(cfg.arc_k_mem_block * risk);
        const u_calm  = clip01(cfg.arc_k_calm * a_excess);
        const u_reapp = clip01(cfg.arc_k_reapp * state.u * (1.0 - risk));

        return { u_dmg, u_att, u_mem, u_calm, u_reapp };
    }

    reset(): void { /* stateless */ }
}

// ────────────────────────────────────────────────────────────────────────
// ARC Robust (H∞) — best overall (paper §4.3.6, Table 14)
// ────────────────────────────────────────────────────────────────────────

/**
 * H∞-inspired robust controller with conservative gains + integral action.
 * Best overall balance in paper (Table 14): PerfMean=0.95, RI=0, ControlEffort=1.03.
 *
 * Design (paper Section 4.3.6):
 *   - Nominal feedback on error vector x = [a_error, s_error, U]
 *   - Robustness margin: γ · d̂ · 0.3  (d̂ = online disturbance estimate)
 *   - Integral on rumination-level narrative (anti-rumination → RI=0)
 *   - Disturbance estimator: d̂ ← 0.9·d̂ + 0.1·‖x‖
 */
export class ARCRobust implements ARCController {
    readonly name = 'arc_robust';

    // Robustness parameter
    private readonly gamma: number = 1.5;
    // Base feedback gains for [a_error, s_error, U]
    private readonly K_base: readonly [number, number, number] = [1.0, 1.2, 0.7];
    // Integral gain on narrative rumination
    private readonly ki_s: number = 0.22;
    // Integral cap (anti-windup) — important: paper shows LQI collapses without it under adversarial_coupling
    private readonly integral_cap: number = 0.8;

    // State
    private integral_s: number = 0;
    private disturbance_est: number = 0.1;

    act(state: ARCState, _obs: ARCObservation, cfg: ARCConfig): ARCAction {
        const a_error     = pos(state.a - cfg.a_safe);
        const s_error     = pos(state.s - cfg.s_safe);
        const s_rum_error = pos(state.s - cfg.s_rum_tau);

        // Error vector x = [a_error, s_error, U]
        const x: [number, number, number] = [a_error, s_error, state.u];

        // Integral on rumination-level narrative (with anti-windup clamp)
        this.integral_s = clip(
            this.integral_s + this.ki_s * s_rum_error,
            0,
            this.integral_cap,
        );

        // H∞ robust control: nominal + robustness margin
        const margin = this.gamma * this.disturbance_est * 0.3;
        const u_nominal: [number, number, number] = [
            this.K_base[0] * x[0],
            this.K_base[1] * x[1],
            this.K_base[2] * x[2],
        ];
        const u_robust: [number, number, number] = [
            u_nominal[0] + margin,
            u_nominal[1] + margin + this.integral_s,   // integral only on narrative axis
            u_nominal[2] + margin,
        ];

        const u_calm = clip01(cfg.arc_k_calm * u_robust[0]);
        const u_dmg  = clip01(cfg.arc_k_dmg  * u_robust[1]);
        const u_att  = clip01(cfg.arc_k_att  * u_robust[2]);

        const risk_for_mem = Math.max(u_robust[0], u_robust[1]);
        const u_mem = 1.0 - clip01(cfg.arc_k_mem_block * risk_for_mem);

        const x_norm = Math.sqrt(x[0] * x[0] + x[1] * x[1] + x[2] * x[2]);
        const u_reapp = clip01(cfg.arc_k_reapp * state.u * (1.0 - Math.min(1.0, x_norm)));

        // Update disturbance estimate (EMA on ‖x‖)
        this.disturbance_est = 0.9 * this.disturbance_est + 0.1 * x_norm;

        return { u_dmg, u_att, u_mem, u_calm, u_reapp };
    }

    reset(): void {
        this.integral_s = 0;
        this.disturbance_est = 0.1;
    }

    /** Debug accessors for telemetry/tests (not in paper's public contract). */
    getInternalState(): { integral_s: number; disturbance_est: number } {
        return { integral_s: this.integral_s, disturbance_est: this.disturbance_est };
    }
}

// ────────────────────────────────────────────────────────────────────────
// FACTORY
// ────────────────────────────────────────────────────────────────────────

export type ARCControllerName = 'arc_v1' | 'arc_robust';

/**
 * Construct an ARC controller by name. Default is `arc_robust` (best overall
 * balance per paper Table 14 — use unless there's a reason to prefer another).
 */
export function createARC(name: ARCControllerName = 'arc_robust'): ARCController {
    switch (name) {
        case 'arc_v1':     return new ARCv1();
        case 'arc_robust': return new ARCRobust();
        default: {
            // Exhaustiveness check at type level
            const _exhaustive: never = name;
            throw new Error(`Unknown ARC controller: ${String(_exhaustive)}`);
        }
    }
}
