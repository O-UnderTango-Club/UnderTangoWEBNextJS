import { NextResponse } from "next/server";

// Versión verificada de 9 páginas con Perfil APRENDE y propuesta de 7 días.
// Se fija a un commit inmutable para evitar que el subdominio vuelva a servir
// el PDF anterior que quedó en public/ dentro de main.
const FINAL_GUIDE_URL =
  "https://raw.githubusercontent.com/O-UnderTango-Club/UnderTangoWEBNextJS/4172fcfce2bad14eb1de80b6b482020747fc3f25/public/APRENDE_7_paginas_para_recordar_mejor.pdf";

export function GET() {
  return NextResponse.redirect(FINAL_GUIDE_URL, 307);
}
