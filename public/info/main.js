"use strict";

// OWNER CONFIG — Set a verified number (0–50), or leave null for no live count.
const SPOTS_LEFT = null;
const VSL_EMBED_URL = ""; // Paste an HTTPS iframe embed URL. No request is made until Play.
const PAYPAL_URL = "https://www.paypal.com/ncp/payment/SPAZMDNRU5EQA";

// Offer availability. Never fabricate or decrement a count locally.
const validCount =
  Number.isInteger(SPOTS_LEFT) && SPOTS_LEFT >= 0 && SPOTS_LEFT <= 50;
const spotsLabel = validCount
  ? `${SPOTS_LEFT} of 50 bonus spots left`
  : "Bonuses for the first 50 members";
document.querySelectorAll("[data-spots]").forEach((node) => {
  node.textContent = spotsLabel;
});
if (validCount && SPOTS_LEFT === 0) {
  document.querySelectorAll("[data-bonus-only]").forEach((node) => {
    node.hidden = true;
  });
  document.querySelectorAll("[data-sold-out]").forEach((node) => {
    node.hidden = false;
  });
  document.querySelector('meta[property="og:description"]').content =
    "$97 one time. Lifetime access to your AI fitness coach. The human-written bonus spots are filled.";
}
document.querySelectorAll("[data-buy]").forEach((link) => {
  link.href = PAYPAL_URL;
  link.removeAttribute("target");
});
document.getElementById("year").textContent = new Date().getFullYear();

// The slim progress bar follows all 24 sections, without a second header row.
const storySections = [...document.querySelectorAll("[data-vsl]")];
const readingProgress = document.getElementById("reading-progress");
let readingFrame = false;
function updateReadingProgress() {
  readingFrame = false;
  const readingLine = document.querySelector(".topbar").offsetHeight + 100;
  let current = 1;
  storySections.forEach((section) => {
    if (section.getBoundingClientRect().top <= readingLine)
      current = Number(section.dataset.vsl);
  });
  readingProgress.value = current;
  readingProgress.textContent = `${current} of 24`;
}
function scheduleReadingProgress() {
  if (readingFrame) return;
  readingFrame = true;
  requestAnimationFrame(updateReadingProgress);
}
window.addEventListener("scroll", scheduleReadingProgress, { passive: true });
window.addEventListener("resize", scheduleReadingProgress);
window.addEventListener("load", updateReadingProgress);
updateReadingProgress();

// Reusable deterministic ransom tiles. The original heading is preserved for AT.
function makeRansom(heading, seed = 0) {
  const title = heading.textContent.trim();
  const accessibleText = document.createElement("span");
  accessibleText.className = "sr-only";
  accessibleText.textContent = title;
  heading.replaceChildren(accessibleText);
  const colors = ["#FFFFFF", "#F5B400", "#D4D4D4", "#16213A", "#2F6BFF"];
  let index = 0;
  title.split(/\s+/).forEach((word) => {
    const group = document.createElement("span");
    group.className = "ransom-word";
    group.setAttribute("aria-hidden", "true");
    Array.from(word).forEach((letter) => {
      const tile = document.createElement("span");
      const noise = Math.sin((index + 1 + seed * 31) * 12.9898) * 43758.5453;
      const fraction = noise - Math.floor(noise);
      const colorIndex = (index + seed) % colors.length;
      tile.className = "ransom-letter";
      tile.textContent = letter;
      tile.style.setProperty(
        "--rotation",
        `${((fraction - 0.5) * 20).toFixed(2)}deg`,
      );
      tile.style.setProperty("--tile-bg", colors[colorIndex]);
      tile.style.setProperty(
        "--tile-color",
        colorIndex >= 3 ? "#FFFFFF" : "#000000",
      );
      tile.style.setProperty(
        "--letter-size",
        `${(0.92 + fraction * 0.12).toFixed(2)}em`,
      );
      tile.style.setProperty(
        "--letter-font",
        index % 3 === 0 ? "Georgia, serif" : "Jost, sans-serif",
      );
      tile.style.setProperty("--letter-style", index % 2 ? "italic" : "normal");
      tile.style.setProperty("--delay", `${index * 0.035}s`);
      group.append(tile);
      index += 1;
    });
    heading.append(group);
  });
}
document.querySelectorAll("h2[data-ransom]").forEach(makeRansom);

