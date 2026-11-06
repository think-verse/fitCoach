"use strict";

/* =====================================================================
   OWNER CONFIG — the only block you should need to edit.
   Every urgency element on this page reads from these values, so keep
   them true: update SPOTS_LEFT as real buyers come in, and set
   OFFER_ENDS_AT to the moment the price actually goes up.
   ===================================================================== */
const CONFIG = {
  PAYPAL_URL: "https://www.paypal.com/ncp/payment/SPAZMDNRU5EQA",

  // Real number of custom-plan (bonus) spots still open, out of SPOTS_TOTAL.
  // Set to 0 when they're gone: the page switches to "app only" automatically.
  // Set to null to hide every spots counter.
  SPOTS_TOTAL: 50,
  SPOTS_LEFT: 15,

  // 12-hour discount countdown shown on every page load.
  OFFER_HOURS: 12,

  // Contact form → your inbox (FormSubmit). The first message triggers a one-time
  // activation email to aesthetixai.fit@gmail.com; click the link in it once.
  CONTACT_ENDPOINT: "https://formsubmit.co/ajax/aesthetixai.fit@gmail.com",

  // Optional: HTTPS embed URL for the VSL (YouTube/Vimeo/Wistia). Loads on click.
  VSL_EMBED_URL: "https://www.youtube.com/embed/-C5VOCfZyKQ?autoplay=1&rel=0",

  POPUP_DELAY_MS: 60000, // the "heads-up" popup, shown once per visitor
};

/* ---------- tiny helpers ---------- */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
};
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const pad = (n) => String(n).padStart(2, "0");

/* ---------- demo mode (/info?preview=1) ----------
   The countdown, "people viewing" badge and buyer pop-ups use sample data,
   so they only run on the demo link, never for regular visitors. */
const DEMO = new URLSearchParams(location.search).has("preview");
if (DEMO) {
  $("#preview-banner").hidden = false;
  document.body.classList.add("is-preview");
}

/* ---------- checkout links ---------- */
$$("[data-buy]").forEach((link) => {
  link.href = CONFIG.PAYPAL_URL;
  link.removeAttribute("target");
  link.addEventListener("click", () => store.set("ax_checkout_clicked", "1"));
});
$("#year").textContent = new Date().getFullYear();

/* ---------- spots (driven only by CONFIG, never decremented locally) ---------- */
const total = CONFIG.SPOTS_TOTAL;
const spotsKnown = Number.isInteger(CONFIG.SPOTS_LEFT) && CONFIG.SPOTS_LEFT >= 0 && CONFIG.SPOTS_LEFT <= total;
const spotsLeft = spotsKnown ? CONFIG.SPOTS_LEFT : null;
const soldOut = spotsLeft === 0;

$$("[data-spots-left]").forEach((n) => (n.textContent = spotsLeft ?? ""));
$$("[data-spots-claimed]").forEach((n) => (n.textContent = spotsKnown ? total - spotsLeft : ""));
$$("[data-spots-text]").forEach((n) => {
  n.textContent = spotsKnown ? `Only ${spotsLeft} of ${total} custom-plan spots left` : `Custom plans for the first ${total} members`;
});
if (spotsKnown && !soldOut) {
  $$("[data-spots-box], [data-spots-inline], [data-spots-meter]").forEach((n) => (n.hidden = false));
}
if (soldOut) {
  $$("[data-bonus-only]").forEach((n) => (n.hidden = true));
  $$("[data-sold-out]").forEach((n) => (n.hidden = false));
}

/* ---------- countdown: always shows OFFER_HOURS from page load ---------- */
const deadline = Date.now() + CONFIG.OFFER_HOURS * 3600000;
const hasTimer = DEMO && CONFIG.OFFER_HOURS > 0;

