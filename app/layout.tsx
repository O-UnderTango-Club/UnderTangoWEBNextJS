import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "./context/AuthContext";
import ChatRobot from "./components/ChatRobot";

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
  title: "Ø UnderTango Club | Shows y Producción en Puerto Iguazú",
  description:
    "Productora artística de la Triple Frontera. Shows de tango, música en vivo, Ø Tango Rave y producciones a medida para hoteles, gastronomía y eventos.",
  applicationName: "Ø UnderTango Club",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Ø UnderTango Club | Shows y Producción en Puerto Iguazú",
    description:
      "Espectáculos, música en vivo y producción escénica para hoteles, gastronomía y eventos de la Triple Frontera.",
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
        <ChatRobot />
      </body>
    </html>
  );
}
