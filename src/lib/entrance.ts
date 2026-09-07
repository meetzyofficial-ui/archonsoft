"use client";

import { useEffect, useState } from "react";

/**
 * Tiny store coordinating the entrance panel with the hero sequence, so the
 * headline starts animating as the curtain lifts rather than behind it.
 */
let entered = false;
const listeners = new Set<() => void>();

export function markEntered(): void {
  if (entered) return;
  entered = true;
  listeners.forEach((listener) => listener());
}

export function useEntered(): boolean {
  const [value, setValue] = useState(entered);

  useEffect(() => {
    if (entered) {
      setValue(true);
      return;
    }
    const listener = () => setValue(true);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return value;
}
