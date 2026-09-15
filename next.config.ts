import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Keep Prisma Client out of Next's own bundler.
   *
   * Prisma's Workers client loads its query engine from a .wasm file. If Next
   * bundles it, Turbopack rewrites that import to its own WASM loader, which
   * relies on APIs workerd doesn't have (compileStreaming / filesystem reads)
   * and ultimately hands Prisma an undefined module. Marking Prisma external
   * leaves the .wasm import intact so Wrangler bundles it as a real Workers
   * WebAssembly module instead.
   */
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
