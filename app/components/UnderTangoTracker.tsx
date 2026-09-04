"use client";

import { useEffect } from "react";
import { isAcademiaHost, isAcademiaPath } from "../../src/lib/academia-routing";

type Attribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
};

const VISITOR_KEY = "undertango_visitor_id";
const SESSION_KEY = "undertango_session_id";
const ATTRIBUTION_KEY = "undertango_attribution";

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

function inferIntent(pathname: string) {
  const path = pathname.toLowerCase();
  if (path.includes("clases")) return "aprender_tango";
  if (path.includes("reservas")) return "contratar_show";
  if (path.includes("userscalendar") || path.includes("agenda")) return "ver_tango";
  return "";
}

function shouldTrack() {
  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();

  if (isAcademiaHost(hostname) || isAcademiaPath(pathname)) return false;

  if (hostname.startsWith("aprende.")) return false;
  if (pathname.startsWith("/aprende")) return false;
  if (pathname.startsWith("/proyectos")) return false;
  if (pathname.startsWith("/finanzas")) return false;
  return true;
}

function send(payload: Record<string, string>) {
  const json = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([json], { type: "application/json" });
    navigator.sendBeacon("/api/undertango/event", blob);
    return;
  }

  void fetch("/api/undertango/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
    keepalive: true,
  });
}

export default function UnderTangoTracker() {
  useEffect(() => {
    if (!shouldTrack()) return;

    const visitorId = persistentId(localStorage, VISITOR_KEY, "uv");
    const sessionId = persistentId(sessionStorage, SESSION_KEY, "us");
    const attribution = getAttribution();

    const base = () => ({
      visitorId,
      sessionId,
      path: `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer || "",
      ...attribution,
    });

    send({
      eventId: id("ue"),
      event: "page_view",
      destination: "page",
      intent: inferIntent(window.location.pathname),
      subintent: "",
      cta: "",
      ...base(),
    });

    const handleClick = (event: MouseEvent) => {
      const origin = event.target as Element | null;
      const anchor = origin?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const href = anchor.href || "";
      const explicitEvent = anchor.dataset.undertangoEvent || "";
      const isWhatsapp = href.includes("wa.me/") || href.includes("whatsapp.com/");

      if (!explicitEvent && !isWhatsapp) return;

      send({
        eventId: id("ue"),
        event: explicitEvent || "whatsapp_click",
        destination: anchor.dataset.undertangoDestination || href,
        intent: anchor.dataset.undertangoIntent || inferIntent(window.location.pathname),
        subintent: anchor.dataset.undertangoSubintent || "",
        cta: anchor.dataset.undertangoCta || anchor.textContent?.trim().slice(0, 120) || "",
        ...base(),
      });
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
