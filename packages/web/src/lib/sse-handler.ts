/**
 * SSE Handler
 * 
 * Manages SSE stream connections and emits events to the event bus.
 * This decouples the SSE stream handling from individual stores.
 */

import { eventBus } from "./event-bus"
import type { SseEnvelope } from "@/client/sandbox/types.gen"

export interface SSEStreamResponse {
  stream: AsyncIterable<SseEnvelope>
}

/**
 * Process an SSE stream and emit events to the event bus
 * @param sseResponse - The SSE response containing the stream
 * @returns Promise that resolves when stream ends
 */
export async function processSSEStream(
  sseResponse: SSEStreamResponse
): Promise<void> {
  try {
    console.log("[SSE Handler] Starting SSE stream processing")

    for await (const event of sseResponse.stream) {
      // Log the event for debugging
      console.log("[SSE Handler] Received event:", event.type, event)

      // Emit the event to the event bus
      eventBus.emit(event)

      // Check for stream end
      if (event.type === "stream.end") {
        const reason = (event.data as any)?.reason
        console.log("[SSE Handler] Stream ended:", reason || "No reason provided")
        break
      }
    }

    console.log("[SSE Handler] SSE stream processing completed")
  } catch (error) {
    console.error("[SSE Handler] Error processing SSE stream:", error)
    
    // Emit error event to the bus
    eventBus.emit({
      v: 1,
      type: "error",
      data: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      ts: Date.now(),
    })

    throw error
  }
}

/**
 * Create a handler for SSE streams that automatically processes events
 * @returns A function that accepts an SSE response and processes it
 */
export function createSSEHandler() {
  let activeStreams = 0

  return {
    /**
     * Process a new SSE stream
     */
    async handle(sseResponse: SSEStreamResponse): Promise<void> {
      activeStreams++
      console.log(`[SSE Handler] Active streams: ${activeStreams}`)

      try {
        await processSSEStream(sseResponse)
      } finally {
        activeStreams--
        console.log(`[SSE Handler] Active streams: ${activeStreams}`)
      }
    },

    /**
     * Get the number of active streams
     */
    getActiveStreamCount(): number {
      return activeStreams
    },
  }
}

// Export singleton handler
export const sseHandler = createSSEHandler()
