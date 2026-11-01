/* Carbon Khata · home page motion */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- 1. molten flow field behind the hero ---------- */
  (function flow() {
    const c = $("#flow"); if (!c || reduce) return;
    const ctx = c.getContext("2d");
    let w, h, dpr, parts = [], t = 0, running = true;
    const N = window.innerWidth < 700 ? 70 : 150;
    const css = getComputedStyle(document.documentElement), V = (k) => css.getPropertyValue(k).trim();
    const BG = V("--bg-rgb"), C1 = V("--accent-rgb"), C2 = V("--accent2-rgb"), C3 = V("--pos-rgb");
    const light = (css.colorScheme || V("color-scheme")).includes("light") || document.documentElement.dataset.theme === "ledger" || document.documentElement.dataset.theme === "cobalt";
    const AMP = light ? 0.32 : 0.55;
    function size() { dpr = Math.min(window.devicePixelRatio || 1, 2); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = `rgb(${BG})`; ctx.fillRect(0, 0, w, h); }
    function spawn(p) { p.x = Math.random() * w * 0.5 + w * 0.45; p.y = Math.random() * h; p.life = 120 + Math.random() * 220; p.age = 0; p.hue = Math.random(); return p; }
    size(); for (let i = 0; i < N; i++) parts.push(spawn({}));
    window.addEventListener("resize", size);
    new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) loop(); }).observe(c);
    function loop() {
      if (!running) return;
      t += 0.0025;
      ctx.fillStyle = `rgba(${BG},0.085)`; ctx.fillRect(0, 0, w, h);
      for (const p of parts) {
        const a = Math.sin(p.x * 0.0032 + t * 2) * 1.6 + Math.cos(p.y * 0.0041 - t) * 1.6 + 2.3;
        const nx = p.x + Math.cos(a) * 1.25, ny = p.y + Math.sin(a) * 1.25;
        const k = p.age / p.life, alpha = Math.sin(Math.PI * k) * AMP;
        ctx.strokeStyle = p.hue > 0.82 ? `rgba(${C3},${alpha * 0.6})` : p.hue > 0.45 ? `rgba(${C2},${alpha})` : `rgba(${C1},${alpha})`;
        ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny; p.age++;
        if (p.age > p.life || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) spawn(p);
      }
      requestAnimationFrame(loop);
    }
    loop();
  })();

  /* ---------- 2. WhatsApp conversation loop (Punjabi) ---------- */
  const chat = [
    ["in", "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! Send this month's fuel bill and weighbridge slips here.", "10:02"],
    ["out", '<div class="img">PUNJAB FUELS<br>Tax invoice 4471<br>Furnace oil … 3,200 L<br>Period 01–31 Oct 2026<br>Amount ₹2,94,400</div>', "10:04"],
    ["in", '<b>ਬਿੱਲ ਮਿਲ ਗਿਆ</b> · bill received<div class="kv2"><span>Fuel</span><b>Furnace oil</b><span>Quantity</span><b>3,200 L</b><span>Period</span><b>Oct 2026</b></div><div class="btns"><i>ਸਹੀ ਹੈ ✓</i><i>Edit</i></div>', "10:04"],
    ["out", "ਸਹੀ ਹੈ ✓", "10:05"],
    ["in", "Checked by a reviewer. Shipment EU-2391 evidence is now 92% ready for the verifier visit in week 3.", "10:07"],
  ];
  (function wa() {
    const body = $("#waBody"); if (!body) return;
    let i = 0, timer;
    const add = () => {
      if (i === chat.length) { timer = setTimeout(() => { body.innerHTML = ""; i = 0; add(); }, 3600); return; }
      const [dir, html, time] = chat[i++];
      const b = document.createElement("div"); b.className = "bub " + dir; b.innerHTML = html + `<span class="t">${time}${dir === "out" ? " ✓✓" : ""}</span>`;
      body.appendChild(b);
      if (!reduce && hasGsap) gsap.from(b, { y: 14, opacity: 0, scale: 0.96, duration: 0.45, ease: "back.out(1.6)", transformOrigin: dir === "in" ? "0 100%" : "100% 100%" });
      while (body.scrollHeight > body.clientHeight + 4 && body.children.length > 1) body.removeChild(body.firstChild);
      timer = setTimeout(add, dir === "in" ? 2100 : 1300);
    };
    if (reduce) { chat.forEach(([d, h, t]) => { const b = document.createElement("div"); b.className = "bub " + d; b.innerHTML = h + `<span class="t">${t}</span>`; body.appendChild(b); }); return; }
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { add(); o.disconnect(); } }, { threshold: 0.3 }).observe(body);
  })();


  /* ---------- map: build once, used by the pinned journey ---------- */
  function journey(animated) {
    const M = window.CK_MAP, svg = $("#map"); if (!M || !svg) return;
    const NS = "http://www.w3.org/2000/svg", el = (t, a = {}, p = svg) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
    svg.innerHTML = `<defs><linearGradient id="routeGrad" gradientUnits="userSpaceOnUse" x1="1000" y1="480" x2="80" y2="140"><stop offset="0" style="stop-color:var(--accent)"/><stop offset=".55" style="stop-color:var(--accent-2)"/><stop offset="1" style="stop-color:var(--good)"/></linearGradient>
      <radialGradient id="glowIn" cx="50%" cy="50%" r="50%"><stop offset="0" style="stop-color:var(--accent)" stop-opacity=".55"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity="0"/></radialGradient></defs>`;
    const gLand = el("g", { class: "lands" });
    const tip = $("#mapTip"), wrap = $("#mapWrap");
    const showTip = (e, html) => { const r = wrap.getBoundingClientRect(); tip.innerHTML = html; tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px)`; tip.classList.add("on"); };
    const hideTip = () => tip.classList.remove("on");
    M.lands.forEach((l) => {
      const pth = el("path", { d: l.d, class: "land land-" + l.k, "vector-effect": "non-scaling-stroke" }, gLand);
    });
    const base = el("path", { d: M.route, class: "base" });
    const lit = el("path", { d: M.route, class: "lit" });
    const puckGlow = el("circle", { r: 18, fill: "url(#glowIn)", class: "puck-glow" });
    const nodeLayer = el("g", { class: "nodes" });
    const OFF = { mill: [16, 5, "start"], stockist: [16, -10, "start"], workshop: [-16, -12, "end"], verifier: [-16, 22, "end"], port: [-16, 5, "end"], eu: [16, 5, "start"] };
    const stopsEls = $$(".stop");
    const nodes = M.nodes.map((n, i) => {
      const g = el("g", { class: "node n-" + n.id + (n.id === "verifier" ? " twin" : ""), "aria-hidden": "true" }, nodeLayer);
      el("circle", { r: 16, class: "pulse" }, g); el("circle", { r: 9, class: "ring" }, g); el("circle", { r: 3.6, class: "core" }, g);
      let [dx, dy, anchor] = OFF[n.id];
      if (n.id === "mill" && svg.clientWidth < 600) { dx = -16; dy = 26; anchor = "end"; }
      const t = el("text", { x: dx, y: dy, "text-anchor": anchor, class: "lbl" }, g); t.textContent = n.label;
      const t2 = el("text", { x: dx, y: dy + 16, "text-anchor": anchor, class: "sub" }, g); t2.textContent = n.sub;
      return { ...n, g };
    });
    const puck = el("circle", { r: 5.5, class: "puck" });
    const L = lit.getTotalLength();
    const at = M.nodes.map((n) => { let best = 0, bd = 1e12; for (let l = 0; l <= L; l += 2) { const p = lit.getPointAtLength(l); const d = (p.x - n.xy[0]) ** 2 + (p.y - n.xy[1]) ** 2; if (d < bd) { bd = d; best = l; } } return best / L; });
    at[0] = 0; at[at.length - 1] = 1;
    // views normalised to the map's aspect ratio
    const AR = M.W / M.H, norm = ([x, y, w, h]) => { const cx = x + w / 2, cy = y + h / 2; if (w / h < AR) w = h * AR; else h = w / AR; return [cx - w / 2, cy - h / 2, w, h]; };
    const V_IN = norm(M.views.india), V_W = M.views.world;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const lerpV = (a, b, t) => a.map((v, k) => v + (b[k] - v) * t);
    function camera(v) {
      svg.setAttribute("viewBox", v.map((n) => n.toFixed(2)).join(" "));
      const k = v[2] / (svg.clientWidth || 700);
      svg.classList.toggle("far", v[2] > 520);
      nodes.forEach((n) => n.g.setAttribute("transform", `translate(${n.xy[0]} ${n.xy[1]}) scale(${k.toFixed(4)})`));
      puck.setAttribute("r", 5.5 * k); puckGlow.setAttribute("r", 22 * k);
      lit.style.strokeWidth = 2.6 * k; base.style.strokeWidth = 1.3 * k; base.style.strokeDasharray = `${2 * k} ${5 * k}`;
    }
    function draw(frac, idx, v) {
      const len = Math.min(L, frac * L); lit.style.strokeDashoffset = L - len;
      const p = lit.getPointAtLength(len); puck.setAttribute("cx", p.x); puck.setAttribute("cy", p.y); puckGlow.setAttribute("cx", p.x); puckGlow.setAttribute("cy", p.y);
      nodes.forEach((n, i) => { n.g.classList.toggle("on", i <= idx); n.g.classList.toggle("cur", i === idx); });
      camera(v);
    }
    lit.style.strokeDasharray = L;
    const stopsBox = $("#stops");
    let cur = -1;
    const setStop = (i) => { if (i === cur) return; stopsEls.forEach((el, k) => el.classList.toggle("on", k === i)); $("#jProg").innerHTML = `<b>0${i + 1}</b> / 06`; cur = i; };
    if (!animated || !hasGsap || reduce) {
      draw(1, 5, V_W); nodes.forEach((n) => n.g.classList.add("on"));
      stopsBox.classList.add("static"); stopsEls.forEach((el) => el.classList.add("on"));
      window.addEventListener("resize", () => camera(V_W)); return;
    }
    // plays once when the map scrolls into view: world, settle on India, stop by stop, then the sea leg to Hamburg
    const st = { f: 0, c: 0 }, HOLD = 2.8, labels = [0];
    const tl = gsap.timeline({ paused: true, onUpdate: render });
    tl.to(st, { c: 1, duration: 1.8, ease: "power2.inOut" }, 0.5);
    let t = 0.5 + HOLD;
    [2.0, 0.9, 0, 1.9].forEach((d, i) => { if (d) tl.to(st, { f: at[i + 1], duration: d, ease: "power1.inOut" }, t); t += d; labels[i + 1] = t; t += HOLD; });
    tl.to(st, { f: 1, duration: 5, ease: "power1.inOut" }, t).to(st, { c: 0, duration: 3.4, ease: "power2.inOut" }, t);
    labels[5] = t + 5;
    function render() {
      const time = tl.time(); let idx = 0; labels.forEach((lt, i) => { if (time >= lt) idx = i; });
      draw(st.f, idx, lerpV(V_W, V_IN, st.c)); setStop(idx);
    }
    render();
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { tl.play(); o.disconnect(); } }, { threshold: 0.4 }).observe($("#mapWrap"));
    window.addEventListener("resize", render);
  }

  /* ---------- 3. count-ups ---------- */
  function countUp(el) {
    const to = +el.dataset.to, from = el.dataset.from !== undefined ? +el.dataset.from : 0, dec = +(el.dataset.dec || 0);
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const put = (v) => (el.textContent = pre + v.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf);
    if (reduce || !hasGsap) return put(to);
    const o = { v: from }; gsap.to(o, { v: to, duration: 1.8, ease: "power3.out", onUpdate: () => put(o.v) });
  }
  const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } }), { threshold: 0.5 });
  $$(".count").forEach((el) => cio.observe(el));

  /* tally tag + verifier ticks on view */
  const once = (el, fn) => el && new IntersectionObserver(([e], o) => { if (e.isIntersecting) { fn(); o.disconnect(); } }, { threshold: 0.5 }).observe(el);
  once($("#tallyTag"), () => hasGsap && !reduce ? gsap.fromTo("#tallyTag", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.5, ease: "power3.out" }) : ($("#tallyTag").style.opacity = 1));

  /* hero bars */
  const heroBars = () => $$(".hb").forEach((b, i) => setTimeout(() => (b.style.width = b.dataset.w + "%"), 500 + i * 220));

  if (!hasGsap || reduce) {
    heroBars();
    $$(".statement .w").forEach((w) => (w.style.opacity = 1));
    $$(".cost-row .tr > div").forEach((d, i) => (d.style.width = [100, 71.8, 22.2][i] + "%"));
    $("#bigFig").innerHTML = '₹10.4<small>lakh</small>';
    journey(false);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- 4. hero entrance and parallax ---------- */
  gsap.from("#heroTitle .split-line > span", { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.09, delay: 0.1 });
  gsap.from(".hero-fade", { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, delay: 0.55 });
  gsap.from("#heroStage .float", { y: 60, opacity: 0, rotateX: 12, duration: 1.2, ease: "power3.out", stagger: 0.12, delay: 0.35, onComplete: heroBars });
  const stage = $("#heroStage");
  if (stage && window.matchMedia("(pointer: fine)").matches) {
    const floats = $$(".float", stage).map((el) => ({ el, d: +el.dataset.depth, x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3" }), y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3" }) }));
    const main = $(".f-main", stage);
    window.addEventListener("mousemove", (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      floats.forEach((f) => { f.x(nx * 22 * f.d); f.y(ny * 18 * f.d); });
      gsap.to(main, { rotateY: nx * 8, rotateX: -ny * 6, duration: 1, ease: "power3.out" });
    });
  }
  gsap.to(".hero-grid", { yPercent: -8, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- 5. statement: words light up with scroll ---------- */
  const st = $("#statement");
  if (st) {
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => { if (/^\s+$/.test(w) || !w) frag.appendChild(document.createTextNode(w)); else { const s = document.createElement("span"); s.className = "w"; s.textContent = w; frag.appendChild(s); } });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(st);
    gsap.to("#statement .w", { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: st, start: "top 78%", end: "bottom 42%", scrub: true } });
  }

  /* ---------- 6. cost reveal ---------- */
  const rows = $$(".cost-row"), fills = rows.map((r) => $(".tr > div", r));
  const widths = [100, 71.8, 22.2], figs = [46.8, 33.6, 10.4];
  const caps = ["On India's default value of 6.29 tonnes of CO₂ per tonne of bolts.", "With the exporter's own plant verified, but its wire rod still on India's default.", "With both mill reports carried through the stockist. ₹36.4 lakh stays with the exporter."];
  gsap.set(rows, { opacity: 0.25 });
  const fig = { v: 46.8 };
  const showStep = (i) => {
    rows.forEach((r, j) => gsap.to(r, { opacity: j <= i ? 1 : 0.25, duration: 0.4 }));
    gsap.to(fills[i], { width: widths[i] + "%", duration: 1, ease: "power3.out" });
    gsap.to(fig, { v: figs[i], duration: 1, ease: "power3.out", onUpdate: () => ($("#bigFig").innerHTML = "₹" + fig.v.toFixed(1) + "<small>lakh</small>") });
    $("#bigCap").textContent = caps[i];
    $("#bigFig").style.color = i === 2 ? "var(--mint)" : "";
  };
  if (window.matchMedia("(min-width: 901px)").matches) {
    let cur = -1;
    ScrollTrigger.create({ trigger: "#reveal", start: "top top", end: "bottom bottom", onUpdate: (s) => { const i = Math.min(2, Math.floor(s.progress * 3.2)); if (i !== cur) { for (let k = cur + 1; k <= i; k++) showStep(k); cur = i; } } });
  } else {
    ScrollTrigger.create({ trigger: "#reveal", start: "top 70%", once: true, onEnter: () => [0, 1, 2].forEach((i) => setTimeout(() => showStep(i), i * 700)) });
  }

  /* ---------- 7. journey on a real map ---------- */
  journey(true);
  /* ---------- 8. section reveals with stagger ---------- */
  $$(".tile .stage").forEach((s) => gsap.from(s, { y: 40, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 88%" } }));
  gsap.utils.toArray(".vchk").forEach((b, i) => gsap.from(b, { scale: 0.6, opacity: 0, duration: 0.5, delay: i * 0.25, ease: "back.out(2)", scrollTrigger: { trigger: b, start: "top 90%" } }));
})();
