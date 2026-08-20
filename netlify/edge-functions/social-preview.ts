import type { Config, Context } from "@netlify/edge-functions";

const SITE_NAME = "Cultheld";
const SITE_URL = "https://cultheld.nl";
const DEFAULT_IMAGE = `${SITE_URL}/logo-ch.png`;

const GENERIC_TITLE = "Cultheld - Draag jouw voetbalheld op premium streetwear";
const GENERIC_DESCRIPTION =
  "Kies jouw favoriete voetballegende uit de Eredivisie of wereldlegends en draag ze op premium hoodies, sweaters en t-shirts. We all love football.";
const GENERIC_OG_DESCRIPTION =
  "Kies jouw favoriete voetballegende uit de Eredivisie of wereldlegends en draag ze op premium hoodies, sweaters en t-shirts.";
const GENERIC_TWITTER_TITLE = "Cultheld - Draag jouw voetbalheld";
const GENERIC_TWITTER_DESCRIPTION =
  "Premium voetbal merchandise met je favoriete legendes";

// Social crawlers do not execute the SPA JS that sets per-page OG tags in
// src/lib/seo.ts, so they would otherwise always preview the homepage tags
// baked into index.html. Keep this list broad; matching is case-insensitive.
const CRAWLER_UA_PATTERNS = [
  "facebookexternalhit",
  "facebot",
  "meta-externalagent",
  "meta-externalfetcher",
  "twitterbot",
  "linkedinbot",
  "whatsapp",
  "telegrambot",
  "discordbot",
  "slackbot",
  "slack-imgproxy",
  "pinterest",
  "redditbot",
  "embedly",
  "iframely",
  "quora link preview",
  "skypeuripreview",
  "vkshare",
  "w3c_validator",
  "developers.google.com/+/web/snippet",
  "google-nuzzel",
  "qwantify",
  "bitlybot",
  "tumblr",
  "outbrain",
  "showyoubot",
  "viber",
  "line/",
  "micromessenger",
  "baiduspider",
  "yandex",
  "applebot",
  "nuzzel",
  "flipboard",
  "opengraph",
];

export default async (request: Request, context: Context) => {
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    return;
  }

  if (!isSocialCrawler(request.headers.get("user-agent") || "")) {
    return;
  }

  const pathname = new URL(request.url).pathname;
  const tags =
    (await resolveTags(pathname, context.params)) ?? genericTags(pathname);
  return previewResponse(tags, method === "HEAD");
};

export const config: Config = {
  path: ["/legend/:slug", "/seizoen/:seasonSlug/club/:clubSlug"],
  onError: "bypass",
};

function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_UA_PATTERNS.some((pattern) => ua.includes(pattern));
}

interface OgTags {
  title: string;
  description: string;
  image: string;
  url: string;
  type: "website" | "product";
  metaDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}

function genericTags(pathname: string): OgTags {
  return {
    title: GENERIC_TITLE,
    description: GENERIC_OG_DESCRIPTION,
    image: DEFAULT_IMAGE,
    url: `${SITE_URL}${pathname}`,
    type: "website",
    metaDescription: GENERIC_DESCRIPTION,
    twitterTitle: GENERIC_TWITTER_TITLE,
    twitterDescription: GENERIC_TWITTER_DESCRIPTION,
  };
}

async function resolveTags(
  pathname: string,
  params: Record<string, string>
): Promise<OgTags | null> {
  const slug =
    params.slug || pathname.match(/^\/legend\/([^/]+)\/?$/)?.[1];
  if (slug) {
    return fetchLegendTags(decodeURIComponent(slug), pathname);
  }

  const seasonSlug =
    params.seasonSlug ||
    pathname.match(/^\/seizoen\/([^/]+)\/club\/([^/]+)\/?$/)?.[1];
  const clubSlug =
    params.clubSlug ||
    pathname.match(/^\/seizoen\/([^/]+)\/club\/([^/]+)\/?$/)?.[2];
  if (seasonSlug && clubSlug) {
    return fetchClubTags(
      decodeURIComponent(seasonSlug),
      decodeURIComponent(clubSlug),
      pathname
    );
  }

  return null;
}

