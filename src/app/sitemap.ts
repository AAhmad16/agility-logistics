import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://agility-logistics.vercel.app";
  return [
    { url: base },
    { url: `${base}/blog` },
    ...POSTS.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.date })),
  ];
}
