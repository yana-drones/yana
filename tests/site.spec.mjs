import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

test("all requested sections, original logo, honest configuration and no broken media", async ({
  page,
  request,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/");
  expect(response.status()).toBe(200);
  await expect(page).toHaveTitle("YANA — Make learning take flight.");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Make learningtake flight.",
  );
  for (const section of ["about", "product", "details", "gallery", "contact"])
    await expect(page.locator(`#${section}`)).toBeAttached();
  await expect(page.locator(".site-header .brand img")).toBeVisible();
  await expect(page.locator("#details")).toContainText("F450");
  await expect(page.locator("#details")).toContainText("Pixhawk 2.4.8");
  await expect(page.locator("#details")).toContainText(
    "Proposed configuration",
  );
  expect(await page.locator(".unconfirmed").count()).toBe(4);
  await page.evaluate(async () => {
    // Force off-screen images to load for this check; production remains lazy.
    await Promise.all([...document.images].map((image) => {
      image.loading = "eager";
      return image.decode();
    }));
  });
  for (const image of await page.locator("img").all())
    expect(
      await image.evaluate((node) => node.complete && node.naturalWidth > 0),
    ).toBeTruthy();
  const manifest = await (await request.get("/media-manifest.json")).json();
  expect(manifest.logo).toBeTruthy();
  expect(errors).toEqual([]);
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(
    /\bFPV\b|autonomous|testimonials|certified|warranty|₹|\$\d|\d+\s*(minutes|km|kilometres|kilometers)/i,
  );
});

test("demo and quote links address YANA with distinct enquiry templates", async ({
  page,
}) => {
  await page.goto("/");
  const demo = await page
    .getByRole("link", { name: "Request a Demo" })
    .getAttribute("href");
  const quote = await page
    .getByRole("link", { name: "Request a Quote" })
    .getAttribute("href");
  expect(decodeURIComponent(demo)).toContain(
    "mailto:hello@naadix.xyz?subject=YANA — Demo request",
  );
  expect(decodeURIComponent(quote)).toContain(
    "mailto:hello@naadix.xyz?subject=YANA — Custom quote request",
  );
  expect(decodeURIComponent(quote)).toContain(
    "Please confirm the final configuration",
  );
  await expect(
    page.getByRole("link", { name: "hello@naadix.xyz", exact: true }),
  ).toHaveAttribute("href", "mailto:hello@naadix.xyz");
});

test("navigation works and page fits narrow screens", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile) {
    const menu = page.getByRole("button", { name: "Menu" });
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("navigation")).toBeHidden();
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "The quadcopter" })
      .click();
    await expect(page).toHaveURL(/#product$/);
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  } else {
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Our approach" })
      .click();
    await expect(page).toHaveURL(/#about$/);
  }
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `No horizontal overflow at ${width}px`,
    ).toBeTruthy();
  }
});

test("gallery filters, photo dialog, keyboard closing and focus restoration", async ({
  page,
}) => {
  await page.goto("/");
  const photos = page.locator('.gallery-item[data-type="image"]');
  const total = await page.locator(".gallery-item").count();
  if (!total) {
    await expect(page.locator(".gallery-empty")).toBeVisible();
    await expect(page.locator(".gallery-toolbar")).toBeHidden();
    return;
  }
  await page.getByRole("button", { name: "Photos", exact: true }).click();
  await expect(
    page.locator('.gallery-item[data-type="video"]:visible'),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Photos", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  if (await photos.count()) {
    const first = photos.first().locator("a");
    await first.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator("#dialog-media img")).toBeVisible();
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(first).toBeFocused();
  }
  await page.getByRole("button", { name: "Videos", exact: true }).click();
  await expect(
    page.locator('.gallery-item[data-type="image"]:visible'),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "All media", exact: true }).click();
  await expect(page.locator(".gallery-item:visible")).toHaveCount(total);
});

test("WCAG A/AA automated accessibility checks", async ({ page, isMobile }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  if (isMobile) {
    await page.getByRole("button", { name: "Menu" }).click();
    const expanded = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(expanded.violations).toEqual([]);
  }
});

test("essential content and email enquiries remain available without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173");
  await expect(page.getByRole("navigation")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Request a Demo" }),
  ).toHaveAttribute("href", /^mailto:hello@naadix.xyz/);
  await expect(
    page.getByRole("link", { name: "Request a Quote" }),
  ).toHaveAttribute("href", /^mailto:hello@naadix.xyz/);
  await expect(page.locator("#product")).toContainText("EducationalQuadcopter");
  await context.close();
});

