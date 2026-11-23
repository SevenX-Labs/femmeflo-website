"use client";

import { useEffect, useRef } from "react";
import { realtimeWebClient, type RealtimeEventType, type RealtimeEventPayload } from "./realtimeClient";

export interface UseRealtimeSyncOptions {
  /**
   * Background polling interval in milliseconds as a fallback guarantee.
   * Defaults to 10,000ms (10 seconds). Set to 0 to disable interval.
   */
  pollIntervalMs?: number;
  /**
   * Whether sync is enabled. Defaults to true.
   */
  enabled?: boolean;
}

/**
 * React hook to automatically sync page data on real-time events and periodic heartbeat
 * so users never have to click refresh manually.
 */
export function useRealtimeSync(
  eventTypes: RealtimeEventType[],
  onSync: (event?: RealtimeEventPayload) => void | Promise<void>,
  options: UseRealtimeSyncOptions = {}
): void {
  const { pollIntervalMs = 10000, enabled = true } = options;
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  const lastSyncTimeRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;

    const triggerSync = async (event?: RealtimeEventPayload) => {
      const now = Date.now();
      // Throttle rapid duplicate events to once per 800ms
      if (now - lastSyncTimeRef.current < 800 && event) return;
      if (isSyncingRef.current) return;

      isSyncingRef.current = true;
      lastSyncTimeRef.current = now;
      try {
        await onSyncRef.current(event);
      } catch (err) {
        console.warn("[useRealtimeSync] Sync error", err);
      } finally {
        isSyncingRef.current = false;
      }
    };

    // 1. Subscribe to push events from SSE
    const unsubscribe = realtimeWebClient.subscribe(eventTypes, (evt) => {
      triggerSync(evt);
    });

    // 2. Continuous fallback interval while page is open and visible
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (pollIntervalMs > 0) {
      intervalId = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          triggerSync();
        }
      }, pollIntervalMs);
    }

    return () => {
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, [enabled, pollIntervalMs, eventTypes]);
}
