# YANA website

A responsive static website for YANA’s educational quadcopter, workshop enquiries and learning library. Built with HTML, CSS and small JavaScript modules. No framework, application server, database or API keys are required in production.

## Run locally

Install [Node.js](https://nodejs.org/) version 22 or newer, then run these commands from this directory:

```sh
npm install
npm run dev
```

Open **http://localhost:4173**. The development server rebuilds after changes to homepage HTML, CSS, browser JavaScript or `assets/`. Refresh the browser to see changes. Restart it after changing `content/`, `site.config.mjs` or the page generator. Stop with Ctrl+C. Set the optional `PORT` environment variable to use another port.

If the computer’s shared npm cache reports an `ENOENT` error, use `npm install --cache .npm-cache`. This keeps a separate, ignored cache inside the project.

For a production build and local preview:

```sh
npm run build
npm run preview
```

The live repository is **[yana-drones/yana](https://github.com/yana-drones/yana)**. Its existing GitHub Pages configuration publishes the root of `main` at **https://yana-drones.github.io/yana/**. The build regenerates the root `index.html`, `media/` and `.nojekyll` for that configuration, as well as `dist/` for local preview or other static hosts. Asset paths are relative, so deployment under `/yana/` works.

After editing source or media, run `npm test`, commit the source **and all regenerated output**, then push to `main`. Output includes root `index.html`, `media/`, icons, `shop/`, `educational-drone/`, `drone-workshops/`, `partnerships/`, `blog/`, `blog-index.json`, `sitemap.xml`, `robots.txt` and `generated-pages.json`. GitHub Pages publishes committed output automatically. Edit **`src/index.html`** and the generator, rather than generated HTML. For a different static host, publish only `dist/`.

## Pages and learning library

- `/`: product introduction, continuously moving audience strip, a hands-on workshop section immediately after the product, prototype gallery and combined peach contact/footer area.
- `/shop/`: the single educational quadcopter listing and quote request.
- `/educational-drone/`: proposed F450 / Pixhawk 2.4.8 configuration, a specification status table and purchasing questions.
- `/drone-workshops/` and `/partnerships/`: workshop planning and institutional partnership enquiries. An enquiry is not a confirmed booking.
- `/blog/`: 100 distinct learning guides, with search, topic filtering and progressive display. All article links and bodies are present in the initial HTML, including without JavaScript.
- `/blog/category/<topic>/`: ten topic hubs, with ten articles each.

The learning library covers drone fundamentals, frames and mechanics, flight controllers, power and propulsion, simulation and data, workshop planning, college projects, teaching and learning, buying an educational drone, and clubs and makerspaces. Articles use a shared readable layout, contents links, practical activities, FAQs, references and related guides.

The homepage workshop buttons link to `/drone-workshops/` and an email enquiry with the exact subject **YANA Drone Workshop Enquiry**, including without JavaScript. The workshop page presents components, quadcopter basics, assembly, electronics and flight safety as proposed topics subject to discussion. The prefilled email asks for institution name, city, participant age group, expected number and preferred date; it does not reserve a workshop or confirm flight activities.

Edit the structured content in `content/technical-*.mjs` or `content/planning-*.mjs`. The two entry modules export the article collections. Each article needs a stable unique `slug`, `title`, `description`, `category`, `answer`, `sections`, `activity`, `faqs`, `sources` and optional `related` slugs. Keep titles, descriptions and substantive advice distinct. Verify technical claims against primary documentation. Never treat generic component documentation as a confirmed YANA package specification. Run `npm run build` after editing; changes to URLs also need redirects if a page has already been indexed.

`scripts/pages.mjs` owns shared headers, footers, page layouts, metadata, article rendering, category hubs and sitemap generation. `generated-pages.json` records published routes, article word counts and generated files, so obsolete generated files can be removed without touching source content. [SEO notes](docs/SEO.md) explain indexing and the research boundaries.

## Replace the assets

The supplied `assets/yana-logo.png` is the original logo, copied from the provided `Yama logo.png`. The build trims outer white space and creates responsive WebP variants; it does not modify the original. Colours are derived from the supplied artwork.

The same supplied logo generates `favicon.ico` (16/32/48 pixel variants), `favicon-32.png` and `apple-touch-icon.png`. Rebuilding after replacing the logo updates all icons in both the repository root and `dist/`. `hero.css` contains the landing hero layout and its responsive breakpoints, separately from the remaining site styles.

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

- `src/index.html`: homepage sections, product copy and fallback email links.
- `index.html` and `media/`: generated, tracked GitHub Pages output; rebuild rather than editing these directly.
- `styles.css`: palette variables, typography, responsive layouts and reduced-motion support.
- `readability.css`: shared larger text, page layouts, moving strip, product tables, learning library and merged contact/footer styling.
- `app.js`: mobile menu, prefilled email enquiries, gallery dialog and blog search/filter controls.
- `site.config.mjs`: public site URL, email address and publication date used by generated metadata.
- `scripts/build.mjs`: media selection, optimisation and static output.
- `scripts/server.mjs`: local static server with byte-range support for video seeking.
- `fonts/`: locally hosted DM Sans and Manrope fonts, with their licenses. The optional `scripts/fetch-fonts.mjs` refreshes them; normal builds and page visits do not contact a font provider.

The initial email is **hello@naadix.xyz**. Change `email` in **`site.config.mjs`** and rebuild: the generator updates homepage fallback links, all new pages and the address used by browser enquiry templates. Demo, quote, workshop, partnership and general enquiry links open the visitor’s configured email app. There is no form backend, automatic email delivery or enquiry storage. A working email client is needed; the visible address can also be copied.

The navigation, content, photos and email links work without JavaScript. JavaScript adds the collapsed mobile menu, gallery filtering and image enlargement. Native video controls remain available. The photo dialog supports Escape, left/right arrow keys, a focus trap through the native dialog element and focus restoration when closed.

## Test

```sh
npx playwright install chromium
npm test
```

Tests build the site and start/stop a temporary preview server. Stop any manually started server on port 4173 before testing. Desktop and mobile checks cover navigation, readable type, responsive layouts, no-JavaScript content, workshop/quote email templates, library search/filtering, article layouts and axe WCAG A/AA checks. The content audit checks every generated route, internal link, metadata uniqueness, canonical URL and sitemap entry, and verifies 100 unique articles across ten topics. Gallery checks cover real photos, keyboard/focus handling, video playback/seeking and byte-range responses.

Automated accessibility tests do not replace manual review of final media descriptions, caption accuracy, keyboard usability and device testing. Delivery to the mailbox and external email-client behaviour cannot be verified by browser tests.

## Details still requiring confirmation

- Confirm any spoken-audio transcript/caption track for the supplied workbench video; a visual description is already included.
- Final configuration: **F450 frame and Pixhawk 2.4.8 are proposed**, not guaranteed package specifications.
- Motors, propellers, ESCs, battery, charger, radio equipment and accessories.
- Verified performance specifications, including flight time, range and payload. No numerical claims are published.
- Package contents, documentation and any training or support.
- Workshop scope, facilitator identity and relevant experience, dates, duration, group size, equipment responsibilities, location/service area, pricing and deliverables. These are enquiry options, not published guarantees.
- Price, lead time, delivery terms, warranty terms, certification information and demonstration arrangements. No claims about these are published.
- Confirm that `hello@naadix.xyz` is monitored and intended for public enquiries.
- Confirm public business identity, contact/location details and any genuine instructor profiles before adding them. No invented affiliations, customer stories or credentials are used.
- Verify the GitHub Pages URL in Search Console and submit the sitemap. Search indexing, traffic and rankings cannot be promised by adding articles.

Only one educational quadcopter is listed. FPV and autonomous drones are not advertised as available products. There are no invented testimonials, prices, performance figures or certification claims.