// Scribbles use two zigzag passes, rather than a straight strikethrough.
const SVG_NS = "http://www.w3.org/2000/svg";
function svgElement(tag, attributes) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) =>
    element.setAttribute(key, String(value)),
  );
  return element;
}
function addScribble(node) {
  const svg = svgElement("svg", {
    viewBox: "0 0 200 35",
    preserveAspectRatio: "none",
    class: "scribble",
    "aria-hidden": "true",
  });
  svg.append(
    svgElement("path", {
      d: "M3 26 L28 5 L55 29 L82 7 L108 27 L136 4 L164 28 L195 6 L182 29 L152 9 L125 30 L98 6 L69 29 L41 9 L12 28",
      pathLength: 1,
    }),
  );
  node.append(svg);
}
document.querySelectorAll("[data-scribble]").forEach(addScribble);
document.querySelectorAll("[data-x]").forEach((node) => {
  const svg = svgElement("svg", {
    viewBox: "0 0 50 50",
    "aria-hidden": "true",
  });
  svg.append(svgElement("path", { d: "M7 5 Q20 22 43 44", pathLength: 1 }));
  svg.append(svgElement("path", { d: "M43 7 Q28 23 6 43", pathLength: 1 }));
  node.append(svg);
});

// Proper circular arrow: its tip lies on the arc and points along the tangent.
document.querySelectorAll("[data-arc]").forEach((svg) => {
  const point = (degrees, radius = 164) => {
    const radians = ((degrees - 90) * Math.PI) / 180;
    return [200 + radius * Math.cos(radians), 200 + radius * Math.sin(radians)];
  };
  const start = point(35),
    end = point(323);
  const path = `M ${start.join(" ")} A 164 164 0 1 1 ${end.join(" ")}`;
  svg.append(
    svgElement("path", { d: path, class: "loop-arc loop-arc-outline" }),
  );
  svg.append(svgElement("path", { d: path, class: "loop-arc" }));
  // The head occupies the final arc segment, centered on the arc's direction.
  const tip = point(335),
    inner = point(321, 142),
    outer = point(321, 186);
  svg.append(
    svgElement("polygon", {
      points: [tip, inner, outer].map((p) => p.join(",")).join(" "),
      class: "loop-arrowhead",
    }),
  );
});

// One-time scroll entrances. Without observer support, everything stays visible.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealNodes = document.querySelectorAll("[data-rise], .price-reveal");
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );
  revealNodes.forEach((node) => {
    node.classList.add("motion-ready");
    revealObserver.observe(node);
  });
}

// The VSL is deliberately click-to-load. An empty URL shows an honest status note.
const videoPlay = document.getElementById("video-play");
videoPlay.addEventListener("click", () => {
  const status = document.getElementById("video-status");
  if (!VSL_EMBED_URL.trim()) {
    status.textContent =
      "Video coming soon. The story, app walkthrough, and full offer are below.";
    return;
  }
  let embed;
  try {
    embed = new URL(VSL_EMBED_URL);
  } catch {
    status.textContent =
      "The video is unavailable right now. You can read the full story below.";
    return;
  }
  if (embed.protocol !== "https:") {
    status.textContent =
      "The video is unavailable right now. You can read the full story below.";
    return;
  }
  const iframe = document.createElement("iframe");
  iframe.src = embed.href;
  iframe.title = "Mateo’s AesthetixAI story and walkthrough";
  iframe.allow = "autoplay; fullscreen; picture-in-picture";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  document.getElementById("video-shell").replaceChildren(iframe);
  iframe.focus();
  status.textContent = "";
});

// Real app screenshots. The copy describes the demo account, never a promised target.
const APP_PAGES = {
  dashboard: {
    image: "/info/assets/app/dashboard.jpg",
    nav: "/info/assets/app/nav-dashboard.png",
    height: 3160,
    description:
      "Today’s workout, food targets, weight trend, and next check-in. These demo targets are personal to this account.",
    alt: "AesthetixAI dashboard with today’s workout, calorie and macro targets, and weekly check-in",
  },
  workout: {
    image: "/info/assets/app/workout.jpg",
    nav: "/info/assets/app/nav-workout.png",
    height: 8120,
    description:
      "Your split, exercise instructions, form videos, progression rules, and equipment swaps. This demo uses PPL + Upper/Lower across five days.",
    alt: "Real workout screen showing the PPL plus Upper/Lower five-day plan and detailed exercise instructions",
  },
  diet: {
    image: "/info/assets/app/diet.jpg",
    nav: "/info/assets/app/nav-diet.png",
    height: 4356,
    description:
      "Meals, calories and macros, food swaps, water targets, and a grocery list. Built around how you eat.",
    alt: "Real diet screen showing daily macro targets, meal suggestions, swaps, and a grocery list",
  },
  progress: {
    image: "/info/assets/app/progress.jpg",
    nav: "/info/assets/app/nav-progress.png",
    height: 4920,
    description:
      "New photos and weight each week. Compare progress and adjust your training and nutrition.",
    alt: "Real progress screen with weight tracking, photo comparisons, and weekly check-ins",
  },
  coach: {
    image: "/info/assets/app/coach.jpg",
    nav: "/info/assets/app/nav-coach.png",
    height: 1720,
    description:
      "Ask the AI coach about your plan, food swaps, exercises, or a missed session.",
    alt: "Real AI coach chat showing an example conversation and guidance to seek a doctor for injury concerns",
  },
};
const tabs = [...document.querySelectorAll('[role="tab"]')];
const phone = document.getElementById("app-phone");
const screenshot = document.getElementById("app-screenshot");
const phoneNav = document.getElementById("app-nav");
const viewport = document.getElementById("phone-viewport");
const previewToggle = document.getElementById("preview-toggle");
let currentPage = "dashboard";
let manual = reducedMotion.matches;
let paused = reducedMotion.matches;
let phoneVisible = !("IntersectionObserver" in window);

