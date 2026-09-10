const USER_AGENT = 'FleetHeroSpecsScraper/1.0 (+https://fleet-hero.com)';

/**
 * Fetch HTML content from a product URL.
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

/**
 * Validate that a URL is a Fleet Hero product page.
 * @param {string} url
 * @returns {boolean}
 */
export function isProductUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === 'fleet-hero.com' || parsed.hostname === 'www.fleet-hero.com') &&
      parsed.pathname.includes('/products/')
    );
  } catch {
    return false;
  }
}
