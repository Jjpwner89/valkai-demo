"use client";

import Anthropic from "@anthropic-ai/sdk";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// The key lives only in this tab's memory, inside the client. It is never
// written to storage or sent to our server, and it is dropped after an hour
// with no activity, or when the tab closes or reloads.
const IDLE_LIMIT_MS = 60 * 60 * 1000;
const IDLE_CHECK_MS = 30 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

type KeyContextValue = {
  client: Anthropic | null;
  connect: (key: string) => Promise<void>;
  disconnect: () => void;
  // Wrap long work (a streaming reply, a draft run) so it counts as activity.
  trackBusy: <T>(work: () => Promise<T>) => Promise<T>;
};

const KeyContext = createContext<KeyContextValue | null>(null);

export function KeyProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Anthropic | null>(null);
  const lastActive = useRef(0);
  const busy = useRef(0);

  const disconnect = useCallback(() => setClient(null), []);

  const connect = useCallback(async (key: string) => {
    const candidate = new Anthropic({ apiKey: key.trim(), dangerouslyAllowBrowser: true });
    // A free call that fails fast on a bad key.
    await candidate.models.list({ limit: 1 });
    lastActive.current = Date.now();
    setClient(candidate);
  }, []);

  const trackBusy = useCallback(async <T,>(work: () => Promise<T>) => {
    busy.current += 1;
    try {
      return await work();
    } finally {
      busy.current -= 1;
      lastActive.current = Date.now();
    }
  }, []);

  useEffect(() => {
    if (!client) return;
    const touch = () => {
      lastActive.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = window.setInterval(() => {
      if (busy.current > 0) {
        lastActive.current = Date.now();
      } else if (Date.now() - lastActive.current > IDLE_LIMIT_MS) {
        setClient(null);
      }
    }, IDLE_CHECK_MS);
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, touch));
      window.clearInterval(timer);
    };
  }, [client]);

  const value = useMemo(() => ({ client, connect, disconnect, trackBusy }), [client, connect, disconnect, trackBusy]);
  return <KeyContext.Provider value={value}>{children}</KeyContext.Provider>;
}

export function useApiKey() {
  const ctx = useContext(KeyContext);
  if (!ctx) throw new Error("useApiKey must be used inside KeyProvider");
  return ctx;
}
