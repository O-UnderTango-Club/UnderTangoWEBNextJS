import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas frecuentes | Ø UnderTango Club",
  alternates: { canonical: "https://www.undertangoclub.com/faq" },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
