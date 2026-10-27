import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Security Headers ────────────────────────────────────────────────────────
  // Applied on every response. Keeps sane defaults; tighten the CSP
  // script-src once you know every third-party origin.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            // - script-src 'self' 'unsafe-inline': needed by Next.js inline scripts;
            //   remove 'unsafe-inline' if you add a nonce-based approach later.
            // - style-src 'unsafe-inline': Tailwind inlines styles.
            // - connect-src: Supabase, AI providers, Nominatim, OpenStreetMap tiles.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.openstreetmap.org https://*.tile.openstreetmap.org",
              "connect-src 'self' https://*.supabase.co https://api.groq.com https://openrouter.ai https://api.aimlapi.com https://generativelanguage.googleapis.com https://nominatim.openstreetmap.org",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
