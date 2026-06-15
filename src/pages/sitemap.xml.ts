import type { APIRoute } from "astro";

const siteUrl = (import.meta.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL || "https://canirunaimodel.vercel.app").replace(/\/$/, "");

type SitemapEntry = {
  path: string;
};

const buildEntries = (): SitemapEntry[] => {
  return [
    { path: "/" },
    { path: "/check" },
    { path: "/compare" },
    { path: "/docs" },
    { path: "/why" },
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
