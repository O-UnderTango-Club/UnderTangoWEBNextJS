import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/index.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UnderTango Club | Milonga y Clases de Tango en Iguazú",
  description:
    "Descubre el auténtico tango en Iguazú con nuestras clases grupales y privadas, espectáculos de milonga y moda exclusiva. ¡Vive la pasión del tango en la triple frontera!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
