import { notFound } from "next/navigation";
import BandPage, { bandMetadata } from "../band-page";

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
  return bandMetadata(translatedLanguage(params.language));
}

export default function TranslatedBandPage({ params }: Props) {
  return <BandPage language={translatedLanguage(params.language)} />;
}
