import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = () => readFile(path.join(root, 'dist/generated-pages.json'), 'utf8').then(JSON.parse);

test('larger shared type, continuous audience strip and joined contact footer', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.section-number, .step-number, .hero-model-number, .eyebrow')).toHaveCount(0);
  const sizes = await page.evaluate(() => ({
    nav: parseFloat(getComputedStyle(document.querySelector('#navigation a')).fontSize),
    description: parseFloat(getComputedStyle(document.querySelector('.hero-description')).fontSize),
    footer: parseFloat(getComputedStyle(document.querySelector('.footer-bottom')).fontSize),
  }));
  expect(sizes.nav).toBeGreaterThanOrEqual(18);
  expect(sizes.description).toBeGreaterThanOrEqual(18);
  expect(sizes.footer).toBeGreaterThanOrEqual(16);
  await expect(page.locator('.audience-track')).toHaveCount(2);
  const strip = page.locator('.audience-marquee');
  await expect(strip).toHaveCSS('animation-iteration-count', 'infinite');
  await strip.hover({ force: true });
  await expect(strip).toHaveCSS('animation-play-state', 'running');
  const joined = await page.evaluate(() => {
    const contact = document.querySelector('#contact');
    const footer = document.querySelector('.contact-footer');
    return {
      gap: footer.getBoundingClientRect().top - contact.getBoundingClientRect().bottom,
      sameColor: getComputedStyle(contact).backgroundColor === getComputedStyle(footer).backgroundColor,
    };
  });
  expect(joined.sameColor).toBe(true);
  expect(Math.abs(joined.gap)).toBeLessThan(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(strip).toHaveCSS('animation-name', 'none');
});

test('shop, technical details and workshop partnership enquiries', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/shop/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Educational drone shop');
  await page.getByRole('link', { name: 'View technical details' }).click();
  await expect(page).toHaveURL(/\/educational-drone\/$/);
  await expect(page.locator('.comparison-table')).toContainText('F450');
  await expect(page.locator('.comparison-table')).toContainText('Pixhawk 2.4.8');
  await expect(page.locator('.comparison-table')).toContainText('Subject to confirmation');
  await expect(page.locator('.comparison-table')).toContainText('Requires verified testing');
  const quote = await page.getByRole('link', { name: 'Request a Quote', exact: false }).first().getAttribute('href');
  expect(decodeURIComponent(quote)).toContain('Please confirm the final configuration and package contents');
  for (const [route, kind] of [['drone-workshops', 'workshop'], ['partnerships', 'partnership']]) {
    await page.goto(`/${route}/`);
    await expect(page.locator(`a[data-enquiry="${kind}"]`).first()).toBeVisible();
    const href = decodeURIComponent(await page.locator(`a[data-enquiry="${kind}"]`).first().getAttribute('href'));
    expect(href).toContain('mailto:hello@naadix.xyz');
    expect(href).toMatch(/facilitator/);
    await expect(page.locator('main')).toContainText(/experience/);
  }
  expect(errors).toEqual([]);
});

