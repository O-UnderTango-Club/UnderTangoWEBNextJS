import { permanentRedirect } from "next/navigation";
import { bandLanguages } from "../867-producciones-musicales/band-copy";

export default function LegacyBandPage() {
  permanentRedirect(bandLanguages.es.path);
}
