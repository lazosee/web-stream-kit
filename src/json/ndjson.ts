// src/json/ndjson.ts

/**
 * Options configuring newline-delimited JSON stream parsing.
 */
export interface NDJsonParseOptions {
    /**
     * Optional function that transforms the results of parsing each JSON line.
     *
     * @param key - The property key being parsed.
     * @param value - The parsed value.
     */
    reviver?: (key: string, value: unknown) => unknown;
}

/**
 * A `TransformStream` that parses individual lines of text into structured JSON values.
 * Automatically ignores empty lines and comments/keep-alive entries.
 *
 * @typeParam T - The expected output type after parsing.
 *
 * @example
 * ```ts
 * const parsedStream = lineStream.pipeThrough(
 *   new NDJsonParseStream<LogEntry>()
 * );
 * ```
 */
export class NDJsonParseStream<T = unknown> extends TransformStream<string, T> {
    /**
     * Constructs a new `NDJsonParseStream`.
     *
     * @param options - Optional parser settings, including a JSON reviver function.
     */
    constructor(options: NDJsonParseOptions = {}) {
        super({
            transform: (line, controller) => {
                const trimmed = line.trim();
                if (!trimmed) return; // Skip empty keep-alive lines

                try {
                    const parsed = JSON.parse(trimmed, options.reviver) as T;
                    controller.enqueue(parsed);
                } catch (err) {
                    controller.error(
                        new SyntaxError(
                            `NDJson stream parsing error: ${err instanceof Error ? err.message : String(err)}`
                        )
                    );
                }
            },
        });
    }
}
