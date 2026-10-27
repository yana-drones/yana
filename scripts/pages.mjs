import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { site } from "../site.config.mjs";

const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const canonical = (route) => new URL(route, site.url).href;
const json = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");
const dateLabel = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
}).format(new Date(site.published));

export async function loadArticles(root) {
  const articles = [];
  for (const [file, key] of [
    ["technical-articles.mjs", "technicalArticles"],
    ["planning-articles.mjs", "planningArticles"],
  ]) {
    const target = path.join(root, "content", file);
    const module = await import(
      pathToFileURL(target).href + "?build=" + Date.now()
    );
    articles.push(...module[key]);
  }
  const slugs = new Set();
  for (const article of articles) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug))
      throw new Error(`Invalid article slug: ${article.slug}`);
    if (slugs.has(article.slug))
      throw new Error(`Duplicate article slug: ${article.slug}`);
    if (
      !article.title ||
      !article.description ||
      !article.answer ||
      article.sections.length < 5 ||
      !article.sources?.length ||
      !article.activity?.steps?.length ||
      article.faqs?.length < 2 ||
      articleWordCount(article) < 400
    )
      throw new Error(`Incomplete article: ${article.slug}`);
    for (const source of article.sources) {
      if (!source.title || new URL(source.url).protocol !== "https:")
        throw new Error(`Invalid reference in article: ${article.slug}`);
    }
    slugs.add(article.slug);
  }
  return articles;
}

export function seoHead({
  title,
  description,
  route = "",
  type = "WebPage",
  article,
  image,
}) {
  const url = canonical(route);
  const schema = article
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: article.title,
        description: article.description,
        mainEntityOfPage: url,
        datePublished: site.published,
        dateModified: site.published,
        author: { "@type": "Organization", name: site.name, url: site.url },
        publisher: { "@type": "Organization", name: site.name, url: site.url },
        articleSection: article.category,
        inLanguage: "en",
      }
    : {
        "@context": "https://schema.org",
        "@type": type,
        name: title,
        description,
        url,
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
      };
  return `<link rel="canonical" href="${url}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${url}"><meta property="og:type" content="${article ? "article" : "website"}"><meta property="og:site_name" content="YANA"><meta property="og:image" content="${image || canonical("apple-touch-icon.png")}"><meta name="twitter:card" content="summary"><script type="application/ld+json">${json(schema)}</script>`;
}

export function postCard(article, prefix = "", level = "h2") {
  return `<article class="blog-card" data-blog-card data-category="${escape(article.category)}" data-search="${escape((article.title + " " + article.description + " " + article.category).toLowerCase())}"><p class="post-category">${escape(article.category)}</p><${level}><a href="${prefix}blog/${article.slug}/">${escape(article.title)}</a></${level}><p>${escape(article.description)}</p><a href="${prefix}blog/${article.slug}/" aria-label="Read ${escape(article.title)}">Read the guide <span aria-hidden="true">↗</span></a></article>`;
}

export function homeFeaturedPosts(articles) {
  const selected = [
    "Workshop planning",
    "Drone fundamentals",
    "Buying an educational drone",
  ]
    .map((category) =>
      articles.find((article) => article.category === category),
    )
    .filter(Boolean);
  return `<div class="blog-grid">${selected.map((article) => postCard(article, "", "h3")).join("")}</div>`;
}

