/**
 * Build a URL-safe slug from a product title.
 * @param {string} [title]
 * @returns {string}
 */
export function slugTitleFrom(title) {
  return String(title ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build `{spec-key-slug}-{slugTitle}` for one specification label.
 * @param {string} specKey
 * @param {string} [slugTitle]
 * @returns {string}
 */
export function specificationSlug(specKey, slugTitle) {
  const parts = [slugTitleFrom(specKey), slugTitle].filter(Boolean);
  return parts.join('-');
}

/**
 * Map each specification key to `{key-slug}-{slugTitle}`.
 * @param {Record<string, string>} [specifications]
 * @param {string} [slugTitle]
 * @returns {Record<string, string> | undefined}
 */
export function specificationsSlugsFrom(specifications, slugTitle) {
  if (!specifications) return undefined;

  /** @type {Record<string, string>} */
  const slugs = {};
  for (const key of Object.keys(specifications)) {
    slugs[key] = specificationSlug(key, slugTitle);
  }
  return slugs;
}
