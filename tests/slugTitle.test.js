import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugTitleFrom, specificationsSlugsFrom } from '../src/slugTitle.js';

test('slugTitleFrom lowercases and hyphenates a product title', () => {
  assert.equal(
    slugTitleFrom('Winch Strap with Flat Hook 4" x 30\''),
    'winch-strap-with-flat-hook-4-x-30'
  );
});

test('slugTitleFrom strips punctuation and collapses separators', () => {
  assert.equal(
    slugTitleFrom('G70 Transport Chain 3/8" x 20\', WLL 6600 lbs'),
    'g70-transport-chain-3-8-x-20-wll-6600-lbs'
  );
  assert.equal(slugTitleFrom('  Coil Rack  '), 'coil-rack');
});

test('slugTitleFrom returns empty string for missing titles', () => {
  assert.equal(slugTitleFrom(''), '');
  assert.equal(slugTitleFrom(undefined), '');
});

test('specificationsSlugsFrom appends slugTitle to each spec key slug', () => {
  const slugTitle = 'winch-strap-with-flat-hook-4-x-30';
  const slugs = specificationsSlugsFrom(
    {
      'Load limit': '5,400 lbs',
      Width: '4 inches',
      'Working Load Limit (WLL)': '5,400 lbs',
    },
    slugTitle
  );

  assert.equal(slugs['Load limit'], `load-limit-${slugTitle}`);
  assert.equal(slugs.Width, `width-${slugTitle}`);
  assert.equal(slugs['Working Load Limit (WLL)'], `working-load-limit-wll-${slugTitle}`);
});
