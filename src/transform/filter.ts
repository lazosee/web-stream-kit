// src/transform/filter.ts

/**
 * Predicate function evaluating whether an incoming stream chunk should be retained.
 *
 * @typeParam T - The type of item being evaluated.
 * @param chunk - The incoming item.
 * @param index - The zero-based sequential index of the item.
 * @returns `true` to keep the chunk, or `false` to discard it.
 */
export type FilterPredicate<T> = (chunk: T, index: number) => boolean | Promise<boolean>;

/**
 * A `TransformStream` that filters incoming chunks based on a sync or async predicate.
 *
 * @typeParam T - The type of input items.
 * @typeParam S - The narrowed type of passing items, defaulting to `T`.
 *
 * @example
 * ```ts
 * const evens = numbersStream.pipeThrough(
 *   new FilterStream((n: number) => n % 2 === 0)
 * );
 * ```
 */
export class FilterStream<T, S extends T = T> extends TransformStream<T, S> {
    #index = 0; //

    /**
     * Constructs a new `FilterStream`.
     *
     * @param predicate - Predicate function returning `true` for items to pass through.
     */
    constructor(predicate: (chunk: T, index: number) => boolean | Promise<boolean>) {
        super({
            transform: async (chunk, controller) => {
                try {
                    const shouldPass = await predicate(chunk, this.#index++);
                    if (shouldPass) {
                        controller.enqueue(chunk as S);
                    }
                } catch (e) {
                    controller.error(e);
                }
                },
        });
    }
}
