export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="projects-route-scope">
      <style>{`
        #projects-route-scope section {
          padding: 0 !important;
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }

        #projects-route-scope section h2::after {
          content: none !important;
          display: none !important;
        }
      `}</style>
      {children}
    </div>
  );
}
