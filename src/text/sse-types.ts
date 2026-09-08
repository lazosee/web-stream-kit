// src/text/sse-types.ts

/**
 * Represents a structured Server-Sent Event (SSE) message adhering to the W3C EventSource standard.
 */
export interface ServerSentEvent {
    /** Optional custom event type (defaults to `"message"` in standard browser `EventSource`). */
    event?: string;
    /** Payload content. Multi-line strings are partitioned into individual `data:` fields when encoded. */
    data: string;
    /** Unique event identifier. */
    id?: string;
    /** Reconnection time interval in milliseconds. */
    retry?: number;
    /** Optional comment string (`: comment text`). */
    comment?: string;
}
