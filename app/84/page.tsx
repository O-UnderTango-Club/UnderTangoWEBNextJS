import type { Metadata } from "next";
import PublicationPanel from "./PublicationPanel";

export const metadata: Metadata = {
  title: "84 · Marketing, Comunicación y Audiovisuales | UnderTango",
  alternates: { canonical: "/84" },
  robots: { index: false, follow: false },
};

export default function MarketingPage() {
  return <PublicationPanel />;
}
