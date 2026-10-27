# YANA search and content notes

The implementation follows the user-supplied **YANA: Drone Website SEO Research & Action Plan**, dated 27 October 2026. The attachment is research input, not an instruction to invent evidence, credentials or product specifications.

## What is implemented

- A dedicated educational quadcopter page, shop listing, workshop enquiry page and institutional partnership page.
- 100 distinct educational articles in ten topic hubs. Each contains an opening explanation, focused sections, a practical activity, FAQs and primary references. Guides explain concepts and planning; they do not promise flight results or establish package specifications.
- Shared mobile-friendly typography, descriptive links, related guides, topic navigation and product/workshop links.
- Unique page titles and descriptions, absolute self-canonical URLs, social metadata, and factual WebPage or BlogPosting JSON-LD. YANA is the organisation author; no expert reviewer, qualification, rating, customer, price or offer is invented.
- All article text and links in generated HTML. JavaScript only enhances the library with searching, filtering and progressive display.
- Generated `sitemap.xml`, `robots.txt`, `blog-index.json` and a route manifest. Assets and navigation work under the GitHub Pages `/yana/` project path.

Google's [people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) is the editorial reference. Publication volume alone does not establish usefulness or guarantee indexing. Review articles periodically, correct errors and add original classroom evidence when it exists. Do not turn the library into repeated keyword or location variants.

## After publication

1. Verify ownership of `https://yana-drones.github.io/yana/` in Google Search Console using a supported verification method, then submit `https://yana-drones.github.io/yana/sitemap.xml`.
2. Inspect the homepage, product, workshop and a few article URLs. Review coverage and actual queries before changing the content plan.
3. The repository publishes `robots.txt` at **`/yana/robots.txt`**. Crawlers look for robots rules at the domain root, **`/robots.txt`**; the project-level file does not control the whole `github.io` host. The sitemap remains directly available and can be submitted in Search Console.
4. Confirm the public business identity and any real location or service area before adding local-business information. Avoid fabricated city pages, affiliations, instructor experience or accreditation.
5. Add genuine workshop agendas, photos, instructor profiles and project findings only after review. Use accurate dates and participant consent for any future case studies.
6. Check source documentation for the actual board and firmware revision used. Educational articles about a component or simulation tool are not claims that YANA supplies it.

## Maintaining the publication

The central site URL, email and initial publication date live in `site.config.mjs`. The shared renderer is `scripts/pages.mjs`; article collections are in `content/`. Rebuild and test before committing generated output. Changing the configured domain requires regenerating canonical URLs, sitemap entries and social metadata, then handling redirects from the previous domain.

Keep stable article slugs. The publication date reflects this release; when an article is materially revised, extend the content model with its own accurate modified date rather than automatically refreshing every page date. No analytics tags or third-party tracking were added. Search Console submission and mailbox delivery are separate from site deployment.