function tick() {
  const ms = Math.max(1000, deadline - Date.now()); // never hits zero
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  $$("[data-countdown]").forEach((c) => {
    c.querySelector("[data-h]").textContent = pad(h);
    c.querySelector("[data-m]").textContent = pad(m);
    c.querySelector("[data-s]").textContent = pad(s);
  });
  $$("[data-countdown-inline]").forEach((n) => (n.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`));
}
if (!hasTimer) {
  $("[data-timer-wrap] .urgency-label").hidden = true;
  $("[data-timer-wrap] [data-countdown]").hidden = true;
  $$(".checkout-urgency, [data-timer-text], .mc-timer").forEach((n) => (n.hidden = true));
  if (!spotsKnown || soldOut) $("[data-timer-wrap]").hidden = true;
  else $("[data-timer-wrap] .urgency-spots").style.setProperty("display", "inline", "important");
} else {
  tick();
  setInterval(tick, 1000);
}

/* ---------- reading progress ---------- */
const progress = $("#reading-progress");
let progressQueued = false;
function updateProgress() {
  progressQueued = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${max > 0 ? Math.min(100, (scrollY / max) * 100) : 0}%`;
}
addEventListener("scroll", () => { if (!progressQueued) { progressQueued = true; requestAnimationFrame(updateProgress); } }, { passive: true });
addEventListener("resize", updateProgress);
updateProgress();

/* ---------- ransom chapter headings ---------- */
function makeRansom(heading, seed = 0) {
  const title = heading.textContent.trim();
  const accessible = document.createElement("span");
  accessible.className = "sr-only";
  accessible.textContent = title;
  heading.replaceChildren(accessible);
  const colors = ["#FFFFFF", "#F5B400", "#D4D4D4", "#16213A", "#2F6BFF"];
  let index = 0;
  title.split(/\s+/).forEach((word) => {
    const group = document.createElement("span");
    group.className = "ransom-word";
    group.setAttribute("aria-hidden", "true");
    Array.from(word).forEach((letter) => {
      const tile = document.createElement("span");
      const noise = Math.sin((index + 1 + seed * 31) * 12.9898) * 43758.5453;
      const f = noise - Math.floor(noise);
      const ci = (index + seed) % colors.length;
      tile.className = "ransom-letter";
      tile.textContent = letter;
      tile.style.setProperty("--rotation", `${((f - 0.5) * 20).toFixed(2)}deg`);
      tile.style.setProperty("--tile-bg", colors[ci]);
      tile.style.setProperty("--tile-color", ci >= 3 ? "#FFFFFF" : "#000000");
      tile.style.setProperty("--letter-size", `${(0.92 + f * 0.12).toFixed(2)}em`);
      tile.style.setProperty("--letter-font", index % 3 === 0 ? "Georgia, serif" : "Jost, sans-serif");
      tile.style.setProperty("--letter-style", index % 2 ? "italic" : "normal");
      group.append(tile);
      index += 1;
    });
    heading.append(group);
  });
}
$$("h2[data-ransom]").forEach((h, i) => makeRansom(h, i));

/* ---------- scribble strikethroughs + loop arrow ---------- */
const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  return el;
}
$$("[data-scribble]").forEach((node) => {
  const svg = svgEl("svg", { viewBox: "0 0 200 35", preserveAspectRatio: "none", class: "scribble", "aria-hidden": "true" });
  svg.append(svgEl("path", { d: "M3 26 L28 5 L55 29 L82 7 L108 27 L136 4 L164 28 L195 6 L182 29 L152 9 L125 30 L98 6 L69 29 L41 9 L12 28", pathLength: 1 }));
  node.append(svg);
});
$$(".strike-lines, .ladder").forEach((n) => n.classList.add("draw-on"));
$$(".strike-lines [data-scribble]").forEach((n, i) => n.style.setProperty("--draw-delay", `${0.3 + i * 0.45}s`));

$$("[data-arc]").forEach((svg) => {
  const pt = (deg, r = 164) => { const rad = ((deg - 90) * Math.PI) / 180; return [200 + r * Math.cos(rad), 200 + r * Math.sin(rad)]; };
  const path = `M ${pt(35).join(" ")} A 164 164 0 1 1 ${pt(323).join(" ")}`;
  svg.append(svgEl("path", { d: path, class: "loop-arc loop-arc-outline" }));
  svg.append(svgEl("path", { d: path, class: "loop-arc" }));
  svg.append(svgEl("polygon", { points: [pt(335), pt(321, 142), pt(321, 186)].map((p) => p.join(",")).join(" "), class: "loop-arrowhead" }));
});

/* ---------- scroll reveals ---------- */
function onVisible(node) {
  node.classList.add("is-visible");
  if (node.matches("[data-receipt]")) countUpTotal(node);
  if (node.matches("[data-spots-meter]")) {
    const fill = node.querySelector("[data-meter-fill]");
    if (fill && spotsKnown) fill.style.width = `${((total - spotsLeft) / total) * 100}%`;
  }
}
const revealTargets = $$("[data-reveal], [data-rise], .price-reveal, .loop-diagram, .draw-on, [data-spots-meter]");
$$("[data-rise]").forEach((n) => n.classList.add("motion-ready"));
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { onVisible(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  revealTargets.forEach((n) => io.observe(n));
} else {
  revealTargets.forEach(onVisible);
}
function countUpTotal(receipt) {
  const el = receipt.querySelector("[data-total]");
  const end = soldOut ? 997 : Number(el.dataset.final);
  if (reducedMotion.matches) { el.textContent = `$${end.toLocaleString("en-US")}`; return; }
  const start = performance.now(), delay = 1500, dur = 1100;
  const step = (t) => {
    const p = Math.min(1, Math.max(0, (t - start - delay) / dur));
    el.textContent = `$${Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString("en-US")}`;
    if (p < 1) requestAnimationFrame(step);
  };
  el.textContent = "$0";
  requestAnimationFrame(step);
}

/* ---------- VSL: click the poster → YouTube plays inline, in the same box ---------- */
// The <a href> to YouTube stays as the no-JS fallback.
const videoShell = $("#video-shell");
if (videoShell && CONFIG.VSL_EMBED_URL) {
  videoShell.addEventListener("click", (e) => {
    if (videoShell.classList.contains("is-playing")) return;
    e.preventDefault();
    const frame = document.createElement("iframe");
    frame.src = `${CONFIG.VSL_EMBED_URL}${CONFIG.VSL_EMBED_URL.includes("?") ? "&" : "?"}playsinline=1`;
    frame.title = "Mateo’s transformation story";
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    videoShell.removeAttribute("href");
    videoShell.removeAttribute("target");
    videoShell.classList.add("is-playing");
    videoShell.replaceChildren(frame);
  });
}

/* ---------- app demo (real screenshots) ---------- */
const APP_PAGES = {
  dashboard: { image: "/info/assets/app/dashboard.jpg", nav: "/info/assets/app/nav-dashboard.png", height: 3160, label: "Dashboard",
    description: "Today’s workout, food targets, weight trend and next check-in. You always know exactly what you’re doing today.",
    alt: "AesthetixAI dashboard with today’s workout, calorie and macro targets, and weekly check-in" },
  workout: { image: "/info/assets/app/workout.jpg", nav: "/info/assets/app/nav-workout.png", height: 8120, label: "Workout",
    description: "A plan that tells you why: built around chest thickness, shoulder width and arm size. Sets, reps, rest, tempo, form cues, videos, and “add 2.5 kg when you hit 7 reps on all sets.”",
    alt: "Workout screen showing a five-day PPL plus Upper/Lower plan and detailed exercise instructions" },
  diet: { image: "/info/assets/app/diet.jpg", nav: "/info/assets/app/nav-diet.png", height: 4356, label: "Diet",
    description: "Exact calories and macros, six real meals a day, one-tap swaps (don’t like salmon? swap it), a water target and a weekly grocery list.",
    alt: "Diet screen showing daily macro targets, meal suggestions, swaps and a grocery list" },
  progress: { image: "/info/assets/app/progress.jpg", nav: "/info/assets/app/nav-progress.png", height: 4920, label: "Check-in",
    description: "The 7-Day Loop, automated. New photo and weight each week; it compares you with earlier weeks and rewrites your plan.",
    alt: "Progress screen with weight tracking, photo comparisons and weekly check-ins" },
  coach: { image: "/info/assets/app/coach.jpg", nav: "/info/assets/app/nav-coach.png", height: 1720, label: "AI Coach",
    description: "Text it like a coach: a sore shoulder, a missed session, 500 extra calories. Answers in seconds, including when to see a doctor.",
    alt: "AI coach chat showing an example conversation and guidance to see a doctor for injury concerns" },
};
const tabs = $$('[role="tab"]');
const phone = $("#app-phone");
const shot = $("#app-screenshot");
const phoneNav = $("#app-nav");
const viewport = $("#phone-viewport");
const previewToggle = $("#preview-toggle");
let currentPage = "dashboard";
let manual = reducedMotion.matches;
let paused = reducedMotion.matches;
let phoneVisible = !("IntersectionObserver" in window);

function measurePreview() {
  const h = (APP_PAGES[currentPage].height * viewport.clientWidth) / 860;
  const d = Math.max(0, h - viewport.clientHeight);
  shot.style.setProperty("--scroll-distance", `${d}px`);
  shot.style.setProperty("--scroll-duration", `${Math.max(24, d / 13)}s`);
}
function syncPreview() {
  phone.classList.toggle("is-manual", manual || reducedMotion.matches);
  phone.classList.toggle("is-paused", paused || reducedMotion.matches);
  phone.classList.toggle("is-touring", phoneVisible && !manual && !paused && !reducedMotion.matches);
  previewToggle.setAttribute("aria-pressed", String(paused || manual || reducedMotion.matches));
  previewToggle.textContent = reducedMotion.matches ? "Scroll the phone to explore" : paused || manual ? "Play preview" : "Pause preview";
  previewToggle.disabled = reducedMotion.matches;
}
function switchApp(name, focus = false) {
  const page = APP_PAGES[name];
  if (!page) return;
  currentPage = name;
  tabs.forEach((t) => {
    const sel = t.dataset.page === name;
    t.setAttribute("aria-selected", String(sel));
    t.tabIndex = sel ? 0 : -1;
    if (sel && focus) t.focus();
  });
  $("#app-panel").setAttribute("aria-labelledby", `tab-${name}`);
  $("#app-description").textContent = page.description;
  shot.style.animation = "none";
  shot.src = page.image;
  shot.height = page.height;
  shot.alt = page.alt;
  phoneNav.src = page.nav;
  phoneNav.alt = `${page.label} selected in the app navigation`;
  viewport.setAttribute("aria-label", `${page.label} screenshot; scroll to explore`);
  viewport.scrollTop = 0;
  manual = reducedMotion.matches;
  paused = reducedMotion.matches;
  measurePreview();
  void shot.offsetWidth;
  shot.style.animation = "";
  syncPreview();
}
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => switchApp(tab.dataset.page));
  tab.addEventListener("keydown", (e) => {
    const map = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    switchApp(tabs[map[e.key]].dataset.page, true);
  });
});
function exploreManually() {
  if (manual) return;
  const tf = getComputedStyle(shot).transform;
  const offset = tf === "none" ? 0 : Math.max(0, -new DOMMatrixReadOnly(tf).m42);
  manual = true;
  paused = true;
  syncPreview();
  viewport.scrollTop = offset;
}
viewport.addEventListener("pointerdown", exploreManually);
viewport.addEventListener("wheel", exploreManually, { passive: true });
viewport.addEventListener("keydown", (e) => {
  if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) exploreManually();
});
previewToggle.addEventListener("click", () => {
  if (manual) {
    manual = false; paused = false; viewport.scrollTop = 0;
    shot.style.animation = "none"; void shot.offsetWidth; shot.style.animation = "";
  } else paused = !paused;
  syncPreview();
});
shot.addEventListener("load", measurePreview);
shot.addEventListener("animationend", exploreManually);
if ("ResizeObserver" in window) new ResizeObserver(measurePreview).observe(viewport);
if ("IntersectionObserver" in window) {
  new IntersectionObserver((e) => { phoneVisible = e[0].isIntersecting; syncPreview(); }, { threshold: 0.15 }).observe(phone);
}
measurePreview();
syncPreview();

