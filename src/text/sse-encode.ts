// src/text/sse-encode.ts
import { ServerSentEvent } from "./sse-types.js";

/**
 * A `TransformStream` that encodes `ServerSentEvent` objects into standard SSE wire strings.
 *
 * Each message is delimited with a blank line (`\n\n`) and multi-line data payloads
 * are split into individual `data:` lines.
 // src/text/sse-encode.ts
 import { ServerSentEvent } from "./sse-types.js";

 /**
 * A `TransformStream` that encodes `ServerSentEvent` objects into standard SSE wire strings.
 * Each message is delimited with a blank line (`\n\n`) and multi-line data payloads
 * are split into individual `data:` lines.
 *
 * @example
 * ```ts
 * const sseWireStream = objectStream
 *   .pipeThrough(new ServerSentEventEncodeStream())
 *   .pipeThrough(new TextEncoderStream());
 * ```
 */
export class ServerSentEventEncodeStream extends TransformStream<ServerSentEvent, string> {
    /**
     * Constructs a new `ServerSentEventEncodeStream`.
     */
    constructor() {
        super({
            transform: (event, controller) => {
                let payload = "";

                if (event.comment !== undefined) {
                    payload += `: ${event.comment}\n`;
                }

                if (event.event !== undefined) {
                    payload += `event: ${event.event}\n`;
                }

                if (event.id !== undefined) {
                    payload += `id: ${event.id}\n`;
                }

                if (event.retry !== undefined) {
                    payload += `retry: ${event.retry}\n`;
                }

                if (event.data !== undefined) {
                    // Normalize newlines within the payload
                    const normalized = event.data.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
                    const lines = normalized.split("\n");
                    for (const line of lines) {
                        payload += `data: ${line}\n`;
                    }
                }

                // SSE message boundary
                payload += "\n";
                controller.enqueue(payload);
            },
        });
    }
}