async function fetchLegendTags(
  slug: string,
  pathname: string
): Promise<OgTags | null> {
  const legends = await supabaseGet<
    { name: string; bio: string | null; png_url: string | null; club_id: string | null }[]
  >("legends", {
    slug: `eq.${slug}`,
    select: "name,bio,png_url,club_id",
  });
  const legend = legends?.[0];
  if (!legend) return null;

  let clubLabel = "";
  if (legend.club_id) {
    const clubs = await supabaseGet<{ name: string; city: string | null }[]>(
      "clubs",
      {
        id: `eq.${legend.club_id}`,
        select: "name,city",
      }
    );
    const club = clubs?.[0];
    if (club) {
      const cityLabel = club.city ? `, ${club.city}` : "";
      clubLabel = ` (${club.name}${cityLabel})`;
    }
  }

  const productTypes = await supabaseGet<{ base_price: string | number }[]>(
    "product_types",
    { select: "base_price" }
  );
  const prices = (productTypes || [])
    .map((t) => Number(t.base_price))
    .filter((n) => Number.isFinite(n));
  const lowestPrice = prices.length ? Math.min(...prices) : undefined;

  const title = `${legend.name} shirt${clubLabel}`;
  const description =
    `Draag ${legend.name}${clubLabel} op een premium t-shirt, hoodie of sweater.${
      lowestPrice ? ` Vanaf €${lowestPrice.toFixed(2)}.` : ""
    } ${legend.bio ? legend.bio.slice(0, 120) : ""}`.trim();

  return {
    title: fullTitle(title),
    description,
    image: absoluteUrl(legend.png_url) || DEFAULT_IMAGE,
    url: `${SITE_URL}${pathname}`,
    type: "product",
  };
}

async function fetchClubTags(
  seasonSlug: string,
  clubSlug: string,
  pathname: string
): Promise<OgTags | null> {
  const [startYear, endYear] = seasonSlug.split("-");
  const start = Number(startYear);
  const end = Number(endYear);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;

  const [seasons, clubs] = await Promise.all([
    supabaseGet<{ name: string }[]>("seasons", {
      start_year: `eq.${start}`,
      end_year: `eq.${end}`,
      select: "name",
    }),
    supabaseGet<{ name: string; city: string | null; logo_url: string | null }[]>(
      "clubs",
      {
        slug: `eq.${clubSlug}`,
        select: "name,city,logo_url",
      }
    ),
  ]);

  const season = seasons?.[0];
  const club = clubs?.[0];
  if (!season || !club) return null;

  const cityLabel = club.city ? ` ${club.city}` : "";
  const title = `${club.name} shirt kopen${club.city ? ` – ${club.city}` : ""}`;
  const description = `Voetbalshirt van ${club.name}${cityLabel} met jouw favoriete cultheld erop. Kies uit de legends van ${club.name} (seizoen ${season.name}) en druk 'm op een premium t-shirt, hoodie of sweater.`;

  return {
    title: fullTitle(title),
    description,
    image: absoluteUrl(club.logo_url) || DEFAULT_IMAGE,
    url: `${SITE_URL}${pathname}`,
    type: "website",
  };
}

function fullTitle(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

function absoluteUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return `${SITE_URL}/${value}`;
}

async function supabaseGet<T>(
  table: string,
  query: Record<string, string>
): Promise<T | null> {
  const base = Netlify.env.get("VITE_SUPABASE_URL");
  const key = Netlify.env.get("VITE_SUPABASE_ANON_KEY");
  if (!base || !key) {
    console.warn("[social-preview] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    return null;
  }

  const params = new URLSearchParams(query);
  const endpoint = `${base.replace(/\/$/, "")}/rest/v1/${table}?${params.toString()}`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.warn(`[social-preview] ${table} ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn("[social-preview] Supabase fetch failed:", err);
    return null;
  }
}

function previewResponse(tags: OgTags, headOnly: boolean): Response {
  const title = escapeHtml(tags.title);
  const description = escapeHtml(tags.description);
  const metaDescription = escapeHtml(tags.metaDescription || tags.description);
  const image = escapeHtml(tags.image);
  const url = escapeHtml(tags.url);
  const twitterTitle = escapeHtml(tags.twitterTitle || tags.title);
  const twitterDescription = escapeHtml(tags.twitterDescription || tags.description);

  const html = `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <meta name="description" content="${metaDescription}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="${tags.type}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:locale" content="nl_NL" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${twitterTitle}" />
    <meta name="twitter:description" content="${twitterDescription}" />
    <meta name="twitter:image" content="${image}" />
    <link rel="canonical" href="${url}" />
  </head>
  <body>
    <p>${title}</p>
  </body>
</html>
`;

  return new Response(headOnly ? null : html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, s-maxage=300, max-age=60",
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
