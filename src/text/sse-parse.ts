// src/text/sse-parse.ts
import { ServerSentEvent } from "./sse-types.js";

/**
 * A `TransformStream` that parses raw SSE text streams into typed `ServerSentEvent` objects.
 *
 * Normalizes CRLF and CR line breaks to LF, preserves comments, and triggers dispatches on blank line boundaries.
 *
 * @example
 * ```ts
 * const eventStream = response.body
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new ServerSentEventParseStream());
 * ```
 */
export class ServerSentEventParseStream extends TransformStream<string, ServerSentEvent> {
    #buffer = "";
    #currentEvent: Partial<ServerSentEvent> = {};
    #dataLines: string[] = [];

    /**
     * Constructs a new `ServerSentEventParseStream`.
     */
    constructor() {
        super({
            transform: (chunk, controller) => {
                // Normalize CRLF and CR to LF
                this.#buffer += chunk.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

                let newlineIndex: number;
                while ((newlineIndex = this.#buffer.indexOf("\n")) !== -1) {
                    const line = this.#buffer.slice(0, newlineIndex);
                    this.#buffer = this.#buffer.slice(newlineIndex + 1);

                    this.#processLine(line, controller);
                }
            },
            flush: (controller) => {
                if (this.#buffer.length > 0) {
                    this.#processLine(this.#buffer, controller);
                    this.#buffer = "";
                }
                this.#dispatchCurrentEvent(controller);
            },
        });
    }

    #processLine(
        line: string,
        controller: TransformStreamDefaultController<ServerSentEvent>
    ): void {
        // Empty line signals dispatch of current event buffer
        if (line === "") {
            this.#dispatchCurrentEvent(controller);
            return;
        }

        // Comment line: (: comment text)
        if (line.startsWith(":")) {
            this.#currentEvent.comment = line.startsWith(": ") ? line.slice(2) : line.slice(1);
            return;
        }

        const colonIndex = line.indexOf(":");
        let field = line;
        let value = "";

        if (colonIndex !== -1) {
            field = line.slice(0, colonIndex);
            value = line.slice(colonIndex + 1);
            if (value.startsWith(" ")) {
                value = value.slice(1); // Strip leading single whitespace per spec
            }
        }

        switch (field) {
            case "event":
                this.#currentEvent.event = value;
                break;
            case "data":
                this.#dataLines.push(value);
                break;
            case "id":
                this.#currentEvent.id = value;
                break;
            case "retry": {
                const parsedRetry = parseInt(value, 10);
                if (!Number.isNaN(parsedRetry)) {
                    this.#currentEvent.retry = parsedRetry;
                }
                break;
            }
            default:
                // Ignore unrecognized fields per SSE standard
                break;
        }
    }

    #dispatchCurrentEvent(
        controller: TransformStreamDefaultController<ServerSentEvent>
    ): void {
        const hasData = this.#dataLines.length > 0;
        const hasComment = this.#currentEvent.comment !== undefined;

        if (hasData || hasComment) {
            const dispatched: ServerSentEvent = {
                data: this.#dataLines.join("\n"),
                ...(this.#currentEvent.event !== undefined && { event: this.#currentEvent.event }),
                ...(this.#currentEvent.retry !== undefined && { retry: this.#currentEvent.retry }),
                ...(this.#currentEvent.comment !== undefined && { comment: this.#currentEvent.comment }),
                ...(this.#currentEvent.id !== undefined && { id: this.#currentEvent.id }),
            };

            controller.enqueue(dispatched);
        }

        // Reset accumulator state
        this.#currentEvent = {};
        this.#dataLines = [];
    }
}
