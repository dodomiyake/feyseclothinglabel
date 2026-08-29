import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/email";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything behind sign-in, plus the one-time secure enquiry link
      // and API routes — nothing here is meant to be publicly indexed.
      disallow: ["/admin/", "/production/", "/dashboard", "/orders", "/enquiries/", "/quotations/", "/invoices/", "/notifications", "/enquiry/confirmation/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
