import { ImageResponse } from "next/og";

export const alt = "UnderTango App — una red productiva que conecta cultura y trabajo. Diapositivas y discurso de la propuesta de desarrollo.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function PitchOpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "52px 64px", background: "#081f32", color: "#f7f6f1", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 31, fontWeight: 700 }}>Ø UnderTango App</div>
          <div style={{ color: "#a6c4d8", fontSize: 20 }}>DIAPOSITIVAS Y DISCURSO</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40, fontSize: 64, lineHeight: 1.1, fontWeight: 700 }}>
          <div>Una red productiva</div>
          <div>que conecta</div>
          <div style={{ color: "#ffa56d" }}>cultura y trabajo.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 32 }}>
          {["Personas", "Oficios", "Producciones"].map((label, index) => (
            <div key={label} style={{ display: "flex", alignItems: "center" }}>
              {index > 0 && <div style={{ width: 60, height: 2, background: "#73c8f1" }} />}
              <div style={{ display: "flex", border: "1px solid #73c8f1", borderRadius: 24, padding: "10px 24px", fontSize: 24 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", color: "#a6c4d8", fontSize: 20 }}>
          <div>Propuesta de desarrollo · Triple Frontera</div>
          <div>undertangoclub.com</div>
        </div>
      </div>
    ),
    size,
  );
}
