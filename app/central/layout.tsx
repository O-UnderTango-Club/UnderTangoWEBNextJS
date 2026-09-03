import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ø Central | UnderTango",
  description:
    "La central de operaciones de UnderTango: proyectos, equipos y capacidades trabajando como un solo sistema.",
  alternates: { canonical: "/central" },
};

export default function CentralLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="central-route-scope">
      <style>{`
        #central-route-scope section {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
        #central-route-scope section h2::after {
          content: none !important;
          display: none !important;
        }
      `}</style>
      {children}
    </div>
  );
}
