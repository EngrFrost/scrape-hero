const USER_AGENT = 'FleetHeroSpecsScraper/1.0 (+https://fleet-hero.com)';

/**
 * Fetch a URL and throw if the response is not OK.
 * @param {string} url
 * @param {Record<string, string>} acceptHeaders
 * @returns {Promise<Response>}
 */
async function fetchOk(url, acceptHeaders) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      ...acceptHeaders,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response;
}

/**
 * Fetch HTML content from a product URL.
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function fetchPage(url) {
  const response = await fetchOk(url, {
    Accept: 'text/html,application/xhtml+xml',
  });
  return response.text();
}

/**
 * Fetch JSON from a URL.
 * @param {string} url
 * @returns {Promise<unknown>}
 */
export async function fetchJson(url) {
  const response = await fetchOk(url, {
    Accept: 'application/json',
  });
  return response.json();
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
