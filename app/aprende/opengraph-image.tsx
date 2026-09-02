import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "APRENDE — Recordá más. Estudiá con método.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #041426 0%, #082442 100%)",
          color: "#f7f5ee",
          padding: "68px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: 390,
            height: 390,
            borderRadius: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(145deg, #06172b 0%, #0b2039 100%)",
            border: "2px solid #183d63",
            marginRight: 50,
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 250,
              lineHeight: 1,
              fontWeight: 800,
              color: "#efbd43",
              marginTop: -16,
            }}
          >
            A
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 60,
              width: 170,
              height: 46,
              display: "flex",
              justifyContent: "center",
              borderTop: "5px solid #efbd43",
              borderRadius: "50%",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: 620 }}>
          <div
            style={{
              display: "flex",
              fontSize: 82,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            APRENDE
          </div>
          <div
            style={{
              display: "flex",
              color: "#efbd43",
              fontSize: 38,
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            Memoria y aprendizaje
          </div>
          <div
            style={{
              display: "flex",
              width: "100%",
              height: 3,
              background: "#efbd43",
              marginTop: 28,
              marginBottom: 36,
            }}
          />
          <div style={{ display: "flex", fontSize: 42, fontWeight: 700 }}>
            Recordá más.
          </div>
          <div style={{ display: "flex", fontSize: 42, fontWeight: 700, marginTop: 3 }}>
            Estudiá con método.
          </div>
          <div
            style={{
              display: "flex",
              color: "#bcc9da",
              fontSize: 25,
              marginTop: 35,
            }}
          >
            Memoria · Mnemotecnia · Aprendizaje
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 32 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 54,
                padding: "0 28px",
                borderRadius: 28,
                background: "#efbd43",
                color: "#06172b",
                fontSize: 23,
                fontWeight: 800,
              }}
            >
              GUÍA GRATUITA
            </div>
            <div style={{ display: "flex", color: "#bcc9da", fontSize: 18, marginLeft: 30 }}>
              aprende.undertangoclub.com
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
