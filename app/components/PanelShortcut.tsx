"use client";
import { usePathname } from "next/navigation";

export default function PanelShortcut() {
  const pathname = usePathname();
  if (pathname?.startsWith("/panel-de-control")) return null;
  return <button type="button" aria-label="Abrir panel de control" onClick={() => { window.location.href = "https://www.undertangoclub.com/panel-de-control"; }} style={{ position: "fixed", right: 0, bottom: 0, width: 48, height: 48, zIndex: 2147483647, padding: 0, margin: 0, border: 0, borderRadius: 0, background: "transparent", boxShadow: "none", opacity: 0, cursor: "pointer" }} />;
}
