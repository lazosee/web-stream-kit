// src/text/delimiter.ts

/**
 * Options configuring delimiter-based text chunk splitting.
 */
export interface DelimiterStreamOptions {
    /** The string delimiter to split chunks by. Defaults to `"\n"`. */
    delimiter?: string;
    /** Whether to retain the delimiter character at the end of each emitted chunk. Defaults to `false`. */
    keepDelimiter?: boolean;
}

/**
 * A `TransformStream` that splits incoming string chunks along a specified delimiter string.
 *
 * @example
 * ```ts
 * const lineStream = textStream.pipeThrough(
 *   new DelimiterStream({ delimiter: "\n", keepDelimiter: false })
 * );
 * ```
 */
export class DelimiterStream extends TransformStream<string, string> {
    #buffer: string = "";

    /**
     * Constructs a new `DelimiterStream`.
     *
     * @param options - Configuration options for delimiter matching and retention.
     */
    constructor(options: DelimiterStreamOptions = {}) {
        const delimiter = options.delimiter ?? "\n";
        const keepDelimiter = options.keepDelimiter ?? false;

        super({
            transform: (chunk, controller) => {
                this.#buffer += chunk;
                const parts = this.#buffer.split(delimiter);

                // The last part is either empty or an incomplete line
                this.#buffer = parts.pop() ?? "";

                for (const part of parts) {
                    controller.enqueue(keepDelimiter ? part + delimiter : part);
                }
            },
            flush: (controller) => {
                if (this.#buffer.length > 0) {
                    controller.enqueue(this.#buffer);
                    this.#buffer = "";
                }
            },
        });
    }
}

