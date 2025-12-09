import { NextRequest, NextResponse } from "next/server";
import { messaging } from "../../firebase/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { token, topic } = await req.json();

    if (!token || !topic) {
      return NextResponse.json(
        { message: "Faltan parámetros" },
        { status: 400 }
      );
    }

    const response = await messaging.subscribeToTopic(token, topic);

    return NextResponse.json({
      message: "Suscripción exitosa",
      res: response
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error al suscribir", error: error.message },
      { status: 500 }
    );
  }
}
