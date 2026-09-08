// src/transform/throttle.ts

/**
 * Options configuring rate-limiting behavior for `ThrottleStream`.
 */
export interface ThrottleStreamOptions {
    /** Maximum number of items allowed per interval window. */
    limit: number;
    /** Interval window in milliseconds. */
    intervalMS: number;
}

/**
 * A `TransformStream` that limits chunk throughput over a specified time interval
 * using a token bucket rate-limiting algorithm.
 *
 * @typeParam T - The type of items flowing through the stream.
 *
 * @example
 * ```ts
 * // Allow at most 5 items per second
 * const throttled = stream.pipeThrough(
 *   new ThrottleStream({ limit: 5, intervalMS: 1000 })
 * );
 * ```
 */
export class ThrottleStream<T> extends TransformStream<T, T> {
    #tokens: number;
    readonly #limit: number;
    readonly #intervalMS: number;
    #lastRefill: number = Date.now();

    /**
     * Constructs a new `ThrottleStream`.
     *
     * @param options - Configuration options for limits and interval window.
     * @throws {RangeError} If `limit` or `intervalMS` is less than or equal to 0.
     */
    constructor({ limit, intervalMS }: ThrottleStreamOptions) {
        if (limit <= 0) throw new RangeError("limit must be greater than 0");
        if (intervalMS <= 0) throw new RangeError("intervalMS must be greater than 0");

        let tokens = limit;

        super({
            transform: async (chunk, controller) => {
                const now = Date.now();
                const elapsed = now - this.#lastRefill;

                // Refill tokens proportionally over elapsed time
                tokens = Math.min(this.#limit, tokens + (elapsed / this.#intervalMS) * this.#limit);
                this.#lastRefill = now;

                if (tokens < 1) {
                    const waitMs = ((1 - tokens) / this.#limit) * this.#intervalMS;
                    await new Promise((resolve) => setTimeout(resolve, waitMs));
                    this.#lastRefill = Date.now();
                    tokens = 0;
                } else {
                    tokens -= 1;
                }

                controller.enqueue(chunk);
            },
        });

        this.#limit = limit;
        this.#intervalMS = intervalMS;
        this.#tokens = limit;
    }
}