function measurePreview() {
  const height = (APP_PAGES[currentPage].height * viewport.clientWidth) / 860;
  const distance = Math.max(0, height - viewport.clientHeight);
  screenshot.style.setProperty("--scroll-distance", `${distance}px`);
  screenshot.style.setProperty(
    "--scroll-duration",
    `${Math.max(24, distance / 13)}s`,
  );
}
function syncPreview() {
  phone.classList.toggle("is-manual", manual || reducedMotion.matches);
  phone.classList.toggle("is-paused", paused || reducedMotion.matches);
  phone.classList.toggle(
    "is-touring",
    phoneVisible && !manual && !paused && !reducedMotion.matches,
  );
  previewToggle.setAttribute(
    "aria-pressed",
    String(paused || manual || reducedMotion.matches),
  );
  previewToggle.textContent = reducedMotion.matches
    ? "Preview paused · scroll to explore"
    : paused || manual
      ? "Play preview"
      : "Pause preview";
  previewToggle.disabled = reducedMotion.matches;
}
function switchApp(pageName, focus = false) {
  const page = APP_PAGES[pageName];
  if (!page) return;
  currentPage = pageName;
  tabs.forEach((tab) => {
    const selected = tab.dataset.page === pageName;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  document
    .getElementById("app-panel")
    .setAttribute("aria-labelledby", `tab-${pageName}`);
  document.getElementById("app-description").textContent = page.description;
  screenshot.style.animation = "none";
  screenshot.src = page.image;
  screenshot.height = page.height;
  screenshot.alt = page.alt;
  phoneNav.src = page.nav;
  phoneNav.alt = `${pageName === "coach" ? "AI Coach" : pageName} selected in the app navigation`;
  viewport.setAttribute(
    "aria-label",
    `${pageName} screenshot; scroll to explore`,
  );
  viewport.scrollTop = 0;
  measurePreview();
  void screenshot.offsetWidth; // Restart the one-shot CSS tour on a user-selected tab.
  screenshot.style.animation = "";
  syncPreview();
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => switchApp(tab.dataset.page));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    switchApp(tabs[next].dataset.page, true);
  });
});
// Hand over the exact visible offset to native scrolling when the user interacts.
function exploreManually() {
  if (manual) return;
  const transform = getComputedStyle(screenshot).transform;
  const offset =
    transform === "none"
      ? 0
      : Math.max(0, -new DOMMatrixReadOnly(transform).m42);
  manual = true;
  paused = true;
  syncPreview();
  viewport.scrollTop = offset;
}
viewport.addEventListener("pointerdown", exploreManually);
viewport.addEventListener("wheel", exploreManually, { passive: true });
viewport.addEventListener("keydown", (event) => {
  if (
    ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(
      event.key,
    )
  )
    exploreManually();
});
previewToggle.addEventListener("click", () => {
  if (manual) {
    manual = false;
    paused = false;
    viewport.scrollTop = 0;
    screenshot.style.animation = "none";
    void screenshot.offsetWidth;
    screenshot.style.animation = "";
  } else {
    paused = !paused;
  }
  syncPreview();
});
screenshot.addEventListener("load", measurePreview);
screenshot.addEventListener("animationend", () => {
  exploreManually();
});
if ("ResizeObserver" in window)
  new ResizeObserver(measurePreview).observe(viewport);
else window.addEventListener("resize", measurePreview);
if ("IntersectionObserver" in window) {
  new IntersectionObserver(
    (entries) => {
      phoneVisible = entries[0].isIntersecting;
      syncPreview();
    },
    { threshold: 0.15 },
  ).observe(phone);
}
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) {
    manual = true;
    paused = true;
  }
  syncPreview();
});
measurePreview();
syncPreview();