export async function buildPages({
  root,
  output,
  articles,
  logoHtml,
  heroHtml,
}) {
  const written = new Set();
  let oldManifest = [];
  try {
    oldManifest =
      JSON.parse(
        await readFile(path.join(root, "generated-pages.json"), "utf8"),
      ).files || [];
  } catch {}
  const categories = [
    ...new Set(articles.map((article) => article.category)),
  ].sort();
  const allSlugs = new Set(articles.map((article) => article.slug));
  const published = [];
  const prefixFor = (route) =>
    "../".repeat(route.split("/").filter(Boolean).length);
  const enquiry = (kind, label) =>
    `<a class="button button-primary" data-enquiry="${kind}" href="mailto:${site.email}?subject=${encodeURIComponent(kind === "workshop" ? "YANA Drone Workshop Enquiry" : "YANA " + kind + " enquiry")}">${label} <span aria-hidden="true">↗</span></a>`;
  const reference = (url, title) => `<a href="${url}">${title}</a>`;
  async function emit(file, content) {
    const relative = file.replaceAll("\\", "/");
    if (relative.startsWith("/") || relative.split("/").includes(".."))
      throw new Error("Unexpected output path");
    for (const directory of [output, root]) {
      const destination = path.join(directory, relative);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, content);
    }
    written.add(relative);
  }
  function header(prefix) {
    return `<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="container header-inner"><a class="brand" href="${prefix}" aria-label="YANA home">${logoHtml.replaceAll("media/", prefix + "media/")}</a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="navigation" hidden><span class="menu-icon" aria-hidden="true"></span><span>Menu</span></button><nav id="navigation" aria-label="Main navigation"><a href="${prefix}#about">Our approach</a><a href="${prefix}#product">The quadcopter</a><a href="${prefix}shop/">Shop</a><a href="${prefix}#gallery">Gallery</a><a href="${prefix}drone-workshops/">Workshops</a><a href="${prefix}blog/">Blog</a><a class="nav-contact" href="${prefix}#contact">Let’s talk <span aria-hidden="true">↗</span></a></nav></div></header>`;
  }
  function footer(prefix) {
    return `<div class="standalone-contact"><div class="page-container"><h2>Let’s talk about your next project.</h2><p>Ask about an educational quadcopter, a hands-on workshop or a partnership with your institution.</p>${enquiry("general", "Email YANA")} <a class="contact-email" href="mailto:${site.email}">${site.email}</a></div><footer class="site-footer"><div class="container footer-inner"><a class="brand" href="${prefix}" aria-label="YANA home">${logoHtml.replaceAll("media/", prefix + "media/")}</a><p>Educational drones.<br>Hands-on learning.</p><nav aria-label="Footer navigation"><a href="${prefix}shop/">Shop</a><a href="${prefix}drone-workshops/">Workshops</a><a href="${prefix}partnerships/">Partnerships</a><a href="${prefix}blog/">Blog</a></nav><a href="#main">Back to top ↑</a></div><div class="container footer-bottom"><span>© <span id="year">2026</span> YANA. All rights reserved.</span><a href="mailto:${site.email}">${site.email}</a></div></footer></div>`;
  }
  function shell({ route, title, description, body, article }) {
    const prefix = prefixFor(route);
    return `<!doctype html><html lang="en" data-email="${escape(site.email)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#faf8f5"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="icon" href="${prefix}favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="${prefix}favicon-32.png"><link rel="apple-touch-icon" sizes="180x180" href="${prefix}apple-touch-icon.png"><link rel="stylesheet" href="${prefix}styles.css"><link rel="stylesheet" href="${prefix}readability.css"><script type="module" src="${prefix}app.js"></script>${seoHead({ title, description, route, article })}</head><body>${header(prefix)}<main id="main">${body}</main>${footer(prefix)}</body></html>`;
  }
  function top(route, title, description, extra = "") {
    const prefix = prefixFor(route);
    return `<div class="page-container page-top"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${prefix}">Home</a><span aria-hidden="true">/</span><span>${escape(title)}</span></nav><h1>${title}</h1><p class="page-intro">${description}</p>${extra}</div>`;
  }
  async function page(route, title, description, body, article) {
    await emit(
      route + "index.html",
      shell({ route, title, description, body, article }),
    );
    published.push({
      route,
      url: canonical(route),
      title,
      description,
      kind: article ? "article" : "page",
      ...(article
        ? {
            slug: article.slug,
            category: article.category,
            wordCount: articleWordCount(article),
          }
        : {}),
    });
  }
  function photo(
    prefix,
    caption = "Prototype shown. Final configuration and package are subject to confirmation.",
  ) {
    return `<figure class="page-photo">${heroHtml.replaceAll("media/", prefix + "media/")}<figcaption>${caption}</figcaption></figure>`;
  }
  function faqs(rows) {
    return `<div class="faq-list">${rows.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>`;
  }
  function table(headers, rows) {
    return `<p class="table-hint">Scroll the table to see all columns.</p><div class="table-scroll" role="region" aria-label="Comparison table" tabindex="0"><table class="comparison-table"><thead><tr>${headers.map((item) => `<th scope="col">${escape(item)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell, index) => (index === 0 ? `<th scope="row">${escape(cell)}</th>` : `<td>${escape(cell)}</td>`)).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  await page(
    "shop/",
    "Educational Drone Shop | YANA",
    "Explore YANA’s educational quadcopter prototype. Review the proposed configuration and request a custom quote for your learning project.",
    top(
      "shop/",
      "Educational drone shop",
      "One educational quadcopter. Start with the learning goals, then agree the configuration and package.",
    ) +
      `<section class="page-container shop-card two-columns">${photo("../")}<div><h2>Educational Quadcopter</h2><p>A platform for exploring airframes, electronics and flight-control concepts in colleges, robotics clubs and makerspaces.</p><p><strong>Proposed frame:</strong> F450<br><strong>Proposed flight controller:</strong> Pixhawk 2.4.8</p><p>Price, availability and package contents are confirmed in your written quote.</p><div class="page-actions"><a class="button button-dark" href="../educational-drone/">View technical details ↗</a>${enquiry("quote", "Request a Quote")}</div><a class="text-link" href="../drone-workshops/">Discuss a workshop for your institution ↗</a></div></section>`,
  );

  const specifications = [
    ["Airframe", "F450", "Proposed configuration"],
    [
      "Flight controller",
      "Pixhawk 2.4.8",
      "Proposed; exact board revision and firmware compatibility to be verified",
    ],
    [
      "Motor model and KV rating",
      "Subject to confirmation",
      "Confirmed in the itemised quote",
    ],
    [
      "ESC model, rating and protocol",
      "Subject to confirmation",
      "Matched to the agreed motors and power system",
    ],
    [
      "Propeller diameter, pitch and material",
      "Subject to confirmation",
      "Matched to the final configuration",
    ],
    [
      "Battery voltage, capacity and connector",
      "Subject to confirmation",
      "Battery inclusion is not assumed",
    ],
    [
      "Charger and charging accessories",
      "Subject to confirmation",
      "Inclusions and requirements stated in the quote",
    ],
    [
      "Radio transmitter and receiver",
      "Subject to confirmation",
      "Model, inclusion and compatibility agreed before purchase",
    ],
    [
      "GPS, compass and telemetry equipment",
      "Subject to confirmation",
      "Equipment visible in prototype photos is not a package guarantee",
    ],
    [
      "Dimensions and all-up weight",
      "Subject to confirmation",
      "Measured for the final assembly",
    ],
    [
      "Flight time, range and payload",
      "Not published",
      "Requires verified testing of the final configuration",
    ],
    [
      "Assembly state and included accessories",
      "Subject to confirmation",
      "An itemised list is supplied with the quote",
    ],
    [
      "Documentation, training and support",
      "Subject to confirmation",
      "Scope agreed with your institution",
    ],
    [
      "Price, delivery and service terms",
      "Custom quote",
      "No fixed price or delivery commitment is published",
    ],
  ];
  await page(
    "educational-drone/",
    "Educational Quadcopter: Configuration & Details | YANA",
    "Review YANA’s proposed F450 and Pixhawk 2.4.8 educational quadcopter, technical details, package questions and custom quote process.",
    top(
      "educational-drone/",
      "An educational quadcopter for hands-on learning",
      "Explore how the airframe, electronics and flight controller work together. The configuration below is proposed and is confirmed before purchase.",
    ) +
      `<section class="page-container two-columns page-section">${photo("../")}<div><h2>Start with your learning goals.</h2><p>YANA’s initial product is one educational quadcopter for colleges, robotics clubs, makerspaces and students. A custom quote defines the actual hardware and what accompanies it.</p><p>The current proposal uses an F450 frame and Pixhawk 2.4.8 controller. A product name or photograph alone does not establish component ratings, software support or included equipment.</p><div class="page-actions">${enquiry("quote", "Request a Quote")}<a class="text-link" href="../#gallery">See the real prototype ↗</a></div></div></section><section id="specifications" class="page-container page-section"><h2>Proposed configuration and technical details</h2>${table(["Item", "Current information", "What will be confirmed"], specifications)}<div class="page-callout"><p>Prototype photographs show an educational assembly, including exposed electronics. The video shows the hardware on a workbench. Neither is evidence of flight performance or a final package list.</p></div></section><section class="page-container page-section"><h2>What can students explore?</h2><div class="two-columns"><div><h3>Connect components with concepts</h3><p>Identify the structural frame, trace the difference between power and signal paths, and discuss the role of a flight controller. Build a vocabulary for asking better engineering questions.</p></div><div><h3>Plan the learning activity</h3><p>Discuss supervised practical work, simulation and suitable development exercises. Learning support, workshop equipment and instructor time are separate items to agree in your proposal.</p></div></div></section><section class="page-container page-section"><h2>Questions to settle before ordering</h2>${faqs(
        [
          [
            "Is this a ready-to-fly package?",
            "The assembly state and any equipment needed to operate the quadcopter are subject to confirmation. Ask for a complete inclusion and exclusion list.",
          ],
          [
            "Which firmware will the controller run?",
            "The exact Pixhawk board, memory limits, firmware version and supported features must be checked on the actual hardware. A generic Pixhawk specification is not a guarantee for a particular board.",
          ],
          [
            "Can you provide flight time or range?",
            "No flight time, operating range, payload or other performance number is currently published. These require verified testing of the agreed configuration.",
          ],
          [
            "Can we combine the drone with a workshop?",
            "Yes, you can request a combined proposal. The facilitator, equipment, activities, training support and any demonstration must be agreed in writing.",
          ],
        ],
      )}</section><section class="page-container page-section"><h2>Tell us what you need.</h2><p>Include your institution, location, intended use, quantity, preferred timeline and any documentation or training requirements. We’ll use these to discuss a suitable configuration.</p>${enquiry("quote", "Request a Quote")} <a class="text-link" href="../blog/">Read the buying and learning guides ↗</a></section>`,
  );

  const workshopIntro = "Explore how drones are built and how their components work together. YANA welcomes students, teachers and institutions to discuss a hands-on learning workshop shaped around their group.";
  await page(
    "drone-workshops/",
    "Hands-on Drone Workshops for Students and Teachers | YANA",
    "Discuss hands-on drone workshops for students, teachers, schools, colleges, academies and robotics clubs. Explore proposed topics and enquire with YANA.",
    top("drone-workshops/", "Hands-on drone workshops for students and teachers", workshopIntro) +
    `<section class="page-container page-section two-columns"><div><h2>Bring drone learning into your classroom.</h2><p>Students can explore the parts of a quadcopter and the relationships between its structure, electronics and control system. Teachers and institutions can discuss how these topics connect with their learning goals and participants’ experience.</p><p>We’ll agree the outline, practical activities, equipment and supervision with your institution before confirming arrangements.</p>${enquiry("workshop", "Request a Workshop")}</div>${photo("../")}</section><section class="page-container page-section"><h2>Proposed workshop outline</h2><p>These potential topics are subject to discussion. The final outline will reflect your participants’ age group, prior experience, learning goals and available resources.</p><ul><li><strong>Drone components:</strong> identify the frame, motors, propellers, power system and flight controller, and discuss their roles.</li><li><strong>Quadcopter basics:</strong> explore how the parts work together and introduce the ideas behind balance and control.</li><li><strong>Assembly:</strong> discuss how the structure and components fit together, with any practical work agreed for the group.</li><li><strong>Electronics:</strong> explore power and signal connections using suitable examples and supervised activities.</li><li><strong>Flight safety:</strong> discuss responsible handling, supervision and the considerations involved in planning any drone activity.</li></ul><p class="page-callout">The outline is a starting point for discussion. Any demonstrations or flight activities require separate agreement and are not confirmed by an enquiry.</p></section><section class="page-container page-section"><h2>Partner with YANA</h2><p>Schools, colleges, academies and robotics clubs are welcome to partner with YANA to plan a workshop for their students and teachers. Tell us what your group would like to explore and what learning resources you already have.</p><p>Professional-led training can be discussed as part of the proposal. The facilitator’s relevant experience, availability and responsibilities will be shared for your review before arrangements are confirmed.</p><a class="text-link" href="../partnerships/">Explore an institutional partnership &#8599;</a></section><section class="page-container page-section"><h2>Tell us about your group</h2><p>Include these details in your enquiry so we can discuss a suitable workshop outline:</p><ul><li>Institution name</li><li>City</li><li>Participant age group</li><li>Expected number of participants</li><li>Preferred date</li></ul>${enquiry("workshop", "Request a Workshop")} <a class="text-link" href="../blog/category/workshop-planning/">Read the workshop planning guides &#8599;</a></section>`,
  );

  await page(
    "partnerships/",
    "Drone Workshop Partnerships for Institutions | YANA",
    "Partner with YANA to plan hands-on drone-making, development workshops and professional-led training for your institution or learning community.",
    top(
      "partnerships/",
      "Partner with YANA",
      "Bring drone-making, development workshops and professional-led learning to your institution. Start with a clear brief and an agreed plan.",
    ) +
      `<section class="page-container page-section two-columns"><div><h2>For institutions and learning communities</h2><p>We welcome enquiries from colleges, robotics clubs, makerspaces and organisations planning supervised student learning. A partnership can be a single event or a programme proposal shaped around your goals.</p><p>Tell us whether your priority is introducing components, working through assembly, exploring development tools or helping mentors support student projects.</p>${enquiry("partnership", "Start a Partnership Enquiry")}</div><div class="page-callout"><h2>Professional-led training</h2><p>Discuss the expertise your programme needs. The proposed facilitator’s identity, relevant experience and availability will be provided for your review before a booking is confirmed.</p></div></section><section class="page-container page-section"><h2>Agree the responsibilities early</h2>${table(
        ["Area", "Questions to settle"],
        [
          [
            "Learning",
            "Who will attend and what should participants understand afterwards?",
          ],
          [
            "Facilitation",
            "Who leads the session, what is their relevant experience, and who supervises each activity?",
          ],
          [
            "Equipment",
            "Which drones, components, tools and computers are provided, and by whom?",
          ],
          [
            "Venue",
            "Who handles venue access, power, suitable workspace and any required permissions?",
          ],
          [
            "Documentation",
            "What agenda, participant materials and follow-up support are included?",
          ],
          [
            "Commercial terms",
            "What are the price, schedule, responsibilities and agreed deliverables?",
          ],
        ],
      )}</section><section class="page-container page-section"><h2>Send a partnership brief</h2><p>Include your organisation, contact person, location, intended audience, proposed dates, expected group size and programme goals. We’ll discuss a practical scope before preparing a proposal.</p>${enquiry("partnership", "Email Your Partnership Brief")} <a class="text-link" href="../drone-workshops/">Review the workshop enquiry page ↗</a></section>`,
  );

  const controls = `<div class="blog-controls"><label>Find a guide<input id="blog-search" type="search" placeholder="Try: frame, workshop, controller…" autocomplete="off"></label><label>Topic<select id="blog-category"><option value="all">All topics</option>${categories.map((category) => `<option>${escape(category)}</option>`).join("")}</select></label></div>`;
  await page(
    "blog/",
    "Drone Learning Guides, Workshop Planning & Buying Advice | YANA",
    "Explore practical guides to drone components, educational quadcopters, workshop planning and student projects in the YANA learning library.",
    top(
      "blog/",
      "The YANA learning library",
      "Clear explanations, practical checklists and planning guides for students, educators, organisers and first-time buyers.",
    ) +
      `<section class="page-container blog-results"><nav class="topic-links" aria-label="Browse topics">${categories.map(category=>`<a href="category/${slugify(category)}/">${escape(category)}</a>`).join("")}</nav>${controls}<p class="blog-count" id="blog-count" role="status" aria-live="polite">${articles.length} guides</p><div class="blog-grid" id="blog-list">${articles.map((article) => postCard(article, "../")).join("")}</div><p id="blog-empty" hidden>No guides match that search. Try a different topic or clear the search.</p><button id="blog-more" class="button button-dark load-more" type="button" hidden>Show more guides</button><noscript><p>All guides are listed above. Browser page search can help you find a topic.</p></noscript></section>`,
  );

  for (const category of categories) {
    const route = `blog/category/${slugify(category)}/`;
    await page(
      route,
      `${category} Guides | YANA`,
      `Practical ${category.toLowerCase()} guides for educational drone learners and organisers. Explore clear explanations, activities and checklists.`,
      top(
        route,
        escape(category),
        `Read the ${category.toLowerCase()} guides in YANA’s learning library.`,
      ) +
        `<section class="page-container blog-results"><div class="blog-grid">${articles
          .filter((article) => article.category === category)
          .map((article) => postCard(article, "../../../"))
          .join("")}</div></section>`,
    );
  }
  for (const article of articles) {
    const route = `blog/${article.slug}/`;
    const prefix = "../../";
    const sections = article.sections.map((section, index) => ({
      ...section,
      id: `section-${index + 1}`,
    }));
    const related = [
      ...new Set([
        ...(article.related || []),
        ...articles
          .filter(
            (item) =>
              item.category === article.category && item.slug !== article.slug,
          )
          .map((item) => item.slug),
      ]),
    ]
      .filter((slug) => slug !== article.slug && allSlugs.has(slug))
      .slice(0, 3)
      .map((slug) => articles.find((item) => item.slug === slug));
    const readingTime = Math.max(2, Math.ceil(articleWordCount(article) / 200));
    const rows = sections
      .map(
        (section) =>
          `<section id="${section.id}"><h2>${escape(section.heading)}</h2>${section.paragraphs.map((p) => `<p>${escape(p)}</p>`).join("")}${section.list ? `<ul>${section.list.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>` : ""}${section.table ? table(section.table.headers, section.table.rows) : ""}</section>`,
      )
      .join("");
    const sources = article.sources
      .map(
        (source) => `<li>${reference(source.url, escape(source.title))}</li>`,
      )
      .join("");
    const body = `<header class="page-container page-top"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${prefix}">Home</a><span aria-hidden="true">/</span><a href="../">Learning library</a><span aria-hidden="true">/</span><a href="../category/${slugify(article.category)}/">${escape(article.category)}</a></nav><h1>${escape(article.title)}</h1><div class="article-meta"><span>By YANA</span><time datetime="${site.published}">Published ${dateLabel}</time><span>${readingTime} min read</span></div></header><div class="page-container article-layout"><aside class="article-toc" aria-label="In this guide"><h2>In this guide</h2><ol>${sections.map((section) => `<li><a href="#${section.id}">${escape(section.heading)}</a></li>`).join("")}<li><a href="#practical-activity">Practical activity</a></li><li><a href="#questions">Questions</a></li><li><a href="#references">References</a></li></ol></aside><article class="article-body"><p>${escape(article.answer)}</p>${rows}<section id="practical-activity" class="activity"><h2>${escape(article.activity.title)}</h2><ol>${article.activity.steps.map((step) => `<li>${escape(step)}</li>`).join("")}</ol></section><section id="questions"><h2>Questions</h2>${article.faqs.map((faq) => `<h3>${escape(faq.q)}</h3><p>${escape(faq.a)}</p>`).join("")}</section><section id="references" class="sources"><h2>References and further reading</h2><ul>${sources}</ul><p>Read the documentation for the exact hardware and software version you use. Examples in this guide explain concepts; they do not establish a YANA package specification.</p></section><section class="page-callout"><h2>Put the ideas into context.</h2><p>Explore YANA’s <a href="${prefix}educational-drone/">proposed educational quadcopter</a>, discuss a <a href="${prefix}drone-workshops/">hands-on drone workshop</a>, or <a href="${prefix}partnerships/">plan an institutional partnership</a>.</p></section><p class="editorial-note">Questions or corrections? Email <a href="mailto:${site.email}">${site.email}</a>.</p></article></div><section class="related-posts"><div class="page-container"><h2>Continue learning</h2><div class="blog-grid">${related.map((item) => postCard(item, prefix)).join("")}</div></div></section>`;
    await page(
      route,
      `${article.title} | YANA`,
      article.description,
      body,
      article,
    );
  }
  const urls = [{ route: "", url: site.url }, ...published];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((item) => `<url><loc>${escape(item.url)}</loc><lastmod>${site.published}</lastmod></url>`).join("")}</urlset>`;
  await emit("sitemap.xml", sitemap);
  await emit(
    "robots.txt",
    `User-agent: *\nAllow: /\n\nSitemap: ${canonical("sitemap.xml")}\n`,
  );
  await emit(
    "blog-index.json",
    JSON.stringify(
      articles.map(({ slug, title, description, category }) => ({
        slug,
        title,
        description,
        category,
      })),
      null,
      2,
    ),
  );
  const manifest = {
    site: site.url,
    published: site.published,
    articleCount: articles.length,
    pages: published,
    files: [...written, "generated-pages.json"],
  };
  await emit("generated-pages.json", JSON.stringify(manifest, null, 2));
  for (const file of oldManifest) {
    if (
      written.has(file) ||
      file === "generated-pages.json" ||
      file.startsWith("/") ||
      file.split("/").includes("..")
    )
      continue;
    for (const directory of [root, output]) {
      const resolved = path.resolve(directory, file);
      if (!resolved.startsWith(path.resolve(directory) + path.sep))
        throw new Error("Refusing to remove an output outside the project");
      try {
        await unlink(resolved);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  }
  return manifest;
}

export function articleWordCount(article) {
  const content = [
    article.answer,
    ...article.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.list || []),
      ...(section.table?.rows.flat() || []),
    ]),
    article.activity.title,
    ...article.activity.steps,
    ...article.faqs.flatMap((faq) => [faq.q, faq.a]),
  ].join(" ");
  return content.trim().split(/\s+/).length;
}
