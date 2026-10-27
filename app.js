const menu = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
const mobile = window.matchMedia("(max-width: 1100px)");
menu.hidden = false;
function syncMenu() {
  navigation.hidden = mobile.matches;
  menu.setAttribute("aria-expanded", String(!navigation.hidden));
}
syncMenu();
mobile.addEventListener("change", syncMenu);
menu.addEventListener("click", () => {
  navigation.hidden = !navigation.hidden;
  menu.setAttribute("aria-expanded", String(!navigation.hidden));
});
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a") && mobile.matches) {
    navigation.hidden = true;
    menu.setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobile.matches && !navigation.hidden) {
    navigation.hidden = true;
    menu.setAttribute("aria-expanded", "false");
    menu.focus();
  }
});
document.querySelector("#year").textContent = new Date().getFullYear();

const email = document.documentElement.dataset.email || "hello@naadix.xyz";
const enquiries = {
  workshop: {
    subject: "YANA Drone Workshop Enquiry",
    body: "Hello YANA,\n\nWe would like to enquire about a hands-on drone workshop.\n\nInstitution name:\nCity:\nParticipant age group:\nExpected number of participants:\nPreferred date:\nLearning goals or questions:\n\nPlease share a proposed workshop outline and confirm the activities, facilitator, equipment and arrangements with us.\n\nThank you.",
  },
  partnership: {
    subject: "YANA — Workshop partnership enquiry",
    body: "Hello YANA,\n\nWe would like to discuss a partnership for hands-on drone-making, development and professional-led training.\n\nContact name:\nOrganisation:\nLocation:\nProposed audience and group size:\nPreferred dates:\nProgramme goals:\nEquipment and venue available:\nSupport needed:\n\nPlease share the proposed scope, facilitator experience, responsibilities and pricing.\n\nThank you.",
  },
  demo: {
    subject: "YANA — Demo request",
    body: "Hello YANA,\n\nI would like to request a demonstration of the educational quadcopter.\n\nName:\nCollege / organisation (if applicable):\nLocation:\nLearning goals:\nPreferred dates:\n\nThank you.",
  },
  quote: {
    subject: "YANA — Custom quote request",
    body: "Hello YANA,\n\nI would like a custom quote for the educational quadcopter.\n\nName:\nCollege / organisation (if applicable):\nLocation:\nQuantity:\nIntended use / learning goals:\nPackage or support requirements:\nPreferred timeline:\n\nPlease confirm the final configuration and package contents.\n\nThank you.",
  },
  general: {
    subject: "Hello YANA",
    body: "Hello YANA,\n\nI would like to learn more about your educational quadcopter.\n\nName:\nMy question:\n\nThank you.",
  },
};
document.querySelectorAll("[data-enquiry]").forEach((link) => {
  const { subject, body } = enquiries[link.dataset.enquiry];
  link.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

function setupGallery() {
  if (!document.querySelector("#media-dialog")) return;
  const items = [...document.querySelectorAll(".gallery-item")];
  const filters = [...document.querySelectorAll("[data-filter]")];
  const count = document.querySelector("#gallery-count");
  const toolbar = document.querySelector(".gallery-toolbar");
  const dialog = document.querySelector("#media-dialog");
  const mediaContainer = document.querySelector("#dialog-media");
  const caption = document.querySelector("#dialog-caption");
  const previous = document.querySelector("#previous-media");
  const next = document.querySelector("#next-media");
  let activeItem = null;
  let returnFocus = null;
  function visibleItems() {
    return items.filter((item) => !item.hidden);
  }
  function updateCount() {
    const total = visibleItems().length;
    count.textContent = `${total} ${total === 1 ? "item" : "items"}`;
  }
  if (items.length) {
    toolbar.hidden = false;
    updateCount();
  }
  filters.forEach((button) =>
    button.addEventListener("click", () => {
      filters.forEach((filter) =>
        filter.setAttribute("aria-pressed", String(filter === button)),
      );
      items.forEach((item) => {
        item.hidden =
          button.dataset.filter !== "all" &&
          item.dataset.type !== button.dataset.filter;
      });
      updateCount();
    }),
  );
  function showItem(item) {
    activeItem = item;
    mediaContainer.querySelector("video")?.pause();
    mediaContainer.replaceChildren();
    const source = item.querySelector("picture, video");
    if (!source) return;
    const media = source.cloneNode(true);
    media.querySelector("img")?.removeAttribute("loading");
    if (media.tagName === "VIDEO") {
      media.controls = true;
      media.preload = "metadata";
    }
    mediaContainer.append(media);
    caption.textContent = item.querySelector("figcaption").textContent;
    const visible = visibleItems();
    previous.disabled = visible.indexOf(item) <= 0;
    next.disabled = visible.indexOf(item) >= visible.length - 1;
  }
  items.forEach((item) => {
    const link = item.querySelector("a.gallery-open");
    if (!link) return;
    link.addEventListener("click", (event) => {
      if (typeof dialog.showModal !== "function") return;
      event.preventDefault();
      returnFocus = link;
      showItem(item);
      dialog.showModal();
    });
  });
  function move(direction) {
    const visible = visibleItems();
    const target = visible[visible.indexOf(activeItem) + direction];
    if (target) showItem(target);
  }
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  document
    .querySelector(".dialog-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.target.closest("video")) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  });
  dialog.addEventListener("close", () => {
    mediaContainer.querySelector("video")?.pause();
    mediaContainer.replaceChildren();
    returnFocus?.focus();
  });
}
setupGallery();

const blogList = document.querySelector("#blog-list");
if (blogList) {
  const posts = [...blogList.querySelectorAll("[data-blog-card]")];
  const search = document.querySelector("#blog-search");
  const category = document.querySelector("#blog-category");
  const count = document.querySelector("#blog-count");
  const more = document.querySelector("#blog-more");
  const empty = document.querySelector("#blog-empty");
  let limit = 12;
  function renderPosts() {
    const query = search.value.trim().toLocaleLowerCase();
    const matching = posts.filter(
      (post) =>
        (category.value === "all" ||
          post.dataset.category === category.value) &&
        post.dataset.search.includes(query),
    );
    posts.forEach((post) => {
      post.hidden = true;
    });
    matching.slice(0, limit).forEach((post) => {
      post.hidden = false;
    });
    count.textContent = `${matching.length} ${matching.length === 1 ? "guide" : "guides"}${query || category.value !== "all" ? " found" : " in the library"} · showing ${Math.min(limit, matching.length)}`;
    more.hidden = matching.length <= limit;
    empty.hidden = matching.length !== 0;
  }
  search.addEventListener("input", () => {
    limit = 12;
    renderPosts();
  });
  category.addEventListener("change", () => {
    limit = 12;
    renderPosts();
  });
  more.addEventListener("click", () => {
    limit += 12;
    renderPosts();
  });
  renderPosts();
}
