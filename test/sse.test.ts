// tests/sse.test.ts
import { describe, it, expect } from "vitest";
import { ServerSentEventParseStream } from "../src/index.js";
import { ServerSentEventEncodeStream } from "../src/index.js";
import type { ServerSentEvent } from "../src/index.js";
import { runTransform } from "./helpers.js";

describe("ServerSentEventParseStream", () => {
    it("parses simple event with data field", async () => {
        const input = ["data: hello world\n\n"];
        const result = await runTransform(new ServerSentEventParseStream(), input);

        expect(result).toEqual([{ data: "hello world" }]);
    });

    it("parses events with event name, id, and retry", async () => {
        const input = [
            "event: update\n" +
            "id: 42\n" +
            "retry: 3000\n" +
            "data: payload data\n\n"
        ];
        const result = await runTransform(new ServerSentEventParseStream(), input);

        expect(result).toEqual([
            {
                event: "update",
                id: "42",
                retry: 3000,
                data: "payload data",
            },
        ]);
    });

    it("joins multiple data fields with newlines", async () => {
        const input = [
            "data: line 1\n" +
            "data: line 2\n" +
            "data: line 3\n\n"
        ];
        const result = await runTransform(new ServerSentEventParseStream(), input);

        expect(result).toEqual([{ data: "line 1\nline 2\nline 3" }]);
    });

    it("normalizes CRLF and CR newlines", async () => {
        const input = ["data: win\r\ndata: mac\rdata: unix\n\n"];
        const result = await runTransform(new ServerSentEventParseStream(), input);

        expect(result).toEqual([{ data: "win\nmac\nunix" }]);
    });

    it("parses comment-only events", async () => {
        const input = [": this is a ping comment\n\n"];
        const result = await runTransform(new ServerSentEventParseStream(), input);

        expect(result).toEqual([
            {
                comment: "this is a ping comment",
                data: "",
            },
        ]);
    });

    it("strips only a single leading space after the colon", async () => {
        const input = ["data:   three leading spaces\n\n"];
        const result = await runTransform(new ServerSentEventParseStream(), input);

        expect(result).toEqual([{ data: "  three leading spaces" }]);
    });

    it("ignores invalid retry numbers gracefully", async () => {
        const input = ["retry: not-a-number\ndata: ok\n\n"];
        const result = await runTransform(new ServerSentEventParseStream(), input);

        expect(result).toEqual([{ data: "ok" }]);
    });

    it("flushes incomplete event on stream termination", async () => {
        const input = ["data: unclosed event"];
        const result = await runTransform(new ServerSentEventParseStream(), input);

        expect(result).toEqual([{ data: "unclosed event" }]);
    });
});

describe("ServerSentEventEncodeStream", () => {
    it("encodes standard ServerSentEvent object to wire format", async () => {
        const events: ServerSentEvent[] = [
            {
                event: "ping",
                id: "1",
                retry: 5000,
                data: "pong",
            },
        ];
        const result = await runTransform(new ServerSentEventEncodeStream(), events);

        expect(result[0]).toBe("event: ping\nid: 1\nretry: 5000\ndata: pong\n\n");
    });

    it("partitions multi-line data properties into discrete data: lines", async () => {
        const events: ServerSentEvent[] = [
            {
                data: "line1\nline2\r\nline3",
            },
        ];
        const result = await runTransform(new ServerSentEventEncodeStream(), events);

        expect(result[0]).toBe("data: line1\ndata: line2\ndata: line3\n\n");
    });

    it("encodes comments correctly", async () => {
        const events: ServerSentEvent[] = [
            {
                comment: "keepalive",
                data: "",
            },
        ];
        const result = await runTransform(new ServerSentEventEncodeStream(), events);

        expect(result[0]).toBe(": keepalive\ndata: \n\n");
    });

    it("roundtrips cleanly between Encoder and Decoder", async () => {
        const original: ServerSentEvent[] = [
            { event: "msg", id: "101", data: "first line\nsecond line" },
            { comment: "heartbeat", data: "" },
        ];

        const encoded = await runTransform(new ServerSentEventEncodeStream(), original);
        const decoded = await runTransform(new ServerSentEventParseStream(), encoded);

        expect(decoded).toEqual(original);
    });
});
