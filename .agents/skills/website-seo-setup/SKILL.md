---
name: website-seo-setup
description: Audit, implement, repair, and document technical and on-page SEO for any website or web application. Use when asked to improve SEO, fix indexing or sitemap issues, configure robots.txt, add canonical/Open Graph/Twitter metadata, implement JSON-LD structured data, connect analytics or search-engine verification, improve titles and descriptions, or diagnose Search Console crawl and indexing errors.
---

# Website SEO Setup

Implement SEO from the website's actual architecture, public domain, content model, and deployment behavior. Prefer standards-compliant, maintainable configuration over copying another site's files verbatim.

## Core Workflow

1. Discover the framework, rendering mode, deployment provider, public domain, route structure, and existing SEO implementation.
2. Identify indexable pages and exclude private, duplicate, redirected, API, error, and utility routes.
3. Fix the public site URL and canonical URL generation first.
4. Add or repair titles, descriptions, social metadata, structured data, sitemap, and robots.txt.
5. Verify live HTTP responses after deployment.
6. Document Search Console, analytics, and ongoing maintenance steps.

Before editing, inspect likely files:

- framework configuration
- shared layout, head, metadata, or document components
- route and page directories
- sitemap and robots routes/files
- deployment configuration
- environment variable examples
- existing JSON-LD, analytics, and verification files

Use repository-native patterns. Do not introduce a second SEO system when one already exists.

## Establish The Public URL

Choose one canonical production origin, including scheme and hostname:

```text
https://example.com
```

Prefer an environment variable with a production fallback:

```text
PUBLIC_SITE_URL=https://example.com
```

Use the same origin for:

- canonical links
- Open Graph URLs
- structured data URLs and identifiers
- sitemap URLs
- robots.txt sitemap declaration

Do not let preview deployment domains become canonical URLs. Remove trailing slashes from the configured origin before appending route paths, unless the framework intentionally standardizes trailing slashes.

## Indexability Rules

Index pages that provide unique, useful public content. Usually exclude:

- API routes
- authentication and account pages
- admin areas
- internal search result URLs
- duplicate query-parameter variants
- redirects
- error pages
- preview or staging environments

Use a self-referencing canonical URL on each indexable page. Canonicals should normally omit tracking and UI-state query parameters.

Use:

```html
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
```

Use `noindex, follow` for public pages that users may need but search engines should not index. Do not rely on robots.txt to remove an already indexed URL; crawlers must be allowed to fetch a page to see its `noindex`.

## Shared Head Metadata

Implement these in the shared layout or framework metadata system:

```html
<title>Unique descriptive page title</title>
<meta name="description" content="Unique description matching the page content.">
<link rel="canonical" href="https://example.com/current-page">

<meta property="og:type" content="website">
<meta property="og:url" content="https://example.com/current-page">
<meta property="og:title" content="Unique descriptive page title">
<meta property="og:description" content="Unique description matching the page content.">
<meta property="og:image" content="https://example.com/og/page.jpg">
<meta property="og:site_name" content="Site name">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Unique descriptive page title">
<meta name="twitter:description" content="Unique description matching the page content.">
<meta name="twitter:image" content="https://example.com/og/page.jpg">
```

Guidelines:

- Give every important page a unique title and description.
- Put the main search intent near the start of the title.
- Keep titles readable; roughly 50-60 characters is a useful target, not a hard rule.
- Keep descriptions useful and accurate; roughly 140-160 characters is a useful target.
- Use absolute URLs for canonical and social metadata.
- Provide a crawlable social image with stable dimensions, usually 1200x630.
- Set `<html lang="...">`.
- Include one clear, descriptive `<h1>` per page.

## Structured Data

Use JSON-LD and valid Schema.org types. Add only claims supported by visible page content.

Site-wide entities commonly include:

- `Organization` or `Person`
- `WebSite`

Page-specific entities commonly include:

- `WebPage`
- `BreadcrumbList`
- `SoftwareApplication`
- `Product`
- `Article`
- `FAQPage`

Use stable `@id` values so entities connect:

```json
{
  "@type": "WebSite",
  "@id": "https://example.com#website",
  "url": "https://example.com",
  "publisher": { "@id": "https://example.com#organization" }
}
```

Do not add fake reviews, ratings, prices, authors, dates, FAQs, or organization details. Validate JSON-LD syntax and ensure URLs use the canonical public origin.

## Sitemap

Create a sitemap at a stable public URL, usually:

```text
https://example.com/sitemap.xml
```

