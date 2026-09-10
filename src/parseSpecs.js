import * as cheerio from 'cheerio';
import { slugTitleFrom, specificationsSlugsFrom } from './slugTitle.js';

/**
 * Split a line like "Label: value" on the first colon.
 * @param {string} line
 * @returns {[string, string] | null}
 */
function parseSpecLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const colonIndex = trimmed.indexOf(':');
  if (colonIndex === -1) return null;

  const key = trimmed.slice(0, colonIndex).trim();
  const value = trimmed.slice(colonIndex + 1).trim();
  if (!key) return null;

  return [key, value];
}

/**
 * Extract text lines from the specifications content panel.
 * @param {import('cheerio').CheerioAPI} $
 * @param {import('cheerio').Cheerio<import('cheerio').Element>} contentPanel
 * @returns {string[]}
 */
function extractSpecLines($, contentPanel) {
  const metafield = contentPanel.find('.metafield-multi_line_text_field').first();
  if (metafield.length > 0) {
    const html = metafield.html() ?? '';
    return html
      .split(/<br\s*\/?>/i)
      .map((part) => cheerio.load(part).text().trim())
      .filter(Boolean);
  }

  return contentPanel
    .text()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Find the accordion content panel for the Specifications heading.
 * @param {import('cheerio').CheerioAPI} $
 * @returns {import('cheerio').Cheerio<import('cheerio').Element> | null}
 */
function findSpecificationsPanel($) {
  const headings = $('h3').filter((_, el) => $(el).text().trim() === 'Specifications');
  if (headings.length === 0) return null;

  const heading = headings.first();
  const accordionItem = heading.closest('[class*="ai-accordion-item"]');
  if (accordionItem.length === 0) {
    const header = heading.closest('button, [class*="ai-accordion-header"]');
    const itemFromHeader = header.closest('[class*="ai-accordion-item"]');
    if (itemFromHeader.length === 0) return null;
    return itemFromHeader.find('[class*="ai-accordion-content"]').first();
  }

  return accordionItem.find('[class*="ai-accordion-content"]').first();
}

/**
 * Extract product title from page HTML.
 * @param {import('cheerio').CheerioAPI} $
 * @returns {string}
 */
function extractTitle($) {
  const h1 = $('h1').first().text().trim();
  if (h1) return h1;

  const titleTag = $('title').first().text().trim();
  if (titleTag) {
    return titleTag.split('|')[0].trim();
  }

  return '';
}

/**
 * Parse product specifications from Fleet Hero product page HTML.
 * @param {string} html
 * @param {string} url
 * @returns {{ url: string, title: string, slugTitle: string, specifications?: Record<string, string>, specificationsSlugs?: Record<string, string>, error?: string }}
 */
export function parseSpecs(html, url) {
  const $ = cheerio.load(html);
  const title = extractTitle($);
  const slugTitle = slugTitleFrom(title);
  const contentPanel = findSpecificationsPanel($);

  if (!contentPanel || contentPanel.length === 0) {
    return {
      url,
      title,
      slugTitle,
      error: 'Specifications accordion not found',
    };
  }

  const lines = extractSpecLines($, contentPanel);
  /** @type {Record<string, string>} */
  const specifications = {};

  for (const line of lines) {
    const parsed = parseSpecLine(line);
    if (parsed) {
      const [key, value] = parsed;
      specifications[key] = value;
    }
  }

  if (Object.keys(specifications).length === 0) {
    return {
      url,
      title,
      slugTitle,
      error: 'Specifications accordion found but contained no parseable lines',
    };
  }

  return {
    url,
    title,
    slugTitle,
    specifications,
    specificationsSlugs: specificationsSlugsFrom(specifications, slugTitle),
  };
}
