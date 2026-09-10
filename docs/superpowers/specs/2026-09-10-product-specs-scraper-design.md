# Product Specs Scraper — Design Spec

**Date:** 2026-09-10  
**Status:** Approved for implementation

## Goal

Build a Node.js scraper that extracts the **Specifications** accordion from Fleet Hero Shopify product pages and writes results to both JSON and CSV.

**First target:** [Winch Strap with Flat Hook](https://fleet-hero.com/products/winch-strap-with-flat-hook)

## Context

- Fleet Hero runs on Shopify. Product pages expose a Specifications accordion in server-rendered HTML.
- The accordion heading uses a theme-generated class suffix (e.g. `ai-accordion-title-ace5cztlyynnjadrodaigenblockfb1413dex8xgr`). That suffix is unstable — selectors must match heading text `Specifications`, not the hashed class.
- Spec content lives in a `.metafield-multi_line_text_field` span with `<br />`-separated `Label: value` lines.
- Shopify's `/products/{handle}.json` endpoint returns a different specs block inside `body_html` (e.g. "30 feet" only vs "30 feet / 40 feet" in the accordion). **Do not use the JSON endpoint as the source of truth.**

## Requirements

### Input

- Default URL: `https://fleet-hero.com/products/winch-strap-with-flat-hook`
- Support a URL list via `--urls urls.txt` (one product URL per line)
- Reject URLs that are not Fleet Hero product pages (`/products/` path)

### Parsing

1. Fetch HTML via HTTP GET (no browser automation)
2. Find the `h3` element whose trimmed text is `Specifications`
3. Walk up to the accordion item container, then read the content panel
4. Extract text from `.metafield-multi_line_text_field` or `<br>`-separated lines
5. Split each line on the first `:` into key/value pairs
6. Capture product title from the page `<h1>` (or `<title>` fallback)

### Output

Write both files on every run:

- `output/products.json` — array of product objects
- `output/products.csv` — one row per product; columns = `url`, `title`, then union of all spec keys

Example JSON record:

```json
{
  "url": "https://fleet-hero.com/products/winch-strap-with-flat-hook",
  "title": "Winch Strap with Flat Hook 4\" x 30'",
  "specifications": {
    "Width": "4 inches",
    "Available Lengths": "30 feet / 40 feet",
    "Working Load Limit (WLL)": "5,400 lbs"
  }
}
```

### Error handling

- Network/HTTP errors: log error for that URL, continue with remaining URLs
- Missing Specifications accordion: record error on that product, continue
- 750 ms delay between URL requests

### Non-goals (v1)

- Scraping all products automatically (sitemap crawl)
- Browser automation (Playwright/Puppeteer)
- Using Shopify product JSON as specs source

## Architecture

```
urls.txt / CLI args → fetchPage → parseSpecs → writeOutput (JSON + CSV)
```

## Tech stack

- Node.js 22 (native `fetch`)
- `cheerio` for HTML parsing
- `node:test` for unit tests
- Fixture-based tests (no live network in unit tests)

## File layout

| File | Purpose |
|------|---------|
| `src/fetchPage.js` | HTTP GET with User-Agent |
| `src/parseSpecs.js` | Accordion → `{ title, specifications }` |
| `src/writeOutput.js` | Write JSON + wide CSV |
| `src/cli.js` | CLI entry point |
| `urls.txt` | Default URL list |
| `tests/fixtures/winch-strap-accordion.html` | Saved accordion snippet |
| `tests/parseSpecs.test.js` | Parser unit tests |

## Verification

1. Unit tests pass against fixture HTML
2. Live run against winch-strap URL produces JSON/CSV with `Available Lengths: 30 feet / 40 feet`
