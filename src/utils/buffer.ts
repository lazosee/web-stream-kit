// src/utils/buffer.ts

/**
 * Concatenates an array of Uint8Arrays into a single contiguous Uint8Array.
 *
 * @param arrays - The array of Uint8Array chunks to concatenate.
 * @returns A single contiguous Uint8Array containing all bytes.
 *
 * @example
 * ```ts
 * const a = new Uint8Array([1, 2]);
 * const b = new Uint8Array([3, 4]);
 * const combined = concatUint8Arrays([a, b]); // Uint8Array [1, 2, 3, 4]
 * ```
 */
export function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    if (arrays.length === 0) return new Uint8Array(0);
    if (arrays.length === 1) return arrays[0];

    const totalLength = arrays.reduce((acc, curr) => acc + curr.byteLength, 0);
    const result = new Uint8Array(totalLength);

    let offset = 0;
    for (const array of arrays) {
        result.set(array, offset);
        offset += array.byteLength;
    }

    return result;
}

/**
 * Finds the first index of a sequence pattern within a target Uint8Array.
 *
 * @param source - The source buffer to search within.
 * @param pattern - The sequence of bytes to find.
 * @param start - The starting index in `source` to begin searching from. Defaults to `0`.
 * @returns The zero-based index of the first match, or `-1` if not found.
 *
 * @example
 * ```ts
 * const source = new Uint8Array([10, 20, 30, 40]);
 * const pattern = new Uint8Array([20, 30]);
 * const idx = indexOfPattern(source, pattern); // 1
 * ```
 */
export function indexOfPattern(
    source: Uint8Array,
    pattern: Uint8Array,
    start: number = 0
): number {
    if (pattern.byteLength === 0) return 0;
    if (source.byteLength < pattern.byteLength + start) return -1;

    for (let i = start; i <= source.byteLength - pattern.byteLength; i += 1) {
        let match = true;
        for (let j = 0; j < pattern.byteLength; j += 1) {
            if (source[i + j] !== pattern[j]) {
                match = false;
                break;
            }
        }
        if (match) return i;
    }

    return -1;
}
