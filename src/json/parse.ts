// src/json/parse.ts

/**
 * Options configuring whole-stream chunked JSON parsing.
 */
export interface JsonParseOptions {
    /**
     * Optional transformation function passed to `JSON.parse`.
     *
     * @param key - The property key being parsed.
     * @param value - The parsed value.
     */
    reviver?: (key: string, value: unknown) => unknown;
}

/**
 * A `TransformStream` that buffers incoming text chunks and parses the entire stream as a single JSON entity on completion.
 *
 * @typeParam T - The expected shape of the parsed JSON root.
 *
 * @example
 * ```ts
 * const dataStream = response.body
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new JsonParseStream<UserProfile>());
 * ```
 */
export class JsonParseStream<T = unknown> extends TransformStream<string, T> {
    #buffer = "";

    /**
     * Constructs a new `JsonParseStream`.
     *
     * @param options - Optional parser settings.
     */
    constructor(options: JsonParseOptions = {}) {
        super({
            transform: (chunk) => {
                this.#buffer += chunk;
            },
            flush: (controller) => {
                const trimmed = this.#buffer.trim();
                if (!trimmed) return;

                try {
                    const parsed = JSON.parse(trimmed, options.reviver) as T;
                    controller.enqueue(parsed);
                    this.#buffer = "";
                } catch (err) {
                    controller.error(
                        new SyntaxError(
                            `JSON stream parse error: ${err instanceof Error ? err.message : String(err)}`
                        )
                    );
                }
            },
        });
    }
}
