import type { NextConfig } from "next";

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
};

export default nextConfig;
