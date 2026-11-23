import BandPage, { bandMetadata } from "./band-page";

export const metadata = bandMetadata("es");

export default function Page() {
  return <BandPage language="es" />;
}
