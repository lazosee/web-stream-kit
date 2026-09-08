// tests/json.test.ts
import { describe, it, expect } from "vitest";
import { NDJsonParseStream } from "../src/index.js";
import { JsonParseStream } from "../src/index.js";
import { runTransform } from "./helpers.js";

describe("NDJsonParseStream", () => {
    it("parses multiple lines of JSON objects", async () => {
        const lines = [
            '{"id": 1, "name": "Alice"}',
            '{"id": 2, "name": "Bob"}',
        ];
        const result = await runTransform(new NDJsonParseStream(), lines);

        expect(result).toEqual([
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" },
        ]);
    });

    it("ignores whitespace and empty lines", async () => {
        const lines = ["   ", '{"val": 10}', "", "\t\n", '{"val": 20}'];
        const result = await runTransform(new NDJsonParseStream(), lines);

        expect(result).toEqual([{ val: 10 }, { val: 20 }]);
    });

    it("applies reviver function if provided", async () => {
        const lines = ['{"date": "2026-01-01T00:00:00.000Z"}'];
        const stream = new NDJsonParseStream({
            reviver: (key, value) => (key === "date" ? new Date(value as string) : value),
        });
        const result = await runTransform(stream, lines);

        expect(result[0]).toEqual({ date: new Date("2026-01-01T00:00:00.000Z") });
    });

    it("errors on invalid JSON syntax", async () => {
        const lines = ['{"valid": true}', "invalid json"];
        await expect(runTransform(new NDJsonParseStream(), lines)).rejects.toThrow(
            SyntaxError
        );
    });
});

describe("JsonParseStream", () => {
    it("accumulates multiple text chunks and parses single JSON entity on flush", async () => {
        const chunks = ['{"users": [', '{"id": 1}, ', '{"id": 2}', "]}"];
        const result = await runTransform(new JsonParseStream(), chunks);

        expect(result).toEqual([
            {
                users: [{ id: 1 }, { id: 2 }],
            },
        ]);
    });

    it("emits nothing if the stream is completely empty or whitespace", async () => {
        const result = await runTransform(new JsonParseStream(), ["  \n  "]);
        expect(result).toEqual([]);
    });

    it("applies reviver to root payload", async () => {
        const chunks = ['{"count": "100"}'];
        const stream = new JsonParseStream({
            reviver: (key, val) => (key === "count" ? Number(val) : val),
        });
        const result = await runTransform(stream, chunks);

        expect(result).toEqual([{ count: 100 }]);
    });

    it("errors on stream end if buffered content is invalid JSON", async () => {
        const chunks = ['{"unclosed": '];
        await expect(runTransform(new JsonParseStream(), chunks)).rejects.toThrow(
            SyntaxError
        );
    });
});