test("gallery controls work with isolated browser-only fixtures when media is pending", async ({
  page,
  request,
}) => {
  const html = await readFile(
    new URL("../dist/index.html", import.meta.url),
    "utf8",
  );
  const logo = /<img src="([^"]+)"/.exec(html)[1];
  // Test-only markup is served to this browser. No fixture enters assets/ or dist/.
  const fixtures = [1, 2]
    .map(
      (number) =>
        `<figure class="gallery-item" data-type="image"><a class="gallery-open" href="${logo}" aria-label="Enlarge test fixture ${number}"><picture><img src="${logo}" alt="Test fixture ${number}" width="320" height="240"></picture></a><figcaption>Test fixture ${number}</figcaption></figure>`,
    )
    .join("");
  await page.route("http://127.0.0.1:4173/", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: html.replace(
        /<div class="gallery-grid">[\s\S]*?<\/div>\s*<noscript/,
        `<div class="gallery-grid">${fixtures}</div><noscript`,
      ),
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Videos", exact: true }).click();
  await expect(page.locator("#gallery-count")).toHaveText("0 items");
  await expect(page.locator(".gallery-item:visible")).toHaveCount(0);
  await page.getByRole("button", { name: "Photos", exact: true }).click();
  await expect(page.locator("#gallery-count")).toHaveText("2 items");
  const first = page.getByRole("link", {
    name: "Enlarge test fixture 1",
    exact: true,
  });
  await first.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#previous-media")).toBeDisabled();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#dialog-caption")).toHaveText("Test fixture 2");
  await expect(page.locator("#next-media")).toBeDisabled();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#dialog-caption")).toHaveText("Test fixture 1");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(first).toBeFocused();
  await page.getByRole("button", { name: "All media", exact: true }).click();
  await expect(page.locator(".gallery-item:visible")).toHaveCount(2);
  // A media URL is served with the expected MIME type.
  const media = await request.get(`/${logo}`);
  expect(media.status()).toBe(200);
  expect(media.headers()["content-type"]).toBe("image/webp");
});

test("capture the finished layout for visual review", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#gallery').scrollIntoViewIfNeeded();
  await page.evaluate(async () => {
    await Promise.all([...document.images].map(image => {
      image.loading = 'eager';
      return image.decode();
    }));
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.screenshot({
    path: testInfo.outputPath(`${testInfo.project.name}.png`),
    fullPage: true,
  });
});

test("supplied video plays, seeks and supports HTTP byte ranges", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const video = page.locator(".gallery-item video");
  await expect(video).toHaveCount(1);
  await expect(video).toHaveAttribute("preload", "none");
  await expect(video).toHaveAttribute("poster", /\.webp$/);
  await video.evaluate(async (element) => {
    element.muted = true;
    await element.play();
  });
  await expect
    .poll(() => video.evaluate((element) => element.currentTime))
    .toBeGreaterThan(0.2);
  expect(await video.evaluate((element) => element.videoWidth)).toBe(1920);
  expect(await video.evaluate((element) => element.videoHeight)).toBe(1080);
  await video.evaluate((element) => {
    element.pause();
    element.currentTime = 10;
  });
  await expect
    .poll(() =>
      video.evaluate(
        (element) => !element.seeking && element.currentTime >= 10,
      ),
    )
    .toBeTruthy();
  const source = await video.locator("source").getAttribute("src");
  const range = await request.get(`/${source}`, {
    headers: { Range: "bytes=0-1023" },
  });
  expect(range.status()).toBe(206);
  expect(range.headers()["content-type"]).toBe("video/mp4");
  expect((await range.body()).length).toBe(1024);
  expect(range.headers()["content-range"]).toMatch(/^bytes 0-1023\/\d+$/);
  const invalid = await request.get(`/${source}`, {
    headers: { Range: "bytes=999999999-" },
  });
  expect(invalid.status()).toBe(416);
  await page.getByText("Video description", { exact: true }).click();
  await expect(page.locator(".video-description")).toContainText(
    "remains on the workbench",
  );
});

test("GitHub Pages entry point matches the tested production build", async () => {
  const rootHtml = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8",
  );
  const builtHtml = await readFile(
    new URL("../dist/index.html", import.meta.url),
    "utf8",
  );
  expect(rootHtml).toBe(builtHtml);
  expect(rootHtml).not.toContain("<!-- HERO_MEDIA -->");
  expect(rootHtml).not.toContain("PRODUCT PHOTOGRAPHY COMING SOON");
  expect(rootHtml).not.toMatch(/(?:src|href)="\/(?:media|fonts|styles|app)/);
  await expect(
    readFile(new URL("../.nojekyll", import.meta.url), "utf8"),
  ).resolves.toBe("");
});
