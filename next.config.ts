import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// No nonces: this app has no third-party scripts/tracking and no reason to
// force every page into dynamic rendering just to satisfy a stricter CSP.
// Supabase (auth, storage, and the Realtime websocket used by
// order-realtime-refresh.tsx) is the only origin the browser talks to
// besides itself.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.supabase.co;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server Actions default to a 1MB body limit — well under the file
      // uploads this app accepts (enquiry references up to 15MB, payment
      // evidence up to 10MB), which was silently failing every upload past
      // 1MB with "Body exceeded 1 MB limit." in production. Raised past the
      // largest declared per-file limit plus multipart overhead.
      bodySizeLimit: "20mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withBotId(nextConfig);
