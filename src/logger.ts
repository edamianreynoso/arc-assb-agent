/**
 * Minimal scoped logger — drop-in replacement for OMEGA's `error-handler`
 * `getLogger(scope)` factory, stripped of trace-id injection, structured
 * metadata, and the observability pipeline.
 *
 * The harness and adapter only call `info / warn / error / debug`, so we
 * implement exactly that surface. If `ARC_LOG_LEVEL=debug` is set we emit
 * everything; otherwise we suppress `debug` (which is by far the noisiest
 * channel).
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LEVELS;

function activeLevel(): LogLevel {
    const raw = (process.env.ARC_LOG_LEVEL || 'info').toLowerCase();
    if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') return raw;
    return 'info';
}

function shouldLog(level: LogLevel): boolean {
    return LEVELS[level] >= LEVELS[activeLevel()];
}

function write(level: LogLevel, scope: string, message: string, meta?: unknown): void {
    if (!shouldLog(level)) return;
    const tag = `[${scope}] ${level.toUpperCase()}:`;
    const payload = meta === undefined ? '' : ' ' + JSON.stringify(meta);
    (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(
        `${tag} ${message}${payload}`,
    );
}

export function getLogger(scope: string) {
    return {
        debug: (msg: string, meta?: unknown) => write('debug', scope, msg, meta),
        info:  (msg: string, meta?: unknown) => write('info',  scope, msg, meta),
        warn:  (msg: string, meta?: unknown) => write('warn',  scope, msg, meta),
        error: (msg: string, meta?: unknown) => write('error', scope, msg, meta),
    };
}
