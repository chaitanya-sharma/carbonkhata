/* Carbon Khata · shared script: header behaviour, icons, CBAM model, formatters */

/* ---------- CBAM model (EU rules and prices; same numbers as the pitch deck) ---------- */
const CK = (() => {
  const FX = 108;                                  // ₹ per €, Oct 2026
  const PRICE_2026 = 75.28;                        // € per certificate, Q2 2026 (DG TAXUD)
  const CBAM_FACTOR = { 2026: 0.975, 2027: 0.95, 2028: 0.90 };
  const MARKUP = { 2026: 0.10, 2027: 0.20, 2028: 0.30 };
  const BENCH = { default: 1.53, actual: 1.37 };   // tCO2/t, conservative benchmark on default filings
  const PRODUCTS = {
    bolts: { label: "Bolts and screws", cn: "CN 7318 15", def: 5.72, precursorDef: 4.30, precursorActual: 2.35, ownProcess: 0.05 },
    coil:  { label: "Hot-rolled coil", cn: "CN 7208", def: 4.28, actual: 2.30 },
  };
  const certs = (see, bench, year) => Math.max(see - bench * CBAM_FACTOR[year], 0);

  /* returns per-tonne figures in ₹ and tCO2 for one product, year and price */
  function perTonne({ product = "bolts", year = 2026, price = PRICE_2026, traced = 1 } = {}) {
    const p = PRODUCTS[product], k = price * FX, mu = MARKUP[year];
    const defSEE = p.def * (1 + mu);
    let actSEE, noMillSEE;
    if (product === "bolts") {
      const precDef = p.precursorDef * (1 + mu);
      actSEE = traced * p.precursorActual + (1 - traced) * precDef + p.ownProcess;
      noMillSEE = precDef + p.ownProcess;
    } else {
      actSEE = p.actual; noMillSEE = defSEE;
    }
    const out = {
      defSEE, actSEE, noMillSEE,
      defCerts: certs(defSEE, BENCH.default, year),
      actCerts: certs(actSEE, BENCH.actual, year),
      noMillCerts: certs(noMillSEE, product === "bolts" ? BENCH.actual : BENCH.default, year),
      factor: CBAM_FACTOR[year], markup: mu, k,
    };
    out.def = out.defCerts * k; out.act = out.actCerts * k; out.noMill = out.noMillCerts * k;
    out.saving = out.def - out.act;
    return out;
  }
  return { FX, PRICE_2026, CBAM_FACTOR, MARKUP, BENCH, PRODUCTS, perTonne };
})();

const fmt = {
  inr: (v) => "₹" + Math.round(v).toLocaleString("en-IN"),
  inr100: (v) => "₹" + (Math.round(v / 100) * 100).toLocaleString("en-IN"),
  lakh: (v, d = 1) => "₹" + (v / 1e5).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }) + " L",
  t2: (v) => v.toFixed(2),
  int: (v) => Math.round(v).toLocaleString("en-IN"),
  eur: (v) => "€" + Math.round(v).toLocaleString("en-IN"),
};

/* ---------- icons (24px stroke set) ---------- */
const ICON = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  factory: '<path d="M3 21V10l6 4V10l6 4V6l6-3v18H3Z"/><path d="M7 17h2M12 17h2M17 17h1"/>',
  store: '<path d="M3 9 5 4h14l2 5"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M9 20v-6h6v6"/>',
  bolt: '<path d="M12 2l3 2v4l-3 2-3-2V4z"/><path d="M12 10v12M9 14h6M9 18h6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  ship: '<path d="M3 17l2 4h14l2-4H3Z"/><path d="M6 17V9h12v8"/><path d="M9 9V5h6v4"/>',
  bank: '<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  link: '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
  scale: '<path d="M12 3v18M5 21h14M6 7h12"/><path d="m6 7-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h2M12 18h2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.8 0 5 2 5 5"/>',
  leaf: '<path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15Z"/><path d="M5 19 13 11"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  rupee: '<path d="M7 4h11M7 9h11M7 4c6 0 8 2 8 5s-3 5-8 5l8 7"/>',
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" stroke="none"/>',
  prev: '<path d="M15 6l-6 6 6 6"/>',
  next: '<path d="M9 6l6 6-6 6"/>',
  phone: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
};
const icon = (name, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ""}</svg>`;

/* ---------- header behaviour ---------- */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-icon]").forEach((el) => { el.innerHTML = icon(el.dataset.icon); });

  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  document.querySelectorAll(".nav-drop").forEach((drop) => {
    const btn = drop.querySelector("button");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = drop.dataset.open === "true";
      drop.dataset.open = String(!open); btn.setAttribute("aria-expanded", String(!open));
    });
  });
  document.addEventListener("click", () => document.querySelectorAll(".nav-drop").forEach((d) => { d.dataset.open = "false"; d.querySelector("button").setAttribute("aria-expanded", "false"); }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll(".nav-drop").forEach((d) => (d.dataset.open = "false")); });

  const toggle = document.querySelector(".menu-toggle"), mnav = document.querySelector(".mobile-nav");
  if (toggle && mnav) toggle.addEventListener("click", () => {
    const open = mnav.dataset.open === "true";
    mnav.dataset.open = String(!open); toggle.setAttribute("aria-expanded", String(!open));
    toggle.innerHTML = icon(open ? "menu" : "close");
    document.body.style.overflow = open ? "" : "hidden";
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
  } else document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("in"));

  const page = document.body.dataset.page;
  document.querySelectorAll(`.main-nav > a[data-page="${page}"]`).forEach((a) => a.setAttribute("aria-current", "page"));
});
