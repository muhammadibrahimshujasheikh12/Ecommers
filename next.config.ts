import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
const isLocalSupabase = supabaseUrl ? ["localhost", "127.0.0.1"].includes(supabaseUrl.hostname) : false;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    // Product & review photos served from Supabase Storage.
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
            hostname: supabaseUrl.hostname,
            port: supabaseUrl.port,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // Only needed when Supabase runs locally (supabase start).
    dangerouslyAllowLocalIP: isLocalSupabase,
  },
  experimental: {
    // Review photos (up to 3 × 5 MB) are uploaded through a Server Action.
    serverActions: { bodySizeLimit: "16mb" },
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
