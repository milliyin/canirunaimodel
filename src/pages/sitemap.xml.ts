import type { APIRoute } from "astro";
import { models } from "@/data/models";
import { ALL_LICENSES } from "@/data/licenses";
import { getAllDeviceSlugs } from "@/lib/device-slugs";

const siteUrl = (import.meta.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL || "https://canirunaimodel.vercel.app").replace(/\/$/, "");

type SitemapEntry = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
};

const buildEntries = (): SitemapEntry[] => {
  const staticEntries: SitemapEntry[] = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/check", changefreq: "daily", priority: "0.9" },
    { path: "/compare", changefreq: "weekly", priority: "0.8" },
    { path: "/docs", changefreq: "weekly", priority: "0.7" },
    { path: "/why", changefreq: "weekly", priority: "0.7" },
  ];

  const modelEntries: SitemapEntry[] = models.map((model) => ({
    path: `/model/${model.id}`,
    changefreq: "weekly",
    priority: "0.8",
  }));

  const deviceEntries: SitemapEntry[] = getAllDeviceSlugs().map((device) => ({
    path: `/device/${device.slug}`,
    changefreq: "weekly",
    priority: "0.7",
  }));

  const licenseEntries: SitemapEntry[] = ALL_LICENSES.map((license) => ({
    path: `/license/${license.id}`,
    changefreq: "monthly",
    priority: "0.5",
  }));

  return [...staticEntries, ...modelEntries, ...deviceEntries, ...licenseEntries];
};

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().split("T")[0];
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