/* ---------- mobile sticky CTA ---------- */
const mobileCta = $("#mobile-cta");
const blockers = new Set();
function syncMobileCta() {
  const show = scrollY > innerHeight * 0.9 && blockers.size === 0 && !document.body.classList.contains("modal-open");
  mobileCta.classList.toggle("is-shown", show);
  mobileCta.setAttribute("aria-hidden", String(!show));
  mobileCta.querySelector("a").tabIndex = show ? 0 : -1;
}
if ("IntersectionObserver" in window) {
  const ctaIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? blockers.add(e.target) : blockers.delete(e.target)));
    syncMobileCta();
  }, { threshold: 0.05 });
  $$(".checkout-card, .final-cta, #contact, .hero .buy-button").forEach((n) => ctaIo.observe(n));
}
addEventListener("scroll", syncMobileCta, { passive: true });

/* ---------- modals: 60-second heads-up + exit intent, each shown once ---------- */
let openModal = null;
let lastFocus = null;
function canShowPopup() {
  return !openModal && store.get("ax_checkout_clicked") !== "1";
}
function showModal(id) {
  const m = document.getElementById(id);
  if (!m || openModal) return false;
  lastFocus = document.activeElement;
  m.hidden = false;
  openModal = m;
  document.body.classList.add("modal-open");
  hideToast();
  syncMobileCta();
  setTimeout(() => m.querySelector(".modal-close").focus(), 50);
  return true;
}
function closeModal() {
  if (!openModal) return;
  openModal.hidden = true;
  openModal = null;
  document.body.classList.remove("modal-open");
  syncMobileCta();
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}
$$(".modal").forEach((m) => {
  m.addEventListener("click", (e) => {
    const closer = e.target.closest("[data-close]");
    if (!closer) return;
    const goto = closer.dataset.goto;
    closeModal();
    if (goto) $(goto)?.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
  });
  m.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if (e.key !== "Tab") return;
    const f = $$("a[href], button:not([disabled])", m).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
});

