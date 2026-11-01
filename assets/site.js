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
  check: '<path d="M20 6 9 17l-5-5" />',
  arrow: '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />',
  chevron: '<path d="m6 9 6 6 6-6" />',
  menu: '<line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />',
  close: '<path d="M18 6 6 18" /><path d="m6 6 12 12" />',
  factory: '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M17 18h1" /><path d="M12 18h1" /><path d="M7 18h1" />',
  store: '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z" /><path d="M6 18h12" /><path d="M6 14h12" /><rect width="12" height="12" x="6" y="10" />',
  bolt: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><circle cx="12" cy="12" r="4" />',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" />',
  ship: '<path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" /><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" /><path d="M12 10v4" /><path d="M12 2v3" />',
  bank: '<line x1="3" x2="21" y1="22" y2="22" /><line x1="6" x2="6" y1="18" y2="11" /><line x1="10" x2="10" y1="18" y2="11" /><line x1="14" x2="14" y1="18" y2="11" /><line x1="18" x2="18" y1="18" y2="11" /><polygon points="12 2 20 7 4 7" />',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />',
  scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />',
  calendar: '<path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" />',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />',
  calc: '<rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" />',
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />',
  doc: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />',
  search: '<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />',
  rupee: '<path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" />',
  prev: '<path d="m15 18-6-6 6-6" />',
  next: '<path d="m9 18 6-6-6-6" />',
  phone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" />',
  globe: '<circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />',
  spark: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" />',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" />',
  route: '<circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" />',
  container: '<path d="M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z" /><path d="M10 21.9V14L2.1 9.1" /><path d="m10 14 11.9-6.9" /><path d="M14 19.8v-8.1" /><path d="M18 17.5V9.4" />',
  message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />',
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" stroke="none"/>',
};
const icon = (name, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ""}</svg>`;

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

  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    const T = [["8940", "Molten", "#FF5B1F"], ["8941", "Ledger", "#A3171C"], ["8942", "Forest", "#2FCB8A"], ["8943", "Cobalt", "#2350E0"]];
    const sw = document.createElement("nav"); sw.className = "theme-switch"; sw.setAttribute("aria-label", "Palette preview");
    sw.innerHTML = T.map(([port, name, c]) => `<a href="http://localhost:${port}${location.pathname}${location.hash}" aria-current="${location.port === port}"><i style="background:${c}"></i>${name}</a>`).join("");
    document.body.appendChild(sw);
  }

  const page = document.body.dataset.page;
  document.querySelectorAll(`.main-nav > a[data-page="${page}"]`).forEach((a) => a.setAttribute("aria-current", "page"));
});