test('workshop section follows the product and both workshop buttons work', async ({ page, browser }, testInfo) => {
  await page.goto('/');
  expect(await page.locator('#product').evaluate(node => node.nextElementSibling.id)).toBe('workshops');
  const section = page.locator('#workshops');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Hands-on drone workshops for students and teachers');
  await expect(section).toContainText('YANA is open to partnering with schools, colleges, academies and robotics clubs');
  const request = section.getByRole('link', { name: 'Request a Workshop' });
  const mail = new URL(await request.getAttribute('href'));
  expect(mail.protocol).toBe('mailto:');
  expect(mail.pathname).toBe('hello@naadix.xyz');
  expect(mail.searchParams.get('subject')).toBe('YANA Drone Workshop Enquiry');
  for (const field of ['Institution name:', 'City:', 'Participant age group:', 'Expected number of participants:', 'Preferred date:']) {
    expect(mail.searchParams.get('body')).toContain(field);
  }
  await section.getByRole('link', { name: 'Explore Workshops' }).click();
  await expect(page).toHaveURL(/\/drone-workshops\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hands-on drone workshops for students and teachers');
  await expect(page.getByRole('heading', { name: 'Proposed workshop outline' })).toBeVisible();
  for (const topic of ['Drone components:', 'Quadcopter basics:', 'Assembly:', 'Electronics:', 'Flight safety:']) {
    await expect(page.locator('main')).toContainText(topic);
  }
  await expect(page.locator('main')).toContainText('potential topics are subject to discussion');
  const pageMail = new URL(await page.locator('a[data-enquiry="workshop"]').first().getAttribute('href'));
  expect(pageMail.searchParams.get('subject')).toBe('YANA Drone Workshop Enquiry');
  await expect(page.locator('main')).not.toContainText(/participants\?|We\?ll|facilitator\?s/);
  await page.locator('.page-photo img').evaluate(image => image.decode());
  await page.screenshot({ path: testInfo.outputPath('workshops.png'), fullPage: true });
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const fallback = await context.newPage();
  for (const route of ['/', '/drone-workshops/']) {
    await fallback.goto('http://127.0.0.1:4173' + route);
    const link = fallback.locator('a[data-enquiry="workshop"]').first();
    await expect(link).toBeVisible();
    const href = new URL(await link.getAttribute('href'));
    expect(href.pathname).toBe('hello@naadix.xyz');
    expect(href.searchParams.get('subject')).toBe('YANA Drone Workshop Enquiry');
  }
  await context.close();
});

test('library searches, filters, empty state and progressive display', async ({ page }) => {
  await page.goto('/blog/');
  const cards = page.locator('#blog-list [data-blog-card]');
  await expect(cards).toHaveCount(100);
  await expect(page.locator('#blog-count')).toHaveText('100 guides in the library · showing 12');
  await expect(cards.filter({ visible: true })).toHaveCount(12);
  await page.getByRole('button', { name: 'Show more guides' }).click();
  await expect(cards.filter({ visible: true })).toHaveCount(24);
  await page.locator('#blog-category').selectOption('Workshop planning');
  await expect(cards.filter({ visible: true })).toHaveCount(10);
  await expect(page.locator('#blog-more')).toBeHidden();
  await page.locator('#blog-search').fill('no-matching-guide-xyz');
  await expect(page.locator('#blog-empty')).toBeVisible();
  await expect(cards.filter({ visible: true })).toHaveCount(0);
  await page.locator('#blog-category').selectOption('all');
  await page.locator('#blog-search').fill('Pixhawk');
  await expect(page.locator('#blog-empty')).toBeHidden();
  expect(await cards.filter({ visible: true }).count()).toBeGreaterThan(0);
  await page.locator('#blog-search').fill('');
  await expect(cards.filter({ visible: true })).toHaveCount(12);
  await page.locator('.topic-links a').first().click();
  await expect(page.locator('main [data-blog-card]')).toHaveCount(10);
});

test('articles and all library links remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/blog/');
  await expect(page.locator('#blog-list [data-blog-card]:visible')).toHaveCount(100);
  await page.locator('#blog-list h2 a').first().click();
  await expect(page.locator('.article-body')).toBeVisible();
  await expect(page.locator('#references a').first()).toBeVisible();
  await expect(page.locator('.article-body a[href*="educational-drone/"]')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await context.close();
});

