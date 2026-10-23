import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "86 · Música | UnderTango Club",
  description: "Temas para sacar con la banda de UnderTango.",
  alternates: { canonical: "/86" },
};

export default function MusicPage() {
  return (
    <main style={{ minHeight: "100svh", background: "#111214", color: "#f4eee3", padding: "clamp(24px, 6vw, 80px)", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Link href="/central" style={{ color: "#d1a844" }}>← Ø UnderTango Club</Link>
        <header style={{ margin: "48px 0" }}>
          <p style={{ color: "#d1a844", letterSpacing: ".14em" }}>DEPARTAMENTO 86</p>
          <h1 style={{ fontSize: "clamp(36px, 7vw, 72px)", margin: "12px 0" }}>Música</h1>
          <p style={{ color: "#bdb8ae", lineHeight: 1.7 }}>Ensayos, repertorio y preparación musical de UnderTango.</p>
        </header>
        <section aria-labelledby="temas-banda">
          <h2 id="temas-banda" style={{ fontSize: "clamp(24px, 4vw, 36px)" }}>Temas para sacar con la banda</h2>
          <article style={{ border: "1px solid #514735", borderRadius: 16, padding: "clamp(20px, 4vw, 36px)", marginTop: 24 }}>
            <p style={{ color: "#d1a844", marginTop: 0 }}>01 · Para preparar</p>
            <h3 style={{ fontSize: 28, margin: "12px 0" }}>Got To Be Real</h3>
            <p style={{ color: "#bdb8ae", fontSize: 20 }}>Cheryl Lynn</p>
            <a href="https://www.youtube.com/watch?v=fI569nw0YUQ" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#d1a844", color: "#111214", padding: "14px 20px", borderRadius: 8, fontWeight: 700, marginTop: 12 }}>Escuchar en YouTube ↗</a>
          </article>
          <article style={{ border: "1px solid #514735", borderRadius: 16, padding: "clamp(20px, 4vw, 36px)", marginTop: 24 }}>
            <p style={{ color: "#d1a844", marginTop: 0 }}>02 · Para preparar</p>
            <h3 style={{ fontSize: 28, margin: "12px 0" }}>街のドルフィン (Dolphin in Town)</h3>
            <p style={{ color: "#bdb8ae", fontSize: 20 }}>Kingo Hamada</p>
            <a href="https://www.youtube.com/watch?v=x2aA6GEEABA" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#d1a844", color: "#111214", padding: "14px 20px", borderRadius: 8, fontWeight: 700, marginTop: 12 }}>Escuchar en YouTube ↗</a>
          </article>
        </section>
      </div>
    </main>
  );
}
