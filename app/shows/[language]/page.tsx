import { notFound } from "next/navigation";
import ShowsPage, { showsMetadata } from "../shows-page";

type Props = { params: { language: string } };

function translatedLanguage(language: string) {
  if (language !== "pt" && language !== "en") notFound();
  return language;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ language: "pt" }, { language: "en" }];
}

export function generateMetadata({ params }: Props) {
  return showsMetadata(translatedLanguage(params.language));
}

export default function TranslatedShowsPage({ params }: Props) {
  return <ShowsPage language={translatedLanguage(params.language)} />;
}
