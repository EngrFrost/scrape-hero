import { test } from 'node:test';
import assert from 'node:assert/strict';
import { productsToCsv } from '../src/writeOutput.js';

test('productsToCsv includes a slug column for each specification key', () => {
  const csv = productsToCsv([
    {
      url: 'https://fleet-hero.com/products/winch-strap-with-flat-hook',
      title: 'Winch Strap with Flat Hook 4" x 30\'',
      slugTitle: 'winch-strap-with-flat-hook-4-x-30',
      specifications: { Width: '4 inches' },
      specificationsSlugs: { Width: 'width-winch-strap-with-flat-hook-4-x-30' },
    },
  ]);

  const [header, row] = csv.trim().split('\n');
  assert.match(header, /^url,title,slugTitle,error,Width,Width slug$/);
  assert.match(row, /width-winch-strap-with-flat-hook-4-x-30/);
});