test('new pages have accessible layouts and fit desktop, tablet and narrow mobile widths', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const data = await manifest();
  const representatives = [...new Map(data.pages.filter(p => p.kind === 'article').map(p => [p.category, p.route])).values()];
  for (const route of ['shop/', 'educational-drone/', 'drone-workshops/', 'partnerships/', 'blog/', ...representatives]) {
    await page.goto(`/${route}`);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      await Promise.all([...document.images].map(image => image.decode()));
    });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations, route).toEqual([]);
    if (route.startsWith('blog/') && route !== 'blog/') {
      expect(await page.locator('.article-body p').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(18);
      await expect(page.locator('.article-body section p').first()).toHaveCSS('font-size', testInfo.project.name === 'mobile' ? '18px' : '19px');
    }
    for (const width of [320, 390, 768, 1024, 1101, 1200, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at ${width}px`).toBe(true);
    }
    await page.setViewportSize(testInfo.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
  }
  await page.goto('/educational-drone/');
  await page.screenshot({ path: testInfo.outputPath('technical-details.png'), fullPage: true });
  await page.goto(`/${representatives[0]}`);
  await page.screenshot({ path: testInfo.outputPath('article.png'), fullPage: true });
  await page.goto('/');
  await page.locator('#contact').screenshot({ path: testInfo.outputPath('contact.png') });
});

test('every published page, internal link, canonical and sitemap entry is valid', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The same static publication is shared by both device projects.');
  test.setTimeout(120_000);
  const data = await manifest();
  expect(data.articleCount).toBe(100);
  const articles = data.pages.filter(p => p.kind === 'article');
  expect(articles).toHaveLength(100);
  const categories = [...new Set(articles.map(p => p.category))];
  expect(categories).toHaveLength(10);
  for (const category of categories) expect(articles.filter(p => p.category === category)).toHaveLength(10);
  for (const article of articles) expect(article.wordCount, article.slug).toBeGreaterThanOrEqual(400);
  const routes = ['', ...data.pages.map(p => p.route)];
  const documents = [];
  for (let i = 0; i < routes.length; i += 8) {
    documents.push(...await Promise.all(routes.slice(i, i + 8).map(async route => {
      const response = await request.get('/' + route);
      expect(response.status(), route).toBe(200);
      const html = await response.text();
      expect(html).toBe(await readFile(path.join(root, route, 'index.html'), 'utf8'));
      return { route, html };
    })));
  }
  await page.goto('/');
  const parsed = await page.evaluate(documents => documents.map(({ route, html }) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return {
      route,
      title: doc.title,
      description: doc.querySelector('meta[name="description"]')?.content,
      canonical: doc.querySelector('link[rel="canonical"]')?.href,
      h1: doc.querySelectorAll('h1').length,
      ids: [...doc.querySelectorAll('[id]')].map(n => n.id),
      links: [...doc.querySelectorAll('a[href],script[src],link[href],img[src],source[src]')].map(n => n.getAttribute('href') || n.getAttribute('src')),
      schema: JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent),
      article: doc.querySelector('.article-body')?.textContent,
    };
  }), documents);
  expect(new Set(parsed.map(p => p.title)).size).toBe(parsed.length);
  expect(new Set(parsed.map(p => p.description)).size).toBe(parsed.length);
  const publication = new Map(parsed.map(p => [p.route, p]));
  const files = new Set();
  for (const doc of parsed) {
    expect(doc.h1, doc.route).toBe(1);
    expect(doc.canonical).toBe('https://yana-drones.github.io/yana/' + doc.route);
    expect(doc.description.length).toBeGreaterThan(40);
    expect(new Set(doc.ids).size, doc.route).toBe(doc.ids.length);
    if (doc.article) {
      expect(doc.schema['@type']).toBe('BlogPosting');
      expect(doc.schema.author['@type']).toBe('Organization');
      expect(doc.schema.datePublished).toBe('2026-10-27');
    }
    for (const href of doc.links) {
      const url = new URL(href, 'https://yana-drones.github.io/yana/' + doc.route);
      if (url.origin !== 'https://yana-drones.github.io') continue;
      expect(url.pathname.startsWith('/yana/'), `${doc.route} -> ${href}`).toBe(true);
      const relative = decodeURIComponent(url.pathname.slice('/yana/'.length));
      const file = relative.endsWith('/') || relative === '' ? relative + 'index.html' : relative;
      files.add(file);
      if (url.hash && publication.has(relative)) {
        expect(publication.get(relative).ids, `${doc.route} -> ${href}`).toContain(decodeURIComponent(url.hash.slice(1)));
      }
    }
  }
  for (const file of files) await expect(access(path.join(root, 'dist', file)), file).resolves.toBeUndefined();
  expect(new Set(parsed.filter(p => p.article).map(p => p.article)).size).toBe(100);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect([...sitemap.matchAll(/<loc>/g)]).toHaveLength(routes.length);
  for (const doc of parsed) expect(sitemap).toContain(`<loc>${doc.canonical}</loc>`);
});
