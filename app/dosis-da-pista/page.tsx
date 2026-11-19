import { permanentRedirect } from "next/navigation";

export default function LegacyBandPage() {
  permanentRedirect("/banda");
}
