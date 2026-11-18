import ShowsPage, { showsMetadata } from "./shows-page";

export const metadata = showsMetadata("es");

export default function Page() {
  return <ShowsPage language="es" />;
}
