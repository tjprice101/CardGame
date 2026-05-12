import type { EventPayloads } from '@/types/events';

type Listener<T> = (payload: T) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  on<K extends keyof EventPayloads>(event: K, listener: Listener<EventPayloads[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);
    return () => this.off(event, listener);
  }

  off<K extends keyof EventPayloads>(event: K, listener: Listener<EventPayloads[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<K extends keyof EventPayloads>(event: K, payload: EventPayloads[K]): void {
    this.listeners.get(event)?.forEach(l => l(payload));
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
