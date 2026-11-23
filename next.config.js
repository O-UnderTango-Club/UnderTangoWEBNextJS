// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: { PANEL_ACTION_GROUPS: process.env.PANEL_ACTION_GROUPS || "1" },
  async redirects() {
    const homeRedirects = ["www.undertangoclub.com", "undertangoclub.com"].map((host) => ({
      source: "/index.html",
      has: [{ type: "host", value: host }],
      destination: "https://www.undertangoclub.com/",
      permanent: true,
    }));
    const bandRedirects = ["/banda", "/dosis-da-pista"].map((source) => ({
      source,
      destination: "/867-producciones-musicales",
      permanent: true,
    }));
    return [...homeRedirects, ...bandRedirects];
  },
};

module.exports = nextConfig;

