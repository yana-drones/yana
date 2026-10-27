# YANA website

A responsive, accessible single-page website for YANA’s initial educational quadcopter. Built with HTML, CSS and small JavaScript modules. No framework, application server, database or API keys are required in production.

## Run locally

Install [Node.js](https://nodejs.org/) version 22 or newer, then run these commands from this directory:

```sh
npm install
npm run dev
```

Open **http://localhost:4173**. The development server rebuilds after changes to HTML, CSS, JavaScript or `assets/`. Refresh the browser to see changes. Stop with Ctrl+C. Set the optional `PORT` environment variable to use another port.

If the computer’s shared npm cache reports an `ENOENT` error, use `npm install --cache .npm-cache`. This keeps a separate, ignored cache inside the project.

For a production build and local preview:

```sh
npm run build
npm run preview
```

The live repository is **[yana-drones/yana](https://github.com/yana-drones/yana)**. Its existing GitHub Pages configuration publishes the root of `main` at **https://yana-drones.github.io/yana/**. The build regenerates the root `index.html`, `media/` and `.nojekyll` for that configuration, as well as `dist/` for local preview or other static hosts. Asset paths are relative, so deployment under `/yana/` works.

After editing source or media, run `npm test`, commit the source **and** the regenerated root `index.html` and `media/`, then push to `main`. GitHub Pages publishes the committed output automatically. Edit **`src/index.html`**, not the generated root HTML. No change to Pages settings or build workflow is required. For a different static host, publish only `dist/`.

## Replace the assets

The supplied `assets/yana-logo.png` is the original logo, copied from the provided `Yama logo.png`. The build trims outer white space and creates responsive WebP variants; it does not modify the original. Colours are derived from the supplied artwork.

The website uses background-removed versions of the two supplied drone photographs and the supplied workbench video. `quadcopter-overview.jpg` is the provided `IMG_20260711_121303482_HDR.jpg`; `drone.jpg` keeps its supplied name. The transparent PNG derivatives are `quadcopter-overview-cutout.png` and `drone-detail-cutout.png`; original photographs are preserved. The cutouts were edited with the built-in imagegen tool specifically to remove the backgrounds and supporting hand. [Edit notes and prompts](assets/IMAGE-EDITS.md) document their provenance. No stock images are used.

`quadcopter-demo.mp4` is a high-quality, full-resolution 1080p H.264 web export of `VID_20260711_223208904.mp4`, with original audio and web-friendly fast-start metadata. The original video remains on the Desktop. The video preview now uses the overview cutout to match the other website images; `quadcopter-poster.jpg` preserves the original extracted video frame. The footage itself has not been background-edited.

The footage shows stationary hardware on a workbench, not a flight demonstration. A factual visual description is included. Original audio has been preserved; spoken-audio transcription/caption accuracy still needs manual review, since audio could not be auditioned in this environment.

1. Add actual drone photographs and videos to `assets/`. Subdirectories work.
2. Keep `logo` in the logo filename, or select it explicitly in `assets/media.json`.
3. Run `npm run build` (or keep the development server running).

Without a manifest, all supported photos and videos are included automatically. The first photograph becomes the hero and the second becomes the product image. A single photograph can serve both. Filenames containing `logo` or `poster` are excluded from automatic photo selection. Supported image formats are JPEG, PNG, WebP, AVIF and TIFF. SVG is supported for the logo. Videos can be MP4 or WebM.

For reliable ordering, accurate alternative text and video descriptions, create `assets/media.json`:

```json
{
  "logo": "yana-logo.png",
  "hero": "drone-front.jpg",
  "product": "drone-top.jpg",
  "items": [
    {
      "file": "drone-front.jpg",
      "alt": "An accurate description of the photograph",
      "caption": "A short, factual caption"
    },
    {
      "file": "drone-top.jpg",
      "alt": "An accurate description of the second photograph",
      "caption": "A short, factual caption"
    },
    {
      "file": "demonstration.mp4",
      "poster": "demonstration-poster.jpg",
      "caption": "A short, factual video title",
      "captions": "demonstration.en.vtt",
      "transcript": "Describe what is shown and include a transcript of any speech."
    }
  ]
}
```

All paths are relative to `assets/` and use forward slashes. `items` defines the gallery’s order and selection when supplied. A missing or misspelled asset fails the build with an explanatory error. Omit `captions` for a silent video; provide an accurate visual description. Videos with meaningful speech/audio need an accurate WebVTT captions track. Set the appropriate track language in `scripts/build.mjs` if not English.

Photos are auto-oriented and exported at up to 640, 1280 and 1920 pixels wide with high-quality WebP compression (quality 90), without upscaling. The browser picks the appropriate size. The hero loads eagerly; gallery images load lazily. Inspect the supplied photos after adding them to check visual quality and framing. Video files are preserved without lossy re-encoding and do not autoplay or preload on page load. Use browser-compatible codecs and reasonable exports for web delivery; the build does not transcode video.

`dist/media-manifest.json` lists the selected sources and outstanding media descriptions. Stale generated media is removed from `dist/media/` after a successful build. Original files in `assets/` are preserved.

## Edit content and branding

- `src/index.html`: all six content sections, product copy and fallback email links.
- `index.html` and `media/`: generated, tracked GitHub Pages output; rebuild rather than editing these directly.
- `styles.css`: palette variables, typography, responsive layouts and reduced-motion support.
- `app.js`: mobile menu, prefilled email enquiries, gallery filters and keyboard-accessible image dialog.
- `scripts/build.mjs`: media selection, optimisation and static output.
- `scripts/server.mjs`: local static server with byte-range support for video seeking.
- `fonts/`: locally hosted DM Sans and Manrope fonts, with their licenses. The optional `scripts/fetch-fonts.mjs` refreshes them; normal builds and page visits do not contact a font provider.

The initial email is **hello@naadix.xyz**. To replace it, update it in **both `src/index.html` and `app.js`** so that no-JavaScript links and enhanced prefilled emails stay consistent. Demo, quote and general enquiry links open the visitor’s configured email app. There is no form backend, automatic email delivery, enquiry storage or success message claiming a message was sent. A working email client is needed; the visible address can also be copied.

The navigation, content, photos and email links work without JavaScript. JavaScript adds the collapsed mobile menu, gallery filtering and image enlargement. Native video controls remain available. The photo dialog supports Escape, left/right arrow keys, a focus trap through the native dialog element and focus restoration when closed.

## Test

```sh
npx playwright install chromium
npm test
```

Tests build the site and start/stop a temporary preview server. Stop any manually started server on port 4173 before testing. Desktop and mobile checks cover requested sections, honest configuration language, loaded images, distinct email enquiry links, navigation, horizontal overflow at 320/390/768/1440 pixels, no-JavaScript essentials and axe WCAG A/AA checks. Gallery interaction checks run against available real media; test-only browser fixtures additionally exercise photo filtering, enlargement and focus handling without adding fake assets to the site.

Automated accessibility tests do not replace manual review of final media descriptions, caption accuracy, keyboard usability and device testing. Delivery to the mailbox and external email-client behaviour cannot be verified by browser tests.

## Details still requiring confirmation

- Confirm any spoken-audio transcript/caption track for the supplied workbench video; a visual description is already included.
- Final configuration: **F450 frame and Pixhawk 2.4.8 are proposed**, not guaranteed package specifications.
- Motors, propellers, ESCs, battery, charger, radio equipment and accessories.
- Verified performance specifications, including flight time, range and payload. No numerical claims are published.
- Package contents, documentation and any training or support.
- Price, lead time, delivery terms, warranty terms, certification information and demonstration arrangements. No claims about these are published.
- Confirm that `hello@naadix.xyz` is monitored and intended for public enquiries.

Only one educational quadcopter is listed. FPV and autonomous drones are not advertised as available products. There are no invented testimonials, prices, performance figures or certification claims.