// Timed popup: about the custom-plan spots, so it only appears while spots are open.
function tryTimedPopup() {
  if (store.get("ax_popup_timed") || !spotsKnown || soldOut) return;
  if (!canShowPopup()) { setTimeout(tryTimedPopup, 15000); return; }
  if (showModal("popup-timed")) store.set("ax_popup_timed", "1");
}
setTimeout(tryTimedPopup, CONFIG.POPUP_DELAY_MS);

// Exit popup ("Don't give it another year"): fires on exit intent OR after 60 seconds, whichever comes first.
const pageStart = Date.now();
let exitShown = false;
function tryExitPopup() {
  if (exitShown || store.get("ax_popup_exit") || !canShowPopup()) return;
  if (showModal("popup-exit")) { exitShown = true; store.set("ax_popup_exit", "1"); }
}
// Trigger 1: cursor leaves for the tab bar (desktop)
document.addEventListener("mouseout", (e) => {
  if (!e.relatedTarget && e.clientY <= 8) tryExitPopup();
});
// Trigger 2: after 60 seconds on page (fallback for users who don't exit-intent)
setTimeout(() => { if (!exitShown) tryExitPopup(); }, 60000);
let lastY = scrollY, lastT = performance.now(), maxRead = 0, lastTouch = 0;
addEventListener("touchmove", () => (lastTouch = performance.now()), { passive: true });
addEventListener("touchend", () => (lastTouch = performance.now()), { passive: true });
addEventListener("scroll", () => {
  const now = performance.now();
  const dy = scrollY - lastY, dt = now - lastT;
  maxRead = Math.max(maxRead, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
  const userFlick = now - lastTouch < 1200; // ignore jumps caused by focus or anchor links
  if (userFlick && maxRead > 0.3 && dt > 0 && dy < 0 && -dy / dt > 2.5 && scrollY > 400) tryExitPopup();
  lastY = scrollY; lastT = now;
}, { passive: true });

/* ---------- live viewer count: fluctuates between 200–300 ---------- */
function showViewers(n) {
  $$("[data-viewers]").forEach((el) => (el.hidden = false));
  $$("[data-viewers-count]").forEach((el) => (el.textContent = n));
}
if (DEMO) {
  let currentViewers = 200 + Math.floor(Math.random() * 101);
  showViewers(currentViewers);
  setInterval(() => {
    currentViewers += Math.floor(Math.random() * 11) - 5; // drift ±5
    currentViewers = Math.max(200, Math.min(300, currentViewers));
    showViewers(currentViewers);
  }, 3000 + Math.random() * 2000);
}

/* ---------- purchase toast: real buyers only ---------- */
const toast = $("#buyer-toast");
let toastTimer = null, toastStopped = false;
function hideToast() { toast.classList.remove("is-shown"); }
toast.querySelector(".toast-close").addEventListener("click", () => {
  toastStopped = true;
  hideToast();
  clearTimeout(toastTimer);
  try { sessionStorage.setItem("ax_toast_off", "1"); } catch { /* ignore */ }
});
function timeAgo(ts) {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
/* Built-in buyer names — 100 entries */
const SAMPLE_BUYERS = [
  { name: "Emily", city: "Sydney" }, { name: "Jake", city: "Chicago" }, { name: "Rahul", city: "Pune" },
  { name: "Marcus", city: "Atlanta" }, { name: "Chloe", city: "Seattle" }, { name: "Liam", city: "London" },
  { name: "Sarah", city: "Austin" }, { name: "Daniel", city: "Toronto" }, { name: "Priya", city: "Mumbai" },
  { name: "James", city: "New York" }, { name: "Alex", city: "Berlin" }, { name: "Lily", city: "Miami" },
  { name: "Noah", city: "Los Angeles" }, { name: "Aisha", city: "Dubai" }, { name: "Ethan", city: "Denver" },
  { name: "Sofia", city: "Madrid" }, { name: "Ryan", city: "Boston" }, { name: "Mia", city: "Paris" },
  { name: "Arjun", city: "Bangalore" }, { name: "Olivia", city: "Vancouver" }, { name: "Tyler", city: "Houston" },
  { name: "Zara", city: "Manchester" }, { name: "Ben", city: "Melbourne" }, { name: "Ananya", city: "Delhi" },
  { name: "Chris", city: "San Diego" }, { name: "Emma", city: "Dublin" }, { name: "Vikram", city: "Hyderabad" },
  { name: "Hannah", city: "Nashville" }, { name: "Omar", city: "Cairo" }, { name: "Isabella", city: "Rome" },
  { name: "Josh", city: "Phoenix" }, { name: "Fatima", city: "Riyadh" }, { name: "Lucas", city: "São Paulo" },
  { name: "Grace", city: "Perth" }, { name: "Aditya", city: "Chennai" }, { name: "Sophia", city: "Amsterdam" },
  { name: "Matt", city: "Portland" }, { name: "Yuki", city: "Tokyo" }, { name: "Nathan", city: "Charlotte" },
  { name: "Leah", city: "Auckland" }, { name: "Rohan", city: "Kolkata" }, { name: "Ava", city: "Stockholm" },
  { name: "Jason", city: "Philadelphia" }, { name: "Amara", city: "Lagos" }, { name: "Sam", city: "Edinburgh" },
  { name: "Nina", city: "Vienna" }, { name: "Kevin", city: "Minneapolis" }, { name: "Isla", city: "Brisbane" },
  { name: "Diego", city: "Mexico City" }, { name: "Amy", city: "Birmingham" }, { name: "Leo", city: "Milan" },
  { name: "Tara", city: "Singapore" }, { name: "Adam", city: "Dallas" }, { name: "Meera", city: "Jaipur" },
  { name: "Jack", city: "Cape Town" }, { name: "Rachel", city: "San Francisco" }, { name: "Kai", city: "Honolulu" },
  { name: "Nadia", city: "Casablanca" }, { name: "Luke", city: "Tampa" }, { name: "Hana", city: "Seoul" },
  { name: "Tom", city: "Bristol" }, { name: "Riya", city: "Ahmedabad" }, { name: "Carlos", city: "Bogotá" },
  { name: "Ella", city: "Copenhagen" }, { name: "Max", city: "Munich" }, { name: "Maya", city: "Kuala Lumpur" },
  { name: "Aaron", city: "Orlando" }, { name: "Layla", city: "Istanbul" }, { name: "Dylan", city: "Leeds" },
  { name: "Sana", city: "Karachi" }, { name: "Oscar", city: "Barcelona" }, { name: "Jade", city: "Glasgow" },
  { name: "Ali", city: "Nairobi" }, { name: "Ellie", city: "Wellington" }, { name: "Finn", city: "Helsinki" },
  { name: "Pooja", city: "Lucknow" }, { name: "Eric", city: "Sacramento" }, { name: "Clara", city: "Zurich" },
  { name: "Andre", city: "Johannesburg" }, { name: "Megan", city: "Columbus" }, { name: "Raj", city: "Chandigarh" },
  { name: "Holly", city: "Liverpool" }, { name: "Mike", city: "Detroit" }, { name: "Luna", city: "Lisbon" },
  { name: "Sami", city: "Oslo" }, { name: "Cora", city: "Adelaide" }, { name: "Ian", city: "Raleigh" },
  { name: "Diya", city: "Indore" }, { name: "Hugo", city: "Brussels" }, { name: "Freya", city: "Cardiff" },
  { name: "Ravi", city: "Surat" }, { name: "Nora", city: "Prague" }, { name: "Theo", city: "Montreal" },
  { name: "Ines", city: "Buenos Aires" }, { name: "Will", city: "Salt Lake City" }, { name: "Kira", city: "Warsaw" },
  { name: "Dev", city: "Bhopal" }, { name: "Iris", city: "Athens" }, { name: "Joel", city: "Jacksonville" },
  { name: "Anika", city: "Gothenburg" },
];

function startToasts() {
  let off = false;
  try { off = sessionStorage.getItem("ax_toast_off") === "1"; } catch { /* ignore */ }
  if (off) return;

  // Shuffle the list so repeat visitors see a different order
  const buyers = [...SAMPLE_BUYERS].sort(() => Math.random() - 0.5);
  let i = 0;

  const showNext = () => {
    if (toastStopped) return;
    if (i >= buyers.length) i = 0; // loop forever
    if (openModal) { toastTimer = setTimeout(showNext, 10000); return; }
    const b = buyers[i++];
    const mins = 1 + Math.floor(Math.random() * 28); // "1–28 minutes ago"
    const main = toast.querySelector(".toast-main");
    main.replaceChildren();
    const strong = document.createElement("b");
    strong.textContent = `${b.name} from ${b.city}`;
    main.append("🔥 ", strong, " just joined AesthetixAI!");
    toast.querySelector(".toast-sub").textContent =
      `${mins} minute${mins === 1 ? "" : "s"} ago${spotsKnown && !soldOut ? ` · Only ${spotsLeft} spots remaining` : ""}`;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("is-shown"));
    toastTimer = setTimeout(() => {
      hideToast();
      toastTimer = setTimeout(showNext, 24000); // next one ~30s after this one appeared
    }, 6000);
  };
  toastTimer = setTimeout(showNext, 8000); // first toast after 8s
}
if (DEMO) startToasts();

/* ---------- contact form → email ---------- */
const form = $("#contact-form");
const formStatus = $("#form-status");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formStatus.className = "form-status";
  let firstBad = null;
  $$("input[required], select[required], textarea[required]", form).forEach((f) => {
    const bad = !f.value.trim() || (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
    f.closest(".field").classList.toggle("invalid", bad);
    if (bad && !firstBad) firstBad = f;
  });
  if (firstBad) {
    formStatus.textContent = "Please fill in every field with a valid email so we can reply.";
    formStatus.classList.add("err");
    firstBad.focus();
    return;
  }
  if (form._honey.value) return; // bot
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  formStatus.textContent = "Sending…";
  const data = Object.fromEntries(new FormData(form).entries());
  delete data._honey;
  data._replyto = data.email;
  try {
    const res = await fetch(CONFIG.CONTACT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || String(out.success) === "false") throw new Error(out.message || "send failed");
    form.reset();
    formStatus.textContent = "Got it. A real person will reply to your email, usually within 24 hours.";
    formStatus.classList.add("ok");
  } catch {
    formStatus.textContent = "That didn’t send. Please email aesthetixai.fit@gmail.com and we’ll reply there.";
    formStatus.classList.add("err");
  } finally {
    btn.disabled = false;
  }
});
$$("input, select, textarea", form).forEach((f) =>
  f.addEventListener("input", () => f.closest(".field")?.classList.remove("invalid")),
);
