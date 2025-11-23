import type { SSEStreamingApi } from "hono/streaming";
import { Log } from "../util/log.ts";

const log = Log.create({ service: "sse" });

export namespace SSE {
  export type EventType =
    | 'part.updated'
    | 'session.name'
    | 'session.updated'
    | 'session.deleted'
    | 'session.idle'
    | 'error'
    | 'billing.insufficient_credits';

  export async function writeEnvelope(
    stream: SSEStreamingApi,
    type: EventType | string,
    data: unknown,
  ) {
    await stream.writeSSE({
      data: JSON.stringify({ v: 1, type, data, ts: Date.now() }),
    });
  }

  export async function endStream(stream: SSEStreamingApi) {
    await stream.writeSSE({ data: "[DONE]" });
  }

  export function create(stream: SSEStreamingApi) {
    let ended = false;

    return {
      get ended() {
        return ended;
      },
      async write(type: EventType | string, data: unknown) {
        if (ended) return;
        try {
          await SSE.writeEnvelope(stream, type, data);
        }
        catch (err) {
          log.error('Failed to write SSE', { error: err });
          ended = true;
        }
      },
      async end(reason?: string) {
        if (ended) return;
        ended = true;
        await SSE.endStream(stream);
        if (reason) {
          log.info("Stream ended", { reason });
        }
      },
    };
  }
}
