import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSpecs } from '../src/parseSpecs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureHtml = readFileSync(
  join(__dirname, 'fixtures', 'winch-strap-accordion.html'),
  'utf8'
);

const EXPECTED_URL = 'https://fleet-hero.com/products/winch-strap-with-flat-hook';

test('parseSpecs extracts title and specifications from accordion HTML', () => {
  const result = parseSpecs(fixtureHtml, EXPECTED_URL);

  assert.equal(result.url, EXPECTED_URL);
  assert.equal(result.title, 'Winch Strap with Flat Hook 4" x 30\'');
  assert.equal(result.slugTitle, 'winch-strap-with-flat-hook-4-x-30');
  assert.equal(result.error, undefined);
  assert.equal(result.specifications['Width'], '4 inches');
  assert.equal(
    result.specificationsSlugs['Width'],
    'width-winch-strap-with-flat-hook-4-x-30'
  );
  assert.equal(
    result.specificationsSlugs['Working Load Limit (WLL)'],
    'working-load-limit-wll-winch-strap-with-flat-hook-4-x-30'
  );
  assert.equal(result.specifications['Available Lengths'], '30 feet / 40 feet');
  assert.equal(result.specifications['Working Load Limit (WLL)'], '5,400 lbs');
  assert.equal(result.specifications['Break Strength (BS)'], '16,200 lbs');
  assert.equal(result.specifications['Hook Type'], 'Flat hook');
  assert.equal(result.specifications['Webbing Color'], 'Yellow');
  assert.equal(result.specifications['Branding'], 'Fleet Hero logo');
  assert.equal(
    result.specifications['Application'],
    'Flatbed cargo securement, step deck tie-down, lumber, steel, machinery, equipment hauling'
  );
  assert.equal(
    result.specifications['Compliance'],
    'Designed to support FMCSA 49 CFR Part 393 cargo securement standards'
  );
  assert.equal(
    result.specifications['Ideal For'],
    'Flatbed trailers, step decks, RGN trailers, owner-operators, fleet drivers, heavy haul operators'
  );
});

test('parseSpecs returns error when Specifications accordion is missing', () => {
  const html = '<html><body><h1>Test Product</h1></body></html>';
  const result = parseSpecs(html, 'https://fleet-hero.com/products/test');

  assert.equal(result.title, 'Test Product');
  assert.equal(result.slugTitle, 'test-product');
  assert.equal(result.specifications, undefined);
  assert.equal(result.specificationsSlugs, undefined);
  assert.match(result.error, /Specifications accordion not found/i);
});

test('parseSpecs ignores Description accordion', () => {
  const html = `
    <h1>Only Description</h1>
    <h3>Description</h3>
    <p>Some description text</p>
  `;
  const result = parseSpecs(html, 'https://fleet-hero.com/products/no-specs');

  assert.match(result.error, /Specifications accordion not found/i);
});
