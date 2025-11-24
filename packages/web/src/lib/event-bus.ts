/**
 * Event Bus for SSE Events
 * 
 * This event bus allows different parts of the application to listen to
 * and react to SSE events without tight coupling. Zustand stores can
 * subscribe to specific event types and update their state accordingly.
 */

import type { SseEnvelope } from "@/client/sandbox/types.gen"

// Event listener type
type EventListener = (event: SseEnvelope) => void

// Event listeners map
type EventListeners = Map<string, Set<EventListener>>

class EventBus {
  private listeners: EventListeners = new Map()
  private globalListeners: Set<EventListener> = new Set()

  /**
   * Subscribe to a specific event type
   * @param eventType - The event type to listen for (e.g., "session.updated")
   * @param listener - The callback function to execute when event occurs
   * @returns Unsubscribe function
   */
  on(eventType: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    this.listeners.get(eventType)!.add(listener)

    // Return unsubscribe function
    return () => {
      this.off(eventType, listener)
    }
  }

  /**
   * Subscribe to all events
   * @param listener - The callback function to execute for any event
   * @returns Unsubscribe function
   */
  onAny(listener: EventListener): () => void {
    this.globalListeners.add(listener)

    return () => {
      this.offAny(listener)
    }
  }

  /**
   * Unsubscribe from a specific event type
   */
  off(eventType: string, listener: EventListener): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.listeners.delete(eventType)
      }
    }
  }

  /**
   * Unsubscribe from all events
   */
  offAny(listener: EventListener): void {
    this.globalListeners.delete(listener)
  }

  /**
   * Emit an event to all registered listeners
   * @param event - The SSE event envelope
   */
  emit(event: SseEnvelope): void {
    // Notify global listeners
    this.globalListeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error("[EventBus] Error in global listener:", error)
      }
    })

    // Notify specific event type listeners
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event)
        } catch (error) {
          console.error(`[EventBus] Error in listener for ${event.type}:`, error)
        }
      })
    }
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners.clear()
    this.globalListeners.clear()
  }

  /**
   * Get count of listeners for a specific event type
   */
  listenerCount(eventType: string): number {
    return this.listeners.get(eventType)?.size || 0
  }

  /**
   * Get total count of all listeners
   */
  totalListenerCount(): number {
    let count = this.globalListeners.size
    this.listeners.forEach((listeners) => {
      count += listeners.size
    })
    return count
  }
}

// Export singleton instance
export const eventBus = new EventBus()

// Export the class for testing purposes
export { EventBus }

// Type-safe event subscription helpers
export type EventType = SseEnvelope['type']

/**
 * Type-safe wrapper for subscribing to events
 */
export function subscribeToEvent(
  eventType: EventType,
  listener: EventListener
): () => void {
  return eventBus.on(eventType, listener)
}

/**
 * Type-safe wrapper for subscribing to all events
 */
export function subscribeToAllEvents(listener: EventListener): () => void {
  return eventBus.onAny(listener)
}
