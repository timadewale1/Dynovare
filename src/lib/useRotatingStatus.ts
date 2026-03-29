"use client";

import { useEffect, useMemo, useState } from "react";

export function useRotatingStatus(active: boolean, messages: string[], intervalMs = 1800) {
  const safeMessages = useMemo(() => messages.filter(Boolean), [messages]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }

    if (safeMessages.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeMessages.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [active, intervalMs, safeMessages]);

  return active ? safeMessages[index] ?? "" : "";
}
