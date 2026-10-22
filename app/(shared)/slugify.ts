/**
 * Slugs used in public URLs.
 *
 * These are display-only: article URLs are `/artikel/<id>/<slug>`, where the id
 * is the source of truth and the trailing segment exists purely so the link is
 * readable. It is always derived from the current title, never stored, so a
 * renamed article simply gets a new (and old links keep working — see
 * `app/artikel/[...parts]/page.tsx`).
 */

// Transliterated before the diacritics are stripped below, so "Fäuste" becomes
// "faeuste" (German convention) rather than "fauste".
const GERMAN_REPLACEMENTS: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
};

export function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => GERMAN_REPLACEMENTS[char])
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Titles made up entirely of emoji/punctuation would slugify to "", which
  // would produce a trailing empty URL segment.
  return slug || "beitrag";
}
