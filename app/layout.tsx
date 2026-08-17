import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "./context/AuthContext";
import ChatRobot from "./components/ChatRobot";
import UnderTangoTracker from "./components/UnderTangoTracker";

import "./styles/index.css";
import "./styles/footer.css";
import "./styles/navbar.css";
import "./styles/timeline.css";
import "./styles/pilars.css";
import "./styles/burguer.css";
import "./styles/home-current.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.undertangoclub.com"),
  title: "Ø UnderTango Club | Tango en Puerto Iguazú",
  description:
    "Shows y experiencias de tango, clases privadas y grupales, milongas y producción artística para hoteles, gastronomía y eventos en la Triple Frontera.",
  applicationName: "Ø UnderTango Club",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Ø UnderTango Club | Tango en Puerto Iguazú",
    description:
      "Mirá tango, aprendé tango o contratá una producción artística en Puerto Iguazú y la Triple Frontera.",
    url: "https://www.undertangoclub.com",
    siteName: "Ø UnderTango Club",
    locale: "es_AR",
    type: "website",
  },
  icons: {
    icon: "/assets/images/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <UnderTangoTracker />
        <ChatRobot />
      </body>
    </html>
  );
}
