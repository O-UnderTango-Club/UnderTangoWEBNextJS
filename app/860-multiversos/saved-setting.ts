import { useCallback, useLayoutEffect, useRef, useState, type SetStateAction } from "react";
import { archiveControls, isControlSetting, readControlSetting, RECOVERED_CONTROLS, SETTINGS_PREFIX } from "./control-map";

export function useSavedSetting<T>(name: string, initial: T | (() => T)) {
  const key = SETTINGS_PREFIX + name;
  const learned = isControlSetting(name);
  const initialRef = useRef(initial);
  const read = useCallback((): T => {
    const initialValue = initialRef.current;
    const fallback = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
    try {
      const raw = localStorage.getItem(key);
      const saved = isControlSetting(name) ? readControlSetting(name, raw) : raw !== null ? JSON.parse(raw) : undefined;
      if (saved === undefined) return fallback;
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
  }, [key, name]);
  const [value, setValue] = useState<T>(read);
  const lastValue = useRef(value);
  const update = useCallback((action: SetStateAction<T>) => {
    if (!learned) { setValue(action); return; }
    let current = lastValue.current;
    try { if (localStorage.getItem(key) !== null) current = read(); } catch { /* Volatile session. */ }
    const next = typeof action === "function" ? (action as (v: T) => T)(current) : action;
    lastValue.current = next;
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      void archiveControls().catch(() => {});
    } catch { /* The control remains usable when storage is unavailable. */ }
  }, [learned, key, read]);
  useLayoutEffect(() => {
    if (!learned) return;
    void archiveControls().catch(() => {});
    const refresh = () => {
      const next = read();
      lastValue.current = next;
      setValue(next);
    };
    const changed = (event: StorageEvent) => {
      if (event.key === key || event.key === null) refresh();
    };
    window.addEventListener("storage", changed);
    window.addEventListener(RECOVERED_CONTROLS, refresh);
    return () => {
      window.removeEventListener("storage", changed);
      window.removeEventListener(RECOVERED_CONTROLS, refresh);
    };
  }, [learned, key, read]);
  useLayoutEffect(() => {
    if (learned) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private browsing or a full storage quota can prevent saving.
    }
  }, [key, learned, value]);
  return [value, update] as const;
}
