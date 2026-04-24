import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "./context/AuthContext";

import "./styles/index.css";
import "./styles/footer.css";
import "./styles/navbar.css";
import "./styles/timeline.css";
import "./styles/pilars.css";
import "./styles/burguer.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UnderTango Club | Milonga y Clases de Tango en Iguazú",
  description:
    "Descubre el auténtico tango en Iguazú con nuestras clases grupales y privadas, espectáculos de milonga y moda exclusiva.",
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

        <Script
          src="https://script2.chat-robot.com/?token=ed1139a97e102e18ec88a20b30f97aa3"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
