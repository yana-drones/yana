import {
  mkdir,
  readFile,
  writeFile,
  readdir,
  copyFile,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sharp from "sharp";

export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const assets = path.join(root, "assets");
const output = path.join(root, "dist");
const imageExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".tif",
  ".tiff",
]);
const videoExtensions = new Set([".mp4", ".webm"]);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );

async function walk(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory())
      files.push(...(await walk(path.join(directory, entry.name), relative)));
    else if (entry.isFile()) files.push(relative);
  }
  return files.sort();
}

export async function build() {
  await mkdir(path.join(output, "media"), { recursive: true });
  const files = await walk(assets);
  let config = {};
  if (files.includes("media.json"))
    config = JSON.parse(
      await readFile(path.join(assets, "media.json"), "utf8"),
    );
  function resolveAsset(file) {
    if (typeof file !== "string" || !files.includes(file))
      throw new Error(
        `Asset not found: ${file}. Use a path relative to assets/ and forward slashes.`,
      );
    return path.join(assets, file);
  }
  const cache = new Map();
  const writtenFiles = new Set();
  async function imageAsset(file, logo = false) {
    resolveAsset(file);
    const key = `${file}:${logo}`;
    if (cache.has(key)) return cache.get(key);
    const extension = path.extname(file).toLowerCase();
    const bytes = await readFile(resolveAsset(file));
    const hash = createHash("sha256")
      .update(bytes)
      .update(logo ? "logo-v1" : "photo-v1")
      .digest("hex")
      .slice(0, 16);
    if (extension === ".svg") {
      if (!logo)
        throw new Error(
          `Please use a raster photo for ${file}. SVG is supported for logos.`,
        );
      const name = `media/${hash}.svg`;
      await writeFile(path.join(output, name), bytes);
      writtenFiles.add(name);
      const result = { src: name, srcset: "", width: 160, height: 120 };
      cache.set(key, result);
      return result;
    }
    if (!imageExtensions.has(extension))
      throw new Error(`Unsupported image: ${file}`);
    // Trim only the supplied logo's outer whitespace. Original files are preserved.
    const buffer = await (
      logo
        ? sharp(bytes).trim({ background: "#ffffff", threshold: 12 })
        : sharp(bytes)
    )
      .rotate()
      .toBuffer();
    const metadata = await sharp(buffer).metadata();
    const widths = [
      ...new Set(
        (logo ? [160, 320, 640] : [640, 1280, 1920]).map((width) =>
          Math.min(width, metadata.width),
        ),
      ),
    ];
    const variants = [];
    for (const width of widths) {
      const name = `media/${hash}-${width}.webp`;
      await sharp(buffer)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: logo ? 96 : 90, effort: 5 })
        .toFile(path.join(output, name));
      writtenFiles.add(name);
      variants.push({ src: name, width });
    }
    const result = {
      src: variants.at(-1).src,
      srcset: variants.map((item) => `${item.src} ${item.width}w`).join(", "),
      width: metadata.width,
      height: metadata.height,
    };
    cache.set(key, result);
    return result;
  }
  async function copyAsset(file) {
    const source = resolveAsset(file);
    const bytes = await readFile(source);
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    const name = `media/${hash}${path.extname(file).toLowerCase()}`;
    await copyFile(source, path.join(output, name));
    writtenFiles.add(name);
    return name;
  }
  function picture(
    image,
    alt,
    {
      eager = false,
      sizes = "(max-width: 600px) 100vw, 50vw",
      className = "",
    } = {},
  ) {
    return `<picture${className ? ` class="${escape(className)}"` : ""}><img src="${image.src}"${image.srcset ? ` srcset="${image.srcset}" sizes="${escape(sizes)}"` : ""} width="${image.width}" height="${image.height}" alt="${escape(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
  }
  const logoFile =
    config.logo ||
    files.find(
      (file) =>
        /logo/i.test(file) &&
        (imageExtensions.has(path.extname(file).toLowerCase()) ||
          /\.svg$/i.test(file)),
    );
  const logo = logoFile ? await imageAsset(logoFile, true) : null;
  const logoHtml = logo
    ? `<img src="${logo.src}"${logo.srcset ? ` srcset="${logo.srcset}" sizes="94px"` : ""} width="${logo.width}" height="${logo.height}" alt="YANA">`
    : '<span class="brand-wordmark">YANA</span>';
  const photos = files.filter(
    (file) =>
      imageExtensions.has(path.extname(file).toLowerCase()) &&
      !/logo|poster/i.test(file) &&
      file !== logoFile,
  );
  const videos = files.filter((file) =>
    videoExtensions.has(path.extname(file).toLowerCase()),
  );
  const entries =
    config.items ?? [...photos, ...videos].map((file) => ({ file }));
  if (!Array.isArray(entries))
    throw new Error("assets/media.json: items must be an array.");
  const gallery = [];
  const manifest = {
    logo: logoFile ?? null,
    hero: null,
    product: null,
    items: [],
    needsConfirmation: [],
  };
  let photoNumber = 0,
    videoNumber = 0;
  for (const entry of entries) {
    const file = entry.file;
    resolveAsset(file);
    const isVideo = videoExtensions.has(path.extname(file).toLowerCase());
    if (!isVideo && !imageExtensions.has(path.extname(file).toLowerCase()))
      throw new Error(`Unsupported gallery media: ${file}`);
    const number = isVideo ? ++videoNumber : ++photoNumber;
    const title =
      entry.caption ||
      `YANA quadcopter — ${isVideo ? "video" : "photo"} ${String(number).padStart(2, "0")}`;
    const alt =
      entry.alt ||
      `User-supplied photograph of the YANA educational quadcopter, image ${number}`;
    if (!entry.caption || (!isVideo && !entry.alt))
      manifest.needsConfirmation.push(`Review description for ${file}`);
    let content;
    if (isVideo) {
      const src = await copyAsset(file);
      const poster = entry.poster ? await imageAsset(entry.poster) : null;
      const track = entry.captions
        ? `<track kind="captions" src="${await copyAsset(entry.captions)}" srclang="en" label="English" default>`
        : "";
      if (!entry.captions && entry.audioReviewed !== true)
        manifest.needsConfirmation.push(
          `Review original audio and add captions if it contains speech or meaningful sound: ${file}`,
        );
      content = `<video controls playsinline preload="none" aria-label="${escape(title)}"${poster ? ` poster="${poster.src}"` : ""}><source src="${src}" type="video/${/\.webm$/i.test(file) ? "webm" : "mp4"}">${track}<p>Your browser cannot play this video. <a href="${src}">Download the video</a>.</p></video>`;
    } else {
      const image = await imageAsset(file);
      content = `<a class="gallery-open" href="${image.src}" aria-label="Enlarge ${escape(title)}">${picture(image, alt, { sizes: "(max-width: 600px) 50vw, (max-width: 800px) 50vw, 33vw" })}<span class="open-icon" aria-hidden="true">↗</span></a>`;
    }
    gallery.push(
      `<figure class="gallery-item" data-type="${isVideo ? "video" : "image"}">${content}<figcaption><span>${isVideo ? "VIDEO" : "PHOTO"} ${String(number).padStart(2, "0")}</span>${escape(title)}</figcaption>${entry.transcript ? `<details class="video-description"><summary>Video description</summary><p>${escape(entry.transcript)}</p></details>` : ""}</figure>`,
    );
    manifest.items.push({
      file,
      type: isVideo ? "video" : "image",
      caption: title,
    });
  }
  const pending = `<div class="media-pending">${logo ? `<img src="${logo.src}" width="${logo.width}" height="${logo.height}" alt="" aria-hidden="true">` : ""}<span class="pending-label">PRODUCT PHOTOGRAPHY COMING SOON</span><p>Meet the quadcopter in a demonstration. Get in touch to take a closer look.</p></div>`;
  const heroFile = config.hero || photos[0];
  const productFile = config.product || photos[1] || photos[0];
  async function featured(file, eager = false) {
    if (!file) return pending;
    const entry = entries.find((item) => item.file === file);
    return picture(
      await imageAsset(file),
      entry?.alt || "YANA educational quadcopter",
      { eager },
    );
  }
  const hero = await featured(heroFile, true);
  const product = await featured(productFile);
  manifest.hero = heroFile ?? null;
  manifest.product = productFile ?? null;
  if (!logo) manifest.needsConfirmation.push("Supply the actual YANA logo");
  if (!photos.length)
    manifest.needsConfirmation.push("Supply drone photographs");
  if (!videos.length) manifest.needsConfirmation.push("Supply drone videos");
  const galleryHtml = gallery.length
    ? gallery.join("\n")
    : '<div class="gallery-empty"><p class="eyebrow">THE YANA GALLERY</p><h3>A new perspective is on its way.</h3><p>Drone photos and videos will appear here once available. In the meantime, request a demonstration to learn more.</p></div>';
  const html = (await readFile(path.join(root, "src", "index.html"), "utf8"))
    .replaceAll("<!-- LOGO -->", logoHtml)
    .replace("<!-- HERO_MEDIA -->", hero)
    .replace("<!-- PRODUCT_MEDIA -->", product)
    .replace("<!-- GALLERY -->", galleryHtml);
  await writeFile(path.join(output, "index.html"), html);
  for (const file of ["styles.css", "app.js"])
    await copyFile(path.join(root, file), path.join(output, file));
  await mkdir(path.join(output, "fonts"), { recursive: true });
  for (const file of await readdir(path.join(root, "fonts")))
    await copyFile(
      path.join(root, "fonts", file),
      path.join(output, "fonts", file),
    );
  // Remove stale generated media so replaced source assets are not published accidentally.
  for (const file of await readdir(path.join(output, "media"))) {
    if (!writtenFiles.has(`media/${file}`))
      await unlink(path.join(output, "media", file));
  }
  await writeFile(
    path.join(output, "media-manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  // Existing GitHub Pages hosting serves main:/ directly. Keep that entry point
  // current while retaining dist/ for local preview and other static hosts.
  await mkdir(path.join(root, "media"), { recursive: true });
  for (const file of await readdir(path.join(output, "media")))
    await copyFile(
      path.join(output, "media", file),
      path.join(root, "media", file),
    );
  for (const file of await readdir(path.join(root, "media"))) {
    if (!writtenFiles.has(`media/${file}`))
      await unlink(path.join(root, "media", file));
  }
  await writeFile(path.join(root, "index.html"), html);
  await writeFile(path.join(root, ".nojekyll"), "");
  console.log(
    `Built YANA: ${logo ? "supplied logo" : "text wordmark"}, ${photoNumber} photos, ${videoNumber} videos. ${writtenFiles.size} media files.`,
  );
  if (manifest.needsConfirmation.length)
    console.log(`Still to review: ${manifest.needsConfirmation.join("; ")}.`);
  return manifest;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  build().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
