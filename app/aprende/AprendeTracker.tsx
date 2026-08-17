"use client";

import { useEffect } from "react";

type Attribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
};

const VISITOR_KEY = "aprende_visitor_id";
const SESSION_KEY = "aprende_session_id";
const ATTRIBUTION_KEY = "aprende_attribution";

function id(prefix: string) {
  const value = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${value}`;
}

function persistentId(storage: Storage, key: string, prefix: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const created = id(prefix);
  storage.setItem(key, created);
  return created;
}

function getAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Attribution = {
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    utmContent: params.get("utm_content") || "",
  };

  if (Object.values(fromUrl).some(Boolean)) {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(fromUrl));
    return fromUrl;
  }

  try {
    const stored = sessionStorage.getItem(ATTRIBUTION_KEY);
    return stored ? { ...fromUrl, ...JSON.parse(stored) } : fromUrl;
  } catch {
    return fromUrl;
  }
}

function send(payload: Record<string, string>) {
  const json = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    const blob = new Blob([json], { type: "application/json" });
    navigator.sendBeacon("/api/aprende/event", blob);
    return;
  }

  void fetch("/api/aprende/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
    keepalive: true,
  });
}

export default function AprendeTracker() {
  useEffect(() => {
    const visitorId = persistentId(localStorage, VISITOR_KEY, "av");
    const sessionId = persistentId(sessionStorage, SESSION_KEY, "as");
    const attribution = getAttribution();

    const base = {
      visitorId,
      sessionId,
      path: `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer || "",
      ...attribution,
    };

    send({
      eventId: id("ae"),
      event: "page_view",
      destination: "landing",
      ...base,
    });

    const handleClick = (event: MouseEvent) => {
      const origin = event.target as Element | null;
      const anchor = origin?.closest<HTMLAnchorElement>("a[data-aprende-event]");
      if (!anchor) return;

      const eventName = anchor.dataset.aprendeEvent || "";
      const destination = anchor.dataset.aprendeDestination || anchor.href || "";
      if (!eventName) return;

      send({
        eventId: id("ae"),
        event: eventName,
        destination,
        ...base,
      });
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
