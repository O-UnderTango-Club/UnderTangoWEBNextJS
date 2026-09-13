// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return ["www.undertangoclub.com", "undertangoclub.com"].map((host) => ({
      source: "/index.html",
      has: [{ type: "host", value: host }],
      destination: "https://www.undertangoclub.com/",
      permanent: true,
    }));
  },
};

module.exports = nextConfig;

