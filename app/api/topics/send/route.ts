import { NextRequest, NextResponse } from "next/server";
import { messaging } from "../../firebase/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { topic, title, body } = await req.json();

    if (!topic || !title || !body) {
      return NextResponse.json(
        { message: "Faltan parámetros" },
        { status: 400 }
      );
    }

    const message = {
      notification: { title, body },
      topic
    };

    const response = await messaging.send(message);

    return NextResponse.json({
      message: "Notificación enviada",
      response
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error enviando", error: error.message },
      { status: 500 }
    );
  }
}
