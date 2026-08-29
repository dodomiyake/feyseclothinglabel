import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/email";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/products", "/enquiry", "/privacy", "/sign-in", "/sign-up"];
  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.6,
  }));
}
