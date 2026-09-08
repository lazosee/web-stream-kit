# web-stream-kit

> Zero-dependency WHATWG stream transformers and binary utilities targeting the **WinterCG / Ecma TC55 Minimum Common Web Platform API** baseline.

[![npm version](https://img.shields.io/npm/v/web-stream-kit.svg)](https://www.npmjs.com/package/web-stream-kit)
[![license](https://img.shields.io/npm/l/web-stream-kit.svg)](./LICENSE)

---

## 🌟 Overview

`web-stream-kit` provides lightweight, modular, and composable stream transformers and binary utilities. It relies strictly on universal Web Platform primitives (`ReadableStream`, `TransformStream`, `WritableStream`, `Uint8Array`, `TextEncoder`, and `TextDecoder`) without binding to Node.js built-ins like `node:stream` or `node:buffer`.

### 🌍 Runtime Compatibility

- **Browsers:** Modern Evergreen (Chrome, Firefox, Safari, Edge)
- **Node.js:** 18.0.0 and above
- **Edge & Serverless:** Cloudflare Workers, Fastly Compute, Vercel Edge, AWS Lambda
- **Alternative Runtimes:** Deno, Bun

---

## 📦 Installation

```bash
npm install web-stream-kit
```

---

## 🚀 Subpath Exports

`web-stream-kit` offers targeted subpath exports to minimize bundle size:

| Export | Path | Description |
| :--- | :--- | :--- |
| Main | `web-stream-kit` | Access to all stream transformers and utilities |
| Text | `web-stream-kit/text` | `DelimiterStream`, SSE parse & encode streams |
| JSON | `web-stream-kit/json` | `NDJsonParseStream`, `JsonParseStream` |
| Transform | `web-stream-kit/transform` | `BatchStream`, `ThrottleStream`, `MapStream`, `FilterStream` |
| Utils | `web-stream-kit/utils` | `concatUint8Arrays`, `indexOfPattern` |

---

## 🛠️ Usage Examples

### 1. Line & Text Processing (`DelimiterStream`)

Split raw text chunks by custom delimiters (defaults to standard newlines `\n` or `\r\n`):

```ts
import { DelimiterStream } from "web-stream-kit/text";

const response = await fetch("https://example.com/log-stream.txt");

const lineStream = response.body!
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new DelimiterStream());

for await (const line of lineStream) {
  console.log("Line:", line);
}
```

### 2. Server-Sent Events (SSE) Parsing & Encoding

Parse incoming SSE HTTP response streams or encode outbound events:

```ts
import {
  ServerSentEventParseStream,
  ServerSentEventEncodeStream,
  type ServerSentEvent
} from "web-stream-kit/text";

// Parse incoming SSE stream
const sseResponse = await fetch("https://api.openai.com/v1/chat/completions", {
  headers: { Accept: "text/event-stream" }
});

const eventStream = sseResponse.body!
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new ServerSentEventParseStream());

for await (const event of eventStream) {
  console.log(`[${event.event ?? "message"}]:`, event.data);
}

// Encode outbound SSE stream
const events: ServerSentEvent[] = [
  { event: "update", id: "1", data: "Payload content" }
];
```

### 3. JSON & NDJSON Parsing

Parse Newline-Delimited JSON (NDJSON / JSON Lines) or accumulate and parse an entire JSON payload:

```ts
import { NDJsonParseStream, JsonParseStream } from "web-stream-kit/json";

interface UserRecord {
  id: number;
  name: string;
}

// Stream NDJSON line-by-line
const ndjsonStream = readable
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new NDJsonParseStream<UserRecord>());

for await (const user of ndjsonStream) {
  console.log(`User #${user.id}: ${user.name}`);
}

// Parse entire stream payload into a single object
const jsonStream = readable
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new JsonParseStream<UserRecord[]>());
```

### 4. Batching Stream Items (`BatchStream`)

Accumulate items into arrays of a fixed size, with an optional maximum wait timeout to flush incomplete batches early:

```ts
import { BatchStream } from "web-stream-kit/transform";

const batchedStream = itemsStream.pipeThrough(
  new BatchStream<number>({ batchSize: 100, maxWaitMs: 500 })
);

for await (const batch of batchedStream) {
  console.log(`Processing batch of ${batch.length} items...`);
}
```

### 5. Rate Limiting (`ThrottleStream`)

Throttle chunk throughput using a token-bucket rate-limiting algorithm:

```ts
import { ThrottleStream } from "web-stream-kit/transform";

// Limit throughput to at most 10 items per second (1000ms window)
const throttledStream = rawStream.pipeThrough(
  new ThrottleStream({ limit: 10, intervalMS: 1000 })
);
```

### 6. Map & Filter Operations (`MapStream`, `FilterStream`)

Transform or filter stream items using synchronous or asynchronous functions:

```ts
import { MapStream, FilterStream } from "web-stream-kit/transform";

const pipeline = numbersStream
  // Async mapping operation
  .pipeThrough(new MapStream(async (n: number, index: number) => n * 2))
  // Async filtering predicate
  .pipeThrough(new FilterStream(async (n: number) => n > 10));
```

### 7. Binary Utilities (`Uint8Array`)

High-performance `Uint8Array` aggregation and pattern search:

```ts
import { concatUint8Arrays, indexOfPattern } from "web-stream-kit/utils";

const chunkA = new Uint8Array([10, 20]);
const chunkB = new Uint8Array([30, 40]);
const merged = concatUint8Arrays([chunkA, chunkB]); // Uint8Array([10, 20, 30, 40])

const pattern = new Uint8Array([20, 30]);
const index = indexOfPattern(merged, pattern); // Returns 1
```

---

## ⚡ Error Handling & Backpressure

- **Error Propagation:** Errors occurring within transformer callbacks (`map`, `filter`, `parse`, etc.) are caught and forwarded directly down the pipeline using `controller.error()`.
- **Standard Backpressure:** All transformer implementations respect standard WHATWG stream backpressure mechanics (`desiredSize` signals).

---

<!-- API_DOCS_START -->
<!-- API_DOCS_END -->

---

## 📄 License

[MIT](./LICENSE) © [Lazaro Osee](https://github.com/lazosee)
