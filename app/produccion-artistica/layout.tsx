export default function ProduccionArtisticaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="produccion-artistica-route-scope">
      <style>{`
        #produccion-artistica-route-scope section {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }

        #produccion-artistica-route-scope section h2::after {
          content: none !important;
          display: none !important;
        }
      `}</style>
      {children}
    </div>
  );
}
