// Shared slug helper so the city/club URLs generated on the fly (e.g.
// /stad/:citySlug) match the same rules used when admins generate a slug
// for a name in the admin panel.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
