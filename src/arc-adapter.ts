/**
 * OMEGA Gen 3.0 "PROMETHEUS" - ARC Adapter (Runtime Bridge)
 *
 * Bridges the paper's 10-D `ARCState` (see cortex/arc-regulator.ts) to OMEGA's
 * actual runtime state exposed by `ConsciousnessCoordinator.getState()` and
 * infra-stress signals.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MODE: Shadow (Phase 1, 2026-04-18)
 * ─────────────────────────────────────────────────────────────────────────
 * The adapter currently RUNS the ARC controller on every tick but does NOT
 * apply its action back to OMEGA's subsystems. Actions are observable via
 * `getLastDecision()` and logged at debug level for telemetry / dashboard.
 *
 * This "shadow deployment" pattern lets us:
 *   1. Validate the mapping OMEGA state → ARC 10-D state on real runs
 *   2. Compare what ARC WOULD do vs. what OMEGA's heuristic homeostasis IS doing
 *   3. Build confidence before wiring u_dmg→DMN, u_calm→arousal-system, etc.
 *
 * Phase 2 (future session): apply actions to real subsystems.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MAPPING (OMEGA → ARC 10-D)
 * ─────────────────────────────────────────────────────────────────────────
 *   phi (integration)            ← homeostasis.integrity
 *   g   (global workspace)       ← stats.predictionAccuracy
 *   p   (predictive precision)   ← 1 / (1 + freeEnergy)
 *   i   (introspective attention)← homeostasis.curiosity
 *   s   (narrative intensity)    ← infraStressSignal (allostatic load proxy)
 *   v   (valence)                ← 0.5 + 0.5·(recent success rate − 0.5)
 *   a   (arousal)                ← homeostasis.arousal
 *   mf  (fast memory)            ← default 0.5 (no runtime source yet)
 *   ms  (slow memory)            ← default 0.5 (no runtime source yet)
 *   u   (uncertainty)            ← 1 − homeostasis.certainty
 *
 * Every field is clamped to [0,1]. Missing sources fall back to safe defaults.
 */

import {
    ARCRobust,
    createARC,
    ARC_DEFAULT_CONFIG,
    type ARCController,
    type ARCState,
    type ARCAction,
    type ARCObservation,
    type ARCConfig,
    type ARCControllerName,
} from './arc-regulator.js';
import { getLogger } from './logger.js';

const arcLogger = getLogger('ARCAdapter');

// ────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────

/** Minimal shape of ConsciousnessCoordinator.getState() output that the adapter needs. */
export interface ConsciousnessSnapshot {
    homeostasis: {
        certainty: number;
        curiosity: number;
        integrity: number;
        energy: number;
        arousal: number;
    };
    freeEnergy: number;
    stats: {
        predictionAccuracy: number;
        averageSurprise: number;
    };
}

/** Signals about infra pressure / task outcomes that modulate S, V, observations. */
export interface RuntimeSignals {
    /** Stress proxy, 0 (idle) → 1 (critical load). Maps to narrative intensity S. */
    infraStress?: number;
    /** Recent success rate (0 to 1). Maps to valence. */
    recentSuccessRate?: number;
    /** Measured task performance for this step (0 to 1). Observation for meta-controllers. */
    perf?: number;
    /** Prediction error for this step (0 to 1). Observation. */
    predictionError?: number;
}

/** Full decision record for telemetry / debugging. */
export interface ARCDecisionRecord {
    tickAt: number;          // epoch ms
    controllerName: string;
    state: ARCState;         // what the controller saw
    action: ARCAction;       // what it decided
    obs: ARCObservation;     // observations passed in
    shadow: boolean;         // true = not applied (current mode)
}

// ────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────

const clip01 = (x: number): number => (Number.isFinite(x) ? (x < 0 ? 0 : x > 1 ? 1 : x) : 0);

/**
 * Map a `ConsciousnessSnapshot` + `RuntimeSignals` to a 10-D ARCState.
 * Export for direct testing without needing a full coordinator instance.
 */
export function buildARCState(
    snapshot: ConsciousnessSnapshot,
    signals: RuntimeSignals = {},
): ARCState {
    const { homeostasis, freeEnergy, stats } = snapshot;

    // Predictive precision: inverse of free energy (higher FE = lower precision).
    // Simple monotone map that stays in [0,1] without requiring FE's global max.
    const precision = 1 / (1 + Math.max(0, freeEnergy));

    // Valence recentered to [0,1] from success rate (paper's v is [0,1] here, not [-1,1]).
    const successRate = signals.recentSuccessRate ?? 0.5;
    const valence = 0.5 + 0.5 * (clip01(successRate) - 0.5);

    return {
        phi: clip01(homeostasis.integrity),
        g:   clip01(stats.predictionAccuracy),
        p:   clip01(precision),
        i:   clip01(homeostasis.curiosity),
        s:   clip01(signals.infraStress ?? 0.2),  // conservative default: mild baseline narrative
        v:   clip01(valence),
        a:   clip01(homeostasis.arousal),
        mf:  0.5, // TODO wire fast-memory strength when memory API exposes it
        ms:  0.5, // TODO wire slow-memory strength when memory API exposes it
        u:   clip01(1 - homeostasis.certainty),
    };
}

