/** @type {import('next').NextConfig} */
const nextConfig = {
  // Treat sharp as external so Next.js doesn't bundle it through webpack — that
  // lets the serverless file tracer include sharp's native libvips .so files
  // (otherwise libvips-cpp.so is missing at runtime → ERR_DLOPEN_FAILED).
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    serverComponentsExternalPackages: ["sharp"],
    // serverComponentsExternalPackages keeps webpack from bundling sharp, but the
    // serverless file tracer still can't follow sharp's runtime dlopen of
    // libvips-cpp.so, so the .so is left out of the function bundle
    // (→ ERR_DLOPEN_FAILED at runtime). Force-include sharp's native linux
    // binary + the libvips .so for every API route that loads sharp
    // (/api/upload, /api/analysis, /api/checkin).
    outputFileTracingIncludes: {
      "/api/**": [
        "./node_modules/@img/sharp-linux-x64/**/*",
        "./node_modules/@img/sharp-libvips-linux-x64/**/*",
      ],
      // The /info route reads its HTML template from disk at build time.
      "/info": ["./src/app/info/template.html"],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
