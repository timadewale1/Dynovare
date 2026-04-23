"use client";

import { useSyncExternalStore } from "react";

export type PublicTheme = "dark" | "light";

const STORAGE_KEY = "dynovare_public_theme";
let currentTheme: PublicTheme = "dark";
const listeners = new Set<() => void>();
let initialized = false;

function applyTheme(theme: PublicTheme) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.publicTheme = theme;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function initTheme() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  currentTheme = stored === "light" ? "light" : "dark";
  applyTheme(currentTheme);

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    currentTheme = event.newValue === "light" ? "light" : "dark";
    applyTheme(currentTheme);
    emit();
  });
}

function subscribe(listener: () => void) {
  initTheme();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  initTheme();
  return currentTheme;
}

export function setPublicTheme(nextTheme: PublicTheme) {
  currentTheme = nextTheme;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }
  applyTheme(nextTheme);
  emit();
}

export function usePublicTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "dark");
  return {
    theme,
    setTheme: setPublicTheme,
    toggleTheme: () => setPublicTheme(theme === "dark" ? "light" : "dark"),
    mounted: true,
  };
}
