import * as z from "zod";

/**
 * Single entry point for Zod in app code.
 *
 * Zod probes `new Function("")` when an object schema is created to decide
 * whether it may compile fast parsers. Browsers report that caught call to
 * Content-Security-Policy as an `unsafe-eval` violation even though the
 * exception is swallowed. Disabling JIT in the browser skips the probe, so
 * `script-src` can drop `'unsafe-eval'`. Server code keeps the fast path.
 *
 * Importing from this module (instead of `zod`) guarantees the config runs
 * before any schema in the importing module is created.
 */
if (typeof window !== "undefined") {
    z.config({ jitless: true });
}

export * from "zod";
export { z };
