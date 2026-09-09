import type { NextConfig } from "next";

// Vercel's own build pipeline doesn't support `output: "standalone"` (its
// onBuildComplete step expects the default trace output and fails without
// it), so this only applies for the self-hosted Docker build, which doesn't
// set the VERCEL env var.
const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
