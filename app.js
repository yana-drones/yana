const menu = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
const mobile = window.matchMedia("(max-width: 600px)");
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

const email = "hello@naadix.xyz";
const enquiries = {
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
