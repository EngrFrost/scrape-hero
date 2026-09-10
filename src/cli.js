import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchPage, isProductUrl } from './fetchPage.js';
import { parseSpecs } from './parseSpecs.js';
import { writeOutput } from './writeOutput.js';

const DEFAULT_URL = 'https://fleet-hero.com/products/winch-strap-with-flat-hook';
const REQUEST_DELAY_MS = 750;

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

/**
 * Parse CLI arguments.
 * @param {string[]} argv
 * @returns {{ urlsFile?: string, urls: string[], outputDir: string }}
 */
function parseArgs(argv) {
  /** @type {string[]} */
  const urls = [];
  let urlsFile;
  let outputDir = 'output';

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--urls' && argv[i + 1]) {
      urlsFile = argv[++i];
    } else if (arg === '--output' && argv[i + 1]) {
      outputDir = argv[++i];
    } else if (arg.startsWith('http')) {
      urls.push(arg);
    }
  }

  return { urlsFile, urls, outputDir };
}

/**
 * Load URLs from a file (one per line, # comments ignored).
 * @param {string} filePath
 * @returns {Promise<string[]>}
 */
async function loadUrlsFromFile(filePath) {
  const content = await readFile(filePath, 'utf8');
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

/**
 * Resolve the list of URLs to scrape.
 * @param {{ urlsFile?: string, urls: string[] }} args
 * @returns {Promise<string[]>}
 */
async function resolveUrls({ urlsFile, urls }) {
  if (urlsFile) {
    const filePath = resolve(projectRoot, urlsFile);
    const fromFile = await loadUrlsFromFile(filePath);
    return fromFile.length > 0 ? fromFile : [DEFAULT_URL];
  }

  if (urls.length > 0) {
    return urls;
  }

  const defaultFile = resolve(projectRoot, 'urls.txt');
  try {
    const fromDefault = await loadUrlsFromFile(defaultFile);
    if (fromDefault.length > 0) return fromDefault;
  } catch {
    // urls.txt missing — fall back to hardcoded default
  }

  return [DEFAULT_URL];
}

/**
 * Scrape a single product URL.
 * @param {string} url
 * @returns {Promise<{ url: string, title: string, specifications?: Record<string, string>, error?: string }>}
 */
async function scrapeProduct(url) {
  if (!isProductUrl(url)) {
    return {
      url,
      title: '',
      error: `Invalid product URL (must be a fleet-hero.com /products/ page): ${url}`,
    };
  }

  try {
    const html = await fetchPage(url);
    return parseSpecs(html, url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      url,
      title: '',
      error: message,
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const urls = await resolveUrls(args);
  /** @type {Array<{ url: string, title: string, specifications?: Record<string, string>, error?: string }>} */
  const results = [];

  console.log(`Scraping ${urls.length} product URL(s)...`);

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] ${url}`);

    const result = await scrapeProduct(url);
    results.push(result);

    if (result.error) {
      console.error(`  Error: ${result.error}`);
    } else {
      const specCount = Object.keys(result.specifications ?? {}).length;
      console.log(`  OK: ${result.title} (${specCount} specifications)`);
    }

    if (i < urls.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  const outputDir = resolve(projectRoot, args.outputDir);
  const { jsonPath, csvPath } = await writeOutput(results, outputDir);

  console.log(`\nWrote ${jsonPath}`);
  console.log(`Wrote ${csvPath}`);

  const failures = results.filter((r) => r.error);
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