Include only canonical, indexable URLs that return successful responses. Include important dynamic routes when they provide unique public content; do not include them merely because they exist.

Preferred simple format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-06-15T10:30:00.000Z</lastmod>
  </url>
</urlset>
```

Sitemap rules:

- Use absolute HTTPS URLs.
- XML-escape URL values.
- Return `Content-Type: application/xml` or `application/xml; charset=utf-8`.
- Use valid W3C datetime values for `<lastmod>`.
- Set `<lastmod>` to the real meaningful content modification time.
- Do not generate a new `<lastmod>` timestamp on every request unless content truly changed.
- Omit `<lastmod>` when no reliable modification time exists.
- Omit `changefreq` and `priority` unless the project explicitly wants them; search engines may ignore them.
- Use a sitemap index only when multiple sitemap files are genuinely needed.
- Stay below 50,000 URLs and 50 MB uncompressed per sitemap.

When changing sitemap strategy, update robots.txt and remove stale sitemap submissions from Search Console.

## Robots.txt

Keep robots.txt simple unless the site has clear crawl-control requirements:

```text
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

Only disallow paths that should not be crawled. Do not block CSS, JavaScript, images, or framework assets required to render pages. Remember:

- robots.txt controls crawling, not guaranteed indexing.
- unknown directives may be ignored.
- an unreachable or malformed robots.txt can delay crawling.
- the sitemap URL must match the real deployed host and path.

## Internal Links And Content

Search engines discover and understand pages through content and links, not metadata alone.

- Link important pages from navigation, footer, landing pages, or relevant content.
- Use descriptive anchor text.
- Add breadcrumbs for hierarchical pages.
- Ensure important content is present in server-rendered HTML when practical.
- Give images useful `alt` text and explicit dimensions.
- Avoid thin pages whose only meaningful content appears after client-side interaction.
- Keep route names short, lowercase, descriptive, and stable.

## Analytics And Verification

Add analytics only when requested or already part of the project. Install it in the shared layout so it loads consistently.

For Google Analytics:

- use the correct measurement ID
- avoid loading the script twice
- confirm client-side navigation records page views when using SPA transitions
- respect the site's consent and privacy requirements

For Search Console:

- deploy the provided HTML verification file at the site root, or use the requested verification method
- submit the current sitemap URL only
- remove obsolete sitemap URLs
- use URL Inspection for a small number of important pages
- expect crawl and indexing status to lag after deployment

Never treat a temporary Search Console "Couldn't fetch" message as proof the live endpoint is broken. Verify the live response directly first.

## Framework Adaptation

Identify the framework before implementation:

- Astro: use `site`, shared layouts, endpoint routes, or `@astrojs/sitemap`.
- Next.js: use the Metadata API, `app/sitemap.ts`, and `app/robots.ts`.
- Nuxt: use route rules, head helpers, and the project's sitemap module.
- SvelteKit: use shared layouts and server routes.
- Static HTML: edit shared templates or page heads and create static XML/text files.

Follow the framework's supported metadata and routing APIs. Do not copy Next.js paths such as `/_next/` into an Astro site, or Astro paths such as `/_astro/` into an unrelated framework.

## Validation

After implementation, verify the deployed production URLs directly:

```text
GET /
GET /robots.txt
GET /sitemap.xml
GET each important canonical page
```

Confirm:

- successful HTTP status
- expected content type
- canonical host and path
- unique title and description
- rendered `<h1>`
- social metadata
- valid JSON-LD
- sitemap contains only intended URLs
- sitemap URLs return successful responses
- robots.txt points to the current sitemap
- no important page is accidentally `noindex`

Use the repository's allowed checks. Do not run expensive tests, linters, or type checks when repository instructions prohibit them.

## Common Failure Modes

- Canonicals point to preview or upstream domains.
- robots.txt points to an old sitemap path.
- multiple obsolete sitemaps remain submitted in Search Console.
- sitemap contains redirects, errors, private routes, or duplicate parameter URLs.
- sitemap `lastmod` changes on every request without content changes.
- all pages reuse the same title or description.
- structured data claims content not visible on the page.
- important content exists only after browser JavaScript runs.
- social images use relative or unreachable URLs.
- analytics loads twice or misses client-side navigation.
- agents copy another website's SEO files without adapting hostnames, routes, or framework behavior.

## Agent Handoff

When finishing an SEO task, report:

- files changed
- canonical production origin
- sitemap URL and included route strategy
- robots.txt policy
- structured data types added
- analytics or verification IDs added
- live URLs verified
- remaining external actions, such as Search Console submission
- checks not run because of repository instructions
