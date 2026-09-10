import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCollectionHandle,
  parseCollectionProducts,
  fetchCollectionProductUrls,
} from '../src/collection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureJson = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'cargo-securement-products.json'), 'utf8')
);

test('normalizeCollectionHandle accepts a bare collection handle', () => {
  assert.equal(normalizeCollectionHandle('cargo-securement'), 'cargo-securement');
});

test('normalizeCollectionHandle extracts handle from a collection path', () => {
  assert.equal(normalizeCollectionHandle('/collections/cargo-securement'), 'cargo-securement');
});

test('normalizeCollectionHandle extracts handle from a Fleet Hero collection URL', () => {
  assert.equal(
    normalizeCollectionHandle('https://fleet-hero.com/collections/cargo-securement'),
    'cargo-securement'
  );
  assert.equal(
    normalizeCollectionHandle('https://www.fleet-hero.com/collections/cargo-securement?page=2'),
    'cargo-securement'
  );
});

test('normalizeCollectionHandle rejects other hosts and product URLs', () => {
  assert.throws(
    () => normalizeCollectionHandle('https://example.com/collections/cargo-securement'),
    /fleet-hero\.com \/collections\//i
  );
  assert.throws(
    () => normalizeCollectionHandle('https://fleet-hero.com/products/winch-strap-with-flat-hook'),
    /fleet-hero\.com \/collections\//i
  );
});

test('parseCollectionProducts expands unique product URLs from collection JSON', () => {
  const urls = parseCollectionProducts(fixtureJson);
  assert.deepEqual(urls, [
    'https://fleet-hero.com/products/winch-strap-with-flat-hook',
    'https://fleet-hero.com/products/ratchet-load-binder-with-folding-handle',
  ]);
});

test('parseCollectionProducts rejects invalid collection JSON', () => {
  assert.throws(() => parseCollectionProducts({}), /Invalid collection products JSON/i);
  assert.throws(() => parseCollectionProducts(null), /Invalid collection products JSON/i);
});

test('fetchCollectionProductUrls paginates until an empty products page', async () => {
  const requested = [];
  async function fetchJson(url) {
    requested.push(url);
    if (url.includes('page=1')) {
      return { products: [{ handle: 'winch-strap-with-flat-hook' }] };
    }
    if (url.includes('page=2')) {
      return { products: [{ handle: 'ratchet-load-binder-with-folding-handle' }] };
    }
    return { products: [] };
  }

  const urls = await fetchCollectionProductUrls('cargo-securement', { fetchJson, delayMs: 0 });

  assert.deepEqual(urls, [
    'https://fleet-hero.com/products/winch-strap-with-flat-hook',
    'https://fleet-hero.com/products/ratchet-load-binder-with-folding-handle',
  ]);
  assert.equal(requested.length, 3);
  assert.match(requested[0], /\/collections\/cargo-securement\/products\.json\?limit=250&page=1$/);
  assert.match(requested[2], /page=3$/);
});

test('fetchCollectionProductUrls fails when the collection has no products', async () => {
  await assert.rejects(
    () =>
      fetchCollectionProductUrls('empty-collection', {
        fetchJson: async () => ({ products: [] }),
        delayMs: 0,
      }),
    /contained no products/i
  );
});
