/** @type {import('next').NextConfig} */
const nextConfig = {
  // Treat sharp as external so Next.js doesn't bundle it through webpack — that
  // lets the serverless file tracer include sharp's native libvips .so files
  // (otherwise libvips-cpp.so is missing at runtime → ERR_DLOPEN_FAILED).
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    serverComponentsExternalPackages: ["sharp"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
