import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [{ source: "/index", destination: "/index-content" }],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    const legacyRoutes = [
      "ai-generate", "critique", "dashboard", "faq", "forgot-password", "login",
      "my-critiques", "my-simulations", "onboarding", "policies", "public",
      "rankings", "register", "repository", "simulations", "uploaded-policies",
    ];

    return legacyRoutes.map((route) => ({
      source: `/${route}/:path*`,
      destination: `/ciegma/${route}/:path*`,
      permanent: false,
    }));
  },
};

export default nextConfig;
