import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/**
 * Escape a CSV field value.
 * @param {string} value
 * @returns {string}
 */
function escapeCsvField(value) {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build the union of all specification keys across products.
 * @param {Array<{ specifications?: Record<string, string> }>} products
 * @returns {string[]}
 */
function collectSpecKeys(products) {
  const keys = new Set();
  for (const product of products) {
    if (product.specifications) {
      for (const key of Object.keys(product.specifications)) {
        keys.add(key);
      }
    }
  }
  return [...keys].sort();
}

/**
 * Convert products to CSV string with wide format.
 * @param {Array<{ url: string, title: string, slugTitle?: string, specifications?: Record<string, string>, specificationsSlugs?: Record<string, string>, error?: string }>} products
 * @returns {string}
 */
export function productsToCsv(products) {
  const specKeys = collectSpecKeys(products);
  const headers = [
    'url',
    'title',
    'slugTitle',
    'error',
    ...specKeys,
    ...specKeys.map((key) => `${key} slug`),
  ];
  const rows = [headers.join(',')];

  for (const product of products) {
    const row = [
      escapeCsvField(product.url),
      escapeCsvField(product.title),
      escapeCsvField(product.slugTitle ?? ''),
      escapeCsvField(product.error ?? ''),
      ...specKeys.map((key) => escapeCsvField(product.specifications?.[key] ?? '')),
      ...specKeys.map((key) => escapeCsvField(product.specificationsSlugs?.[key] ?? '')),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n') + '\n';
}

/**
 * Write products to JSON and CSV files.
 * @param {Array<{ url: string, title: string, slugTitle?: string, specifications?: Record<string, string>, specificationsSlugs?: Record<string, string>, error?: string }>} products
 * @param {string} outputDir
 * @returns {Promise<{ jsonPath: string, csvPath: string }>}
 */
export async function writeOutput(products, outputDir = 'output') {
  await mkdir(outputDir, { recursive: true });

  const jsonPath = join(outputDir, 'products.json');
  const csvPath = join(outputDir, 'products.csv');

  await writeFile(jsonPath, JSON.stringify(products, null, 2) + '\n', 'utf8');
  await writeFile(csvPath, productsToCsv(products), 'utf8');

  return { jsonPath, csvPath };
}
