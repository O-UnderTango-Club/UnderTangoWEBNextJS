import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/index.css";
import { AuthProvider } from './context/AuthContext';
import PWAServiceWorker from './Android-module/PWAServiceWorker';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Agregamos el enlace al manifiesto aquí, dentro de los metadatos
// Si esto no funciona, usamos el componente Head de React directamente.

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UnderTango Club | Milonga y Clases de Tango en Iguazú",
  description:
    "Descubre el auténtico tango en Iguazú con nuestras clases grupales y privadas, espectáculos de milonga y moda exclusiva. ¡Vive la pasión del tango en la triple frontera!",
    manifest:"/manifest.json" 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        //className={/*`${geistSans.variable} ${geistMono.variable} antialiased`*/}
      >
       <AuthProvider>
          {children}
        </AuthProvider>
        <PWAServiceWorker />
      </body>
    </html>
  );
}
