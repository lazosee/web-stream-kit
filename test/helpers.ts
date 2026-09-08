// tests/helpers.ts
export async function runTransform<I, O>(
    transform: TransformStream<I, O>,
    inputChunks: I[]
): Promise<O[]> {
    const readable = new ReadableStream<I>({
        start(controller) {
            for (const chunk of inputChunks) {
                controller.enqueue(chunk);
            }
            controller.close();
        },
    });

    const output: O[] = [];
    const reader = readable.pipeThrough(transform).getReader();

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        output.push(value);
    }

    return output;
}
