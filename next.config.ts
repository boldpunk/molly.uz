import type { NextConfig } from "next";

// Vercel's own build pipeline doesn't support `output: "standalone"` (its
// onBuildComplete step expects the default trace output and fails without
// it), so this only applies for the self-hosted Docker build, which doesn't
// set the VERCEL env var.
const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  // Headers that add protection without constraining scripts: a full
  // script-src CSP would need nonces for the inline analytics snippet, so
  // that is left as a separate change rather than risked at launch.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              // Stops the site being framed for clickjacking, blocks Flash-era
              // plugin embeds, and prevents an injected <base> from
              // re-pointing every relative URL on the page.
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=15552000",
          },
        ],
      },
    ];
  },
  images: {
    // Product photos uploaded before the self-host migration still live on
    // Vercel Blob; new uploads are same-origin under /uploads and need no
    // remote pattern.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
