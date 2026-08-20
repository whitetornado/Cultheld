// Generates public/sitemap.xml from the current Supabase content (seasons,
// clubs and legends) so every season/club/legend page is discoverable by
// search engines without maintaining the list by hand. Runs automatically
// before every build (see the "build" script in package.json).
//
// If Supabase isn't reachable (e.g. missing env vars in a local dev build),
// this falls back to just the static pages instead of failing the build —
// a slightly stale sitemap is fine, a broken deploy is not.

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Unlike `vite build`, a plain `node script.mjs` does not read .env files
// automatically, so load it by hand here (Netlify's build environment sets
// these as real env vars directly, so this is only needed for local runs).
function loadDotEnv() {
  if (!existsSync('.env')) return;
  let content = readFileSync('.env', 'utf-8');
  // Strip a leading UTF-8 BOM — PowerShell's Set-Content/Out-File often add
  // one, which would otherwise silently corrupt the first variable name.
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const SITE_URL = 'https://cultheld.nl';

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/seizoenen', priority: '0.9', changefreq: 'weekly' },
  { path: '/legends', priority: '0.9', changefreq: 'weekly' },
  { path: '/faq', priority: '0.5', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/track-order', priority: '0.3', changefreq: 'yearly' },
];

function urlEntry(path, priority, changefreq) {
  return `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function seasonSlug(season) {
  return `${season.start_year}-${season.end_year}`;
}

// Mirrors src/lib/slug.ts — kept as a plain copy here since this build
// script runs under plain Node, not through the Vite/TS toolchain.
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  const entries = STATIC_PAGES.map((p) => urlEntry(p.path, p.priority, p.changefreq));

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[sitemap] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set, generating static-only sitemap');
  } else {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const [{ data: seasons }, { data: clubs }, { data: legends }, { data: assignments }] = await Promise.all([
        supabase.from('seasons').select('start_year, end_year'),
        supabase.from('clubs').select('id, slug, city'),
        supabase.from('legends').select('slug, club_id, all_time'),
        supabase.from('legend_assignments').select('season_id, club_id, seasons(start_year, end_year), clubs(slug)'),
      ]);

      (seasons || []).forEach((season) => {
        entries.push(urlEntry(`/seizoen/${seasonSlug(season)}`, '0.8', 'weekly'));
      });

      const seenClubPages = new Set();
      (assignments || []).forEach((a) => {
        const season = a.seasons;
        const club = a.clubs;
        if (!season || !club) return;
        const path = `/seizoen/${seasonSlug(season)}/club/${club.slug}`;
        if (seenClubPages.has(path)) return;
        seenClubPages.add(path);
        entries.push(urlEntry(path, '0.7', 'weekly'));
      });

      (legends || []).forEach((legend) => {
        entries.push(urlEntry(`/legend/${legend.slug}`, '0.7', 'weekly'));
      });

      // All-time club/city pages only exist (and are worth indexing) once at
      // least one legend has been marked all-time for that club.
      const allTimeClubIds = new Set(
        (legends || []).filter((l) => l.all_time && l.club_id).map((l) => l.club_id)
      );

      let allTimeClubPages = 0;
      const citySlugs = new Set();
      (clubs || []).forEach((club) => {
        if (!allTimeClubIds.has(club.id)) return;
        entries.push(urlEntry(`/club/${club.slug}`, '0.6', 'weekly'));
        allTimeClubPages++;
        if (club.city) {
          const citySlug = slugify(club.city);
          if (!citySlugs.has(citySlug)) {
            citySlugs.add(citySlug);
            entries.push(urlEntry(`/stad/${citySlug}`, '0.6', 'weekly'));
          }
        }
      });

      console.log(`[sitemap] ${(seasons || []).length} seasons, ${seenClubPages.size} club pages, ${(legends || []).length} legends, ${allTimeClubPages} all-time club pages, ${citySlugs.size} city pages`);
    } catch (err) {
      console.warn('[sitemap] Failed to fetch from Supabase, generating static-only sitemap:', err.message);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  writeFileSync('public/sitemap.xml', xml);
  console.log(`[sitemap] Wrote public/sitemap.xml with ${entries.length} URLs`);
}

main();
