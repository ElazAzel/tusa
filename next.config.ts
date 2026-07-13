import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://*.clerk.dev https://*.clerkstage.dev https://*.clerk.services https://clerk.tusa.game https://challenges.cloudflare.com",
  "script-src-elem 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://*.clerk.dev https://*.clerkstage.dev https://*.clerk.services https://clerk.tusa.game https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev https://*.clerk.accounts.dev https://*.clerk.com https://*.clerk.dev https://*.clerkstage.dev",
  "connect-src 'self' https://*.clerk.accounts.dev wss://*.clerk.accounts.dev https://*.clerk.com wss://*.clerk.com https://*.clerk.dev wss://*.clerk.dev https://*.clerkstage.dev wss://*.clerkstage.dev https://*.clerk.services wss://*.clerk.services https://clerk-telemetry.com https://telemetry.clerk.com https://*.vercel-insights.com https://vitals.vercel-insights.com https://*.vercel.app https://clerk.tusa.game wss://clerk.tusa.game https://*.tusa.game wss://*.tusa.game https://challenges.cloudflare.com https://*.ably.io wss://*.ably.io https://*.ably-realtime.com wss://*.ably-realtime.com",
  "worker-src 'self' blob:",
  "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.clerk.dev https://*.clerkstage.dev https://*.clerk.services https://clerk.tusa.game https://challenges.cloudflare.com",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.clerk.dev https://*.clerkstage.dev https://*.clerk.services https://clerk.tusa.game",
  "frame-ancestors 'none'",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/favicon.svg", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp.join("; ") },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
