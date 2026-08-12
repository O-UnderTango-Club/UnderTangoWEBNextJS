export default function ShowsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="shows-route-scope">
      <style>{`
        #shows-route-scope section {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }

        #shows-route-scope section h2::after {
          content: none !important;
          display: none !important;
        }
      `}</style>
      {children}
    </div>
  );
}