function buildObservation(snapshot: ConsciousnessSnapshot, signals: RuntimeSignals): ARCObservation {
    return {
        perf: signals.perf ?? clip01(snapshot.stats.predictionAccuracy),
        pe:   signals.predictionError ?? clip01(snapshot.stats.averageSurprise),
    };
}

// ────────────────────────────────────────────────────────────────────────
// ADAPTER
// ────────────────────────────────────────────────────────────────────────

/**
 * Callback invoked with the ARC action whenever the adapter is in active
 * (non-shadow) mode. Implementations should route the action's fields to
 * OMEGA's subsystems (u_dmg → DMN, u_calm → arousal, …).
 */
export type ARCApplyCallback = (action: ARCAction, state: ARCState) => void;

export interface ARCAdapterOptions {
    controller?: ARCControllerName; // default 'arc_robust'
    config?: Partial<ARCConfig>;
    /** If true (default), run but don't apply actions. Required `false` + an applyAction to activate. */
    shadowMode?: boolean;
    /**
     * Called with each tick's action when `shadowMode === false`. Errors
     * inside the callback are caught and logged; they never abort the tick.
     */
    applyAction?: ARCApplyCallback;
}

/**
 * Runtime bridge between OMEGA's live cognitive state and the paper's ARC controller.
 *
 * Usage pattern (shadow mode):
 *   const adapter = new ARCAdapter();
 *   // ... per task completion:
 *   adapter.tick(consciousness.getState(), { infraStress, recentSuccessRate });
 *   const last = adapter.getLastDecision();
 *   // log(last) or push to dashboard
 */
export class ARCAdapter {
    private readonly controller: ARCController;
    private readonly config: ARCConfig;
    private readonly shadow: boolean;
    private readonly applyAction?: ARCApplyCallback;
    private last?: ARCDecisionRecord;
    private tickCount = 0;

    constructor(options: ARCAdapterOptions = {}) {
        this.controller = createARC(options.controller ?? 'arc_robust');
        this.config = { ...ARC_DEFAULT_CONFIG, ...(options.config ?? {}) };
        this.shadow = options.shadowMode ?? true;
        this.applyAction = options.applyAction;
    }

    /**
     * Run one controller step given OMEGA's current runtime state.
     * Returns the computed action. In shadow mode the action is observable
     * via `getLastDecision()` but NOT routed anywhere. In active mode
     * (`shadowMode: false` + `applyAction` callback) the callback is invoked
     * with the action, letting the caller apply u_dmg/u_calm/u_mem/etc. to
     * the corresponding OMEGA subsystems.
     */
    tick(snapshot: ConsciousnessSnapshot, signals: RuntimeSignals = {}): ARCAction {
        const state = buildARCState(snapshot, signals);
        const obs = buildObservation(snapshot, signals);
        const action = this.controller.act(state, obs, this.config);

        this.last = {
            tickAt: Date.now(),
            controllerName: this.controller.name,
            state,
            action,
            obs,
            shadow: this.shadow,
        };
        this.tickCount++;

        // Debug-only log; dashboard can subscribe via getLastDecision().
        arcLogger.debug('ARC tick', {
            controller: this.controller.name,
            shadow: this.shadow,
            risk_inputs: { u: state.u, a: state.a, s: state.s },
            action,
        });

        // Active mode: route the action to subsystems. Defensive — a throwing
        // callback must not abort the cortex's post-task learning loop.
        if (!this.shadow && this.applyAction) {
            try {
                this.applyAction(action, state);
            } catch (err) {
                arcLogger.warn('ARC applyAction callback threw (non-fatal)', {
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        }

        return action;
    }

    /** Last decision record (state + action + metadata). Undefined before first tick(). */
    getLastDecision(): ARCDecisionRecord | undefined {
        return this.last;
    }

    /** Number of times tick() has been called. Useful for telemetry. */
    getTickCount(): number {
        return this.tickCount;
    }

    /** Reset controller state (integral, disturbance estimator). */
    reset(): void {
        this.controller.reset();
        this.last = undefined;
    }

    /** True if adapter is currently only observing (not applying actions). */
    isShadowMode(): boolean {
        return this.shadow;
    }

    /** Escape hatch exposing the underlying controller for controller-specific telemetry. */
    getController(): ARCController {
        return this.controller;
    }
}
