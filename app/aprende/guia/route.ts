import { NextRequest, NextResponse } from "next/server";

const FINAL_GUIDE_PATH = "/APRENDE_7_paginas_para_recordar_mejor.pdf";

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL(FINAL_GUIDE_PATH, request.url), 307);
}
