import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The share cards read their fonts from disk. Traced by name here so the
  // files ship with the function on Vercel — a route that renders on demand
  // otherwise finds an empty directory and answers 500.
  outputFileTracingIncludes: {
    "/**": ["./src/assets/og/**"],
  },
  images: {
    // Anything resolving its own URL through `getImageProps` — the exploded
    // assembly, and the world's WebGL textures — asks for a quality Next does
    // not otherwise know about. Only what is listed here is served; a quality
    // that is missing is a 400 in production and nothing at all in dev, so
    // every value `optimizedSrc` is ever called with has to appear.
    qualities: [62, 75, 88],
    formats: ["image/avif", "image/webp"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  async redirects() {
    // Old links keep working. The Lab became one band inside Archon Labs, and
    // two case studies were renamed to the shape the rest of the site uses —
    // a project's slug is its product's name, not the folder it arrived in.
    return [
      { source: "/:locale(en|tr)/lab", destination: "/:locale/labs", permanent: true },
      { source: "/lab", destination: "/en/labs", permanent: true },
      {
        source: "/:locale(en|tr)/work/dp-pano",
        destination: "/:locale/projects/dppano",
        permanent: true,
      },
      {
        source: "/:locale(en|tr)/work/erden-davetiye",
        destination: "/:locale/projects/erden",
        permanent: true,
      },
      /* The work became projects in the creative-tech rebuild; every old
         address still lands on the same thing. */
      {
        source: "/:locale(en|tr)/projects/erden-davetiye",
        destination: "/:locale/projects/erden",
        permanent: true,
      },
      {
        source: "/:locale(en|tr)/projects/dp-pano",
        destination: "/:locale/projects/dppano",
        permanent: true,
      },
      { source: "/:locale(en|tr)/work", destination: "/:locale/projects", permanent: true },
      { source: "/:locale(en|tr)/work/:slug", destination: "/:locale/projects/:slug", permanent: true },
      { source: "/work", destination: "/projects", permanent: true },
      { source: "/work/:slug", destination: "/projects/:slug", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
