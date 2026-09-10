import { fetchJson as defaultFetchJson } from './fetchPage.js';

const ORIGIN = 'https://fleet-hero.com';

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function defaultSleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

/**
 * Normalize a collection handle, path, or Fleet Hero collection URL.
 * @param {string} input
 * @returns {string}
 */
export function normalizeCollectionHandle(input) {
  const trimmed = String(input ?? '').trim();
  if (!trimmed) {
    throw new Error('Collection handle is required');
  }

  const asUrl = trimmed.includes('://')
    ? trimmed
    : trimmed.startsWith('/') || trimmed.startsWith('collections/')
      ? `https://fleet-hero.com/${trimmed.replace(/^\//, '')}`
      : null;

  if (!asUrl) {
    if (/[/?#]/.test(trimmed)) {
      throw new Error(`Invalid collection handle: ${input}`);
    }
    return trimmed;
  }

  let parsed;
  try {
    parsed = new URL(asUrl);
  } catch {
    throw new Error(`Invalid collection handle: ${input}`);
  }

  if (parsed.hostname !== 'fleet-hero.com' && parsed.hostname !== 'www.fleet-hero.com') {
    throw new Error(`Invalid collection (must be a fleet-hero.com /collections/ page): ${input}`);
  }

  const match = parsed.pathname.match(/^\/collections\/([^/]+)\/?$/);
  if (!match) {
    throw new Error(`Invalid collection (must be a fleet-hero.com /collections/ page): ${input}`);
  }

  return match[1];
}

/**
 * Build unique product URLs from a Shopify collection products.json payload.
 * @param {unknown} json
 * @returns {string[]}
 */
export function parseCollectionProducts(json) {
  if (!json || typeof json !== 'object' || !Array.isArray(json.products)) {
    throw new Error('Invalid collection products JSON');
  }

  const urls = [];
  const seen = new Set();

  for (const product of json.products) {
    const handle = product?.handle;
    if (typeof handle !== 'string' || !handle) continue;

    const url = `${ORIGIN}/products/${handle}`;
    if (seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }

  return urls;
}

/**
 * Fetch every product URL in a Fleet Hero collection, paginating products.json.
 * @param {string} handle
 * @param {{ fetchJson?: (url: string) => Promise<unknown>, delayMs?: number, sleep?: (ms: number) => Promise<void> }} [options]
 * @returns {Promise<string[]>}
 */
export async function fetchCollectionProductUrls(handle, options = {}) {
  const fetchJson = options.fetchJson ?? defaultFetchJson;
  const delayMs = options.delayMs ?? 0;
  const sleep = options.sleep ?? defaultSleep;

  const urls = [];
  const seen = new Set();
  let page = 1;

  while (true) {
    const json = await fetchJson(
      `${ORIGIN}/collections/${handle}/products.json?limit=250&page=${page}`
    );
    const pageUrls = parseCollectionProducts(json);
    if (pageUrls.length === 0) break;

    for (const url of pageUrls) {
      if (seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }

    page += 1;
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  if (urls.length === 0) {
    throw new Error(`Collection "${handle}" contained no products`);
  }

  return urls;
}
