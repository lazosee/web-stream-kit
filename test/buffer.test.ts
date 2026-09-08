// tests/buffer.test.ts
import { describe, it, expect } from "vitest";
import { concatUint8Arrays, indexOfPattern } from "../src/index.js";

describe("concatUint8Arrays", () => {
    it("returns an empty Uint8Array when passed an empty array", () => {
        const result = concatUint8Arrays([]);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.byteLength).toBe(0);
    });

    it("returns the exact same instance when passed a single array", () => {
        const input = new Uint8Array([1, 2, 3]);
        const result = concatUint8Arrays([input]);
        expect(result).toBe(input);
        expect(Array.from(result)).toEqual([1, 2, 3]);
    });

    it("concatenates multiple Uint8Arrays preserving byte order", () => {
        const a = new Uint8Array([1, 2]);
        const b = new Uint8Array([3, 4, 5]);
        const c = new Uint8Array([6]);
        const result = concatUint8Arrays([a, b, c]);

        expect(result.byteLength).toBe(6);
        expect(Array.from(result)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("handles empty arrays mixed with non-empty arrays", () => {
        const a = new Uint8Array([1, 2]);
        const empty = new Uint8Array(0);
        const b = new Uint8Array([3]);
        const result = concatUint8Arrays([a, empty, b, empty]);

        expect(Array.from(result)).toEqual([1, 2, 3]);
    });
});

describe("indexOfPattern", () => {
    const source = new Uint8Array([10, 20, 30, 40, 50, 20, 30, 60]);

    it("returns 0 if pattern has 0 byte length", () => {
        expect(indexOfPattern(source, new Uint8Array(0))).toBe(0);
    });

    it("finds pattern at the very beginning", () => {
        const pattern = new Uint8Array([10, 20]);
        expect(indexOfPattern(source, pattern)).toBe(0);
    });

    it("finds pattern in the middle", () => {
        const pattern = new Uint8Array([30, 40]);
        expect(indexOfPattern(source, pattern)).toBe(2);
    });

    it("finds pattern at the end", () => {
        const pattern = new Uint8Array([30, 60]);
        expect(indexOfPattern(source, pattern)).toBe(6);
    });

    it("respects the start offset parameter", () => {
        const pattern = new Uint8Array([20, 30]);
        expect(indexOfPattern(source, pattern, 0)).toBe(1);
        expect(indexOfPattern(source, pattern, 2)).toBe(5);
    });

    it("returns -1 when pattern is not present", () => {
        const pattern = new Uint8Array([99, 100]);
        expect(indexOfPattern(source, pattern)).toBe(-1);
    });

    it("returns -1 when pattern is longer than source", () => {
        const shortSource = new Uint8Array([1, 2]);
        const longPattern = new Uint8Array([1, 2, 3]);
        expect(indexOfPattern(shortSource, longPattern)).toBe(-1);
    });

    it("returns -1 when start offset leaves fewer bytes than pattern length", () => {
        const pattern = new Uint8Array([50, 20]);
        expect(indexOfPattern(source, pattern, 7)).toBe(-1);
    });

    it("handles single-byte searches accurately", () => {
        expect(indexOfPattern(source, new Uint8Array([50]))).toBe(4);
        expect(indexOfPattern(source, new Uint8Array([77]))).toBe(-1);
    });
});
