// src/transform/map.ts

/**
 * Transformation function for mapping an incoming chunk to a new representation.
 *
 * @typeParam I - The type of input chunk.
 * @typeParam O - The type of output chunk.
 * @param chunk - The item to transform.
 * @param index - The zero-based sequential index of the item.
 * @returns The transformed item or a Promise resolving to it.
 */
export type MapFunction<I, O> = (chunk: I, index: number) => O | Promise<O>;

/**
 * A `TransformStream` that applies a synchronous or asynchronous mapping function to each chunk.
 *
 * @typeParam I - Input stream chunk type.
 * @typeParam O - Output stream chunk type.
 *
 * @example
 * ```ts
 * const doubled = numbersStream.pipeThrough(
 *   new MapStream((n: number) => n * 2)
 * );
 * ```
 */
export class MapStream<I, O> extends TransformStream<I, O> {
    #index = 0;

    /**
     * Constructs a new `MapStream`.
     *
     * @param fn - The mapping function applied to each incoming item.
     */
    constructor(fn: MapFunction<I, O>) {
        super({
            transform: async (chunk, controller) => {
                try {
                    const result = await fn(chunk, this.#index++);
                    controller.enqueue(result);
                } catch (e) {
                    controller.error(e);
                }
            }
        });
    }

}
















