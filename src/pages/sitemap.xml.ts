import type { APIRoute } from "astro";

const siteUrl = (import.meta.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL || "https://canirunaimodel.vercel.app").replace(/\/$/, "");

type SitemapEntry = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
};

const buildEntries = (): SitemapEntry[] => {
  return [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/check", changefreq: "daily", priority: "0.9" },
    { path: "/compare", changefreq: "weekly", priority: "0.8" },
    { path: "/docs", changefreq: "weekly", priority: "0.7" },
    { path: "/why", changefreq: "weekly", priority: "0.7" },
  ];
};

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString();
  const urls = buildEntries()
    .map(
      (entry) => `  <url>
    <loc>${xmlEscape(`${siteUrl}${entry.path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
