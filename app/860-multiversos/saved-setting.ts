import { useLayoutEffect, useState } from "react";

export function useSavedSetting<T>(name: string, initial: T | (() => T)) {
  const key = "860-multiversos:settings:v1:" + name;
  const [value, setValue] = useState<T>(() => {
    const fallback = typeof initial === "function" ? (initial as () => T)() : initial;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const saved = JSON.parse(raw);
      if (Array.isArray(fallback)) {
        return Array.isArray(saved) && saved.length === fallback.length ? saved as T : fallback;
      }
      if (fallback && typeof fallback === "object") {
        return saved && typeof saved === "object" && !Array.isArray(saved) ? { ...fallback, ...saved } : fallback;
      }
      return typeof saved === typeof fallback ? saved as T : fallback;
    } catch {
      return fallback;
    }
  });
  useLayoutEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private browsing or a full storage quota can prevent saving.
    }
  }, [key, value]);
  return [value, setValue] as const;
}
