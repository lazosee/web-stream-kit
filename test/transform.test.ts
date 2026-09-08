// tests/transform.test.ts
import { describe, it, expect, vi } from "vitest";
import { BatchStream } from "../src/index.js";
import { ThrottleStream } from "../src/index.js";
import { MapStream } from "../src/index.js";
import { FilterStream } from "../src/index.js";
import { runTransform } from "./helpers.js";

describe("BatchStream", () => {
    it("throws RangeError if batchSize is <= 0", () => {
        expect(() => new BatchStream({ batchSize: 0 })).toThrow(RangeError);
        expect(() => new BatchStream({ batchSize: -5 })).toThrow(RangeError);
    });

    it("batches items strictly by batchSize", async () => {
        const stream = new BatchStream<number>({ batchSize: 3 });
        const result = await runTransform(stream, [1, 2, 3, 4, 5, 6, 7]);

        expect(result).toEqual([
            [1, 2, 3],
            [4, 5, 6],
            [7], // Remaining chunk on flush
        ]);
    });

    it("flushes incomplete batches early when maxWaitMs triggers", async () => {
        vi.useFakeTimers();

        try {
            const stream = new BatchStream<number>({ batchSize: 5, maxWaitMs: 200 });
            const writer = stream.writable.getWriter();
            const reader = stream.readable.getReader();

            const w1 = writer.write(1);
            const w2 = writer.write(2);

            const readPromise = reader.read();
            await vi.advanceTimersByTimeAsync(250);

            const { value } = await readPromise;
            expect(value).toEqual([1, 2]);

            await Promise.all([w1, w2]);
            await writer.close();
        } finally {
            vi.useRealTimers();
        }
    });
});

describe("ThrottleStream", () => {
    it("throws RangeError for invalid options", () => {
        expect(() => new ThrottleStream({ limit: 0, intervalMS: 100 })).toThrow(RangeError);
        expect(() => new ThrottleStream({ limit: 5, intervalMS: 0 })).toThrow(RangeError);
    });

    it("allows immediate throughput within limit and introduces delay beyond limit", async () => {
        const stream = new ThrottleStream<number>({ limit: 2, intervalMS: 100 });
        const start = Date.now();

        const result = await runTransform(stream, [1, 2, 3]);
        const elapsed = Date.now() - start;

        expect(result).toEqual([1, 2, 3]);
        // The 3rd chunk should trigger a sleep delay
        expect(elapsed).toBeGreaterThanOrEqual(40);
    });
});

describe("MapStream", () => {
    it("maps chunks synchronously with accurate index tracking", async () => {
        const mapped = await runTransform(
            new MapStream<string, string>((val, idx) => `${idx}:${val.toUpperCase()}`),
            ["a", "b", "c"]
        );
        expect(mapped).toEqual(["0:A", "1:B", "2:C"]);
    });

    it("handles asynchronous mapping operations", async () => {
        const asyncMap = new MapStream<number, number>(async (n) => {
            await new Promise((r) => setTimeout(r, 5));
            return n * 10;
        });
        const result = await runTransform(asyncMap, [1, 2, 3]);
        expect(result).toEqual([10, 20, 30]);
    });

    it("propagates errors thrown inside mapping function", async () => {
        const errorMap = new MapStream<number, number>(() => {
            throw new Error("Map failed");
        });
        await expect(runTransform(errorMap, [1])).rejects.toThrow("Map failed");
    });
});

describe("FilterStream", () => {
    it("filters chunks synchronously with accurate index tracking", async () => {
        const stream = new FilterStream<number>((n, idx) => n % 2 === 0 && idx > 0);
        const result = await runTransform(stream, [2, 3, 4, 5, 6]);
        // 2 is at index 0 (filtered out), 4 is at index 2 (kept), 6 is at index 4 (kept)
        expect(result).toEqual([4, 6]);
    });

    it("supports async filter predicates", async () => {
        const stream = new FilterStream<string>(async (str) => {
            await new Promise((r) => setTimeout(r, 5));
            return str.startsWith("valid");
        });
        const result = await runTransform(stream, ["valid-1", "invalid-2", "valid-3"]);
        expect(result).toEqual(["valid-1", "valid-3"]);
    },);

    it("propagates errors thrown inside predicate function", async () => {
        const errorFilter = new FilterStream<number>(() => {
            throw new Error("Predicate crash");
        });
        await expect(runTransform(errorFilter, [100])).rejects.toThrow("Predicate crash");
    });
});
