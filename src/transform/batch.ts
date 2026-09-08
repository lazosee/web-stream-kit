// src/transform/batch.ts

/**
 * Options configuring chunk batching behavior.
 */
export interface BatchStreamOptions {
    /** The maximum number of items to accumulate before emitting a batch. */
    batchSize: number;
    /** Optional timeout in milliseconds to flush an incomplete batch. */
    maxWaitMs?: number;
}

/**
 * A `TransformStream` that accumulates incoming items into arrays of a fixed size
 * or flushes early if an optional maximum wait duration elapses.
 *
 * @typeParam T - The type of items flowing through the stream.
 *
 * @example
 * ```ts
 * const batched = readable.pipeThrough(
 *   new BatchStream<number>({ batchSize: 100, maxWaitMs: 500 })
 * );
 * ```
 */
export class BatchStream<T> extends TransformStream<T, T[]> {
    #batch: T[] = [];
    readonly #batchSize: number;
    readonly #maxWaitMs?: number;
    #timerId: ReturnType<typeof setTimeout> | null = null;

    /**
     * Constructs a new `BatchStream`.
     *
     * @param options - Configuration options for batch size and timeout.
     * @throws {RangeError} If `batchSize` is less than or equal to 0.
     */
    constructor({ batchSize, maxWaitMs }: BatchStreamOptions) {
        if (batchSize <= 0) {
            throw new RangeError("batchSize must be greater than 0");
        }

        super({
            transform: (chunk, controller) => {
                this.#batch.push(chunk);
                if (this.#batch.length >= this.#batchSize) {
                    this.#flushBatch(controller);
                } else if (maxWaitMs !== undefined && this.#timerId === null) {
                    this.#timerId = setTimeout(() => {
                        this.#flushBatch(controller);
                    }, this.#maxWaitMs);
                }
            },
            flush: (controller) => {
                this.#flushBatch(controller);
            },
        });

        this.#batchSize = batchSize;
        this.#maxWaitMs = maxWaitMs;
    }

    #flushBatch(controller: TransformStreamDefaultController<T[]>) {
        if (this.#timerId !== null) {
            clearTimeout(this.#timerId);
            this.#timerId = null;
        }

        if (this.#batch.length > 0) {
            controller.enqueue(this.#batch);
            this.#batch = [];
        }
    }
}
