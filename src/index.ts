// src/index.ts

/**
 *
 * A zero-dependency WHATWG stream transformation and binary utility toolkit.
 *
 * @packageDocumentation
 *
 * ## Overview
 *
 * `web-stream-kit` provides lightweight, modular, and composable stream transformers
 * and binary utilities targeting the **WinterCG / Ecma TC55 Minimum Common Web Platform API** baseline.
 *
 * It relies strictly on universal primitives (`ReadableStream`, `TransformStream`, `WritableStream`,
 * `Uint8Array`, `TextEncoder`, and `TextDecoder`) without binding to Node.js built-ins (`node:stream`, `node:buffer`).
 *
 * ## Runtime Compatibility
 *
 * - **Browsers:** Modern Evergreen (Chrome, Firefox, Safari, Edge)
 * - **Node.js:** 18.0.0 and above
 * - **Edge & Serverless:** Cloudflare Workers, Fastly Compute, Vercel Edge, AWS Lambda
 * - **Alternative Runtimes:** Deno, Bun
 *
 * ## Core Features
 *
 * - **Text Transforms:** Delimiter-based line parsing (`DelimiterStream`) and spec-compliant Server-Sent Events encoding/decoding (`ServerSentEventParseStream`, `ServerSentEventEncodeStream`).
 * - **JSON Transforms:** Fast newline-delimited JSON line parsing (`NDJsonParseStream`) and full-stream payload parsing (`JsonParseStream`).
 * - **Pipeline Controls:** Backpressure-preserving batching (`BatchStream`), token-bucket rate limiting (`ThrottleStream`), and sync/async item transformers (`MapStream`, `FilterStream`).
 * - **Buffer Utilities:** Memory-conscious `Uint8Array` aggregation and sequence search (`concatUint8Arrays`, `indexOfPattern`).
 *
 * ## Error Handling & Backpressure
 *
 * All streams propagate errors directly to their downstream consumers via `controller.error()`.
 * Internal queues strictly honor standard backpressure semantics using the underlying stream controller's
 * `desiredSize` buffer controls.
 *
 * @example Pipeline Composition
 * ```ts
 * import {
 *   DelimiterStream,
 *   NDJsonParseStream,
 *   BatchStream,
 * } from "web-stream-kit";
 *
 * interface LogEntry {
 *   level: string;
 *   message: string;
 * }
 *
 * const response = await fetch("[https://api.example.com/logs/stream](https://api.example.com/logs/stream)");
 *
 * const pipeline = response.body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new DelimiterStream())
 *   .pipeThrough(new NDJsonParseStream<LogEntry>())
 *   .pipeThrough(new BatchStream<LogEntry>({ batchSize: 50, maxWaitMs: 1000 }));
 *
 * for await (const batch of pipeline) {
 *   console.log(`Received batch of ${batch.length} logs`);
 * }
 * ```
 *
 * @module web-stream-kit
 * @description
 * Zero-dependency WHATWG stream transformers and binary utilities compliant
 * with the WinterCG / Ecma TC55 Minimum Common Web Platform API standard.
 *
 * Designed to run natively across all modern JavaScript runtimes including
 * Node.js (18+), Bun, Deno, Cloudflare Workers, Fastly Compute, and modern web browsers.
 *
 * @example
 * ```ts
 * import {
 *   DelimiterStream,
 *   NDJsonParseStream,
 *   BatchStream,
 * } from "web-stream-kit";
 *
 * const processed = readable
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new DelimiterStream())
 *   .pipeThrough(new NDJsonParseStream())
 *   .pipeThrough(new BatchStream({ batchSize: 50 }));
 * ```
 */

// ============================================================================
// Text Transforms
// ============================================================================

/**
 * Options and stream transformer for splitting text along string boundaries.
 * @see {@link DelimiterStream}
 * @see {@link DelimiterStreamOptions}
 */
export {
    type DelimiterStreamOptions,
    DelimiterStream,
} from "./text/delimiter.js";

/**
 * Parsers, encoders, and interfaces for Server-Sent Events (SSE).
 * @see {@link ServerSentEventParseStream}
 * @see {@link ServerSentEventEncodeStream}
 * @see {@link ServerSentEvent}
 */
export { ServerSentEventParseStream } from "./text/sse-parse.js";
export { ServerSentEventEncodeStream } from "./text/sse-encode.js";
export { type ServerSentEvent } from "./text/sse-types.js";

// ============================================================================
// JSON Transforms
// ============================================================================

/**
 * Options and stream transformer for line-delimited JSON (NDJSON / JSON Lines).
 * @see {@link NDJsonParseStream}
 * @see {@link NDJsonParseOptions}
 */
export {
    type NDJsonParseOptions,
    NDJsonParseStream,
} from "./json/ndjson.js";

/**
 * Options and stream transformer for accumulating and parsing an entire JSON payload stream.
 * @see {@link JsonParseStream}
 * @see {@link JsonParseOptions}
 */
export {
    type JsonParseOptions,
    JsonParseStream,
} from "./json/parse.js";

// ============================================================================
// Stream Pipeline Transforms
// ============================================================================

/**
 * Options and transformer for grouping stream items into fixed-size batches or flushing on timeout.
 * @see {@link BatchStream}
 * @see {@link BatchStreamOptions}
 */
export {
    type BatchStreamOptions,
    BatchStream,
} from "./transform/batch.js";

/**
 * Options and transformer for rate-limiting stream throughput using token-bucket throttling.
 * @see {@link ThrottleStream}
 * @see {@link ThrottleStreamOptions}
 */
export {
    type ThrottleStreamOptions,
    ThrottleStream,
} from "./transform/throttle.js";

/**
 * Synchronous and asynchronous chunk-mapping transformation stream.
 * @see {@link MapStream}
 * @see {@link MapFunction}
 */
export {
    type MapFunction,
    MapStream,
} from "./transform/map.js";

/**
 * Synchronous and asynchronous chunk-filtering predicate stream.
 * @see {@link FilterStream}
 * @see {@link FilterPredicate}
 */
export {
    type FilterPredicate,
    FilterStream,
} from "./transform/filter.js";

// ============================================================================
// Binary Utilities
// ============================================================================

/**
 * High-performance, zero-dependency `Uint8Array` binary manipulation utilities.
 * @see {@link concatUint8Arrays}
 * @see {@link indexOfPattern}
 */
export {
    concatUint8Arrays,
    indexOfPattern,
} from "./utils/buffer.js";
